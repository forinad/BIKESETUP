import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

export function StepCard({
  step,
  title,
  summary,
  open,
  onToggle,
  children,
  action,
}: {
  step: number
  title: string
  summary?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="rounded-[5px] bg-acid px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#0a0c09]">
          Шаг {step}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="block font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
              {title}
            </span>
            {summary && <span className="mt-0.5 block truncate text-[11.5px] text-dim">{summary}</span>}
          </span>
          <Icon
            name="chevron-down"
            size={16}
            className={cn('shrink-0 text-dim transition-transform', open && 'rotate-180')}
          />
        </button>
        {action}
      </div>
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </section>
  )
}
