import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Rider } from '../types'
import { decodeShared, encodeShared } from '../lib/share'
import { bikeSignature, calcSetup } from '../lib/calc'
import { useApp } from '../lib/store'
import { formatDateTime, wheelLabel } from '../lib/format'
import { WEATHER_CONDITIONS } from '../data/presets'
import { Badge, Panel, SectionTitle } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { BikeBlueprint } from '../components/BikeBlueprint'
import { ResultsView } from '../components/ResultsView'
import { copyText } from '../lib/clipboard'

export function SharedPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const bikes = useApp((s) => s.bikes)
  const importShared = useApp((s) => s.importShared)
  const [copied, setCopied] = useState(false)

  const payload = useMemo(() => decodeShared(code ?? ''), [code])
  const existing = useMemo(
    () => (payload ? bikes.find((b) => bikeSignature(b) === bikeSignature(payload.bike)) : undefined),
    [payload, bikes],
  )

  const result = useMemo(() => {
    if (!payload) return null
    const rider: Rider = {
      id: 'shared_rider',
      name: payload.rider.name,
      heightCm: payload.rider.heightCm,
      weightKg: payload.rider.weightKg,
      gearKg: payload.rider.gearKg,
      createdAt: payload.createdAt,
    }
    return calcSetup(payload.bike, rider, payload.params, payload.weather)
  }, [payload])

  if (!payload || !result) {
    return (
      <Panel className="mx-auto max-w-lg p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-amber/30 bg-amber/10 text-amber">
          <Icon name="alert" size={24} />
        </span>
        <h1 className="mt-3 font-mono text-[14px] uppercase tracking-[0.12em] text-ink">
          Код не распознан
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Проверьте, что скопировали код целиком (начинается с BS1-) или полную ссылку.
        </p>
        <Link to="/" className="btn btn-primary mt-4 inline-flex">
          В гараж
        </Link>
      </Panel>
    )
  }

  const weatherMeta = WEATHER_CONDITIONS.find((x) => x.id === payload.weather.condition) ?? WEATHER_CONDITIONS[0]
  const rider = payload.rider

  const addToGarage = () => {
    const { bikeId, setupId } = importShared(payload, existing?.id)
    navigate(`/bike/${bikeId}/setup?setup=${setupId}`)
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionTitle>Сетап по коду</SectionTitle>
          <h1 className="mt-2 text-[22px] font-semibold text-ink sm:text-[26px]">{payload.bike.name}</h1>
          <p className="mt-1 text-[12px] text-muted">
            {payload.name} · {formatDateTime(payload.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            icon={<Icon name="copy" size={14} />}
            onClick={async () => {
              if (await copyText(encodeShared(payload))) {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1800)
              }
            }}
          >
            {copied ? 'Скопировано' : 'Скопировать код'}
          </Button>
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={addToGarage}>
            {existing ? 'Добавить сетап к моему байку' : 'Добавить байк и сетап'}
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-acid/25 bg-acid/5 px-4 py-3">
        <p className="text-[11.5px] leading-relaxed text-acid/90">
          Режим просмотра. Цифры посчитаны под райдера автора: {rider.name}, {rider.heightCm} см,{' '}
          {rider.weightKg} кг, экипировка {rider.gearKg} кг. {existing
            ? 'Такой байк уже есть у вас в гараже — добавится только сетап.'
            : 'Байк и сетап появятся в вашем гараже после нажатия кнопки.'}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1">
          <ResultsView bike={payload.bike} rider={rider} result={result} weather={payload.weather} params={payload.params} />
        </div>

        <aside className="order-1 space-y-3 lg:order-2">
          <Panel className="overflow-hidden">
            <div className="grid-bg border-b border-line px-2 pt-2">
              <BikeBlueprint bike={payload.bike} />
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="acid">{payload.bike.size || '—'}</Badge>
                <Badge>{wheelLabel(payload.bike.wheels.front.size)}{payload.bike.wheels.rear.size !== payload.bike.wheels.front.size ? ` / ${wheelLabel(payload.bike.wheels.rear.size)}` : ''}</Badge>
                <Badge>{payload.bike.massKg} кг</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <Line label="Вилка" value={result.fork?.label ?? 'Ригид'} />
                <Line label="Аморт" value={result.shock?.label ?? 'Нет'} />
                <Line label="Ходы" value={`${payload.bike.fork.travelMm} / ${payload.bike.rear.travelMm} мм`} />
                <Line label="База" value={`${payload.bike.geometry.wheelbaseMm} мм`} />
                <Line label="Условия" value={`${weatherMeta.short}, ${payload.weather.tempC} °C`} />
              </div>
              {payload.notes && (
                <p className="mt-3 border-l-2 border-acid/40 pl-2 text-[11px] leading-relaxed text-muted">
                  {payload.notes}
                </p>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex gap-2 text-[11px] leading-relaxed text-dim">
              <Icon name="info" size={15} className="mt-0.5 shrink-0 text-acid/70" />
              <p>
                Хотите свои цифры? После добавления откройте сетап и переключите профиль райдера на
                себя — пересчитается под ваш вес.
              </p>
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={addToGarage}>
              <Icon name="plus" size={14} />
              {existing ? 'Добавить сетап' : 'Добавить в гараж'}
            </Button>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="eyebrow-plain shrink-0 text-[9px] text-dim">{label}</span>
      <span className="min-w-0 truncate text-right text-[11px] text-muted">{value}</span>
    </div>
  )
}
