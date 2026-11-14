import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ─────────────────────────── Числовое поле ─────────────────────────── */

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  hint,
  className,
  disabled,
}: {
  label?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  hint?: string
  className?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])

  const commit = () => {
    setFocused(false)
    const parsed = parseFloat(draft.replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }
    const lo = min ?? -Infinity
    const hi = max ?? Infinity
    const clamped = Math.min(hi, Math.max(lo, parsed))
    onChange(clamped)
    setDraft(String(clamped))
  }

  return (
    <label className={cn('block', className)}>
      {(label || unit) && (
        <span className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="eyebrow-plain text-[10px] text-muted">{label}</span>
          {unit && <span className="font-mono text-[10px] text-dim">{unit}</span>}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        className="field"
        value={draft}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setDraft(e.target.value)
          const parsed = parseFloat(e.target.value.replace(',', '.'))
          if (Number.isFinite(parsed)) {
            const lo = min ?? -Infinity
            const hi = max ?? Infinity
            onChange(Math.min(hi, Math.max(lo, parsed)))
          }
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-dim">{hint}</span>}
    </label>
  )
}

/* ─────────────────────────── Текстовое поле ─────────────────────────── */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
  multiline,
  rows = 3,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  className?: string
  multiline?: boolean
  rows?: number
}) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="eyebrow-plain mb-1.5 block text-[10px] text-muted">{label}</span>}
      {multiline ? (
        <textarea
          className="field resize-y"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="field"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-dim">{hint}</span>}
    </label>
  )
}

/* ─────────────────────────── Селект ─────────────────────────── */

export interface SelectOption<T extends string | number = string> {
  value: T
  label: string
  group?: string
  disabled?: boolean
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
  className,
  unit,
}: {
  label?: string
  value: T
  onChange: (v: T) => void
  options: SelectOption<T>[]
  hint?: string
  className?: string
  unit?: string
}) {
  const groups = Array.from(new Set(options.map((o) => o.group).filter(Boolean))) as string[]
  const plain = options.filter((o) => !o.group)

  const renderOption = (o: SelectOption<T>) => (
    <option key={String(o.value)} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  )

  return (
    <label className={cn('block', className)}>
      {(label || unit) && (
        <span className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="eyebrow-plain text-[10px] text-muted">{label}</span>
          {unit && <span className="font-mono text-[10px] text-dim">{unit}</span>}
        </span>
      )}
      <select
        className="field"
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          const found = options.find((o) => String(o.value) === raw)
          if (found) onChange(found.value)
        }}
      >
        {plain.map(renderOption)}
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {options.filter((o) => o.group === g).map(renderOption)}
          </optgroup>
        ))}
      </select>
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-dim">{hint}</span>}
    </label>
  )
}

/* ─────────────────────────── Слайдер ─────────────────────────── */

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  left,
  right,
  format,
  hint,
  className,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  left?: ReactNode
  right?: ReactNode
  format?: (v: number) => string
  hint?: string
  className?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={cn('select-none', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow-plain text-[10px] text-muted">{label}</span>
        <span className="font-mono text-[12px] tnum text-acid">
          {format ? format(value) : `${Math.round(pct)}%`}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--p': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
      <div className="flex justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-dim">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {hint && <p className="mt-2 text-[11px] leading-snug text-dim">{hint}</p>}
    </div>
  )
}

/* ─────────────────────────── Переключатель ─────────────────────────── */

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="text-[13px] text-ink">{label}</span>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-dim">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-acid/60 bg-acid/25' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all',
            checked ? 'left-[18px] bg-acid' : 'left-[3px] bg-dim',
          )}
        />
      </button>
    </div>
  )
}

/* ─────────────────────────── Сегменты ─────────────────────────── */

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && <span className="eyebrow-plain mb-1.5 block text-[10px] text-muted">{label}</span>}
      <div
        className="flex gap-1 rounded-[10px] border border-line-strong bg-surface-2 p-1"
        role="group"
      >
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 rounded-[7px] px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors',
              value === o.value
                ? 'bg-acid text-[#0a0c09] font-bold'
                : 'text-muted hover:bg-white/5 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
