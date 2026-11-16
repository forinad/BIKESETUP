import type { Discipline } from '../types'

export interface DisciplineMeta {
  id: Discipline
  label: string
  short: string
  description: string
  /** Целевой сэг вилки, доля хода. */
  sagFront: number
  /** Целевой сэг аморта, доля хода. */
  sagRear: number
  /** Базовое число токенов вилки. */
  tokensFront: number
  /** Базовое число токенов аморта. */
  tokensRear: number
  /** Поправка к давлению в шинах, psi. */
  tireAdj: number
  /** Поправка к высоте руля, мм. */
  barRise: number
  /** Поправка к ширине руля, мм. */
  barWidthAdj: number
  /** Динамический запас давления в вилке и аморте — защита от пробоев. */
  pressureReserve: number
  /** Множитель жёсткости пружины аморта. */
  coilFactor: number
  /** Типичная масса байка, кг. */
  massKg: number
}

export const DISCIPLINES: Record<Discipline, DisciplineMeta> = {
  xc: {
    id: 'xc',
    label: 'XC / Downcountry',
    short: 'XC',
    description: 'Кросс-кантри, марафон, даункантри. Короткие ходы, низкий сэг, накат.',
    sagFront: 0.22,
    sagRear: 0.27,
    tokensFront: 2,
    tokensRear: 1,
    tireAdj: 2,
    barRise: 15,
    barWidthAdj: -20,
    pressureReserve: 1.0,
    coilFactor: 0.96,
    massKg: 11.5,
  },
  trail: {
    id: 'trail',
    label: 'Trail / All-Mountain',
    short: 'Trail',
    description: 'Универсал: вверх педалить, вниз не бояться. Средние ходы и давление.',
    sagFront: 0.25,
    sagRear: 0.3,
    tokensFront: 2,
    tokensRear: 1,
    tireAdj: 0,
    barRise: 25,
    barWidthAdj: 10,
    pressureReserve: 1.0,
    coilFactor: 1.0,
    massKg: 14,
  },
  enduro: {
    id: 'enduro',
    label: 'Enduro',
    short: 'Enduro',
    description: 'Длинные ходы, гонка вниз. Больше сэга и запаса под жёсткие приземления.',
    sagFront: 0.28,
    sagRear: 0.32,
    tokensFront: 2,
    tokensRear: 2,
    tireAdj: -0.5,
    barRise: 30,
    barWidthAdj: 15,
    pressureReserve: 1.08,
    coilFactor: 1.02,
    massKg: 15.5,
  },
  dh: {
    id: 'dh',
    label: 'DH / Freeride',
    short: 'DH',
    description: 'Парк и даунхилл. Максимальные ходы, низкий сэг и запас давления на пробои.',
    sagFront: 0.22,
    sagRear: 0.27,
    tokensFront: 3,
    tokensRear: 2,
    tireAdj: -1.5,
    barRise: 35,
    barWidthAdj: 25,
    pressureReserve: 1.2,
    coilFactor: 1.03,
    massKg: 17,
  },
  dirt: {
    id: 'dirt',
    label: 'Dirt / Street',
    short: 'Dirt',
    description: 'Дёрт, стрит, слопстайл. Короткий ход, жёсткая подвеска, узкие рули.',
    sagFront: 0.18,
    sagRear: 0.24,
    tokensFront: 2,
    tokensRear: 1,
    tireAdj: 4,
    barRise: 40,
    barWidthAdj: 15,
    pressureReserve: 1.08,
    coilFactor: 0.94,
    massKg: 12.5,
  },
  gravel: {
    id: 'gravel',
    label: 'Gravel / Trekking',
    short: 'Gravel',
    description: 'Гравий, туризм, город. Часто ригид, высокое давление в узких шинах.',
    sagFront: 0.16,
    sagRear: 0.22,
    tokensFront: 1,
    tokensRear: 0,
    tireAdj: 4,
    barRise: 20,
    barWidthAdj: -25,
    pressureReserve: 1.0,
    coilFactor: 0.95,
    massKg: 10,
  },
}

export const DISCIPLINE_LIST = Object.values(DISCIPLINES)
