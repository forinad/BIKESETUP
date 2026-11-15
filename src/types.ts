export type ID = string

/** Дисциплина задаёт базовые коэффициенты: сэг, токены, давление в шинах, кокпит. */
export type Discipline = 'xc' | 'trail' | 'enduro' | 'dh' | 'dirt' | 'gravel'

export type WheelSize = 26 | 27.5 | 29 | 700

export type SpringKind = 'air' | 'coil' | 'rigid'
export type RearKind = 'none' | 'air' | 'coil'

/**
 * Как покрышка посажена на обод. Влияет на рекомендуемое давление:
 * камера требует запаса, бескамерка — базовый расчёт, трубка держит форму сама.
 */
export type TireSetup =
  | 'tube'
  | 'tube-light'
  | 'tubeless'
  | 'tubeless-hookless'
  | 'tubular'

export type LinkageType =
  | 'single-pivot'
  | 'four-bar'
  | 'horst'
  | 'vpp'
  | 'dw-link'
  | 'high-pivot'
  | 'flex-stay'
  | 'other'

export type WeatherCondition = 'dry' | 'damp' | 'wet' | 'mud' | 'snow'

export type ClickKey = 'lsc' | 'hsc' | 'lsr' | 'hsr'

/** Регулировки, которые реально бывают на вилках и амортах. */
export type AdjusterKey = ClickKey | 'abs' | 'lockout' | 'preload'

export interface ForkAdjuster {
  key: AdjusterKey
  /** Максимум кликов / положений. */
  max: number
  /** Пользователь не знает точный диапазон: max — типовое значение. */
  maxUnknown?: boolean
}

export interface ClickSetting {
  key: AdjusterKey
  value: number
  max: number
  /** switch — вкл/выкл (блокировка), clicks — клики. */
  kind?: 'clicks' | 'switch'
  /** false — максимум кликов не указан, значение ориентировочное. */
  maxKnown?: boolean
}

export interface Rider {
  id: ID
  name: string
  heightCm: number
  weightKg: number
  gearKg: number
  createdAt: number
}

export interface WheelSpec {
  size: WheelSize
  /** Ширина покрышки в мм (2.4" ≈ 61 мм). */
  widthMm: number
  insert: boolean
  /** Тип посадки покрышки. Не указан — считаем бескамерку (прежнее поведение). */
  tireSetup?: TireSetup
}

export interface ForkSpec {
  kind: SpringKind
  /** id из базы компонентов или null для ручного ввода. */
  modelId: string | null
  travelMm: number
  stanchionMm: number
  /** Токены (volume spacers) для воздушной вилки. */
  tokens: number
  /** Пользователь не знает, сколько токенов стоит (или их нет). */
  tokensUnknown?: boolean
  /** Какие регулировки есть на вилке и их диапазон. */
  adjusters?: ForkAdjuster[]
  /** Жёсткость пружины вилки, lb/in — только для пружинной. */
  coilRate?: number
  damper?: string
}

export interface RearSpec {
  kind: RearKind
  modelId: string | null
  travelMm: number
  strokeMm: number
  eyeToEyeMm: number
  linkage: LinkageType
  /** Если задано — используется вместо travel / stroke. */
  leverageOverride: number | null
  /** Прогрессия подвески, % — насколько рычажность падает к концу хода. */
  progressionPct: number
  /** Токены воздушного аморта. */
  tokens: number
  /** Жёсткость пружины, lb/in — только для пружинного. */
  coilRate?: number
}

export interface GeometrySpec {
  wheelbaseMm: number
  chainstayMm: number
  headAngleDeg: number
  seatAngleDeg: number
  bbDropMm: number
  reachMm: number
  stackMm: number
  barWidthMm: number
  barRiseMm: number
  stemLengthMm: number
  spacersMm: number
}

export interface Bike {
  id: ID
  name: string
  discipline: Discipline
  size: string
  massKg: number
  notes?: string
  wheels: { front: WheelSpec; rear: WheelSpec }
  fork: ForkSpec
  rear: RearSpec
  geometry: GeometrySpec
  createdAt: number
  updatedAt: number
}

export interface SetupParams {
  /** 0 — мягко, 1 — жёстко. */
  feel: number
  /** 0 — низкое сцепление, 1 — максимальный грип. */
  grip: number
  /** 0 — технично, 1 — флоу. */
  terrain: number
  /** -1 — назад, +1 — вперёд. */
  position: number
}

export interface Weather {
  tempC: number
  condition: WeatherCondition
  altitudeM: number
}

export interface BalanceResult {
  frontPct: number
  rearPct: number
  frontKg: number
  rearKg: number
  comFromRearMm: number
  comShiftMm: number
}

export interface ForkResult {
  kind: 'air' | 'coil'
  label: string
  travelMm: number
  stanchionMm: number
  pressurePsi: number | null
  springRateLbIn: number | null
  sagMm: number
  sagPct: number
  tokens: number
  tokensMax: number
  /** false — пользователь не указал токены, число выше является рекомендацией. */
  tokensKnown: boolean
  clicks: ClickSetting[]
}

export interface ShockResult {
  kind: 'air' | 'coil'
  label: string
  travelMm: number
  strokeMm: number
  eyeToEyeMm: number
  leverageRatio: number
  progressionPct: number
  pressurePsi: number | null
  springRateLbIn: number | null
  springRateIdeal: number | null
  sagMm: number
  wheelSagMm: number
  sagPct: number
  tokens: number
  tokensMax: number
  clicks: ClickSetting[]
}

export interface TireResult {
  size: WheelSize
  widthMm: number
  psi: number
  bar: number
  insert: boolean
  setup: TireSetup
  /** Полное название посадки — для карточки и объяснений. */
  setupLabel: string
  /** Короткая метка — для бейджа. */
  setupShort: string
}

export interface CockpitResult {
  barWidthMm: number
  barRiseMm: number
  stemLengthMm: number
  spacersMm: number
  recommendedBarWidthMm: number
}

export interface WarningItem {
  level: 'info' | 'warn'
  text: string
}

export interface ExplainRow {
  id: string
  title: string
  formula: string
  result: string
  hint?: string
}

export interface CalcResult {
  engineVersion: string
  computedAt: number
  mass: {
    riderKg: number
    gearKg: number
    bikeKg: number
    totalKg: number
    totalLb: number
  }
  balance: BalanceResult
  fork: ForkResult | null
  shock: ShockResult | null
  tires: { front: TireResult; rear: TireResult }
  cockpit: CockpitResult
  sagTargets: { forkPct: number; rearPct: number }
  weatherNote: string
  warnings: WarningItem[]
  explain: ExplainRow[]
}

export interface Setup {
  id: ID
  bikeId: ID
  riderId: ID
  name: string
  notes?: string
  createdAt: number
  params: SetupParams
  weather: Weather
  riderSnapshot: { name: string; heightCm: number; weightKg: number; gearKg: number }
  bikeSignature: string
  result: CalcResult
}

export interface SharedPayload {
  v: 1
  name: string
  notes?: string
  createdAt: number
  bike: Bike
  rider: { name: string; heightCm: number; weightKg: number; gearKg: number }
  params: SetupParams
  weather: Weather
}

export const DEFAULT_PARAMS: SetupParams = {
  feel: 0.55,
  grip: 0.6,
  terrain: 0.55,
  position: 0,
}

export const DEFAULT_WEATHER: Weather = {
  tempC: 18,
  condition: 'dry',
  altitudeM: 150,
}
