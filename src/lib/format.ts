import type { AdjusterKey, ClickKey, Discipline, WheelSize } from '../types'
import { DISCIPLINES } from '../data/disciplines'

export const wheelLabel = (size: WheelSize): string => {
  if (size === 700) return '700c'
  return `${size}″`
}

export const widthLabel = (mm: number): string => {
  const inches = mm / 25.4
  return `${Math.round(mm)} мм · ${inches.toFixed(1)}″`
}

export const disciplineLabel = (d: Discipline): string => DISCIPLINES[d].label
export const disciplineShort = (d: Discipline): string => DISCIPLINES[d].short

export const CLICK_LABELS: Record<ClickKey, string> = {
  lsc: 'LSC',
  hsc: 'HSC',
  lsr: 'LSR',
  hsr: 'HSR',
}

export const CLICK_HINTS: Record<ClickKey, string> = {
  lsc: 'низкоскор. сжатие',
  hsc: 'высокоскор. сжатие',
  lsr: 'низкоскор. отбой',
  hsr: 'высокоскор. отбой',
}

export const ADJUSTER_LABELS: Record<AdjusterKey, string> = {
  lsr: 'Отскок',
  lsc: 'Сжатие LSC',
  hsc: 'Сжатие HSC',
  hsr: 'Отскок HSR',
  abs: 'ABS+',
  preload: 'Преднатяг',
  lockout: 'Блокировка',
}

export const ADJUSTER_HINTS: Record<AdjusterKey, string> = {
  lsr: 'низкоскоростной отскок (rebound)',
  lsc: 'низкоскоростное сжатие',
  hsc: 'высокоскоростное сжатие',
  hsr: 'высокоскоростной отскок',
  abs: 'доп. регулировка ABS+',
  preload: 'преднатяг пружины',
  lockout: 'гидравлическая блокировка (HLO/MLO)',
}

export const ADJUSTER_SHORT: Record<AdjusterKey, string> = {
  lsr: 'REB',
  lsc: 'LSC',
  hsc: 'HSC',
  hsr: 'HSR',
  abs: 'ABS+',
  preload: 'PRE',
  lockout: 'LOCK',
}

export const formatDate = (ts: number): string =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ts))

export const formatDateTime = (ts: number): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))

export const round = (v: number, step = 1) => Math.round(v / step) * step
