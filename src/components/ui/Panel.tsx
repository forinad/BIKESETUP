import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Panel({
  className,
  children,
  flat,
}: {
  className?: string
  children: ReactNode
  flat?: boolean
}) {
  return <div className={cn(flat ? 'panel-flat' : 'panel', className)}>{children}</div>
}

export function SectionTitle({
  children,
  right,
  className,
}: {
  children: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="eyebrow">{children}</span>
      {right}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'acid' | 'sky' | 'amber' | 'danger'
  className?: string
}) {
  const tones = {
    neutral: 'chip',
    acid: 'chip chip-acid',
    sky: 'chip border-sky/30 text-sky bg-sky/5',
    amber: 'chip border-amber/30 text-amber bg-amber/5',
    danger: 'chip border-danger/30 text-danger bg-danger/5',
  }
  return <span className={cn(tones[tone], className)}>{children}</span>
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('divider', className)} />
}
