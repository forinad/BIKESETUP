import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Rider, Setup, SharedPayload, Weather, WeatherCondition } from '../types'
import { DEFAULT_PARAMS, DEFAULT_WEATHER } from '../types'
import { useApp } from '../lib/store'
import { uid } from '../lib/id'
import { bikeSignature, calcSetup } from '../lib/calc'
import { DISCIPLINES } from '../data/disciplines'
import { WEATHER_CONDITIONS } from '../data/presets'
import { disciplineShort, formatDate } from '../lib/format'
import { Panel, SectionTitle, Badge } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { NumberField, Segmented, SelectField, Slider, TextField } from '../components/ui/Fields'
import { StepCard } from '../components/ui/StepCard'
import { Modal } from '../components/ui/Modal'
import { ResultsView } from '../components/ResultsView'
import { ShareDialog } from '../components/ShareDialog'

export function SetupPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const setupId = search.get('setup')

  const bikes = useApp((s) => s.bikes)
  const riders = useApp((s) => s.riders)
  const setups = useApp((s) => s.setups)
  const activeRiderId = useApp((s) => s.activeRiderId)
  const updateRider = useApp((s) => s.updateRider)
  const addSetup = useApp((s) => s.addSetup)

  const bike = bikes.find((b) => b.id === id)
  const loadedSetup = setups.find((s) => s.id === setupId)
  const fallbackRider = riders.find((r) => r.id === activeRiderId) ?? riders[0]

  const [riderId, setRiderId] = useState(loadedSetup?.riderId ?? fallbackRider?.id ?? '')
  const [params, setParams] = useState(loadedSetup?.params ?? DEFAULT_PARAMS)
  const [weather, setWeather] = useState<Weather>(loadedSetup?.weather ?? DEFAULT_WEATHER)
  const [open, setOpen] = useState({ bike: false, rider: true, conditions: true, position: true })
  const [saveOpen, setSaveOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')

  const storeRider = riders.find((r) => r.id === riderId)
  const rider: Rider | null =
    storeRider ??
    (loadedSetup
      ? {
          id: `snapshot_${loadedSetup.id}`,
          name: loadedSetup.riderSnapshot.name,
          heightCm: loadedSetup.riderSnapshot.heightCm,
          weightKg: loadedSetup.riderSnapshot.weightKg,
          gearKg: loadedSetup.riderSnapshot.gearKg,
          createdAt: loadedSetup.createdAt,
        }
      : (fallbackRider ?? null))

  const result = useMemo(() => {
    if (!bike || !rider) return null
    return calcSetup(bike, rider, params, weather)
  }, [bike, rider, params, weather])

  if (!bike) {
    return (
      <Panel className="mx-auto max-w-lg p-6 text-center">
        <h1 className="font-mono text-[14px] uppercase tracking-[0.12em] text-ink">Байк не найден</h1>
        <p className="mt-2 text-[12px] text-muted">Возможно, он был удалён из гаража.</p>
        <Link to="/" className="btn btn-primary mt-4 inline-flex">
          В гараж
        </Link>
      </Panel>
    )
  }

  if (!rider || !result) {
    return (
      <Panel className="mx-auto max-w-lg p-6 text-center">
        <h1 className="font-mono text-[14px] uppercase tracking-[0.12em] text-ink">Нет профиля райдера</h1>
        <p className="mt-2 text-[12px] text-muted">Добавьте райдера в настройках, чтобы считать сетап.</p>
        <Link to="/settings" className="btn btn-primary mt-4 inline-flex">
          В настройки
        </Link>
      </Panel>
    )
  }

  const isSnapshot = rider.id.startsWith('snapshot_')
  const d = DISCIPLINES[bike.discipline]
  const w = WEATHER_CONDITIONS.find((x) => x.id === weather.condition) ?? WEATHER_CONDITIONS[0]
  const defaultName = `${bike.name} · ${formatDate(Date.now())}`

  const updateActiveRider = (patch: Partial<Rider>) => {
    if (storeRider) updateRider(storeRider.id, patch)
  }

  const sharePayload: SharedPayload = {
    v: 1,
    name: loadedSetup?.name ?? defaultName,
    notes: loadedSetup?.notes,
    createdAt: Date.now(),
    bike,
    rider: {
      name: rider.name,
      heightCm: rider.heightCm,
      weightKg: rider.weightKg,
      gearKg: rider.gearKg,
    },
    params,
    weather,
  }

  const bump = (key: keyof typeof open) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="shrink-0 rounded-lg border border-line-strong p-2 text-dim hover:text-ink" aria-label="В гараж">
            <Icon name="arrow-left" size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SectionTitle>Настройка</SectionTitle>
              <Badge tone="acid">{disciplineShort(bike.discipline)}</Badge>
            </div>
            <h1 className="mt-1 truncate text-[20px] font-semibold text-ink sm:text-[24px]">{bike.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/bike/${bike.id}/setups`} className="btn btn-ghost btn-sm">
            <Icon name="sliders" size={14} />
            Сетапы
          </Link>
          <Button variant="ghost" size="sm" icon={<Icon name="share" size={14} />} onClick={() => setShareOpen(true)}>
            Поделиться
          </Button>
          <Button variant="primary" icon={<Icon name="save" size={14} />} onClick={() => setSaveOpen(true)}>
            Сохранить сетап
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* ──────── Управление ──────── */}
        <div className="space-y-3">
          <StepCard
            step={1}
            title="Байк"
            open={open.bike}
            onToggle={() => bump('bike')}
            summary={`${bike.fork.kind === 'rigid' ? 'ригид' : `${bike.fork.travelMm} мм`} / ${
              bike.rear.kind === 'none' ? 'хардтейл' : `${bike.rear.travelMm} мм`
            } · ${bike.wheels.front.size === 700 ? '700c' : `${bike.wheels.front.size}″`}`}
            action={
              <Link
                to={`/bike/${bike.id}`}
                className="rounded-lg p-1.5 text-dim transition-colors hover:bg-white/5 hover:text-ink"
                aria-label="Редактировать байк"
              >
                <Icon name="edit" size={15} />
              </Link>
            }
          >
            <div className="space-y-2 text-[12px]">
              <Row label="Вилка" value={result.fork ? result.fork.label : 'Ригид'} />
              <Row label="Аморт" value={result.shock ? result.shock.label : 'Нет'} />
              <Row
                label="Рычажность"
                value={result.shock ? `${result.shock.leverageRatio}:1 · прогрессия ${bike.rear.progressionPct}%` : '—'}
              />
              <Row label="Геометрия" value={`база ${bike.geometry.wheelbaseMm} · перья ${bike.geometry.chainstayMm}`} />
              <Row
                label="Посадка шин"
                value={`${result.tires.front.setupShort.toLowerCase()} / ${result.tires.rear.setupShort.toLowerCase()}`}
              />
              <Row label="Масса байка" value={`${bike.massKg} кг`} />
            </div>
          <Link to={`/bike/${bike.id}`} className="btn btn-ghost btn-sm mt-3 w-full">
              <Icon name="edit" size={13} />
              Изменить характеристики
            </Link>
          </StepCard>

          <StepCard
            step={2}
            title="Райдер"
            open={open.rider}
            onToggle={() => bump('rider')}
            summary={`${rider.name} · ${rider.heightCm} см · ${rider.weightKg} кг`}
          >
            <div className="space-y-3">
              {riders.length > 1 && (
                <SelectField
                  label="Профиль"
                  value={storeRider?.id ?? ''}
                  onChange={(v) => setRiderId(v)}
                  options={[
                    ...(storeRider ? [] : [{ value: '', label: `${rider.name} (из сетапа, не сохранён)` }]),
                    ...riders.map((r) => ({ value: r.id, label: `${r.name} · ${r.weightKg} кг` })),
                  ]}
                  hint="Профили переключаются в шапке приложения"
                />
              )}

              {isSnapshot && (
                <div className="rounded-xl border border-amber/25 bg-amber/5 p-3">
                  <p className="text-[11px] leading-relaxed text-amber/90">
                    Это вес и рост автора сетапа, а не ваш профиль. Цифры будут как у него.
                  </p>
                  {fallbackRider && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={() => setRiderId(fallbackRider.id)}
                    >
                      Пересчитать под меня ({fallbackRider.weightKg} кг)
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Рост"
                  unit="см"
                  value={rider.heightCm}
                  onChange={(v) => updateActiveRider({ heightCm: v })}
                  min={130}
                  max={215}
                  disabled={isSnapshot}
                />
                <NumberField
                  label="Вес"
                  unit="кг"
                  value={rider.weightKg}
                  onChange={(v) => updateActiveRider({ weightKg: v })}
                  min={30}
                  max={160}
                  step={0.5}
                  disabled={isSnapshot}
                />
                <NumberField
                  label="Экипировка"
                  unit="кг"
                  value={rider.gearKg}
                  onChange={(v) => updateActiveRider({ gearKg: v })}
                  min={0}
                  max={20}
                  step={0.5}
                  disabled={isSnapshot}
                  hint="Шлем, защита, рюкзак"
                />
                <div className="flex flex-col justify-end">
                  <div className="panel-flat px-3 py-2">
                    <div className="eyebrow-plain text-[8.5px] text-dim">Суммарно с байком</div>
                    <div className="mt-0.5 font-mono text-[15px] font-bold text-acid">
                      {result.mass.totalKg.toFixed(1)} кг
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="eyebrow-plain mb-2 text-[8.5px] text-dim">Развесовка</div>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>перед {Math.round(result.balance.frontPct)}%</span>
                  <span>зад {100 - Math.round(result.balance.frontPct)}%</span>
                </div>
              </div>

              {!storeRider && (
                <Link to="/settings" className="btn btn-ghost btn-sm w-full">
                  <Icon name="user" size={13} />
                  Сохранить профиль в настройках
                </Link>
              )}
            </div>
          </StepCard>

          <StepCard
            step={3}
            title="Условия"
            open={open.conditions}
            onToggle={() => bump('conditions')}
            summary={`${w.short} · ${weather.tempC > 0 ? '+' : ''}${weather.tempC} °C · ${weather.altitudeM} м`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Температура"
                  unit="°C"
                  value={weather.tempC}
                  onChange={(v) => setWeather((prev) => ({ ...prev, tempC: v }))}
                  min={-20}
                  max={45}
                  step={1}
                />
                <NumberField
                  label="Высота"
                  unit="м"
                  value={weather.altitudeM}
                  onChange={(v) => setWeather((prev) => ({ ...prev, altitudeM: v }))}
                  min={0}
                  max={4500}
                  step={50}
                />
              </div>

              <SelectField
                label="Погода / состояние трейла"
                value={weather.condition}
                onChange={(v) => setWeather((prev) => ({ ...prev, condition: v as WeatherCondition }))}
                options={WEATHER_CONDITIONS.map((c) => ({ value: c.id, label: c.label }))}
                hint={w.note}
              />

              <div className="space-y-3 border-t border-line pt-3">
                <Slider
                  label="Ощущение подвески"
                  value={params.feel}
                  onChange={(v) => setParams((p) => ({ ...p, feel: v }))}
                  left="Мягко"
                  right="Жёстко"
                  format={(v) => `${Math.round(v * 100)}%`}
                  hint="Влияет на целевой сэг и клики демпфирования."
                />
                <Slider
                  label="Сцепление / грип"
                  value={params.grip}
                  onChange={(v) => setParams((p) => ({ ...p, grip: v }))}
                  left="Низкий"
                  right="Высокий"
                  format={(v) => `${Math.round(v * 100)}%`}
                  hint="Чем выше — тем ниже давление в шинах."
                />
                <Slider
                  label="Тип трейла"
                  value={params.terrain}
                  onChange={(v) => setParams((p) => ({ ...p, terrain: v }))}
                  left="Технично"
                  right="Флоу"
                  format={(v) => `${Math.round(v * 100)}%`}
                  hint="Техничный рельеф → чуть больше сэга и токенов."
                />
              </div>
            </div>
          </StepCard>

          <StepCard
            step={4}
            title="Позиция райдера"
            open={open.position}
            onToggle={() => bump('position')}
            summary={`${params.position > 0 ? '+' : ''}${Math.round(params.position * 60)} мм от нейтрали`}
          >
            <div className="space-y-2">
              <Segmented
                label="Быстрый выбор стойки"
                value={params.position >= 0.25 ? 0.5 : params.position <= -0.25 ? -0.5 : 0}
                onChange={(v) => setParams((p) => ({ ...p, position: v }))}
                options={[
                  { value: 0.5, label: 'Атака' },
                  { value: 0, label: 'Нейтраль' },
                  { value: -0.5, label: 'Назад' },
                ]}
              />
              <p className="text-[11px] leading-relaxed text-dim">
                «Атака» — центр массы вперёд на ~30 мм: больше держака переднего колеса.
                «Назад» — разгружает вилку и нагружает аморт, если байк клюёт носом.
              </p>
              <Slider
                label="Смещение центра массы"
                value={params.position}
                onChange={(v) => setParams((p) => ({ ...p, position: v }))}
                min={-1}
                max={1}
                step={0.05}
                left="Назад"
                right="Вперёд"
                format={(v) => `${v > 0 ? '+' : ''}${Math.round(v * 60)} мм`}
              />
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-dim">
                <span>−60 мм</span>
                <span className="text-acid/80">рекомендуемый старт</span>
                <span>+60 мм</span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-dim">
                Нейтральная атакующая стойка — центр массы над кареткой. Сдвиг вперёд нагружает
                вилку (давление выше), назад — аморт. Ставьте по ощущениям: не хватает держака
                переднего колеса — чуть вперёд.
              </p>
              <div className="panel-flat mt-2 px-3 py-2.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-dim">ЦМ от задней оси</span>
                  <span className="text-ink">{result.balance.comFromRearMm} мм</span>
                </div>
                <div className="mt-1 flex justify-between font-mono text-[11px]">
                  <span className="text-dim">Нагрузка перед / зад</span>
                  <span className="text-ink">
                    {result.balance.frontKg.toFixed(1)} / {result.balance.rearKg.toFixed(1)} кг
                  </span>
                </div>
                {result.fork?.pressurePsi != null && (
                  <div className="mt-1 flex justify-between font-mono text-[11px]">
                    <span className="text-dim">Давление вилки</span>
                    <span className="text-acid">{result.fork.pressurePsi} psi</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between font-mono text-[11px]">
                  <span className="text-dim">Шины перед / зад</span>
                  <span className="text-ink">
                    {result.tires.front.psi} / {result.tires.rear.psi} psi
                  </span>
                </div>
              </div>
            </div>
          </StepCard>

          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-dim transition-colors hover:text-ink"
              onClick={() => {
                setParams(DEFAULT_PARAMS)
                setWeather(DEFAULT_WEATHER)
              }}
            >
              Сбросить модификаторы
            </button>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-dim">
              {d.short} · {Math.round(d.sagFront * 100)}% сэг
            </span>
          </div>
        </div>

        {/* ──────── Результаты ──────── */}
        <div>
          <ResultsView bike={bike} rider={rider} result={result} weather={weather} params={params} />
        </div>
      </div>

      <SaveSetupDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        defaultName={defaultName}
        onSave={(name, notes) => {
          const setup: Setup = {
            id: uid('setup'),
            bikeId: bike.id,
            riderId: rider.id,
            name,
            notes: notes.trim() || undefined,
            createdAt: Date.now(),
            params,
            weather,
            riderSnapshot: {
              name: rider.name,
              heightCm: rider.heightCm,
              weightKg: rider.weightKg,
              gearKg: rider.gearKg,
            },
            bikeSignature: bikeSignature(bike),
            result,
          }
          addSetup(setup)
          setSaveOpen(false)
          setToast('Сетап сохранён')
          window.setTimeout(() => setToast(''), 2600)
        }}
      />

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} payload={sharePayload} />

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-acid/40 bg-surface-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-acid shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="eyebrow-plain shrink-0 text-[9px] text-dim">{label}</span>
      <span className="min-w-0 truncate text-right text-[11.5px] text-muted">{value}</span>
    </div>
  )
}

function SaveSetupDialog({
  open,
  onClose,
  defaultName,
  onSave,
}: {
  open: boolean
  onClose: () => void
  defaultName: string
  onSave: (name: string, notes: string) => void
}) {
  const [name, setName] = useState(defaultName)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setNotes('')
    }
  }, [open, defaultName])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Сохранить сетап"
      subtitle="Сетап сохранится с текущими условиями и результатами. Потом можно сравнить с другим."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            icon={<Icon name="save" size={14} />}
            onClick={() => onSave(name.trim() || defaultName, notes)}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextField label="Название" value={name} onChange={setName} placeholder={defaultName} />
        <TextField
          label="Заметки"
          value={notes}
          onChange={setNotes}
          multiline
          rows={3}
          placeholder="Например: мокро, сработало лучше на корнях. Вилку на +5 psi."
        />
      </div>
    </Modal>
  )
}
