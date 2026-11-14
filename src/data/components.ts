import type { AdjusterKey, ClickKey, ForkAdjuster } from '../types'

/**
 * База популярных вилок и амортизаторов.
 *
 * ВАЖНО: это стартовые ориентиры, а не официальные таблицы производителя.
 * Диапазоны кликов и стоковое количество токенов — типичные для модели;
 * точные значения всегда сверяйте с мануалом на сайте производителя.
 */

export type BrandId =
  | 'fox'
  | 'rockshox'
  | 'manitou'
  | 'dvo'
  | 'ohlins'
  | 'cane-creek'
  | 'formula'
  | 'suntour'
  | 'mrp'
  | 'ext'
  | 'bos'
  | 'marzocchi'
  | '2roxx'

export interface ForkModel {
  id: string
  brandId: BrandId
  brand: string
  model: string
  spring: 'air' | 'coil'
  stanchions: number[]
  travels: number[]
  tokens?: { stock: number; max: number }
  clicks: Partial<Record<ClickKey, number>>
  /** Дополнительные регулировки: ABS+, блокировка, преднатяг. */
  extraAdjusters?: Partial<Record<'abs' | 'lockout' | 'preload', number>>
  springs?: number[]
  damper?: string
  note?: string
}

export interface ShockModel {
  id: string
  brandId: BrandId
  brand: string
  model: string
  spring: 'air' | 'coil'
  sizes: { eyeToEye: number; stroke: number }[]
  tokens?: { stock: number; max: number }
  clicks: Partial<Record<ClickKey, number>>
  springs?: number[]
  damper?: string
  note?: string
}

const FOX_CLICKS: Record<ClickKey, number> = { lsc: 16, hsc: 8, lsr: 16, hsr: 8 }
const RS_CHARGER3: Record<ClickKey, number> = { lsc: 18, hsc: 5, lsr: 18, hsr: 5 }
const RS_MOTION: Partial<Record<ClickKey, number>> = { lsc: 10, lsr: 12 }
const FOX_GRIP: Partial<Record<ClickKey, number>> = { lsc: 12, lsr: 12 }
const FOX_SIMPLE: Partial<Record<ClickKey, number>> = { lsc: 12, lsr: 12 }

const SLS = [250, 300, 350, 400, 450, 500, 550, 600, 650]

export const FORKS: ForkModel[] = [
  {
    id: 'fox-32-sc',
    brandId: 'fox',
    brand: 'Fox',
    model: '32 Float SC',
    spring: 'air',
    stanchions: [32],
    travels: [100, 110, 120],
    tokens: { stock: 2, max: 6 },
    clicks: FOX_GRIP,
    damper: 'FIT4 / GRIP',
  },
  {
    id: 'fox-34',
    brandId: 'fox',
    brand: 'Fox',
    model: '34 Float',
    spring: 'air',
    stanchions: [34],
    travels: [120, 130, 140, 150],
    tokens: { stock: 3, max: 6 },
    clicks: FOX_CLICKS,
    damper: 'GRIP2 / GRIP',
  },
  {
    id: 'fox-36',
    brandId: 'fox',
    brand: 'Fox',
    model: '36 Float',
    spring: 'air',
    stanchions: [36],
    travels: [150, 160, 170],
    tokens: { stock: 2, max: 5 },
    clicks: FOX_CLICKS,
    damper: 'GRIP2',
  },
  {
    id: 'fox-38',
    brandId: 'fox',
    brand: 'Fox',
    model: '38 Float',
    spring: 'air',
    stanchions: [38],
    travels: [160, 170, 180],
    tokens: { stock: 2, max: 6 },
    clicks: FOX_CLICKS,
    damper: 'GRIP2 X2 / Performance Elite',
    note: 'Референс из Norco: 64 кг, 170 мм → ≈70 psi.',
  },
  {
    id: 'fox-40',
    brandId: 'fox',
    brand: 'Fox',
    model: '40 Float',
    spring: 'air',
    stanchions: [40],
    travels: [203],
    tokens: { stock: 2, max: 5 },
    clicks: FOX_CLICKS,
    damper: 'GRIP2 DH',
  },
  {
    id: 'rs-sid-sl',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'SID SL',
    spring: 'air',
    stanchions: [32],
    travels: [100, 110, 120],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 12, lsr: 12 },
    damper: 'Charger Race Day',
  },
  {
    id: 'rs-sid',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'SID',
    spring: 'air',
    stanchions: [35],
    travels: [100, 110, 120],
    tokens: { stock: 1, max: 5 },
    clicks: RS_CHARGER3,
    damper: 'Charger 3',
  },
  {
    id: 'rs-pike',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Pike',
    spring: 'air',
    stanchions: [35],
    travels: [120, 130, 140],
    tokens: { stock: 1, max: 5 },
    clicks: RS_CHARGER3,
    damper: 'Charger 3',
  },
  {
    id: 'rs-lyrik',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Lyrik',
    spring: 'air',
    stanchions: [35],
    travels: [150, 160, 170, 180],
    tokens: { stock: 1, max: 6 },
    clicks: RS_CHARGER3,
    damper: 'Charger 3 RC2',
  },
  {
    id: 'rs-zeb',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Zeb',
    spring: 'air',
    stanchions: [38],
    travels: [160, 170, 180, 190],
    tokens: { stock: 1, max: 5 },
    clicks: RS_CHARGER3,
    damper: 'Charger 3',
  },
  {
    id: 'rs-yari',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Yari',
    spring: 'air',
    stanchions: [35],
    travels: [150, 160, 170, 180],
    tokens: { stock: 2, max: 6 },
    clicks: RS_MOTION,
    damper: 'Motion Control',
  },
  {
    id: 'rs-domain',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Domain',
    spring: 'air',
    stanchions: [38],
    travels: [150, 160, 170, 180],
    tokens: { stock: 2, max: 6 },
    clicks: RS_MOTION,
    damper: 'Motion Control',
  },
  {
    id: 'rs-boxxer',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'BoXXer',
    spring: 'air',
    stanchions: [38],
    travels: [200],
    tokens: { stock: 1, max: 5 },
    clicks: RS_CHARGER3,
    damper: 'Charger 3 DH',
  },
  {
    id: 'rs-psylo',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Psylo',
    spring: 'air',
    stanchions: [35],
    travels: [130, 140, 150],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 12, lsr: 12 },
    damper: 'Isostar',
  },
  {
    id: 'rs-recon',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Recon',
    spring: 'air',
    stanchions: [32],
    travels: [100, 120, 130],
    tokens: { stock: 2, max: 6 },
    clicks: RS_MOTION,
    damper: 'Motion Control',
  },
  {
    id: 'man-mezzer',
    brandId: 'manitou',
    brand: 'Manitou',
    model: 'Mezzer Pro',
    spring: 'air',
    stanchions: [37],
    travels: [150, 160, 170, 180],
    tokens: { stock: 1, max: 5 },
    clicks: { lsc: 14, hsc: 6, lsr: 14, hsr: 6 },
    damper: 'MC2 / Dorado Air',
  },
  {
    id: 'man-mattoc',
    brandId: 'manitou',
    brand: 'Manitou',
    model: 'Mattoc',
    spring: 'air',
    stanchions: [34],
    travels: [120, 140, 150, 160],
    tokens: { stock: 1, max: 5 },
    clicks: { lsc: 14, hsc: 6, lsr: 14, hsr: 6 },
    damper: 'MC2',
  },
  {
    id: 'dvo-diamond',
    brandId: 'dvo',
    brand: 'DVO',
    model: 'Diamond D1',
    spring: 'air',
    stanchions: [35],
    travels: [150, 160, 170],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'OTT',
  },
  {
    id: 'dvo-onyx',
    brandId: 'dvo',
    brand: 'DVO',
    model: 'Onyx SC',
    spring: 'air',
    stanchions: [36],
    travels: [160, 170, 180],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'OTT',
  },
  {
    id: 'ohlins-rxf36',
    brandId: 'ohlins',
    brand: 'Öhlins',
    model: 'RXF36 m.2',
    spring: 'air',
    stanchions: [36],
    travels: [140, 150, 160, 170],
    tokens: { stock: 2, max: 5 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'TTX18',
  },
  {
    id: 'ohlins-rxf38',
    brandId: 'ohlins',
    brand: 'Öhlins',
    model: 'RXF38 m.2',
    spring: 'air',
    stanchions: [38],
    travels: [160, 170, 180],
    tokens: { stock: 2, max: 5 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'TTX18',
  },
  {
    id: 'ohlins-dh38',
    brandId: 'ohlins',
    brand: 'Öhlins',
    model: 'DH38 m.1',
    spring: 'air',
    stanchions: [38],
    travels: [200],
    tokens: { stock: 2, max: 5 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'TTX18 DH',
  },
  {
    id: 'cc-helm',
    brandId: 'cane-creek',
    brand: 'Cane Creek',
    model: 'Helm MKII',
    spring: 'air',
    stanchions: [35],
    travels: [130, 140, 150, 160, 170],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'ACS3',
  },
  {
    id: 'formula-selva',
    brandId: 'formula',
    brand: 'Formula',
    model: 'Selva S',
    spring: 'air',
    stanchions: [35],
    travels: [150, 160, 170],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'CTS',
  },
  {
    id: 'suntour-durolux',
    brandId: 'suntour',
    brand: 'SR Suntour',
    model: 'Durolux 36',
    spring: 'air',
    stanchions: [36],
    travels: [150, 160, 170, 180],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 12, lsr: 12 },
    damper: 'PCS',
  },
  {
    id: 'suntour-aion',
    brandId: 'suntour',
    brand: 'SR Suntour',
    model: 'Aion 34',
    spring: 'air',
    stanchions: [34],
    travels: [120, 130, 140, 150],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 12, lsr: 12 },
    damper: 'PCS',
  },
  {
    id: 'mrp-ribbon',
    brandId: 'mrp',
    brand: 'MRP',
    model: 'Ribbon',
    spring: 'air',
    stanchions: [35],
    travels: [140, 150, 160, 170],
    tokens: { stock: 2, max: 6 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'Ramp Control',
  },
  {
    id: 'ext-era',
    brandId: 'ext',
    brand: 'EXT',
    model: 'Era V2',
    spring: 'air',
    stanchions: [36],
    travels: [150, 160, 170, 180],
    tokens: { stock: 2, max: 5 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'Storia',
  },
  {
    id: 'marzocchi-z1-coil',
    brandId: 'marzocchi',
    brand: 'Marzocchi',
    model: 'Bomber Z1 Coil',
    spring: 'coil',
    stanchions: [36],
    travels: [150, 160, 170],
    clicks: { lsc: 12, lsr: 12 },
    springs: [40, 45, 50, 55, 60, 65],
    damper: 'GRIP',
    note: 'Пружинная вилка: подбирается жёсткость пружины, а не давление.',
  },
  {
    id: '2roxx-md999',
    brandId: '2roxx',
    brand: '2Roxx',
    model: 'MD-999 Air',
    spring: 'air',
    stanchions: [32],
    travels: [100, 120],
    clicks: { lsr: 18 },
    extraAdjusters: { abs: 9, lockout: 1 },
    damper: 'Воздушно-масляная, HLO',
    note: 'Бюджетная воздушная вилка: отскок, ABS+ и гидравлическая блокировка. Токенов штатно нет — если не ставили, оставьте «не знаю».',
  },
]

export const SHOCKS: ShockModel[] = [
  {
    id: 'fox-float-x',
    brandId: 'fox',
    brand: 'Fox',
    model: 'Float X',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 60 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 70 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 12, lsr: 12 },
    damper: '2-pos / LSC / LSR',
  },
  {
    id: 'fox-float-x2',
    brandId: 'fox',
    brand: 'Fox',
    model: 'Float X2',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 60 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 225, stroke: 75 },
    ],
    tokens: { stock: 1, max: 5 },
    clicks: FOX_CLICKS,
    damper: 'GRIP2 X2',
  },
  {
    id: 'fox-float-sl',
    brandId: 'fox',
    brand: 'Fox',
    model: 'Float SL',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
    ],
    tokens: { stock: 1, max: 3 },
    clicks: { lsc: 10, lsr: 10 },
    damper: 'SL',
  },
  {
    id: 'fox-dhx2',
    brandId: 'fox',
    brand: 'Fox',
    model: 'DHX2',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 60 },
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 225, stroke: 75 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: FOX_CLICKS,
    springs: SLS,
    damper: 'GRIP2 X2',
    note: 'Стоковые пружины: 350 / 400 / 450 / 500 / 550 lb/in.',
  },
  {
    id: 'fox-dhx',
    brandId: 'fox',
    brand: 'Fox',
    model: 'DHX',
    spring: 'coil',
    sizes: [
      { eyeToEye: 190, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 12, lsr: 12 },
    springs: SLS,
    damper: 'LSC / LSR',
  },
  {
    id: 'fox-van-rc',
    brandId: 'fox',
    brand: 'Fox',
    model: 'Van RC',
    spring: 'coil',
    sizes: [
      { eyeToEye: 190, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    clicks: { lsc: 10, lsr: 12 },
    springs: SLS,
    damper: 'LSC / LSR',
  },
  {
    id: 'rs-super-deluxe',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Super Deluxe Ultimate',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 60 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
      { eyeToEye: 205, stroke: 65 },
    ],
    tokens: { stock: 1, max: 5 },
    clicks: RS_CHARGER3,
    damper: 'RC2T',
  },
  {
    id: 'rs-deluxe',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Deluxe',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 10, lsr: 12 },
    damper: 'RT',
  },
  {
    id: 'rs-vivid',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Vivid Ultimate',
    spring: 'air',
    sizes: [
      { eyeToEye: 205, stroke: 60 },
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 225, stroke: 70 },
      { eyeToEye: 225, stroke: 75 },
      { eyeToEye: 250, stroke: 75 },
    ],
    tokens: { stock: 1, max: 5 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'RC2T TouchDown',
  },
  {
    id: 'rs-vivid-coil',
    brandId: 'rockshox',
    brand: 'RockShox',
    model: 'Vivid Coil Ultimate',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 225, stroke: 75 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    springs: SLS,
    damper: 'RC2T',
  },
  {
    id: 'ohlins-ttx-air',
    brandId: 'ohlins',
    brand: 'Öhlins',
    model: 'TTX Air',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'TTX',
  },
  {
    id: 'ohlins-ttx22',
    brandId: 'ohlins',
    brand: 'Öhlins',
    model: 'TTX22M.2',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    springs: SLS,
    damper: 'TTX22',
  },
  {
    id: 'ext-storia',
    brandId: 'ext',
    brand: 'EXT',
    model: 'Storia V3',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    springs: SLS,
    damper: 'Storia',
  },
  {
    id: 'ext-arma',
    brandId: 'ext',
    brand: 'EXT',
    model: 'Arma V2',
    spring: 'air',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'Arma',
  },
  {
    id: 'cc-kitsuma-air',
    brandId: 'cane-creek',
    brand: 'Cane Creek',
    model: 'DB Kitsuma Air',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    damper: 'DB',
  },
  {
    id: 'cc-kitsuma-coil',
    brandId: 'cane-creek',
    brand: 'Cane Creek',
    model: 'DB Kitsuma Coil',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    springs: SLS,
    damper: 'DB',
  },
  {
    id: 'dvo-topaz',
    brandId: 'dvo',
    brand: 'DVO',
    model: 'Topaz 3',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 200, stroke: 51 },
      { eyeToEye: 210, stroke: 55 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 16, lsr: 16 },
    damper: 'Topaz',
  },
  {
    id: 'dvo-jade',
    brandId: 'dvo',
    brand: 'DVO',
    model: 'Jade X',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
      { eyeToEye: 250, stroke: 75 },
    ],
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    springs: SLS,
    damper: 'Jade',
  },
  {
    id: 'manitou-mara',
    brandId: 'manitou',
    brand: 'Manitou',
    model: 'Mara Pro',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 14, hsc: 6, lsr: 14, hsr: 6 },
    damper: 'Mara',
  },
  {
    id: 'push-elevensix',
    brandId: 'ext',
    brand: 'Push',
    model: 'ElevenSix',
    spring: 'coil',
    sizes: [
      { eyeToEye: 205, stroke: 65 },
      { eyeToEye: 230, stroke: 65 },
    ],
    clicks: { lsc: 16, hsc: 8, lsr: 16, hsr: 8 },
    springs: SLS,
    damper: 'ElevenSix',
  },
  {
    id: 'formula-mod',
    brandId: 'formula',
    brand: 'Formula',
    model: 'Mod',
    spring: 'air',
    sizes: [
      { eyeToEye: 190, stroke: 45 },
      { eyeToEye: 210, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    tokens: { stock: 1, max: 4 },
    clicks: { lsc: 16, hsc: 6, lsr: 16, hsr: 6 },
    damper: 'CTS',
  },
  {
    id: 'marzocchi-bomber-cr',
    brandId: 'marzocchi',
    brand: 'Marzocchi',
    model: 'Bomber CR',
    spring: 'coil',
    sizes: [
      { eyeToEye: 190, stroke: 50 },
      { eyeToEye: 210, stroke: 55 },
      { eyeToEye: 230, stroke: 65 },
    ],
    clicks: { lsc: 10, lsr: 12 },
    springs: SLS,
    damper: 'CR',
  },
]

export const DEFAULT_FORK_CLICKS: Record<ClickKey, number> = {
  lsc: 16,
  hsc: 8,
  lsr: 16,
  hsr: 8,
}

/** Порядок вывода регулировок: отскок → сжатие → прочее. */
export const ADJUSTER_ORDER: AdjusterKey[] = [
  'lsr',
  'lsc',
  'hsc',
  'hsr',
  'abs',
  'preload',
  'lockout',
]

export const DEFAULT_FORK_ADJUSTERS: ForkAdjuster[] = [
  { key: 'lsr', max: 12 },
  { key: 'lsc', max: 12 },
]

/** Список регулировок по умолчанию для выбранной модели вилки. */
export function forkAdjusters(model?: ForkModel): ForkAdjuster[] {
  if (!model) return DEFAULT_FORK_ADJUSTERS.map((a) => ({ ...a }))
  const out: ForkAdjuster[] = []
  for (const [key, max] of Object.entries(model.clicks)) {
    out.push({ key: key as AdjusterKey, max })
  }
  for (const [key, max] of Object.entries(model.extraAdjusters ?? {})) {
    out.push({ key: key as AdjusterKey, max })
  }
  return out.sort((a, b) => ADJUSTER_ORDER.indexOf(a.key) - ADJUSTER_ORDER.indexOf(b.key))
}

export const DEFAULT_SHOCK_CLICKS: Record<ClickKey, number> = {
  lsc: 12,
  hsc: 6,
  lsr: 16,
  hsr: 6,
}

export const BRAND_FACTOR: Record<BrandId, number> = {
  fox: 1.0,
  rockshox: 1.04,
  manitou: 1.0,
  dvo: 1.0,
  ohlins: 1.02,
  'cane-creek': 1.0,
  formula: 1.0,
  suntour: 0.96,
  mrp: 1.0,
  ext: 1.01,
  bos: 1.0,
  marzocchi: 1.0,
  '2roxx': 0.92,
}

export const getFork = (id?: string | null): ForkModel | undefined =>
  id ? FORKS.find((f) => f.id === id) : undefined

export const getShock = (id?: string | null): ShockModel | undefined =>
  id ? SHOCKS.find((s) => s.id === id) : undefined

export const forkLabel = (id?: string | null): string => {
  const f = getFork(id)
  return f ? `${f.brand} ${f.model}` : 'Своя вилка'
}

export const shockLabel = (id?: string | null): string => {
  const s = getShock(id)
  return s ? `${s.brand} ${s.model}` : 'Свой аморт'
}
