import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Bike, Rider, Setup } from '../types'
import { backupJson, useApp } from '../lib/store'
import { Badge, Panel, SectionTitle } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { NumberField, TextField } from '../components/ui/Fields'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function SettingsPage() {
  const riders = useApp((s) => s.riders)
  const bikes = useApp((s) => s.bikes)
  const setups = useApp((s) => s.setups)
  const activeRiderId = useApp((s) => s.activeRiderId)
  const addRider = useApp((s) => s.addRider)
  const updateRider = useApp((s) => s.updateRider)
  const deleteRider = useApp((s) => s.deleteRider)
  const setActiveRider = useApp((s) => s.setActiveRider)
  const replaceAll = useApp((s) => s.replaceAll)
  const clearGarage = useApp((s) => s.clearGarage)

  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [deleteRiderId, setDeleteRiderId] = useState<string | null>(null)

  const exportBackup = () => {
    const blob = new Blob([backupJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bikesetup-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'ok', text: 'Бэкап выгружен' })
  }

  const importBackup = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as {
        riders?: Rider[]
        bikes?: Bike[]
        setups?: Setup[]
        activeRiderId?: string
      }
      if (!Array.isArray(data.riders) || !Array.isArray(data.bikes) || !Array.isArray(data.setups)) {
        setMessage({ kind: 'err', text: 'В файле нет riders / bikes / setups' })
        return
      }
      replaceAll({
        riders: data.riders,
        bikes: data.bikes,
        setups: data.setups,
        activeRiderId: data.activeRiderId,
      })
      setMessage({
        kind: 'ok',
        text: `Импортировано: ${data.bikes.length} байков, ${data.setups.length} сетапов`,
      })
    } catch {
      setMessage({ kind: 'err', text: 'Не удалось прочитать JSON' })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header>
        <SectionTitle>Настройки</SectionTitle>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">
          Райдеры и данные
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Всё хранится локально в браузере. Бэкап — единственный способ перенести гараж на другой компьютер.
        </p>
      </header>

      <Panel className="p-4 sm:p-5">
        <SectionTitle
          right={
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="plus" size={13} />}
              onClick={() => addRider()}
            >
              Райдер
            </Button>
          }
        >
          Профили райдеров · {riders.length}
        </SectionTitle>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-dim">
          Вес и экипировка идут в расчёт давления. Рост — в рекомендацию по ширине руля.
        </p>

        <div className="mt-4 space-y-2.5">
          {riders.map((r) => {
            const isActive = r.id === activeRiderId
            return (
              <div key={r.id} className="panel-flat p-3.5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-line-strong bg-surface-3 font-mono text-[10px] uppercase text-acid">
                      {r.name.slice(0, 2)}
                    </span>
                    <span className="text-[12.5px] text-ink">{r.name}</span>
                    {isActive && <Badge tone="acid">активный</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => setActiveRider(r.id)}
                        className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim hover:text-acid"
                      >
                        сделать активным
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={riders.length <= 1}
                      onClick={() => setDeleteRiderId(r.id)}
                      className="rounded-md p-1.5 text-dim transition-colors hover:text-danger disabled:opacity-30"
                      aria-label="Удалить райдера"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-4">
                  <TextField label="Имя" value={r.name} onChange={(v) => updateRider(r.id, { name: v })} />
                  <NumberField label="Рост" unit="см" value={r.heightCm} onChange={(v) => updateRider(r.id, { heightCm: v })} min={130} max={215} />
                  <NumberField label="Вес" unit="кг" value={r.weightKg} onChange={(v) => updateRider(r.id, { weightKg: v })} min={30} max={160} step={0.5} />
                  <NumberField label="Экипировка" unit="кг" value={r.gearKg} onChange={(v) => updateRider(r.id, { gearKg: v })} min={0} max={20} step={0.5} />
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <SectionTitle>Данные</SectionTitle>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            В памяти: {bikes.length} байков, {setups.length} сетапов, {riders.length} профилей.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" icon={<Icon name="download" size={14} />} onClick={exportBackup}>
              Скачать бэкап
            </Button>
            <Button variant="ghost" icon={<Icon name="upload" size={14} />} onClick={() => fileRef.current?.click()}>
              Загрузить бэкап
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importBackup(file)
                e.target.value = ''
              }}
            />
          </div>
          {message && (
            <p
              className={
                message.kind === 'ok'
                  ? 'mt-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-acid'
                  : 'mt-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-danger'
              }
            >
              {message.text}
            </p>
          )}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle>Очистка</SectionTitle>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Удалить все байки и сетапы. Профили райдеров останутся. Сначала лучше скачать бэкап.
          </p>
          <Button variant="danger" className="mt-4" icon={<Icon name="trash" size={14} />} onClick={() => setConfirmReset(true)}>
            Очистить гараж
          </Button>
        </Panel>
      </div>

      <Panel className="p-4 sm:p-5">
        <SectionTitle>Как это работает</SectionTitle>
        <div className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-muted">
          <p>
            <b className="text-ink">Гараж</b> — каждый байк хранит вилку, аморт, кинематику, геометрию,
            колёса и массу. Один и тот же профиль райдера используется для всех байков.
          </p>
          <p>
            <b className="text-ink">Расчёт</b> — гибридный: развесовка по геометрии, сэг и нагрузки,
            давление из массы и хода, пружина из рычажности, клики и токены с калибровкой под типичные
            таблицы. В блоке «Как это посчитано» видны все формулы.
          </p>
          <p>
            <b className="text-ink">Шаринг</b> — сетап упаковывается в код. Получатель видит байк и
            цифры в режиме просмотра и может добавить их к себе.
          </p>
          <p className="text-dim">
            Это не официальный калькулятор производителя. Начинайте с рекомендаций, проверяйте сэг на
            байке и корректируйте под свой стиль.
          </p>
        </div>
      </Panel>

      <div className="flex justify-center">
        <Link to="/" className="btn btn-ghost">
          <Icon name="arrow-left" size={14} />
          В гараж
        </Link>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={clearGarage}
        title="Очистить гараж?"
        confirmLabel="Очистить"
      >
        Все байки и сетапы будут удалены. Профили райдеров останутся. Это действие нельзя отменить.
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteRiderId}
        onClose={() => setDeleteRiderId(null)}
        onConfirm={() => deleteRiderId && deleteRider(deleteRiderId)}
        title="Удалить профиль?"
      >
        Сетапы, сделанные для этого райдера, останутся — в них сохранён снимок веса и роста.
      </ConfirmDialog>
    </div>
  )
}
