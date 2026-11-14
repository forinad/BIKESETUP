import { cn } from '../lib/cn'
import { ADJUSTER_HINTS, ADJUSTER_LABELS, ADJUSTER_SHORT } from '../lib/format'
import type { ClickSetting } from '../types'

export function Metric({
  value,
  unit,
  label,
  sub,
  tone = 'default',
  size = 'md',
}: {
  value: string | number
  unit?: string
  label: string
  sub?: string
  tone?: 'default' | 'acid' | 'sky' | 'amber' | 'muted'
  size?: 'sm' | 'md' | 'lg'
}) {
  const toneClass = {
    default: 'text-ink',
    acid: 'text-acid',
    sky: 'text-sky',
    amber: 'text-amber',
    muted: 'text-dim',
  }[tone]
  const sizeClass = {
    sm: 'text-[24px]',
    md: 'text-[30px]',
    lg: 'text-[38px]',
  }[size]
  return (
    <div className="min-w-0">
      <div className={cn('metric flex items-baseline gap-1', sizeClass, toneClass)}>
        <span className="truncate">{value}</span>
        {unit && <span className="font-mono text-[10px] font-medium tracking-wide text-dim">{unit}</span>}
      </div>
      <div className="eyebrow-plain mt-1.5 text-[9.5px] leading-tight text-dim">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] leading-tight text-muted/80">{sub}</div>}
    </div>
  )
}

export function SagBar({
  pct,
  target,
  sagMm,
  travelMm,
}: {
  pct: number
  target: number
  sagMm: number
  travelMm: number
}) {
  const left = Math.min(98, Math.max(0, pct * 100))
  const zoneLeft = Math.max(0, (target - 0.025) * 100)
  return (
    <div className="mt-3">
      <div className="relative h-2 rounded-full bg-surface-3">
        <div
          className="absolute inset-y-0 rounded-sm border-x border-acid/40 bg-acid/15"
          style={{ left: `${zoneLeft}%`, width: '7%' }}
        />
        <div
          className="absolute -top-1 h-4 w-[2px] -translate-x-1/2 rounded-full bg-acid shadow-[0_0_10px_rgba(201,255,61,.7)]"
          style={{ left: `${left}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-dim">
        <span>0</span>
        <span className="text-acid/80">сэг {sagMm} мм</span>
        <span>{travelMm} мм ход</span>
      </div>
    </div>
  )
}

export function ClickGrid({ clicks }: { clicks: ClickSetting[] }) {
  if (!clicks.length) {
    return <p className="mt-3 text-[11px] text-dim">Регулировок демпфирования нет.</p>
  }
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {clicks.map((c) => {
        const rebound = c.key === 'lsr' || c.key === 'hsr'
        const isSwitch = c.kind === 'switch'
        return (
          <div
            key={c.key}
            className="panel-flat px-2.5 py-2"
            title={
              ADJUSTER_LABELS[c.key] +
              (c.maxKnown === false
                ? ' — максимум кликов не указан, значение ориентировочное'
                : '')
            }
          >
            <div
              className={cn(
                'metric text-[22px]',
                isSwitch ? 'text-ink' : rebound ? 'text-amber' : 'text-sky',
              )}
            >
              {isSwitch ? (c.value ? 'ЗАКР' : 'ОТКР') : c.value}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
              {ADJUSTER_SHORT[c.key]}
            </div>
            <div className="truncate text-[9.5px] text-dim/80">
              {isSwitch
                ? 'блокировка'
                : `${c.maxKnown === false ? '≈ ' : ''}из ${c.max} · ${ADJUSTER_HINTS[c.key]}`}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BalanceBar({ frontPct }: { frontPct: number }) {
  return (
    <div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-3">
        <div className="absolute inset-y-0 left-0 bg-acid/70" style={{ width: `${frontPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-sky/30" style={{ width: `${100 - frontPct}%` }} />
        <div
          className="absolute inset-y-0 w-[2px] bg-ink/70"
          style={{ left: `${frontPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-dim">
        <span>перед {Math.round(frontPct)}%</span>
        <span>зад {100 - Math.round(frontPct)}%</span>
      </div>
    </div>
  )
}
