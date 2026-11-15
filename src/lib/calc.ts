import type {
  AdjusterKey,
  Bike,
  CalcResult,
  ClickSetting,
  Discipline,
  ForkAdjuster,
  ForkResult,
  Rider,
  SetupParams,
  ShockResult,
  TireResult,
  Weather,
  WheelSpec,
} from '../types'
import { DISCIPLINES } from '../data/disciplines'
import {
  ADJUSTER_ORDER,
  BRAND_FACTOR,
  DEFAULT_FORK_ADJUSTERS,
  DEFAULT_SHOCK_CLICKS,
  forkAdjusters,
  getFork,
  getShock,
} from '../data/components'
import { getTireSetup, getWeatherMeta } from '../data/presets'

export const ENGINE_VERSION = '1.5.0'

const KG_TO_LB = 2.2046226
const MM_PER_IN = 25.4

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const roundTo = (v: number, step = 1) => Math.round(v / step) * step
const n = (v: number, digits = 0) => Number(v.toFixed(digits)).toString()
/** Слагаемое со знаком: «+ 2.0» / «− 1.2» — чтобы формулы читались с отрицательными поправками. */
const sgn = (v: number, digits = 1) => `${v < 0 ? '−' : '+'} ${n(Math.abs(v), digits)}`

/**
 * Влияние диаметра ног на давление. Сила воздушной пружины = давление × площадь поршня,
 * а площадь растёт как квадрат диаметра. Негативная камера частично сглаживает эту
 * зависимость, поэтому берём степень 1.5 — между линейной и квадратичной.
 * 36 мм принят за опорную ногу (давление ≈ вес райдера в экипе).
 */
const stanchionFactor = (mm: number) => clamp(Math.pow(36 / mm, 1.5), 0.78, 1.35)

/** Базовое смещение ЦМ райдера вперёд от каретки, мм (атакующая посадка). */
const COM_BASE: Record<Discipline, number> = {
  xc: 25,
  trail: 35,
  enduro: 40,
  dh: 45,
  dirt: 20,
  gravel: 30,
}

const TIRE_WHEEL_ADJ: Record<string, number> = {
  '26': 2.2,
  '27.5': 0.8,
  '29': 0,
  '700': 2,
}

const SPRING_STOCK = [250, 300, 350, 400, 450, 500, 550, 600, 650]

/** Стабильная подпись байка — чтобы понять «тот же самый велосипед» при импорте. */
export function bikeSignature(bike: Bike): string {
  const src = JSON.stringify({
    discipline: bike.discipline,
    massKg: bike.massKg,
    wheels: bike.wheels,
    fork: bike.fork,
    rear: bike.rear,
    geometry: bike.geometry,
  })
  let h = 2166136261
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

export function leverageRatio(rear: Bike['rear']): number {
  if (rear.leverageOverride && rear.leverageOverride > 1) return rear.leverageOverride
  if (!rear.strokeMm || rear.strokeMm <= 0) return 0
  return rear.travelMm / rear.strokeMm
}

export function sagTargets(
  discipline: Discipline,
  params: SetupParams,
  weather: Weather,
  forkCoil: boolean,
  rearCoil: boolean,
) {
  const d = DISCIPLINES[discipline]
  const w = getWeatherMeta(weather.condition)
  const feelAdj = (0.5 - params.feel) * 0.05
  const terrainAdj = (0.5 - params.terrain) * 0.015
  const weatherAdj = w.sagAdj

  const fork = clamp(d.sagFront + feelAdj + terrainAdj + weatherAdj + (forkCoil ? 0.005 : 0), 0.1, 0.34)
  const rear = clamp(d.sagRear + feelAdj + terrainAdj * 1.2 + weatherAdj + (rearCoil ? 0.005 : 0), 0.15, 0.42)
  return { fork, rear }
}

/** Развесовка: момент относительно задней оси. */
export function weightBalance(bike: Bike, totalKg: number, position: number) {
  const { wheelbaseMm, chainstayMm, bbDropMm } = bike.geometry
  const wb = Math.max(600, wheelbaseMm)
  const csH = Math.sqrt(Math.max(1, chainstayMm * chainstayMm - bbDropMm * bbDropMm))
  const base = COM_BASE[bike.discipline] ?? 35
  const shift = position * 60
  const comFromRearMm = csH + base + shift
  const frontShare = clamp(comFromRearMm / wb, 0.24, 0.52)
  return {
    frontShare,
    rearShare: 1 - frontShare,
    frontKg: totalKg * frontShare,
    rearKg: totalKg * (1 - frontShare),
    comFromRearMm,
    comShiftMm: base + shift,
  }
}

function sagShiftPct(tempC: number): number {
  // Давление в камере задаётся при +20 °C, катаемся при tempC.
  const set = 293.15
  const ride = 273.15 + tempC
  const ratio = ride / set
  if (ratio <= 0) return 0
  return (Math.pow(1 / ratio, 0.45) - 1) * 100
}

function clickSettings(
  adjusters: ForkAdjuster[],
  opts: { weightKg: number; feel: number; tempC: number; isShock?: boolean },
): ClickSetting[] {
  const out: ClickSetting[] = []
  const weightAdj = (opts.weightKg / 78 - 1) * 0.12
  // Клики зависят от веса, стиля и ТЕМПЕРАТУРЫ. Состояние трейла (сухо/снег)
  // меняет давление в шинах и целевой сэг, но на демпфирование не влияет.
  // Холод → масло гуще → демпфирование медленнее; открываем регулировки.
  const tempAdj = clamp((opts.tempC - 20) * 0.003, -0.09, 0.05)
  const sorted = [...adjusters].sort(
    (a, b) => ADJUSTER_ORDER.indexOf(a.key) - ADJUSTER_ORDER.indexOf(b.key),
  )

  for (const adj of sorted) {
    const maxClick = Math.max(1, Math.round(adj.max))
    if (!adj.max) continue

    if (adj.key === 'lockout') {
      // Блокировка: рекомендация «открыта» для спуска, закрывается только на подъёме.
      out.push({ key: 'lockout', value: 0, max: 1, kind: 'switch', maxKnown: true })
      continue
    }

    const compression = adj.key === 'lsc' || adj.key === 'hsc' || adj.key === 'abs'
    const highSpeed = adj.key === 'hsc' || adj.key === 'hsr'
    let frac: number
    if (adj.key === 'preload') {
      frac = 0.35 + (opts.weightKg / 80 - 1) * 0.25 + (0.5 - opts.feel) * 0.2
    } else {
      frac = compression
        ? 0.55 + (opts.feel - 0.5) * 0.3 + weightAdj
        : 0.52 + (0.5 - opts.feel) * 0.22 + weightAdj
      if (adj.key === 'abs') frac += 0.02
      if (highSpeed) frac += 0.04
      else if (adj.key !== 'abs') frac += 0.02
      // Температурная поправка: на холоде открываем демпфер (быстрее отскок / мягче сжатие).
      frac += tempAdj
    }
    frac = clamp(frac, 0.18, 0.86)
    out.push({
      key: adj.key,
      value: Math.max(1, Math.round(maxClick * frac)),
      max: maxClick,
      kind: 'clicks',
      maxKnown: !adj.maxUnknown,
    })
  }
  return out
}

const recordToAdjusters = (ranges: Partial<Record<AdjusterKey, number>>): ForkAdjuster[] =>
  Object.entries(ranges).map(([key, max]) => ({ key: key as AdjusterKey, max }))

function wheelAdj(size: WheelSpec['size']): number {
  return TIRE_WHEEL_ADJ[String(size)] ?? 0
}

function tirePressure(
  wheel: WheelSpec,
  riderKg: number,
  discipline: Discipline,
  params: SetupParams,
  weather: Weather,
  which: 'front' | 'rear',
  frontWidthIn: number,
  /** Отношение нагрузки на это колесо к нагрузке в нейтральной стойке. */
  loadFactor: number,
): {
  psi: number
  widthIn: number
  setup: ReturnType<typeof getTireSetup>
  parts: { base: number; load: number; width: number; wheel: number; disc: number; grip: number; weather: number; temp: number; setup: number; insert: number; rear: number }
} {
  const widthIn = wheel.widthMm / MM_PER_IN
  const setupMeta = getTireSetup(wheel.tireSetup)
  // База калибрована по бескамерным таблицам (Stan's и др.): для 64 кг ≈ 24–25 psi перед.
  const base = 0.3 * riderKg + 5.5
  // Давление держит вес: при переносе ЦМ вперёд переднее колесо нагружается,
  // и шине нужно больше давления. Пятно контакта тоже подрастает, поэтому
  // отклик не линейный — берём степень 0.7.
  const load = base * (Math.pow(clamp(loadFactor, 0.75, 1.3), 0.7) - 1)
  const width = (2.4 - widthIn) * 5.0
  const wheelPart = wheelAdj(wheel.size)
  const disc = DISCIPLINES[discipline].tireAdj
  const grip = -(params.grip - 0.5) * 3.0
  const w = getWeatherMeta(weather.condition)
  const weatherPart = w.tireAdj
  // На холоде давление в шине падает (P ∝ T): добавляем до 3 psi.
  const temp = clamp((20 - weather.tempC) * 0.1, -3, 3)
  const setupPart = setupMeta.psiAdj
  // Вставка работает только внутри бескамерки/трубки, с камерой её не ставят.
  const insert = wheel.insert && setupMeta.allowsInsert ? -2 : 0
  const rear = which === 'rear' ? 2 - (widthIn - frontWidthIn) * 2 : 0

  const raw = base + load + width + wheelPart + disc + grip + weatherPart + temp + setupPart + insert + rear
  const psi = clamp(Math.round(raw * 2) / 2, 9, 60)
  return {
    psi,
    widthIn,
    setup: setupMeta,
    parts: { base, load, width, wheel: wheelPart, disc, grip, weather: weatherPart, temp, setup: setupPart, insert, rear },
  }
}

export function calcSetup(bike: Bike, rider: Rider, params: SetupParams, weather: Weather): CalcResult {
  const d = DISCIPLINES[bike.discipline]
  const weatherMeta = getWeatherMeta(weather.condition)
  const totalKg = rider.weightKg + rider.gearKg + Math.max(0, bike.massKg)
  const totalLb = totalKg * KG_TO_LB
  // Вес райдера в полной экипировке — именно его используют таблицы давления
  // RockShox/Fox для воздушных вилок и амортов (вес байка туда не входит).
  const riderInGearKg = rider.weightKg + rider.gearKg
  const balance = weightBalance(bike, totalKg, params.position)
  // Давление в пружине должно держать реальную нагрузку на колесо. Считаем
  // отношение к нейтральной стойке, чтобы калибровка «psi ≈ вес» осталась той же,
  // а ползунок позиции реально менял давление спереди и сзади.
  const neutralBalance = weightBalance(bike, totalKg, 0)
  const frontLoadRaw = balance.frontKg / Math.max(1, neutralBalance.frontKg)
  const rearLoadRaw = balance.rearKg / Math.max(1, neutralBalance.rearKg)
  // Райдер частично разгружает колесо работой тела, поэтому отклик мягче прямого.
  const frontLoadF = clamp(Math.pow(frontLoadRaw, 0.85), 0.75, 1.3)
  const rearLoadF = clamp(Math.pow(rearLoadRaw, 0.85), 0.75, 1.3)

  const forkModel = getFork(bike.fork.modelId)
  const shockModel = getShock(bike.rear.modelId)
  const forkIsAir = bike.fork.kind === 'air'
  const forkIsCoil = bike.fork.kind === 'coil'
  const rearIsAir = bike.rear.kind === 'air'
  const rearIsCoil = bike.rear.kind === 'coil'

  const sag = sagTargets(bike.discipline, params, weather, forkIsCoil, rearIsCoil)
  const warnings: CalcResult['warnings'] = []
  const explain: CalcResult['explain'] = []

  // ─────────────────────────────── ВИЛКА ───────────────────────────────
  let fork: ForkResult | null = null

  if (forkIsAir || forkIsCoil) {
    const travel = Math.max(40, bike.fork.travelMm)
    const brandFactor = forkModel ? BRAND_FACTOR[forkModel.brandId] : 1
    const sagPct = sag.fork
    const loadKg = balance.frontKg

    let pressure: number | null = null
    let springRate: number | null = null
    let rawPressure = 0

    // На холоде воздух сжимается (P ∝ T) — компенсируем, добавляя ~0.34% на °C.
    const tempForkFactor = clamp(1 + (20 - weather.tempC) * 0.0034, 0.9, 1.15)

    if (forkIsAir) {
      // Давление калибруется по ВЕСУ РАЙДЕРА В ЭКИПЕ (как в таблицах RockShox/Fox),
      // а не по общему весу с байком. База ≈ 1 psi на 1 кг для 36-мм ноги:
      // тоньше нога (32 мм) — давление выше, толще (38–40 мм) — ниже.
      // Множитель нагрузки учитывает стойку: сдвиг ЦМ вперёд грузит вилку.
      rawPressure =
        riderInGearKg *
        stanchionFactor(bike.fork.stanchionMm) *
        brandFactor *
        (1 + (0.5 - params.feel) * 0.1) *
        frontLoadF *
        tempForkFactor
      pressure = clamp(roundTo(rawPressure, 1), 15, 200)
      if (rawPressure < 15 || rawPressure > 200) {
        warnings.push({ level: 'warn', text: 'Давление вилки вышло за рабочий диапазон — проверьте вес и диаметр ног.' })
      }
    } else {
      const ideal = (loadKg * KG_TO_LB) / ((sagPct * travel) / MM_PER_IN)
      const springs = forkModel?.springs?.length ? forkModel.springs : undefined
      const nearest = springs
        ? springs.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a), springs[0])
        : roundTo(clamp(ideal, 25, 90), 5)
      springRate = nearest
      explain.push({
        id: 'fork-spring',
        title: 'Пружина вилки',
        formula: `${n(loadKg * KG_TO_LB)} lb / ${n(sagPct * travel)} мм сэга (в дюймах) = ${n(ideal)} lb/in, ближайшая ${nearest}`,
        result: `${nearest} lb/in`,
        hint: 'Для пружинной вилки подбирается жёсткость пружины, давление не используется.',
      })
    }

    const tokens = forkIsAir
      ? Math.round(
          clamp(
            (forkModel?.tokens?.stock ?? d.tokensFront) +
              (totalKg - 80) / 25 +
              (params.feel - 0.5) * 2 +
              (1 - params.terrain) * 0.5,
            0,
            forkModel?.tokens?.max ?? 6,
          ),
        )
      : 0

    const adjusterList =
      bike.fork.adjusters ??
      (forkModel ? forkAdjusters(forkModel) : DEFAULT_FORK_ADJUSTERS)

    fork = {
      kind: forkIsAir ? 'air' : 'coil',
      label: forkModel
        ? `${forkModel.brand} ${forkModel.model}${forkModel.damper ? ` · ${forkModel.damper}` : ''}`
        : 'Своя вилка',
      travelMm: travel,
      stanchionMm: bike.fork.stanchionMm,
      pressurePsi: pressure,
      springRateLbIn: springRate,
      sagMm: Math.round(sagPct * travel),
      sagPct,
      tokens,
      tokensMax: forkModel?.tokens?.max ?? 6,
      tokensKnown: !bike.fork.tokensUnknown,
      clicks: clickSettings(adjusterList, {
        weightKg: totalKg,
        feel: params.feel,
        tempC: weather.tempC,
      }),
    }

    if (forkIsAir && pressure !== null) {
      explain.push({
        id: 'fork-pressure',
        title: 'Давление в вилке',
        formula: `${n(riderInGearKg, 1)} кг в экипе × ${n(stanchionFactor(bike.fork.stanchionMm), 2)} (нога ${bike.fork.stanchionMm} мм) × ${n(brandFactor, 2)} (бренд) × ${n(1 + (0.5 - params.feel) * 0.1, 2)} (стиль) × ${n(frontLoadF, 3)} (нагрузка перед) × ${n(tempForkFactor, 3)} (темп. ${weather.tempC} °C) = ${n(rawPressure)} psi`,
        result: `${pressure} psi ≈ ${n(pressure * 0.0689476, 1)} bar`,
        hint: `Стартовый ориентир от веса в экипировке, площади ноги и нагрузки на переднее колесо (${n(balance.frontKg, 1)} кг в текущей стойке). Точное давление индивидуально для каждой вилки — доведите сэг до целевого, добавляя по 5 psi.`,
      })
    }

    explain.push({
      id: 'fork-sag',
      title: 'Сэг вилки',
      formula: `база ${n(d.sagFront * 100)}% + стиль ${n((0.5 - params.feel) * 5, 1)}% + рельеф ${n((0.5 - params.terrain) * 1.5, 1)}% + погода ${n(weatherMeta.sagAdj * 100, 1)}% = ${n(sagPct * 100, 1)}%`,
      result: `${Math.round(sagPct * travel)} мм из ${travel} мм`,
      hint: 'Сэг измеряется в атакующей стойке, с экипировкой.',
    })

    if (forkIsAir) {
      explain.push({
        id: 'fork-tokens',
        title: 'Токены вилки',
        formula: `сток ${forkModel?.tokens?.stock ?? d.tokensFront} + вес ${n((totalKg - 80) / 25, 2)} + стиль ${n((params.feel - 0.5) * 2, 2)} + рельеф ${n((1 - params.terrain) * 0.5, 2)}`,
        result: bike.fork.tokensUnknown
          ? `${tokens} шт — рекомендация, у вас не указано`
          : `${tokens} шт · максимум ${fork.tokensMax}`,
        hint: 'Токены меняют прогрессию в конце хода, а не базовое давление.',
      })
    }
  }

  // ─────────────────────────────── АМОРТ ───────────────────────────────
  let shock: ShockResult | null = null

  if (rearIsAir || rearIsCoil) {
    const travel = Math.max(20, bike.rear.travelMm)
    const stroke = Math.max(10, bike.rear.strokeMm)
    const lr = leverageRatio(bike.rear) || travel / stroke
    const sagPct = sag.rear
    const progressF = clamp(1 - ((bike.rear.progressionPct || 25) - 25) * 0.0015, 0.95, 1.03)

    let pressure: number | null = null
    let springRate: number | null = null
    let idealSpring: number | null = null

    if (rearIsAir) {
      const raw =
        2.2 *
        riderInGearKg *
        Math.pow(65 / stroke, 0.7) *
        Math.pow(2.5 / lr, 0.35) *
        Math.pow(0.28 / sagPct, 0.9) *
        progressF *
        rearLoadF
      pressure = clamp(roundTo(raw, 5), 40, 360)
      if (raw < 40 || raw > 360) {
        warnings.push({ level: 'warn', text: 'Давление аморта вышло за рабочий диапазон — проверьте ход штока и рычажность.' })
      }
      explain.push({
        id: 'shock-pressure',
        title: 'Давление в аморте',
        formula: `2.2 × ${n(riderInGearKg, 1)} кг в экипе × (65/${stroke})^0.7 × (2.5/${n(lr, 2)})^0.35 × (28/${n(sagPct * 100, 1)})^0.9 × ${n(progressF, 2)} × ${n(rearLoadF, 3)} (нагрузка зад) = ${n(raw)} psi`,
        result: `${pressure} psi ≈ ${n(pressure * 0.0689476, 1)} bar`,
        hint: `Чем короче шток и ниже рычажность, тем выше давление. Вес байка в расчёте не участвует, но нагрузка на заднее колесо (${n(balance.rearKg, 1)} кг) — участвует.`,
      })
    } else {
      const ideal =
        2.06 *
        totalLb *
        Math.pow(lr / 2.5, 0.9) *
        Math.pow(0.3 / sagPct, 0.7) *
        d.coilFactor *
        rearLoadF
      idealSpring = roundTo(ideal, 5)
      const springs = shockModel?.springs?.length ? shockModel.springs : SPRING_STOCK
      springRate = springs.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a), springs[0])
      explain.push({
        id: 'shock-spring',
        title: 'Жёсткость пружины',
        formula: `2.06 × ${n(totalLb)} lb × (${n(lr, 2)}/2.5)^0.9 × (30/${n(sagPct * 100, 1)})^0.7 × ${n(d.coilFactor, 2)} × ${n(rearLoadF, 3)} (нагрузка зад) = ${n(ideal)} lb/in`,
        result: `${springRate} lb/in · расчётная ${idealSpring}`,
        hint: `Ближайшая из доступных пружин. Идеал ≈ ${idealSpring} lb/in, ставьте ближайшую по таблице производителя.`,
      })
    }

    const tokens = rearIsAir
      ? Math.round(
          clamp(
            (shockModel?.tokens?.stock ?? d.tokensRear) +
              (totalKg - 80) / 30 +
              (params.feel - 0.5) * 1.5 +
              (1 - params.terrain) * 0.4,
            0,
            shockModel?.tokens?.max ?? 4,
          ),
        )
      : 0

    shock = {
      kind: rearIsAir ? 'air' : 'coil',
      label: shockModel
        ? `${shockModel.brand} ${shockModel.model}${shockModel.damper ? ` · ${shockModel.damper}` : ''}`
        : 'Свой аморт',
      travelMm: travel,
      strokeMm: stroke,
      eyeToEyeMm: bike.rear.eyeToEyeMm,
      leverageRatio: Math.round(lr * 100) / 100,
      progressionPct: bike.rear.progressionPct,
      pressurePsi: pressure,
      springRateLbIn: springRate,
      springRateIdeal: idealSpring,
      sagMm: Math.round(sagPct * stroke),
      wheelSagMm: Math.round(sagPct * travel),
      sagPct,
      tokens,
      tokensMax: shockModel?.tokens?.max ?? 4,
      clicks: clickSettings(recordToAdjusters(shockModel?.clicks ?? DEFAULT_SHOCK_CLICKS), {
        weightKg: totalKg,
        feel: params.feel,
        tempC: weather.tempC,
        isShock: true,
      }),
    }

    explain.push({
      id: 'shock-sag',
      title: 'Сэг аморта',
      formula: `база ${n(d.sagRear * 100)}% + стиль ${n((0.5 - params.feel) * 5, 1)}% + рельеф ${n((0.5 - params.terrain) * 1.8, 1)}% + погода ${n(weatherMeta.sagAdj * 100, 1)}% = ${n(sagPct * 100, 1)}%`,
      result: `${Math.round(sagPct * stroke)} мм по штоку / ${Math.round(sagPct * travel)} мм по колесу`,
      hint: `Рычажность ${Math.round(lr * 100) / 100}:1, прогрессия ${bike.rear.progressionPct}%.`,
    })
  }

  // ─────────────────────────────── ШИНЫ ───────────────────────────────
  const frontTireRaw = tirePressure(
    bike.wheels.front,
    riderInGearKg,
    bike.discipline,
    params,
    weather,
    'front',
    bike.wheels.front.widthMm / MM_PER_IN,
    frontLoadRaw,
  )
  const rearTireRaw = tirePressure(
    bike.wheels.rear,
    riderInGearKg,
    bike.discipline,
    params,
    weather,
    'rear',
    bike.wheels.front.widthMm / MM_PER_IN,
    rearLoadRaw,
  )

  const tires: CalcResult['tires'] = {
    front: {
      size: bike.wheels.front.size,
      widthMm: bike.wheels.front.widthMm,
      psi: frontTireRaw.psi,
      bar: Math.round(frontTireRaw.psi * 0.0689476 * 10) / 10,
      insert: bike.wheels.front.insert,
      setup: frontTireRaw.setup.id,
      setupLabel: frontTireRaw.setup.label,
      setupShort: frontTireRaw.setup.short,
    },
    rear: {
      size: bike.wheels.rear.size,
      widthMm: bike.wheels.rear.widthMm,
      psi: rearTireRaw.psi,
      bar: Math.round(rearTireRaw.psi * 0.0689476 * 10) / 10,
      insert: bike.wheels.rear.insert,
      setup: rearTireRaw.setup.id,
      setupLabel: rearTireRaw.setup.label,
      setupShort: rearTireRaw.setup.short,
    },
  }

  const ft = frontTireRaw.parts
  explain.push({
    id: 'tires',
    title: 'Давление в шинах',
    formula: `база 0.30×${n(riderInGearKg, 1)} + 5.5 = ${n(ft.base, 1)} psi · нагрузка ${sgn(ft.load)} · ширина ${sgn(ft.width)} (2.4−${n(frontTireRaw.widthIn, 1)}″) · колесо ${sgn(ft.wheel)} · дисциплина ${sgn(ft.disc)} · грип ${sgn(ft.grip)} · тип ${sgn(ft.setup)} (${frontTireRaw.setup.short}) · погода ${sgn(ft.weather)} · темп. ${sgn(ft.temp)} = ${n(tires.front.psi, 1)} psi`,
    result: `перед ${n(tires.front.psi, 1)} / зад ${n(tires.rear.psi, 1)} psi`,
    hint: `Перед: ${frontTireRaw.setup.label.toLowerCase()}. Зад: ${rearTireRaw.setup.label.toLowerCase()}. ${frontTireRaw.setup.note} ${weatherMeta.note}`,
  })

  // ─────────────────────────────── КОКПИТ ───────────────────────────────
  const recommendedWidth =
    bike.discipline === 'gravel'
      ? roundTo(clamp(405 + (rider.heightCm - 170) * 1.6, 380, 480), 5)
      : roundTo(clamp(560 + rider.heightCm * 1.15 + d.barWidthAdj, 680, 820), 5)

  const cockpit = {
    barWidthMm: bike.geometry.barWidthMm,
    barRiseMm: bike.geometry.barRiseMm,
    stemLengthMm: bike.geometry.stemLengthMm,
    spacersMm: bike.geometry.spacersMm,
    recommendedBarWidthMm: recommendedWidth,
  }

  explain.push({
    id: 'cockpit',
    title: 'Кокпит',
    formula:
      bike.discipline === 'gravel'
        ? `380 + (${rider.heightCm}−170)×1.6 = ${recommendedWidth} мм`
        : `560 + ${rider.heightCm}×1.15 + ${d.barWidthAdj} (дисциплина) = ${recommendedWidth} мм`,
    result: `рекомендуемый руль ${recommendedWidth} мм, сейчас ${bike.geometry.barWidthMm} мм`,
    hint: 'Широкий руль = больше рычаг и контроля, но шире по деревьям.',
  })

  // ─────────────────────────────── ПРОВЕРКИ ───────────────────────────────
  if (bike.rear.kind === 'none' && (bike.discipline === 'enduro' || bike.discipline === 'dh')) {
    warnings.push({ level: 'info', text: 'Задней подвески нет, а дисциплина предполагает амортизацию. Расчёт шин и вилки всё равно корректен.' })
  }
  if (bike.fork.kind === 'rigid' && bike.fork.travelMm > 0) {
    warnings.push({ level: 'info', text: 'Вилка отмечена как ригид — ход игнорируется.' })
  }
  if ((rearIsAir || rearIsCoil) && (!bike.rear.strokeMm || !bike.rear.travelMm)) {
    warnings.push({ level: 'warn', text: 'Для аморта нужны ход штока и ход заднего колеса — иначе рычажность не посчитать.' })
  }
  if (shock && (shock.leverageRatio < 1.9 || shock.leverageRatio > 3.7)) {
    warnings.push({ level: 'warn', text: `Рычажность ${shock.leverageRatio}:1 нетипична (обычно 2.0–3.5). Проверьте ход штока и ход колеса.` })
  }
  if (rearIsAir || rearIsCoil) {
    if (bike.rear.progressionPct < 10 || bike.rear.progressionPct > 45) {
      warnings.push({ level: 'info', text: 'Прогрессия вне типичных 10–45% — рекомендации по пружине могут быть менее точными.' })
    }
  }
  if (rider.weightKg < 45 || rider.weightKg > 125) {
    warnings.push({ level: 'info', text: 'Вес райдера вне типичного диапазона 45–125 кг: проверяйте рекомендации особенно внимательно.' })
  }
  if (shock && bike.fork.travelMm - bike.rear.travelMm > 40) {
    warnings.push({ level: 'info', text: 'Ход вилки заметно больше хода зада: баланс будет смещён вперёд.' })
  }
  if (Math.abs(recommendedWidth - bike.geometry.barWidthMm) >= 30) {
    warnings.push({
      level: 'info',
      text: `Руль ${bike.geometry.barWidthMm} мм заметно отличается от рекомендованных ${recommendedWidth} мм для роста ${rider.heightCm} см.`,
    })
  }
  if (!bike.geometry.wheelbaseMm || !bike.geometry.chainstayMm) {
    warnings.push({ level: 'warn', text: 'Без базы и длины перьев развесовка будет приблизительной. Заполните геометрию.' })
  }
  for (const [where, wheel] of [
    ['переднем', bike.wheels.front],
    ['заднем', bike.wheels.rear],
  ] as const) {
    const meta = getTireSetup(wheel.tireSetup)
    if (wheel.insert && !meta.allowsInsert) {
      warnings.push({
        level: 'info',
        text: `Вставка на ${where} колесе не ставится с вариантом «${meta.label}» — поправка −2 psi не применена.`,
      })
    }
  }

  // ─────────────────────────────── ПОГОДА ───────────────────────────────
  const sagShift = sagShiftPct(weather.tempC)
  const tempNote =
    Math.abs(sagShift) < 0.6
      ? 'Температура близка к комнатной — поправка на нагрев минимальна.'
      : `Если качать при +20 °C, то при ${weather.tempC} °C давление в воздушных камерах будет примерно на ${n(Math.abs(1 - (273.15 + weather.tempC) / 293.15) * 100, 1)}% ${weather.tempC < 20 ? 'ниже' : 'выше'}, а сэг ${weather.tempC < 20 ? 'вырастет' : 'уменьшится'} на ~${n(Math.abs(sagShift), 1)}%. Настраивайте на улице или после прогрева.`
  const altitudeNote =
    weather.altitudeM > 800
      ? ` Высота ${weather.altitudeM} м: манометр покажет на ~${n(weather.altitudeM * 0.00012 * 14.5, 1)} psi больше относительно уровня моря — качайте на месте.`
      : ''
  const weatherNote = `${weatherMeta.note}${tempNote ? ' ' + tempNote : ''}${altitudeNote}`

  explain.push({
    id: 'clicks-temp',
    title: 'Температура и демпфирование',
    formula: `поправка кликов = (${weather.tempC} °C − 20) × 0.3% = ${n((weather.tempC - 20) * 0.3, 1)}%`,
    result:
      weather.tempC < 20
        ? 'на холоде масло гуще — демпфирование открывается на несколько кликов'
        : weather.tempC > 20
          ? 'в тепле масло жиже — демпфирование чуть прикрывается'
          : 'температура нейтральная — поправка к кликам нулевая',
    hint: 'Клики отскока считаются от быстрого к медленному: меньше кликов — быстрее отскок.',
  })
  explain.push({
    id: 'mass',
    title: 'Суммарная масса',
    formula: `${rider.weightKg} кг райдер + ${rider.gearKg} кг экипировка + ${n(bike.massKg, 1)} кг байк`,
    result: `${n(totalKg, 1)} кг · ${n(totalLb)} lb`,
  })
  explain.push({
    id: 'balance',
    title: 'Развесовка',
    formula: `(${n(Math.sqrt(Math.max(1, bike.geometry.chainstayMm ** 2 - bike.geometry.bbDropMm ** 2)))}) перья + смещение ЦМ ${n(balance.comShiftMm)} мм) / база ${bike.geometry.wheelbaseMm} мм`,
    result: `перед ${n(balance.frontShare * 100, 1)}% · зад ${n(balance.rearShare * 100, 1)}%`,
    hint: 'Ползунок позиции сдвигает ЦМ на ±60 мм: это меняет нагрузку на колёса, а вместе с ней — давление в вилке, аморте и шинах.',
  })

  const frontPct = Math.round(balance.frontShare * 1000) / 10
  const rearPct = Math.round((100 - frontPct) * 10) / 10

  return {
    engineVersion: ENGINE_VERSION,
    computedAt: Date.now(),
    mass: {
      riderKg: rider.weightKg,
      gearKg: rider.gearKg,
      bikeKg: bike.massKg,
      totalKg,
      totalLb,
    },
    balance: {
      frontPct,
      rearPct,
      frontKg: Math.round(balance.frontKg * 10) / 10,
      rearKg: Math.round(balance.rearKg * 10) / 10,
      comFromRearMm: Math.round(balance.comFromRearMm),
      comShiftMm: Math.round(balance.comShiftMm),
    },
    fork,
    shock,
    tires,
    cockpit,
    sagTargets: { forkPct: sag.fork, rearPct: sag.rear },
    weatherNote,
    warnings,
    explain,
  }
}

export const psiToBar = (psi: number) => Math.round(psi * 0.0689476 * 10) / 10
