import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Bike, Setup, SharedPayload } from '../types'
import { useApp } from '../lib/store'
import { disciplineShort, wheelLabel } from '../lib/format'
import { Badge, Panel, SectionTitle } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { BikeBlueprint } from '../components/BikeBlueprint'
import { ShareDialog } from '../components/ShareDialog'
import { ImportDialog } from '../components/ImportDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function GaragePage() {
  const bikes = useApp((s) => s.bikes)
  const setups = useApp((s) => s.setups)
  const riders = useApp((s) => s.riders)
  const activeRiderId = useApp((s) => s.activeRiderId)
  const deleteBike = useApp((s) => s.deleteBike)
  const duplicateBike = useApp((s) => s.duplicateBike)
  const navigate = useNavigate()

  const [sharePayload, setSharePayload] = useState<SharedPayload | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const activeRider = riders.find((r) => r.id === activeRiderId) ?? riders[0]

  const lastSetups = useMemo(() => {
    const map = new Map<string, Setup>()
    for (const s of setups) {
      const prev = map.get(s.bikeId)
      if (!prev || s.createdAt > prev.createdAt) map.set(s.bikeId, s)
    }
    return map
  }, [setups])

  const openShare = (bike: Bike, setup: Setup) => {
    setSharePayload({
      v: 1,
      name: setup.name,
      notes: setup.notes,
      createdAt: setup.createdAt,
      bike,
      rider: setup.riderSnapshot,
      params: setup.params,
      weather: setup.weather,
    })
    setShareOpen(true)
  }

  const bikeToDelete = bikes.find((b) => b.id === deleteId)

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTitle>Гараж</SectionTitle>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
            Мои велосипеды
            <span className="ml-2 font-mono text-[14px] font-normal text-dim">{bikes.length}</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {activeRider
              ? `${activeRider.name} · ${activeRider.heightCm} см · ${activeRider.weightKg} кг`
              : 'Добавьте профиль райдера в настройках'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" icon={<Icon name="link" size={14} />} onClick={() => setImportOpen(true)}>
            Открыть по коду
          </Button>
          <Link to="/bike/new" className="btn btn-primary">
            <Icon name="plus" size={15} />
            Добавить байк
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Байков" value={String(bikes.length).padStart(2, '0')} />
        <StatTile label="Сетапов" value={String(setups.length).padStart(2, '0')} />
        <StatTile
          label="Активный райдер"
          value={activeRider ? activeRider.name : '—'}
          small
        />
        <StatTile
          label="Масса райдера"
          value={activeRider ? `${activeRider.weightKg} кг` : '—'}
          small
        />
      </div>

      {bikes.length === 0 ? (
        <Panel className="grid-bg flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-acid/30 bg-acid/10 text-acid">
            <Icon name="bike" size={26} />
          </span>
          <h2 className="font-mono text-[15px] uppercase tracking-[0.12em] text-ink">
            Гараж пока пуст
          </h2>
          <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
            Добавьте байк: вилку, аморт, кинематику и геометрию. Дальше приложение посчитает
            давление, пружину, сэг, клики и давление в шинах.
          </p>
          <div className="mt-2 flex gap-2">
            <Link to="/bike/new" className="btn btn-primary">
              <Icon name="plus" size={15} />
              Добавить байк
            </Link>
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              Открыть по коду
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {bikes.map((bike) => {
            const last = lastSetups.get(bike.id)
            return (
              <Panel key={bike.id} className="overflow-hidden">
                <div className="grid-bg relative border-b border-line px-2 pb-0 pt-1">
                  <BikeBlueprint bike={bike} />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge tone="acid">{disciplineShort(bike.discipline)}</Badge>
                  </div>
                  <div className="absolute right-3 top-3">
                    <Badge>
                      {bike.fork.kind === 'rigid' ? 'RIGID' : `${bike.fork.travelMm}/${bike.rear.travelMm}`}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">{bike.name}</h3>
                      <p className="mt-0.5 truncate font-mono text-[10.5px] text-dim">
                        {wheelLabel(bike.wheels.front.size)}
                        {bike.wheels.rear.size !== bike.wheels.front.size
                          ? ` / ${wheelLabel(bike.wheels.rear.size)}`
                          : ''}{' '}
                        · {bike.massKg} кг · {bike.size || '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/bike/${bike.id}`)}
                      className="rounded-lg p-1.5 text-dim transition-colors hover:bg-white/5 hover:text-ink"
                      aria-label="Редактировать байк"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                  </div>

                  {last ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <MiniMetric
                        value={last.result.fork?.pressurePsi ?? last.result.fork?.springRateLbIn ?? '—'}
                        unit={last.result.fork?.pressurePsi ? 'psi' : last.result.fork?.springRateLbIn ? 'lb/in' : ''}
                        label="Вилка"
                      />
                      <MiniMetric
                        value={last.result.shock?.pressurePsi ?? last.result.shock?.springRateLbIn ?? '—'}
                        unit={last.result.shock?.pressurePsi ? 'psi' : last.result.shock?.springRateLbIn ? 'lb/in' : ''}
                        label="Аморт"
                      />
                      <MiniMetric
                        value={`${last.result.tires.front.psi}/${last.result.tires.rear.psi}`}
                        unit="psi"
                        label="Шины"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[11px] text-dim">
                      Сетапов пока нет
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Link to={`/bike/${bike.id}/setup`} className="btn btn-primary btn-sm flex-1">
                      <Icon name="gauge" size={14} />
                      Настроить
                    </Link>
                    <Link to={`/bike/${bike.id}/setups`} className="btn btn-ghost btn-sm">
                      Сетапы
                      <span className="font-mono text-[10px] text-dim">
                        {setups.filter((s) => s.bikeId === bike.id).length}
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled={!last}
                      onClick={() => last && openShare(bike, last)}
                      className="rounded-lg border border-line-strong p-2 text-dim transition-colors hover:text-ink disabled:opacity-30"
                      aria-label="Поделиться"
                    >
                      <Icon name="share" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const id = duplicateBike(bike.id)
                        if (id) navigate(`/bike/${id}`)
                      }}
                      className="rounded-lg border border-line-strong p-2 text-dim transition-colors hover:text-ink"
                      aria-label="Дублировать"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(bike.id)}
                      className="rounded-lg border border-line-strong p-2 text-dim transition-colors hover:border-danger/40 hover:text-danger"
                      aria-label="Удалить"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </Panel>
            )
          })}

          <Link
            to="/bike/new"
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-strong text-dim transition-colors hover:border-acid/40 hover:text-acid"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-current">
              <Icon name="plus" size={22} />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Добавить байк</span>
          </Link>
        </div>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} payload={sharePayload} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteBike(deleteId)}
        title="Удалить байк?"
      >
        {bikeToDelete ? (
          <>
            Байк <b className="text-ink">{bikeToDelete.name}</b> и все его сетапы (
            {setups.filter((s) => s.bikeId === bikeToDelete.id).length}) будут удалены. Это действие
            нельзя отменить.
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

function StatTile({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="panel-flat px-3 py-2.5">
      <div className="eyebrow-plain text-[9px] text-dim">{label}</div>
      <div
        className={
          small
            ? 'mt-1 truncate font-mono text-[13px] text-ink'
            : 'mt-1 font-mono text-[20px] font-bold tnum text-ink'
        }
      >
        {value}
      </div>
    </div>
  )
}

function MiniMetric({
  value,
  unit,
  label,
}: {
  value: string | number
  unit: string
  label: string
}) {
  return (
    <div className="rounded-lg bg-black/25 px-2 py-1.5">
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[15px] font-bold tnum text-acid">{value}</span>
        {unit && <span className="font-mono text-[8.5px] text-dim">{unit}</span>}
      </div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-dim">{label}</div>
    </div>
  )
}
