import type {
  Bike,
  Discipline,
  LinkageType,
  SurfaceType,
  TireSetup,
  WeatherCondition,
  WheelSize,
} from '../types'
import { DISCIPLINES } from './disciplines'

export interface WeatherMeta {
  id: WeatherCondition
  label: string
  short: string
  tireAdj: number
  sagAdj: number
  note: string
}

export const WEATHER_CONDITIONS: WeatherMeta[] = [
  { id: 'dry', label: 'Сухо, держак', short: 'Сухо', tireAdj: 0, sagAdj: 0, note: 'Базовые давления без поправок.' },
  { id: 'damp', label: 'Влажно, утренняя роса', short: 'Влажно', tireAdj: -1, sagAdj: 0.003, note: 'Чуть ниже давление в шинах для пятна контакта.' },
  { id: 'wet', label: 'Мокро, дождь', short: 'Мокро', tireAdj: -2, sagAdj: 0.006, note: 'Ниже давление в шинах, чуть больше сэга для сцепления.' },
  { id: 'mud', label: 'Грязь, глубокая колея', short: 'Грязь', tireAdj: -2.5, sagAdj: 0.01, note: 'Самое низкое давление в шинах, подвеска мягче на входе.' },
  { id: 'snow', label: 'Снег / лёд', short: 'Снег', tireAdj: -4, sagAdj: 0.012, note: 'Максимальное пятно контакта, аккуратно с пробоями.' },
]

export const getWeatherMeta = (id: WeatherCondition): WeatherMeta =>
  WEATHER_CONDITIONS.find((w) => w.id === id) ?? WEATHER_CONDITIONS[0]

export interface SurfaceMeta {
  id: SurfaceType
  label: string
  short: string
  /** Поправка к давлению в шинах, psi. */
  tireAdj: number
  note: string
}

export const SURFACES: SurfaceMeta[] = [
  {
    id: 'asphalt',
    label: 'Асфальт / город',
    short: 'Асфальт',
    tireAdj: 3,
    note: 'Твёрдое покрытие: выше давление ради наката и защиты обода от ям и бордюров.',
  },
  {
    id: 'gravel',
    label: 'Гравий / грунтовки',
    short: 'Гравий',
    tireAdj: 1.5,
    note: 'Сыпучий твёрдый грунт: чуть выше давление, чтобы не пробивать покрышку о камни.',
  },
  {
    id: 'hardpack',
    label: 'Трейлы / укатанный грунт',
    short: 'Трейлы',
    tireAdj: 0,
    note: 'Плотный грунт без сильных корней и грязи — базовый вариант.',
  },
  {
    id: 'forest',
    label: 'Мягкий лес / листва',
    short: 'Лес',
    tireAdj: -0.5,
    note: 'Мягкий слой и лёгкая колея: чуть ниже давление для пятна контакта.',
  },
  {
    id: 'roots',
    label: 'Корни и камни',
    short: 'Корни',
    tireAdj: -1,
    note: 'Техничный лес: ниже давление для сцепления на корнях, следите за пробоями.',
  },
  {
    id: 'enduro',
    label: 'Эндуро-трейлы',
    short: 'Эндуро',
    tireAdj: -1.5,
    note: 'Крутые спуски и жёсткий рельеф: низкое давление под нагрузку и удары.',
  },
  {
    id: 'dh',
    label: 'ДХ / байк-парк',
    short: 'ДХ',
    tireAdj: -2,
    note: 'Скоростные спуски: максимальное сцепление, но проверяйте пробои и вставки.',
  },
  {
    id: 'dirt',
    label: 'Дёрт / памп-трек',
    short: 'Дёрт',
    tireAdj: 2,
    note: 'Гладкий хардпак и трамплины: выше давление для поддержки и скорости.',
  },
  {
    id: 'sand',
    label: 'Песок / пляж',
    short: 'Песок',
    tireAdj: -3.5,
    note: 'Мягкий песок: низкое давление для плавучести, но легко поймать пробой.',
  },
]

const DEFAULT_SURFACE: Record<Discipline, SurfaceType> = {
  xc: 'hardpack',
  trail: 'hardpack',
  enduro: 'enduro',
  dh: 'dh',
  dirt: 'dirt',
  gravel: 'gravel',
}

export const defaultSurface = (discipline: Discipline): SurfaceMeta =>
  SURFACES.find((s) => s.id === DEFAULT_SURFACE[discipline]) ?? SURFACES.find((s) => s.id === 'hardpack')!

/** Если покрытие не выбрано, подставляем типичное для дисциплины байка. */
export const getSurface = (id?: SurfaceType, discipline: Discipline = 'trail'): SurfaceMeta =>
  (id ? SURFACES.find((s) => s.id === id) : undefined) ?? defaultSurface(discipline)

export interface TireSetupMeta {
  id: TireSetup
  label: string
  short: string
  /** Поправка к базовому давлению бескамерки, psi. */
  psiAdj: number
  /** Можно ли ставить вставку (CushCore и подобные). */
  allowsInsert: boolean
  note: string
}

export const TIRE_SETUPS: TireSetupMeta[] = [
  {
    id: 'tube',
    label: 'Камера (butyl)',
    short: 'TUBE',
    psiAdj: 2,
    allowsInsert: false,
    note: 'Камере нужен запас давления: иначе змеиные проколы на кромке и проворот покрышки.',
  },
  {
    id: 'tube-light',
    label: 'Камера TPU / латекс',
    short: 'TPU',
    psiAdj: 1,
    allowsInsert: false,
    note: 'Лёгкая камера катит лучше, но от пробоя не защищает: +1 psi к бескамерной рекомендации.',
  },
  {
    id: 'tubeless',
    label: 'Бескамерка, крючковатый обод (crochet)',
    short: 'TUBELESS',
    psiAdj: 0,
    allowsInsert: true,
    note: 'Базовый расчёт: герметик, покрышка держится за крючок обода. Tubeless Ready — то же самое.',
  },
  {
    id: 'tubeless-hookless',
    label: 'Бескамерка, прямой обод (hookless / TSS)',
    short: 'HOOKLESS',
    psiAdj: -0.5,
    allowsInsert: true,
    note: 'Прямой обод не имеет крючка: держите давление ниже лимита обода (обычно 5 бар) и чуть ниже обычного.',
  },
  {
    id: 'tubular',
    label: 'Трубка (tubular)',
    short: 'TUBULAR',
    psiAdj: -1,
    allowsInsert: false,
    note: 'Трубка приклеена и держит форму сама — можно ехать на меньшем давлении без риска разбортировки.',
  },
]

const TIRE_SETUP_FALLBACK = TIRE_SETUPS.find((t) => t.id === 'tubeless')!

export const getTireSetup = (id?: TireSetup): TireSetupMeta =>
  TIRE_SETUPS.find((t) => t.id === id) ?? TIRE_SETUP_FALLBACK

export interface LinkageMeta {
  id: LinkageType
  label: string
  progression: number
  note: string
}

export const LINKAGES: LinkageMeta[] = [
  { id: 'single-pivot', label: 'Однорычажка', progression: 20, note: 'Простая, предсказуемая, часто линейная.' },
  { id: 'four-bar', label: 'Four-bar', progression: 25, note: 'Классическая четырёхрычажка, средняя прогрессия.' },
  { id: 'horst', label: 'Horst link', progression: 27, note: 'Четырёхрычажка с шарниром на пере.' },
  { id: 'vpp', label: 'VPP', progression: 30, note: 'Два коротких рычага, высокая прогрессия.' },
  { id: 'dw-link', label: 'DW-link', progression: 28, note: 'Анти-скват, средняя-высокая прогрессия.' },
  { id: 'high-pivot', label: 'High pivot', progression: 27, note: 'Высокий шарнир, много анти-сквата.' },
  { id: 'flex-stay', label: 'Flex stay', progression: 18, note: 'Гнущиеся перья, обычно линейная.' },
  { id: 'other', label: 'Другая / не знаю', progression: 25, note: 'Средние значения по умолчанию.' },
]

export const getLinkage = (id: LinkageType): LinkageMeta =>
  LINKAGES.find((l) => l.id === id) ?? LINKAGES[LINKAGES.length - 1]

interface Preset {
  massKg: number
  wheelFront: WheelSize
  wheelRear: WheelSize
  tireFrontMm: number
  tireRearMm: number
  forkKind: 'air' | 'coil' | 'rigid'
  forkModelId: string | null
  forkTravel: number
  stanchion: number
  rearKind: 'none' | 'air' | 'coil'
  rearTravel: number
  stroke: number
  eyeToEye: number
  linkage: LinkageType
  progression: number
  shockModelId: string | null
  wheelbase: number
  chainstay: number
  headAngle: number
  seatAngle: number
  bbDrop: number
  reach: number
  stack: number
  barWidth: number
  barRise: number
  stem: number
  spacers: number
}

const PRESETS: Record<Discipline, Preset> = {
  xc: {
    massKg: 11.5,
    wheelFront: 29,
    wheelRear: 29,
    tireFrontMm: 57,
    tireRearMm: 57,
    forkKind: 'air',
    forkModelId: 'fox-34',
    forkTravel: 120,
    stanchion: 34,
    rearKind: 'air',
    rearTravel: 110,
    stroke: 45,
    eyeToEye: 190,
    linkage: 'flex-stay',
    progression: 18,
    shockModelId: 'fox-float-sl',
    wheelbase: 1150,
    chainstay: 435,
    headAngle: 66.5,
    seatAngle: 75.5,
    bbDrop: 40,
    reach: 455,
    stack: 595,
    barWidth: 740,
    barRise: 15,
    stem: 60,
    spacers: 10,
  },
  trail: {
    massKg: 14,
    wheelFront: 29,
    wheelRear: 29,
    tireFrontMm: 61,
    tireRearMm: 61,
    forkKind: 'air',
    forkModelId: 'fox-36',
    forkTravel: 150,
    stanchion: 36,
    rearKind: 'air',
    rearTravel: 140,
    stroke: 55,
    eyeToEye: 210,
    linkage: 'four-bar',
    progression: 24,
    shockModelId: 'fox-float-x',
    wheelbase: 1215,
    chainstay: 435,
    headAngle: 65,
    seatAngle: 76,
    bbDrop: 30,
    reach: 475,
    stack: 615,
    barWidth: 770,
    barRise: 25,
    stem: 50,
    spacers: 10,
  },
  enduro: {
    massKg: 15.5,
    wheelFront: 29,
    wheelRear: 27.5,
    tireFrontMm: 61,
    tireRearMm: 64,
    forkKind: 'air',
    forkModelId: 'fox-38',
    forkTravel: 170,
    stanchion: 38,
    rearKind: 'coil',
    rearTravel: 160,
    stroke: 65,
    eyeToEye: 205,
    linkage: 'horst',
    progression: 28,
    shockModelId: 'fox-dhx2',
    wheelbase: 1245,
    chainstay: 440,
    headAngle: 64,
    seatAngle: 76.5,
    bbDrop: 25,
    reach: 485,
    stack: 625,
    barWidth: 780,
    barRise: 30,
    stem: 40,
    spacers: 10,
  },
  dh: {
    massKg: 17,
    wheelFront: 29,
    wheelRear: 27.5,
    tireFrontMm: 64,
    tireRearMm: 64,
    forkKind: 'air',
    forkModelId: 'fox-40',
    forkTravel: 203,
    stanchion: 40,
    rearKind: 'coil',
    rearTravel: 190,
    stroke: 75,
    eyeToEye: 250,
    linkage: 'high-pivot',
    progression: 26,
    shockModelId: 'fox-dhx2',
    wheelbase: 1270,
    chainstay: 445,
    headAngle: 63,
    seatAngle: 77,
    bbDrop: 10,
    reach: 470,
    stack: 630,
    barWidth: 800,
    barRise: 35,
    stem: 45,
    spacers: 5,
  },
  dirt: {
    massKg: 12.5,
    wheelFront: 26,
    wheelRear: 26,
    tireFrontMm: 58,
    tireRearMm: 58,
    forkKind: 'air',
    forkModelId: 'fox-34',
    forkTravel: 100,
    stanchion: 34,
    rearKind: 'none',
    rearTravel: 0,
    stroke: 0,
    eyeToEye: 0,
    linkage: 'other',
    progression: 0,
    shockModelId: null,
    wheelbase: 1080,
    chainstay: 390,
    headAngle: 68,
    seatAngle: 73,
    bbDrop: 20,
    reach: 420,
    stack: 580,
    barWidth: 740,
    barRise: 40,
    stem: 40,
    spacers: 0,
  },
  gravel: {
    massKg: 10,
    wheelFront: 700,
    wheelRear: 700,
    tireFrontMm: 42,
    tireRearMm: 42,
    forkKind: 'rigid',
    forkModelId: null,
    forkTravel: 0,
    stanchion: 0,
    rearKind: 'none',
    rearTravel: 0,
    stroke: 0,
    eyeToEye: 0,
    linkage: 'other',
    progression: 0,
    shockModelId: null,
    wheelbase: 1050,
    chainstay: 430,
    headAngle: 70,
    seatAngle: 74,
    bbDrop: 70,
    reach: 390,
    stack: 590,
    barWidth: 440,
    barRise: 0,
    stem: 80,
    spacers: 5,
  },
}

export function createBike(discipline: Discipline, id: string, name?: string): Bike {
  const p = PRESETS[discipline]
  const d = DISCIPLINES[discipline]
  const now = Date.now()
  return {
    id,
    name: name ?? `${d.label} · мой байк`,
    discipline,
    size: 'M',
    massKg: p.massKg,
    wheels: {
      front: { size: p.wheelFront, widthMm: p.tireFrontMm, insert: false, tireSetup: 'tubeless' },
      rear: { size: p.wheelRear, widthMm: p.tireRearMm, insert: false, tireSetup: 'tubeless' },
    },
    fork: {
      kind: p.forkKind,
      modelId: p.forkModelId,
      travelMm: p.forkTravel,
      stanchionMm: p.stanchion,
      tokens: d.tokensFront,
      tokensUnknown: p.forkKind === 'air' ? true : undefined,
    },
    rear: {
      kind: p.rearKind,
      modelId: p.shockModelId,
      travelMm: p.rearTravel,
      strokeMm: p.stroke,
      eyeToEyeMm: p.eyeToEye,
      linkage: p.linkage,
      leverageOverride: null,
      progressionPct: p.progression,
      tokens: d.tokensRear,
    },
    geometry: {
      wheelbaseMm: p.wheelbase,
      chainstayMm: p.chainstay,
      headAngleDeg: p.headAngle,
      seatAngleDeg: p.seatAngle,
      bbDropMm: p.bbDrop,
      reachMm: p.reach,
      stackMm: p.stack,
      barWidthMm: p.barWidth,
      barRiseMm: p.barRise,
      stemLengthMm: p.stem,
      spacersMm: p.spacers,
    },
    createdAt: now,
    updatedAt: now,
  }
}

/** Типичная геометрия для быстрого заполнения формы. */
export function geometryPreset(discipline: Discipline) {
  const p = PRESETS[discipline]
  return {
    wheelbaseMm: p.wheelbase,
    chainstayMm: p.chainstay,
    headAngleDeg: p.headAngle,
    seatAngleDeg: p.seatAngle,
    bbDropMm: p.bbDrop,
    reachMm: p.reach,
    stackMm: p.stack,
    barWidthMm: p.barWidth,
    barRiseMm: p.barRise,
    stemLengthMm: p.stem,
    spacersMm: p.spacers,
  }
}

export function suspensionPreset(discipline: Discipline) {
  const p = PRESETS[discipline]
  const d = DISCIPLINES[discipline]
  const wheels: Bike['wheels'] = {
    front: { size: p.wheelFront, widthMm: p.tireFrontMm, insert: false, tireSetup: 'tubeless' },
    rear: { size: p.wheelRear, widthMm: p.tireRearMm, insert: false, tireSetup: 'tubeless' },
  }
  return {
    fork: {
      kind: p.forkKind,
      modelId: p.forkModelId,
      travelMm: p.forkTravel,
      stanchionMm: p.stanchion,
      tokens: d.tokensFront,
      tokensUnknown: p.forkKind === 'air' ? true : undefined,
    },
    rear: {
      kind: p.rearKind,
      modelId: p.shockModelId,
      travelMm: p.rearTravel,
      strokeMm: p.stroke,
      eyeToEyeMm: p.eyeToEye,
      linkage: p.linkage,
      leverageOverride: null,
      progressionPct: p.progression,
      tokens: d.tokensRear,
    },
    massKg: p.massKg,
    wheels,
  }
}

export const WHEEL_SIZES: { value: WheelSize; label: string }[] = [
  { value: 29, label: '29″' },
  { value: 27.5, label: '27.5″' },
  { value: 26, label: '26″' },
  { value: 700, label: '700c / 28″' },
]
