import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  AdjusterKey,
  Bike,
  Discipline,
  ForkAdjuster,
  ForkSpec,
  LinkageType,
  RearSpec,
  TireSetup,
  WheelSize,
} from '../types'
import { DEFAULT_PARAMS, DEFAULT_WEATHER } from '../types'
import { useApp } from '../lib/store'
import { uid } from '../lib/id'
import { createBike, geometryPreset, getTireSetup, LINKAGES, suspensionPreset, TIRE_SETUPS, WHEEL_SIZES } from '../data/presets'
import { DISCIPLINE_LIST, DISCIPLINES } from '../data/disciplines'
import { FORKS, getFork, getShock, SHOCKS, ADJUSTER_ORDER, DEFAULT_FORK_ADJUSTERS, forkAdjusters } from '../data/components'
import { calcSetup } from '../lib/calc'
import { ADJUSTER_LABELS, wheelLabel } from '../lib/format'
import { Panel, SectionTitle, Badge } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { NumberField, Segmented, SelectField, TextField, Toggle } from '../components/ui/Fields'
import { BikeBlueprint } from '../components/BikeBlueprint'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { SelectOption } from '../components/ui/Fields'

const mm = (v: number) => (Number.isFinite(v) ? v : 0)

export function BikeEditorPage() {
  const { id } = useParams()
  const isNew = !id
  const bikes = useApp((s) => s.bikes)
  const riders = useApp((s) => s.riders)
  const activeRiderId = useApp((s) => s.activeRiderId)
  const addBike = useApp((s) => s.addBike)
  const updateBike = useApp((s) => s.updateBike)
  const deleteBike = useApp((s) => s.deleteBike)
  const navigate = useNavigate()

  const existing = bikes.find((b) => b.id === id)
  const [draft, setDraft] = useState<Bike>(() => existing ?? createBike('trail', uid('bike'), ''))
  const [saved, setSaved] = useState(false)
  const [confirmPreset, setConfirmPreset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const rider = riders.find((r) => r.id === activeRiderId) ?? riders[0]
  const preview = useMemo(() => {
    if (!rider) return null
    try {
      return calcSetup(draft, rider, DEFAULT_PARAMS, DEFAULT_WEATHER)
    } catch {
      return null
    }
  }, [draft, rider])

  const forkModel = getFork(draft.fork.modelId)
  const shockModel = getShock(draft.rear.modelId)
  const d = DISCIPLINES[draft.discipline]

  const forkAdjusterList: ForkAdjuster[] =
    draft.fork.adjusters ?? (forkModel ? forkAdjusters(forkModel) : DEFAULT_FORK_ADJUSTERS)

  const patch = (p: Partial<Bike>) => setDraft((prev) => ({ ...prev, ...p }))
  const setFork = (p: Partial<ForkSpec>) => setDraft((prev) => ({ ...prev, fork: { ...prev.fork, ...p } }))
  const setRear = (p: Partial<RearSpec>) => setDraft((prev) => ({ ...prev, rear: { ...prev.rear, ...p } }))
  const setGeo = (p: Partial<Bike['geometry']>) =>
    setDraft((prev) => ({ ...prev, geometry: { ...prev.geometry, ...p } }))
  const setWheels = (p: Partial<Bike['wheels']>) =>
    setDraft((prev) => ({ ...prev, wheels: { ...prev.wheels, ...p } }))

  const toggleAdjuster = (key: AdjusterKey) => {
    const exists = forkAdjusterList.some((a) => a.key === key)
    const next = exists
      ? forkAdjusterList.filter((a) => a.key !== key)
      : [
          ...forkAdjusterList,
          {
            key,
            max: key === 'lockout' ? 1 : key === 'preload' ? 10 : 12,
            // Только что добавленную регулировку считаем «диапазон неизвестен»,
            // пока пользователь не введёт своё число кликов.
            maxUnknown: key !== 'lockout',
          },
        ]
    next.sort((a, b) => ADJUSTER_ORDER.indexOf(a.key) - ADJUSTER_ORDER.indexOf(b.key))
    setFork({ adjusters: next })
  }

  const setAdjusterMax = (key: AdjusterKey, max: number) => {
    setFork({
      adjusters: forkAdjusterList.map((a) =>
        a.key === key
          ? { ...a, max: Math.min(60, Math.max(1, Math.round(max))), maxUnknown: false }
          : a,
      ),
    })
  }

  const toggleAdjusterMaxUnknown = (key: AdjusterKey) => {
    setFork({
      adjusters: forkAdjusterList.map((a) =>
        a.key === key ? { ...a, maxUnknown: !a.maxUnknown } : a,
      ),
    })
  }

  const onForkModel = (modelId: string) => {
    const model = getFork(modelId)
    if (!model) {
      setFork({
        modelId: null,
        adjusters: DEFAULT_FORK_ADJUSTERS.map((a) => ({ ...a })),
        tokensUnknown: draft.fork.kind === 'air' ? true : draft.fork.tokensUnknown,
      })
      return
    }
    const travel = model.travels.includes(draft.fork.travelMm)
      ? draft.fork.travelMm
      : model.travels[Math.floor(model.travels.length / 2)]
    setFork({
      modelId,
      kind: model.spring,
      stanchionMm: model.stanchions[0] ?? draft.fork.stanchionMm,
      travelMm: travel,
      tokens: model.tokens?.stock ?? draft.fork.tokens,
      tokensUnknown: !model.tokens,
      adjusters: forkAdjusters(model),
    })
  }

  const onShockModel = (modelId: string) => {
    const model = getShock(modelId)
    if (!model) {
      setRear({ modelId: null })
      return
    }
    const target = draft.rear.travelMm / Math.max(1, draft.rear.strokeMm || 1)
    const size = [...model.sizes].sort(
      (a, b) =>
        Math.abs(a.stroke - draft.rear.strokeMm) - Math.abs(b.stroke - draft.rear.strokeMm),
    )[0]
    const current = model.sizes.find(
      (s) => Math.abs(s.eyeToEye - draft.rear.eyeToEyeMm) < 6 && Math.abs(s.stroke - draft.rear.strokeMm) < 6,
    )
    const chosen = current ?? size ?? model.sizes[0]
    setRear({
      modelId,
      kind: model.spring,
      eyeToEyeMm: chosen?.eyeToEye ?? draft.rear.eyeToEyeMm,
      strokeMm: chosen?.stroke ?? draft.rear.strokeMm,
      tokens: model.tokens?.stock ?? draft.rear.tokens,
    })
  }

  const applyPreset = () => {
    const p = suspensionPreset(draft.discipline)
    setDraft((prev) => ({
      ...prev,
      massKg: p.massKg,
      wheels: p.wheels,
      fork: { ...prev.fork, ...p.fork } as ForkSpec,
      rear: { ...prev.rear, ...p.rear } as RearSpec,
      geometry: geometryPreset(prev.discipline),
    }))
    setConfirmPreset(false)
  }

  const save = () => {
    const fallbackName = `${DISCIPLINES[draft.discipline].short} · байк`
    const bike: Bike = {
      ...draft,
      name: draft.name.trim() || fallbackName,
      fork: { ...draft.fork, travelMm: draft.fork.kind === 'rigid' ? 0 : draft.fork.travelMm },
      rear: { ...draft.rear, travelMm: Math.max(0, draft.rear.travelMm) },
      updatedAt: Date.now(),
    }
    if (isNew) {
      addBike(bike)
    } else {
      updateBike(bike.id, bike)
    }
    setSaved(true)
    navigate(`/bike/${bike.id}/setup`)
  }

  if (!isNew && !existing) {
    return (
      <Panel className="mx-auto max-w-lg p-6 text-center">
        <h1 className="font-mono text-[14px] uppercase tracking-[0.12em] text-ink">Байк не найден</h1>
        <p className="mt-2 text-[12px] text-muted">Возможно, он был удалён.</p>
        <Link to="/" className="btn btn-primary mt-4 inline-flex">
          В гараж
        </Link>
      </Panel>
    )
  }

  const forkOptions: SelectOption<string>[] = [
    { value: '', label: '— своя вилка / нет в списке —' },
    ...FORKS.map((f) => ({
      value: f.id,
      label: `${f.brand} ${f.model}${f.spring === 'coil' ? ' (пружина)' : ''}`,
      group: f.brand,
    })),
  ]

  const shockOptions: SelectOption<string>[] = [
    { value: '', label: '— свой аморт / нет в списке —' },
    ...SHOCKS.map((s) => ({
      value: s.id,
      label: `${s.brand} ${s.model}${s.spring === 'coil' ? ' (пружина)' : ''}`,
      group: s.brand,
    })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-lg border border-line-strong p-2 text-dim hover:text-ink" aria-label="Назад">
            <Icon name="arrow-left" size={16} />
          </Link>
          <div>
            <SectionTitle>{isNew ? 'Новый байк' : 'Редактирование'}</SectionTitle>
            <h1 className="mt-1 text-[20px] font-semibold text-ink sm:text-[24px]">
              {isNew ? 'Добавить в гараж' : draft.name || 'Без названия'}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <Button variant="danger" size="sm" icon={<Icon name="trash" size={14} />} onClick={() => setConfirmDelete(true)}>
              Удалить
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button variant="primary" icon={<Icon name="save" size={14} />} onClick={save}>
            Сохранить и настроить
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          {/* Основное */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle right={saved ? <Badge tone="acid">Сохранено</Badge> : undefined}>Основное</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField
                label="Название"
                value={draft.name}
                onChange={(v) => patch({ name: v })}
                placeholder="Например, мой трейл-байк"
              />
              <SelectField
                label="Дисциплина"
                value={draft.discipline}
                onChange={(v) => patch({ discipline: v as Discipline })}
                options={DISCIPLINE_LIST.map((x) => ({ value: x.id, label: x.label }))}
                hint={d.description}
              />
              <TextField
                label="Размер рамы"
                value={draft.size}
                onChange={(v) => patch({ size: v })}
                placeholder="S / M / L / 3"
              />
              <NumberField
                label="Масса байка"
                unit="кг"
                value={draft.massKg}
                onChange={(v) => patch({ massKg: v })}
                min={5}
                max={30}
                step={0.1}
              />
              <TextField
                label="Заметки"
                value={draft.notes ?? ''}
                onChange={(v) => patch({ notes: v })}
                placeholder="Например: рама L, тюн под 70 кг"
                className="sm:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Icon name="spark" size={13} />} onClick={() => setConfirmPreset(true)}>
                Подставить пресет дисциплины
              </Button>
              <span className="text-[10.5px] text-dim">
                Заполнит ходы, колёса и геометрию типичными значениями.
              </span>
            </div>
          </Panel>

          {/* Колёса */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle right={<Badge>{`${wheelLabel(draft.wheels.front.size)} / ${wheelLabel(draft.wheels.rear.size)}`}</Badge>}>
              Колёса и шины
            </SectionTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(['front', 'rear'] as const).map((pos) => {
                const wheel = draft.wheels[pos]
                const setupMeta = getTireSetup(wheel.tireSetup)
                return (
                  <div key={pos} className="panel-flat p-3.5">
                    <div className="eyebrow-plain mb-2 text-[10px] text-muted">
                      {pos === 'front' ? 'Переднее' : 'Заднее'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <SelectField
                        label="Диаметр"
                        value={wheel.size}
                        onChange={(v) =>
                          setWheels({ [pos]: { ...wheel, size: v as WheelSize } } as Partial<Bike['wheels']>)
                        }
                        options={WHEEL_SIZES}
                      />
                      <NumberField
                        label="Ширина"
                        unit="″"
                        value={Math.round((wheel.widthMm / 25.4) * 100) / 100}
                        onChange={(v) =>
                          setWheels({
                            [pos]: { ...wheel, widthMm: Math.round(v * 25.4) },
                          } as Partial<Bike['wheels']>)
                        }
                        min={1}
                        max={3.5}
                        step={0.05}
                        hint={`${Math.round(wheel.widthMm)} мм`}
                      />
                    </div>
                    <div className="mt-2.5">
                      <SelectField
                        label="Тип посадки"
                        value={wheel.tireSetup ?? 'tubeless'}
                        onChange={(v) =>
                          setWheels({
                            [pos]: {
                              ...wheel,
                              tireSetup: v,
                              // Вставка несовместима с камерой и трубкой — снимаем галочку.
                              insert: getTireSetup(v).allowsInsert ? wheel.insert : false,
                            },
                          } as Partial<Bike['wheels']>)
                        }
                        options={TIRE_SETUPS.map((t) => ({ value: t.id as TireSetup, label: t.label }))}
                        hint={setupMeta.note}
                      />
                    </div>
                    <div className="mt-2.5">
                      <Toggle
                        label="Вставка / CushCore"
                        checked={wheel.insert}
                        onChange={(v) => setWheels({ [pos]: { ...wheel, insert: v } } as Partial<Bike['wheels']>)}
                        hint={
                          setupMeta.allowsInsert
                            ? '−2 psi к рекомендации'
                            : `Не применяется: «${setupMeta.label}» — без вставки`
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-dim">
              Ширина вводится в дюймах — например 2.4 или 2.6. В бейдже выше указан диаметр
              переднего и заднего колеса: 29″ / 29″ значит оба одинаковые.
            </p>
          </Panel>

          {/* Вилка */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle right={<Badge tone={draft.fork.kind === 'air' ? 'sky' : draft.fork.kind === 'coil' ? 'amber' : 'neutral'}>{draft.fork.kind.toUpperCase()}</Badge>}>
              Вилка
            </SectionTitle>
            <div className="mt-4 space-y-3">
              <Segmented
                label="Тип"
                value={draft.fork.kind}
                onChange={(v) => setFork({ kind: v })}
                options={[
                  { value: 'air', label: 'Воздух' },
                  { value: 'coil', label: 'Пружина' },
                  { value: 'rigid', label: 'Ригид' },
                ]}
              />
              {draft.fork.kind !== 'rigid' && (
                <>
                  <SelectField
                    label="Модель (база настроек)"
                    value={draft.fork.modelId ?? ''}
                    onChange={onForkModel}
                    options={forkOptions}
                    hint="Выбор модели подставит ноги, ход и стоковые токены"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label="Ход"
                      unit="мм"
                      value={draft.fork.travelMm}
                      onChange={(v) => setFork({ travelMm: v })}
                      min={40}
                      max={220}
                      step={5}
                    />
                    <NumberField
                      label="Диаметр ног"
                      unit="мм"
                      value={draft.fork.stanchionMm}
                      onChange={(v) => setFork({ stanchionMm: v })}
                      min={28}
                      max={41}
                    />
                    {draft.fork.kind === 'air' && (
                      <NumberField
                        label={draft.fork.tokensUnknown ? 'Токены (реком.)' : 'Токены сейчас'}
                        unit="шт"
                        value={
                          draft.fork.tokensUnknown
                            ? (preview?.fork?.tokens ?? draft.fork.tokens)
                            : draft.fork.tokens
                        }
                        onChange={(v) => setFork({ tokens: v })}
                        min={0}
                        max={8}
                        disabled={!!draft.fork.tokensUnknown}
                        hint={
                          draft.fork.tokensUnknown
                            ? 'Рекомендация. Если знаете факт — выключите «не знаю»'
                            : forkModel?.tokens
                              ? `сток ${forkModel.tokens.stock} · макс ${forkModel.tokens.max}`
                              : undefined
                        }
                      />
                    )}
                    {draft.fork.kind === 'coil' && (
                      <NumberField
                        label="Пружина (если знаете)"
                        unit="lb/in"
                        value={draft.fork.coilRate ?? 0}
                        onChange={(v) => setFork({ coilRate: v || undefined })}
                        min={0}
                        max={120}
                        step={5}
                        hint="0 — подобрать автоматически"
                      />
                    )}
                  </div>
                  {draft.fork.kind === 'air' && (
                    <Toggle
                      label="Не знаю, сколько токенов стоит"
                      checked={!!draft.fork.tokensUnknown}
                      onChange={(v) =>
                        setFork(
                          v
                            ? { tokensUnknown: true }
                            : {
                                tokensUnknown: false,
                                tokens: preview?.fork?.tokens ?? draft.fork.tokens,
                              },
                        )
                      }
                      hint="Если не ставили или не знаете — оставьте включённым: число выше будет рекомендацией, а не фактом."
                    />
                  )}

                  <div className="panel-flat p-3.5">
                    <div className="eyebrow-plain text-[10px] text-muted">Настройки вилки</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-dim">
                      Отметьте, что реально есть на вашей вилке: отскок, сжатие LSC/HSC, ABS+,
                      блокировка. Клики считаются от полностью открытого: 0 — открыто и
                      быстро, максимум — закрыто и медленно. «Макс» — полный диапазон от
                      открытого до закрытого; если не знаете точное число, нажмите «?» —
                      возьмём типовое и пометим расчёт как ориентировочный.
                    </p>
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {ADJUSTER_ORDER.map((key) => {
                        const adj = forkAdjusterList.find((a) => a.key === key)
                        return (
                          <div
                            key={key}
                            className={
                              'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ' +
                              (adj ? 'border-acid/40 bg-acid/5' : 'border-line bg-surface-2')
                            }
                          >
                            <button
                              type="button"
                              onClick={() => toggleAdjuster(key)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              aria-pressed={!!adj}
                            >
                              <span
                                className={
                                  'h-2.5 w-2.5 shrink-0 rounded-[3px] border ' +
                                  (adj ? 'border-acid bg-acid' : 'border-line-strong')
                                }
                              />
                              <span
                                className={
                                  'truncate text-[12px] ' + (adj ? 'text-ink' : 'text-muted')
                                }
                              >
                                {ADJUSTER_LABELS[key]}
                              </span>
                            </button>
                            {adj && key !== 'lockout' && (
                              <div className="flex shrink-0 items-center gap-1">
                                <label className="flex items-center gap-1 font-mono text-[9.5px] text-dim">
                                  <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={adj.max}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value, 10)
                                      if (Number.isFinite(v)) setAdjusterMax(key, v)
                                    }}
                                    className="field h-7 w-14 px-1.5 py-0 text-[11px]"
                                    aria-label={`Максимум кликов: ${ADJUSTER_LABELS[key]}`}
                                  />
                                  кл.
                                </label>
                                <button
                                  type="button"
                                  onClick={() => toggleAdjusterMaxUnknown(key)}
                                  className={
                                    'flex h-6 w-6 items-center justify-center rounded-md border font-mono text-[11px] ' +
                                    (adj.maxUnknown
                                      ? 'border-acid/60 bg-acid/15 text-acid'
                                      : 'border-line text-muted hover:border-line-strong hover:text-ink')
                                  }
                                  aria-pressed={!!adj.maxUnknown}
                                  aria-label={`Не знаю максимум кликов: ${ADJUSTER_LABELS[key]}`}
                                  title="Не знаю точный диапазон — считать по типовому значению"
                                >
                                  ?
                                </button>
                              </div>
                            )}
                            {adj && key === 'lockout' && (
                              <span className="chip shrink-0">вкл/выкл</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {forkModel && (
                    <StockInfo
                      lines={[
                        forkModel.damper ? `Демпфер: ${forkModel.damper}` : '',
                        forkModel.tokens
                          ? `Токены: сток ${forkModel.tokens.stock}, макс ${forkModel.tokens.max}`
                          : forkModel.spring === 'air'
                            ? 'Токенов штатно нет'
                            : '',
                        `Регулировки: ${forkAdjusters(forkModel)
                          .map((a) =>
                            a.key === 'lockout'
                              ? 'блокировка'
                              : `${ADJUSTER_LABELS[a.key]} ${a.max}`,
                          )
                          .join(' · ')}`,
                        forkModel.note ?? '',
                      ].filter(Boolean)}
                    />
                  )}
                </>
              )}
              {draft.fork.kind === 'rigid' && (
                <p className="text-[11.5px] text-dim">
                  Ригид: давление и сэг не считаются. Давление в шинах всё равно рассчитаем.
                </p>
              )}
            </div>
          </Panel>

          {/* Задняя подвеска */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle right={<Badge tone={draft.rear.kind === 'air' ? 'sky' : draft.rear.kind === 'coil' ? 'amber' : 'neutral'}>{draft.rear.kind === 'none' ? 'HARDTAIL' : draft.rear.kind.toUpperCase()}</Badge>}>
              Задняя подвеска
            </SectionTitle>
            <div className="mt-4 space-y-3">
              <Segmented
                label="Тип"
                value={draft.rear.kind}
                onChange={(v) => setRear({ kind: v })}
                options={[
                  { value: 'none', label: 'Нет' },
                  { value: 'air', label: 'Воздух' },
                  { value: 'coil', label: 'Пружина' },
                ]}
              />
              {draft.rear.kind !== 'none' && (
                <>
                  <SelectField
                    label="Модель аморта (база настроек)"
                    value={draft.rear.modelId ?? ''}
                    onChange={onShockModel}
                    options={shockOptions}
                    hint="Выбор модели подставит размеры и стоковые токены"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <NumberField
                      label="Ход заднего колеса"
                      unit="мм"
                      value={draft.rear.travelMm}
                      onChange={(v) => setRear({ travelMm: v })}
                      min={20}
                      max={260}
                      step={5}
                    />
                    <NumberField
                      label="Ход штока"
                      unit="мм"
                      value={draft.rear.strokeMm}
                      onChange={(v) => setRear({ strokeMm: v })}
                      min={10}
                      max={100}
                      step={0.5}
                    />
                    <NumberField
                      label="Межцентровое (E2E)"
                      unit="мм"
                      value={draft.rear.eyeToEyeMm}
                      onChange={(v) => setRear({ eyeToEyeMm: v })}
                      min={100}
                      max={300}
                      step={0.5}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Тип подвески"
                      value={draft.rear.linkage}
                      onChange={(v) => {
                        const link = LINKAGES.find((l) => l.id === v)
                        setRear({ linkage: v as LinkageType, progressionPct: link?.progression ?? draft.rear.progressionPct })
                      }}
                      options={LINKAGES.map((l) => ({ value: l.id, label: l.label, group: undefined }))}
                      hint={LINKAGES.find((l) => l.id === draft.rear.linkage)?.note}
                    />
                    <NumberField
                      label="Прогрессия"
                      unit="%"
                      value={draft.rear.progressionPct}
                      onChange={(v) => setRear({ progressionPct: v })}
                      min={0}
                      max={60}
                      hint="Насколько рычажность падает к концу хода"
                    />
                    <NumberField
                      label="Рычажность (если известна)"
                      unit=":1"
                      value={draft.rear.leverageOverride ?? 0}
                      onChange={(v) => setRear({ leverageOverride: v > 1 ? v : null })}
                      min={0}
                      max={5}
                      step={0.05}
                      hint={`Расчётная ${(draft.rear.travelMm / Math.max(1, draft.rear.strokeMm)).toFixed(2)}:1 · 0 = авто`}
                    />
                    {draft.rear.kind === 'air' ? (
                      <NumberField
                        label="Токены аморта"
                        unit="шт"
                        value={draft.rear.tokens}
                        onChange={(v) => setRear({ tokens: v })}
                        min={0}
                        max={8}
                        hint={shockModel?.tokens ? `сток ${shockModel.tokens.stock} · макс ${shockModel.tokens.max}` : undefined}
                      />
                    ) : (
                      <NumberField
                        label="Пружина (если знаете)"
                        unit="lb/in"
                        value={draft.rear.coilRate ?? 0}
                        onChange={(v) => setRear({ coilRate: v || undefined })}
                        min={0}
                        max={800}
                        step={25}
                        hint="0 — подобрать автоматически"
                      />
                    )}
                  </div>
                  {shockModel && (
                    <StockInfo
                      lines={[
                        shockModel.damper ? `Демпфер: ${shockModel.damper}` : '',
                        shockModel.tokens ? `Токены: сток ${shockModel.tokens.stock}, макс ${shockModel.tokens.max}` : '',
                        `Размеры: ${shockModel.sizes.map((s) => `${s.eyeToEye}×${s.stroke}`).join(', ')}`,
                        shockModel.springs ? `Пружины: ${shockModel.springs.join(' / ')} lb/in` : '',
                        shockModel.note ?? '',
                      ].filter(Boolean)}
                    />
                  )}
                </>
              )}
            </div>
          </Panel>

          {/* Геометрия */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle right={<Badge>нужна для развесовки</Badge>}>Геометрия</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <NumberField label="База" unit="мм" value={draft.geometry.wheelbaseMm} onChange={(v) => setGeo({ wheelbaseMm: v })} min={800} max={1500} />
              <NumberField label="Длина перьев" unit="мм" value={draft.geometry.chainstayMm} onChange={(v) => setGeo({ chainstayMm: v })} min={300} max={600} />
              <NumberField label="BB drop" unit="мм" value={draft.geometry.bbDropMm} onChange={(v) => setGeo({ bbDropMm: v })} min={-20} max={100} />
              <NumberField label="Угол рулевой" unit="°" value={draft.geometry.headAngleDeg} onChange={(v) => setGeo({ headAngleDeg: v })} min={55} max={75} step={0.5} />
              <NumberField label="Угол подседельной" unit="°" value={draft.geometry.seatAngleDeg} onChange={(v) => setGeo({ seatAngleDeg: v })} min={65} max={82} step={0.5} />
              <NumberField label="Reach" unit="мм" value={draft.geometry.reachMm} onChange={(v) => setGeo({ reachMm: v })} min={300} max={550} />
              <NumberField label="Stack" unit="мм" value={draft.geometry.stackMm} onChange={(v) => setGeo({ stackMm: v })} min={500} max={700} />
            </div>
          </Panel>

          {/* Кокпит */}
          <Panel className="p-4 sm:p-5">
            <SectionTitle>Кокпит</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <NumberField label="Руль" unit="мм" value={draft.geometry.barWidthMm} onChange={(v) => setGeo({ barWidthMm: v })} min={300} max={850} step={5} />
              <NumberField label="Подъём" unit="мм" value={draft.geometry.barRiseMm} onChange={(v) => setGeo({ barRiseMm: v })} min={0} max={80} step={5} />
              <NumberField label="Вынос" unit="мм" value={draft.geometry.stemLengthMm} onChange={(v) => setGeo({ stemLengthMm: v })} min={20} max={120} step={5} />
              <NumberField label="Кольца" unit="мм" value={draft.geometry.spacersMm} onChange={(v) => setGeo({ spacersMm: v })} min={0} max={60} step={5} />
            </div>
          </Panel>
        </div>

        {/* Превью */}
        <aside className="space-y-3 lg:sticky lg:top-[72px] lg:self-start">
          <Panel className="overflow-hidden">
            <div className="grid-bg border-b border-line px-2 pt-2">
              <BikeBlueprint bike={draft} />
            </div>
            <div className="p-4">
              <p className="eyebrow-plain text-[9.5px]">{DISCIPLINES[draft.discipline].short} · {draft.size || 'размер —'}</p>
              <h2 className="mt-1 truncate text-[15px] font-semibold text-ink">{draft.name || 'Новый байк'}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="panel-flat px-2.5 py-2">
                  <div className="eyebrow-plain text-[8.5px]">Ходы</div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">
                    {draft.fork.kind === 'rigid' ? '0' : draft.fork.travelMm} / {draft.rear.kind === 'none' ? '0' : draft.rear.travelMm}
                  </div>
                </div>
                <div className="panel-flat px-2.5 py-2">
                  <div className="eyebrow-plain text-[8.5px]">Колёса</div>
                  <div className="mt-0.5 font-mono text-[13px] text-ink">
                    {draft.wheels.front.size === 700 ? '700' : draft.wheels.front.size}
                    {draft.wheels.rear.size !== draft.wheels.front.size
                      ? `/${draft.wheels.rear.size === 700 ? '700' : draft.wheels.rear.size}`
                      : ''}
                  </div>
                </div>
                {preview?.fork?.pressurePsi != null && (
                  <div className="panel-flat px-2.5 py-2">
                    <div className="eyebrow-plain text-[8.5px]">Вилка дома</div>
                    <div className="mt-0.5 font-mono text-[13px] text-acid">{preview.fork.pressurePsi} psi</div>
                  </div>
                )}
                {preview?.shock && (
                  <div className="panel-flat px-2.5 py-2">
                    <div className="eyebrow-plain text-[8.5px]">Аморт дома</div>
                    <div className="mt-0.5 font-mono text-[13px] text-acid">
                      {preview.shock.pressurePsi ?? preview.shock.springRateLbIn ?? '—'}
                      {preview.shock.pressurePsi ? ' psi' : preview.shock.springRateLbIn ? ' lb/in' : ''}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10.5px] leading-relaxed text-dim">
                Превью считается для {rider ? `${rider.name}, ${rider.weightKg} кг` : 'райдера'} с дефолтными
                настройками рельефа.
              </p>
              <Button variant="primary" className="mt-3 w-full" icon={<Icon name="save" size={14} />} onClick={save}>
                Сохранить и настроить
              </Button>
            </div>
          </Panel>

          <Panel className="p-3.5">
            <div className="flex gap-2 text-[11px] leading-relaxed text-dim">
              <Icon name="info" size={15} className="mt-0.5 shrink-0 text-acid/70" />
              <p>
                Клики и токены в базе — типичные для модели. Точные диапазоны смотрите в мануале
                производителя: они могут отличаться по годам и версиям демпфера.
              </p>
            </div>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmPreset}
        onClose={() => setConfirmPreset(false)}
        onConfirm={applyPreset}
        title="Подставить пресет?"
        confirmLabel="Подставить"
      >
        Ходы, колёса, масса и геометрия будут заменены типичными значениями для дисциплины{' '}
        <b className="text-ink">{d.label}</b>. Ваши текущие значения в этих полях пропадут.
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (id) deleteBike(id)
          navigate('/')
        }}
        title="Удалить байк?"
      >
        Байк и все его сетапы будут удалены без возможности восстановления.
      </ConfirmDialog>
    </div>
  )
}

function StockInfo({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <div className="eyebrow-plain mb-1.5 text-[8.5px] text-dim">Из базы компонентов</div>
      <ul className="space-y-0.5 font-mono text-[10px] leading-relaxed text-muted">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
