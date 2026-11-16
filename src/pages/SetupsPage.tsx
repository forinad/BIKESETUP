import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { SharedPayload, Setup } from '../types'
import { useApp } from '../lib/store'
import { formatDateTime } from '../lib/format'
import { WEATHER_CONDITIONS, getSurface } from '../data/presets'
import { Badge, Panel, SectionTitle } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ShareDialog } from '../components/ShareDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function SetupsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bikes = useApp((s) => s.bikes)
  const setups = useApp((s) => s.setups)
  const deleteSetup = useApp((s) => s.deleteSetup)

  const [sharePayload, setSharePayload] = useState<SharedPayload | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const bike = bikes.find((b) => b.id === id)
  const list = setups
    .filter((s) => s.bikeId === id)
    .sort((a, b) => b.createdAt - a.createdAt)

  if (!bike) {
    return (
      <Panel className="mx-auto max-w-lg p-6 text-center">
        <h1 className="font-mono text-[14px] uppercase tracking-[0.12em] text-ink">Байк не найден</h1>
        <Link to="/" className="btn btn-primary mt-4 inline-flex">
          В гараж
        </Link>
      </Panel>
    )
  }

  const openShare = (setup: Setup) => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="shrink-0 rounded-lg border border-line-strong p-2 text-dim hover:text-ink" aria-label="В гараж">
            <Icon name="arrow-left" size={16} />
          </Link>
          <div className="min-w-0">
            <SectionTitle>История сетапов</SectionTitle>
            <h1 className="mt-1 truncate text-[20px] font-semibold text-ink sm:text-[24px]">{bike.name}</h1>
          </div>
        </div>
        <Link to={`/bike/${bike.id}/setup`} className="btn btn-primary">
          <Icon name="plus" size={15} />
          Новый сетап
        </Link>
      </div>

      {list.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-acid/30 bg-acid/10 text-acid">
            <Icon name="sliders" size={22} />
          </span>
          <h2 className="font-mono text-[13px] uppercase tracking-[0.12em] text-ink">Пока пусто</h2>
          <p className="max-w-sm text-[12px] leading-relaxed text-muted">
            Сохраните первый сетап: давление, пружину, клики и условия. Дальше можно сравнивать
            версии между собой.
          </p>
          <Link to={`/bike/${bike.id}/setup`} className="btn btn-primary mt-1">
            <Icon name="gauge" size={14} />
            Настроить
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((setup) => {
            const w = WEATHER_CONDITIONS.find((x) => x.id === setup.weather.condition) ?? WEATHER_CONDITIONS[0]
            const surface = getSurface(setup.params.surface, bike.discipline)
            const r = setup.result
            return (
              <Panel key={setup.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14.5px] font-semibold text-ink">{setup.name}</h3>
                    <p className="mt-0.5 font-mono text-[10px] text-dim">
                      {formatDateTime(setup.createdAt)} · {setup.riderSnapshot.name} ·{' '}
                      {setup.riderSnapshot.weightKg} кг
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    <Badge>{surface.short}</Badge>
                    <Badge>{w.short} · {setup.weather.tempC > 0 ? '+' : ''}{setup.weather.tempC}°</Badge>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniBox
                    label="Вилка дома"
                    value={r.fork ? (r.fork.pressurePsi ? `${r.fork.pressurePsi} psi` : `${r.fork.springRateLbIn} lb/in`) : '—'}
                    sub={r.fork ? `сэг ${r.fork.sagMm} мм` : 'ригид'}
                  />
                  <MiniBox
                    label="Аморт дома"
                    value={
                      r.shock
                        ? r.shock.pressurePsi
                          ? `${r.shock.pressurePsi} psi`
                          : `${r.shock.springRateLbIn} lb/in`
                        : '—'
                    }
                    sub={r.shock ? `сэг ${r.shock.sagMm} мм` : 'нет'}
                  />
                  <MiniBox
                    label="Шины дома"
                    value={`${r.tires.front.psi}/${r.tires.rear.psi}`}
                    sub="psi перед/зад"
                  />
                </div>

                {setup.notes && (
                  <p className="mt-2.5 line-clamp-2 border-l-2 border-line-strong pl-2 text-[11px] leading-snug text-dim">
                    {setup.notes}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    icon={<Icon name="external" size={13} />}
                    onClick={() => navigate(`/bike/${bike.id}/setup?setup=${setup.id}`)}
                  >
                    Открыть
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Icon name="share" size={13} />} onClick={() => openShare(setup)}>
                    Код
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(setup.id)} aria-label="Удалить сетап">
                    <Icon name="trash" size={13} />
                  </Button>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} payload={sharePayload} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteSetup(deleteId)}
        title="Удалить сетап?"
        confirmLabel="Удалить"
      >
        Запись исчезнет из истории. Байк и другие сетапы останутся.
      </ConfirmDialog>
    </div>
  )
}

function MiniBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-black/25 px-2 py-1.5">
      <div className="font-mono text-[12px] font-bold tnum text-acid">{value}</div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-dim">{label}</div>
      <div className="mt-0.5 text-[9.5px] text-dim/80">{sub}</div>
    </div>
  )
}
