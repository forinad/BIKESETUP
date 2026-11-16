import type { Bike, CalcResult, Rider, SetupParams, SharedPayload, Weather } from '../types'
import type { CalcResult as Result } from '../types'
import { HOME_TEMP_C } from '../types'
import { DISCIPLINES } from '../data/disciplines'
import { getTireSetup, getWeatherMeta, getSurface } from '../data/presets'
import { disciplineLabel, widthLabel, wheelLabel } from '../lib/format'
import { Badge, Divider, Panel, SectionTitle } from './ui/Panel'
import { BalanceBar, ClickGrid, Metric, SagBar } from './Metrics'
import { Icon } from './ui/Icon'

export function ResultsView({
  bike,
  rider,
  result,
  weather,
  params,
}: {
  bike: Bike
  rider: Rider | SharedPayload['rider'] | null
  result: Result
  weather: Weather
  params: SetupParams
}) {
  const d = DISCIPLINES[bike.discipline]
  const w = getWeatherMeta(weather.condition)
  const surface = getSurface(params.surface, bike.discipline)
  const riderHeight = rider && 'heightCm' in rider ? rider.heightCm : null

  return (
    <div className="space-y-3">
      {/* ─────────── Сводка ─────────── */}
      <Panel className="overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionTitle>Сетап</SectionTitle>
              <h2 className="mt-2 truncate text-[21px] font-semibold leading-tight text-ink">
                {bike.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted">
                {result.fork ? result.fork.label : 'Ригид'} · {result.shock ? result.shock.label : 'Хардтейл'}
              </p>
            </div>
            <Badge tone="acid" className="shrink-0">
              {disciplineLabel(bike.discipline)}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              value={result.mass.totalKg.toFixed(0)}
              unit="кг"
              label="Масса с райдером"
              sub={`${riderHeight ? `${riderHeight} см · ` : ''}${result.mass.bikeKg} кг байк`}
            />
            <Metric
              value={result.balance.frontKg.toFixed(0)}
              unit="кг"
              label="На переднее"
              sub={`${Math.round(result.balance.frontPct)}%`}
            />
            <Metric
              value={result.balance.rearKg.toFixed(0)}
              unit="кг"
              label="На заднее"
              sub={`${100 - Math.round(result.balance.frontPct)}%`}
            />
          </div>

          <div className="mt-4">
            <BalanceBar frontPct={result.balance.frontPct} />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge>
              <Icon name="cloud" size={12} /> {w.short} · {weather.tempC > 0 ? '+' : ''}
              {weather.tempC} °C
            </Badge>
            <Badge>{surface.short}</Badge>
            <Badge>{weather.altitudeM} м</Badge>
            <Badge>сэг {Math.round(d.sagFront * 100)}/{Math.round(d.sagRear * 100)}%</Badge>
            <Badge tone="sky">позиция {params.position > 0 ? '+' : ''}{Math.round(params.position * 60)} мм</Badge>
          </div>

          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-dim">
            {result.weatherNote}
          </p>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <ForkCard result={result} />
        <ShockCard result={result} />
        <TiresCard result={result} weather={weather} surfaceShort={surface.short} />
        <CockpitCard result={result} bike={bike} heightCm={riderHeight} />
      </div>

      {result.warnings.length > 0 && (
        <Panel className="p-4 sm:p-5">
          <SectionTitle>Проверки</SectionTitle>
          <ul className="mt-3 space-y-2">
            {result.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] leading-snug">
                <Icon
                  name={warning.level === 'warn' ? 'alert' : 'info'}
                  size={14}
                  className={warning.level === 'warn' ? 'mt-0.5 shrink-0 text-amber' : 'mt-0.5 shrink-0 text-dim'}
                />
                <span className={warning.level === 'warn' ? 'text-amber/90' : 'text-muted'}>{warning.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ExplainCard result={result} />
    </div>
  )
}

function ForkCard({ result }: { result: CalcResult }) {
  const fork = result.fork
  const ridePressure = fork?.ridePressurePsi ?? null
  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle
        right={
          <Badge tone={fork ? (fork.kind === 'air' ? 'sky' : 'amber') : 'neutral'}>
            {fork ? (fork.kind === 'air' ? 'AIR' : 'COIL') : 'RIGID'}
          </Badge>
        }
      >
        Вилка
      </SectionTitle>
      <p className="mt-1.5 truncate font-mono text-[11px] text-muted">
        {fork ? fork.label : 'Без подвески'}
      </p>

      {fork ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              value={fork.pressurePsi ?? fork.springRateLbIn ?? '—'}
              unit={fork.pressurePsi ? 'psi' : 'lb/in'}
              label={fork.pressurePsi ? 'Давление дома' : 'Пружина'}
              size="lg"
              tone="acid"
              sub={
                fork.pressurePsi
                  ? `${(fork.pressurePsi * 0.0689476).toFixed(1)} bar${
                      ridePressure != null ? ` · улица ${ridePressure} psi` : ''
                    }`
                  : undefined
              }
            />
            <Metric
              value={fork.sagMm}
              unit="мм"
              label="Сэг"
              sub={`${Math.round(fork.sagPct * 100)}% of ${fork.travelMm}`}
            />
            <Metric
              value={fork.tokens}
              unit="шт"
              label="Токены"
              sub={fork.tokensKnown === false ? 'рекомендация' : `макс ${fork.tokensMax}`}
            />
          </div>

          <SagBar
            pct={fork.sagPct}
            target={result.sagTargets.forkPct}
            sagMm={fork.sagMm}
            travelMm={fork.travelMm}
          />

          <Divider className="my-4" />
          <div className="eyebrow-plain text-[9px]">Демпфирование · клики от закрытого</div>
          <ClickGrid clicks={fork.clicks} />
        </>
      ) : (
        <div className="mt-6 flex items-center gap-3 text-[12px] text-dim">
          <Icon name="info" size={16} />
          Ригидная вилка: давление и сэг не рассчитываются.
        </div>
      )}
    </Panel>
  )
}

function ShockCard({ result }: { result: CalcResult }) {
  const shock = result.shock
  const ridePressure = shock?.ridePressurePsi ?? null
  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle
        right={
          <Badge tone={shock ? (shock.kind === 'air' ? 'sky' : 'amber') : 'neutral'}>
            {shock ? (shock.kind === 'air' ? 'AIR' : 'COIL') : 'HARDTAIL'}
          </Badge>
        }
      >
        Аморт
      </SectionTitle>
      <p className="mt-1.5 truncate font-mono text-[11px] text-muted">
        {shock ? shock.label : 'Задняя подвеска отсутствует'}
      </p>

      {shock ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              value={shock.pressurePsi ?? shock.springRateLbIn ?? '—'}
              unit={shock.pressurePsi ? 'psi' : 'lb/in'}
              label={shock.pressurePsi ? 'Давление дома' : 'Пружина'}
              size="lg"
              tone="acid"
              sub={
                shock.pressurePsi
                  ? `${(shock.pressurePsi * 0.0689476).toFixed(1)} bar${
                      ridePressure != null ? ` · улица ${ridePressure} psi` : ''
                    }`
                  : shock.springRateIdeal
                    ? `идеал ${shock.springRateIdeal}`
                    : undefined
              }
            />
            <Metric
              value={shock.sagMm}
              unit="мм"
              label="Сэг по штоку"
              sub={`${Math.round(shock.sagPct * 100)}% · ${shock.wheelSagMm} мм колесо`}
            />
            <Metric
              value={shock.leverageRatio}
              unit=":1"
              label="Рычажность"
              sub={`прогрессия ${shock.progressionPct}%`}
            />
          </div>

          <SagBar
            pct={shock.sagPct}
            target={result.sagTargets.rearPct}
            sagMm={shock.sagMm}
            travelMm={shock.strokeMm}
          />

          <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-dim">
            <span className="chip">{shock.eyeToEyeMm}×{shock.strokeMm} мм</span>
            <span className="chip">ход {shock.travelMm} мм</span>
            {shock.kind === 'air' && <span className="chip">токены {shock.tokens}/{shock.tokensMax}</span>}
          </div>

          <Divider className="my-4" />
          <div className="eyebrow-plain text-[9px]">Демпфирование · клики от закрытого</div>
          <ClickGrid clicks={shock.clicks} />
        </>
      ) : (
        <div className="mt-6 flex items-center gap-3 text-[12px] text-dim">
          <Icon name="info" size={16} />
          Хардтейл или ригид: давление в аморте не рассчитывается.
        </div>
      )}
    </Panel>
  )
}

function TiresCard({
  result,
  weather,
  surfaceShort,
}: {
  result: CalcResult
  weather: Weather
  surfaceShort: string
}) {
  const items = [
    { key: 'front', label: 'Перед', data: result.tires.front },
    { key: 'rear', label: 'Зад', data: result.tires.rear },
  ] as const
  const setupBadge = result.tires.front.setup === result.tires.rear.setup
    ? result.tires.front.setupShort
    : `${result.tires.front.setupShort} / ${result.tires.rear.setupShort}`
  const rideTemp = `${weather.tempC > 0 ? '+' : ''}${weather.tempC}`
  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle right={<Badge>{setupBadge}</Badge>}>Шины</SectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {items.map(({ key, label, data }) => (
          <div key={key} className="panel-flat p-3.5">
            <div className="metric flex items-baseline gap-1 text-[36px] text-ink">
              {data.psi}
              <span className="font-mono text-[10px] font-medium text-dim">psi</span>
            </div>
            <div className="eyebrow-plain mt-1.5 text-[9px]">
              {label} · дома +{HOME_TEMP_C} °C
            </div>
            <div className="mt-2 space-y-0.5 font-mono text-[10px] text-dim">
              {data.ridePsi != null && (
                <div className="text-muted">на улице {rideTemp} °C → {data.ridePsi} psi</div>
              )}
              <div>{data.bar} bar</div>
              <div>
                {wheelLabel(data.size)} · {widthLabel(data.widthMm)}
              </div>
              <div>{data.setupShort.toLowerCase()}</div>
              {data.insert && getTireSetup(data.setup).allowsInsert && (
                <div className="text-amber/80">вставка −2 psi</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-dim">
        Покрытие «{surfaceShort}». Большая цифра — что накачать дома при +{HOME_TEMP_C} °C. На
        улице давление изменится, поэтому сэг проверяйте после стабилизации температуры. Расчёт
        под нагрузку на колесо.
      </p>
    </Panel>
  )
}

function CockpitCard({
  result,
  bike,
  heightCm,
}: {
  result: CalcResult
  bike: Bike
  heightCm: number | null
}) {
  const c = result.cockpit
  const diff = c.recommendedBarWidthMm - c.barWidthMm
  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle right={<Badge>{bike.size || '—'}</Badge>}>Кокпит</SectionTitle>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric value={c.barWidthMm} unit="мм" label="Руль" sub={`реком. ${c.recommendedBarWidthMm}`} />
        <Metric value={c.barRiseMm} unit="мм" label="Подъём" />
        <Metric value={c.stemLengthMm} unit="мм" label="Вынос" sub={`${c.spacersMm} мм колец`} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-sky/80"
          style={{ width: `${Math.min(100, (c.barWidthMm / 820) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-dim">
        {Math.abs(diff) < 30
          ? 'Ширина руля близка к рекомендации для вашего роста.'
          : `Рекомендуется ${diff > 0 ? 'шире' : 'уже'} примерно на ${Math.abs(diff)} мм для роста ${
              heightCm ?? '—'
            } см.`}
      </p>
    </Panel>
  )
}

function ExplainCard({ result }: { result: CalcResult }) {
  return (
    <Panel className="overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <span className="flex items-center gap-2.5">
            <Icon name="code" size={16} className="text-acid" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Как это посчитано
            </span>
          </span>
          <Icon
            name="chevron-down"
            size={16}
            className="text-dim transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <div className="space-y-3">
            {result.explain.map((row) => (
              <div key={row.id} className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="eyebrow-plain text-[9.5px] text-muted">{row.title}</span>
                  <span className="font-mono text-[12px] font-semibold text-acid">{row.result}</span>
                </div>
                <p className="mt-1.5 break-words font-mono text-[10.5px] leading-relaxed text-dim">
                  {row.formula}
                </p>
                {row.hint && <p className="mt-1 text-[10.5px] leading-snug text-dim/80">{row.hint}</p>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-dim/70">
            Движок v{result.engineVersion}. Модель гибридная: физика нагрузки и рычажности плюс
            калибровочные коэффициенты под типичные таблицы производителей. Это стартовая точка, а не
            гарантированный заводской сетап — проверяйте на трейле и корректируйте по ощущениям.
          </p>
        </div>
      </details>
    </Panel>
  )
}
