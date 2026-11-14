import type { SVGProps } from 'react'
import type { Bike, WheelSpec } from '../types'
import { cn } from '../lib/cn'

/**
 * Реалистичный боковой профиль байка, построенный по геометрии рамы.
 * Все расстояния считаются в миллиметрах, затем масштабируются в SVG.
 * Это не инженерный чертёж, но пропорции колёс, базы, вилки и рамы
 * соответствуют введённым размерам.
 */

const clamp = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min

const RAD = Math.PI / 180

/** Радиус обода по ETRTO: 26″ = 559, 27.5″ = 584, 29″ / 700c = 622. */
const rimRadius = (size: WheelSpec['size']): number => {
  if (size === 26) return 559 / 2
  if (size === 27.5) return 584 / 2
  return 622 / 2
}

const wheelRadius = (wheel: WheelSpec): number =>
  rimRadius(wheel.size) + clamp(wheel.widthMm, 20, 100)

const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

interface P {
  x: number
  y: number
}

export function BikeBlueprint({ bike, className }: { bike: Bike; className?: string }) {
  const g = bike.geometry
  const wb = clamp(g.wheelbaseMm, 900, 1450)
  const cs = clamp(g.chainstayMm, 380, 540)
  const bbDrop = clamp(g.bbDropMm, 5, 70)
  const stack = clamp(g.stackMm, 520, 700)
  const reach = clamp(g.reachMm, 340, 540)
  const headAngle = clamp(g.headAngleDeg, 58, 72) * RAD
  const seatAngle = clamp(g.seatAngleDeg, 66, 82) * RAD
  const stemLen = clamp(g.stemLengthMm, 25, 110)
  const barRise = clamp(g.barRiseMm, 0, 70)
  const spacers = clamp(g.spacersMm, 0, 60)
  const travel = bike.fork.kind === 'rigid' ? 0 : clamp(bike.fork.travelMm, 0, 220)
  const rearTravel = bike.rear.kind === 'none' ? 0 : clamp(bike.rear.travelMm, 0, 260)

  const frontWheel = bike.wheels.front
  const rearWheel = bike.wheels.rear
  const rF = wheelRadius(frontWheel)
  const rR = wheelRadius(rearWheel)

  // ── Точки рамы (мм, каретка в начале координат, y вниз) ──
  const bb: P = { x: 0, y: 0 }
  const rearAxle: P = {
    x: -Math.sqrt(Math.max(1, cs * cs - bbDrop * bbDrop)),
    y: -bbDrop,
  }
  const groundY = -bbDrop + rR
  const frontAxle: P = { x: rearAxle.x + wb, y: groundY - rF }

  const headTubeLen = clamp(85 + travel * 0.2, 95, 140)
  const htTop: P = { x: reach, y: -stack }
  const htBottom: P = {
    x: htTop.x + Math.cos(headAngle) * headTubeLen,
    y: htTop.y + Math.sin(headAngle) * headTubeLen,
  }
  const htJoint = lerp(htTop, htBottom, 0.2)

  const seatTopY = -(stack - 145)
  const seatTubeLen = Math.abs(seatTopY) / Math.sin(seatAngle)
  const seatTop: P = {
    x: -Math.cos(seatAngle) * seatTubeLen,
    y: seatTopY,
  }
  const postTop: P = {
    x: seatTop.x - Math.cos(seatAngle) * 215,
    y: seatTop.y - Math.sin(seatAngle) * 215,
  }

  const seatStayTop = lerp(bb, seatTop, 0.82)
  const shockTop = { x: seatTop.x + 8, y: seatTop.y + 34 }
  const shockBottom: P = { x: 16, y: -86 }

  const clampPoint: P = { x: htTop.x, y: htTop.y - spacers }
  const stemEnd: P = {
    x: clampPoint.x + Math.cos(8 * RAD) * stemLen,
    y: clampPoint.y - Math.sin(8 * RAD) * stemLen,
  }
  const barCenter: P = { x: stemEnd.x + 7, y: stemEnd.y - barRise }

  // ── Границы и масштаб ──
  const W = 360
  const padX = 12
  const padTop = 10
  const padBottom = 26
  const minX = Math.min(rearAxle.x - rR, frontAxle.x - rF) - 8
  const maxX = Math.max(frontAxle.x + rF, rearAxle.x + rR) + 8
  const minY = Math.min(
    postTop.y - 24,
    barCenter.y - 18,
    htTop.y - spacers - 18,
  )
  const maxY = groundY + 6
  const scale = (W - padX * 2) / (maxX - minX)
  const H = Math.ceil((maxY - minY) * scale + padTop + padBottom)

  const px = (p: P) => ({
    x: padX + (p.x - minX) * scale,
    y: padTop + (p.y - minY) * scale,
  })
  const sx = (v: number) => v * scale

  const FRAME = 'var(--color-muted)'
  const FRAME_DIM = 'var(--color-dim)'
  const ACID = 'var(--color-acid)'
  const AMBER = 'var(--color-amber)'
  const SKY = 'var(--color-sky)'
  const DARK = '#0a0c09'
  const TIRE = '#242a20'
  const RIM = '#7f8a74'

  const bbPx = px(bb)
  const rearPx = px(rearAxle)
  const frontPx = px(frontAxle)
  const seatPx = px(seatTop)
  const postPx = px(postTop)
  const htTopPx = px(htTop)
  const htBottomPx = px(htBottom)
  const htJointPx = px(htJoint)
  const shockTopPx = px(shockTop)
  const shockBottomPx = px(shockBottom)
  const stemEndPx = px(stemEnd)
  const barPx = px(barCenter)

  const line = (a: P, b: P, props: SVGProps<SVGLineElement> = {}) => {
    const pa = px(a)
    const pb = px(b)
    return (
      <line
        x1={pa.x}
        y1={pa.y}
        x2={pb.x}
        y2={pb.y}
        strokeLinecap="round"
        {...props}
      />
    )
  }

  const wheel = (center: P, wheelSpec: WheelSpec) => {
    const c = px(center)
    const rimR = sx(rimRadius(wheelSpec.size))
    const tyreR = sx(wheelRadius(wheelSpec))
    const tyreW = Math.max(3.5, sx(clamp(wheelSpec.widthMm, 20, 100)))
    const rotorR = sx(wheelSpec.size === 29 || wheelSpec.size === 700 ? 92 : 84)
    const spokes = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 360) / 16 + (i % 2 ? 6 : -6)
      const rad = a * RAD
      return (
        <line
          key={`spoke-${i}`}
          x1={c.x + Math.cos(rad) * 4}
          y1={c.y + Math.sin(rad) * 4}
          x2={c.x + Math.cos(rad) * (rimR - 1)}
          y2={c.y + Math.sin(rad) * (rimR - 1)}
          stroke={FRAME_DIM}
          strokeWidth={0.55}
          opacity={0.45}
        />
      )
    })
    return (
      <g>
        <circle
          cx={c.x}
          cy={c.y}
          r={tyreR - tyreW / 2}
          fill="none"
          stroke={TIRE}
          strokeWidth={tyreW}
        />
        <circle
          cx={c.x}
          cy={c.y}
          r={tyreR - tyreW * 0.68}
          fill="none"
          stroke="#39412f"
          strokeWidth={Math.max(0.7, tyreW * 0.16)}
          opacity={0.9}
        />
        <circle cx={c.x} cy={c.y} r={rimR} fill="none" stroke={RIM} strokeWidth={2.2} />
        <circle
          cx={c.x}
          cy={c.y}
          r={rimR - 5}
          fill="none"
          stroke={RIM}
          strokeWidth={0.7}
          opacity={0.5}
        />
        {/* Тормозной диск */}
        <circle
          cx={c.x}
          cy={c.y}
          r={rotorR}
          fill="none"
          stroke={FRAME_DIM}
          strokeWidth={1.5}
          strokeDasharray="3.2 2.2"
          opacity={0.85}
        />
        <circle cx={c.x} cy={c.y} r={rotorR * 0.62} fill="none" stroke={FRAME_DIM} strokeWidth={0.6} opacity={0.45} />
        {spokes}
        <circle cx={c.x} cy={c.y} r={5.2} fill={DARK} stroke={FRAME} strokeWidth={1.2} />
        <circle cx={c.x} cy={c.y} r={1.8} fill={FRAME} />
      </g>
    )
  }

  const hasRear = bike.rear.kind !== 'none'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label={`Схема велосипеда ${bike.name}`}
    >
      <defs>
        <linearGradient id="bbFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9ff3d" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#c9ff3d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Земля */}
      <line
        x1={padX * 0.4}
        y1={px({ x: 0, y: groundY }).y}
        x2={W - padX * 0.4}
        y2={px({ x: 0, y: groundY }).y}
        stroke="var(--color-line-strong)"
        strokeWidth={0.7}
        strokeDasharray="4 3"
        opacity={0.7}
      />

      {wheel(rearAxle, rearWheel)}
      {wheel(frontAxle, frontWheel)}

      {/* Задний треугольник */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {line(bb, rearAxle, { stroke: FRAME, strokeWidth: 2.6 })}
        {line(rearAxle, seatStayTop, { stroke: FRAME, strokeWidth: 2.2 })}
        {line(bb, seatTop, { stroke: FRAME, strokeWidth: 3.4 })}
        {line(seatTop, htJoint, { stroke: FRAME, strokeWidth: 3.2 })}
        {line(bb, htBottom, { stroke: FRAME, strokeWidth: 3.6 })}
        {line(htTop, htBottom, { stroke: FRAME, strokeWidth: 5 })}
      </g>

      {/* Задняя ось / дропауты */}
      <circle cx={px(rearAxle).x} cy={px(rearAxle).y} r={3.4} fill={FRAME} />

      {/* Аморт */}
      {hasRear && (
        <g>
          {line(shockBottom, shockTop, { stroke: DARK, strokeWidth: 6.4 })}
          {line(shockBottom, shockTop, {
            stroke: bike.rear.kind === 'coil' ? AMBER : SKY,
            strokeWidth: 3.6,
          })}
          {bike.rear.kind === 'coil' &&
            Array.from({ length: 7 }, (_, i) => {
              const t = 0.22 + i * 0.085
              const c = lerp(shockBottom, shockTop, t)
              const p = px(c)
              const dx = shockTopPx.x - shockBottomPx.x
              const dy = shockTopPx.y - shockBottomPx.y
              const len = Math.hypot(dx, dy) || 1
              const nx = (-dy / len) * 4.2
              const ny = (dx / len) * 4.2
              return (
                <line
                  key={`coil-${i}`}
                  x1={p.x - nx}
                  y1={p.y - ny}
                  x2={p.x + nx}
                  y2={p.y + ny}
                  stroke={AMBER}
                  strokeWidth={1.1}
                  opacity={0.9}
                />
              )
            })}
          <circle cx={shockBottomPx.x} cy={shockBottomPx.y} r={2.6} fill={DARK} stroke={FRAME} strokeWidth={0.9} />
          <circle cx={shockTopPx.x} cy={shockTopPx.y} r={2.6} fill={DARK} stroke={FRAME} strokeWidth={0.9} />
        </g>
      )}

      {/* Рокер / линк */}
      {hasRear && line(seatStayTop, shockBottom, { stroke: FRAME, strokeWidth: 1.8, opacity: 0.85 })}

      {/* Вилка */}
      <g fill="none" strokeLinecap="round">
        {line(htBottom, frontAxle, { stroke: DARK, strokeWidth: 7.4 })}
        {line(htBottom, frontAxle, { stroke: ACID, strokeWidth: 4.2 })}
        {line(htBottom, lerp(htBottom, frontAxle, 0.48), { stroke: ACID, strokeWidth: 5.6 })}
        {line(lerp(htBottom, frontAxle, 0.52), frontAxle, {
          stroke: ACID,
          strokeWidth: 6.6,
          opacity: 0.92,
        })}
        {/* Корона */}
        {(() => {
          const crown = px(htBottom)
          const end = px(frontAxle)
          const dx = end.x - crown.x
          const dy = end.y - crown.y
          const len = Math.hypot(dx, dy) || 1
          const nx = (-dy / len) * 7
          const ny = (dx / len) * 7
          return (
            <g stroke={ACID} strokeWidth={3.4} opacity={0.95}>
              <line x1={crown.x - nx} y1={crown.y - ny} x2={crown.x + nx} y2={crown.y + ny} />
              <line
                x1={end.x - nx * 1.2}
                y1={end.y - ny * 1.2}
                x2={end.x + nx * 1.2}
                y2={end.y + ny * 1.2}
                strokeWidth={2.4}
              />
              {/* Дуга-арка над покрышкой */}
              <line
                x1={crown.x + dx * 0.58 - nx * 0.7}
                y1={crown.y + dy * 0.58 - ny * 0.7}
                x2={crown.x + dx * 0.58 + nx * 0.7}
                y2={crown.y + dy * 0.58 + ny * 0.7}
                strokeWidth={2}
              />
            </g>
          )
        })()}
      </g>

      {/* Подседельный штырь и седло */}
      <g fill="none" strokeLinecap="round">
        {line(seatTop, postTop, { stroke: FRAME, strokeWidth: 2.8 })}
        <path
          d={(() => {
            const s = px(postTop)
            return `M ${s.x - 26} ${s.y + 4} C ${s.x - 12} ${s.y - 3}, ${s.x + 16} ${s.y - 4}, ${s.x + 30} ${s.y + 1} L ${s.x + 30} ${s.y + 4} C ${s.x + 14} ${s.y + 1}, ${s.x - 10} ${s.y + 5}, ${s.x - 26} ${s.y + 9} Z`
          })()}
          fill={FRAME}
          stroke={DARK}
          strokeWidth={0.8}
          opacity={0.95}
        />
      </g>

      {/* Кокпит: вынос и руль */}
      <g fill="none" strokeLinecap="round">
        {line(clampPoint, stemEnd, { stroke: DARK, strokeWidth: 5.4 })}
        {line(clampPoint, stemEnd, { stroke: FRAME, strokeWidth: 2.8 })}
        <line
          x1={htTopPx.x}
          y1={htTopPx.y}
          x2={px(clampPoint).x}
          y2={px(clampPoint).y}
          stroke={FRAME}
          strokeWidth={3.2}
        />
        <circle
          cx={barPx.x}
          cy={barPx.y}
          r={7.4}
          fill={DARK}
          stroke={FRAME}
          strokeWidth={2}
        />
        <circle cx={barPx.x} cy={barPx.y} r={2.2} fill={FRAME} />
      </g>

      {/* Трансмиссия */}
      <g fill="none">
        {/* Кассета */}
        <circle cx={rearPx.x} cy={rearPx.y} r={sx(78)} stroke={FRAME_DIM} strokeWidth={1.5} opacity={0.8} />
        <circle cx={rearPx.x} cy={rearPx.y} r={sx(58)} stroke={FRAME_DIM} strokeWidth={1.1} opacity={0.6} />
        <circle cx={rearPx.x} cy={rearPx.y} r={sx(38)} stroke={FRAME_DIM} strokeWidth={0.9} opacity={0.45} />
        {/* Цепь */}
        <line
          x1={bbPx.x + sx(72)}
          y1={bbPx.y - sx(20)}
          x2={rearPx.x + sx(72)}
          y2={rearPx.y - sx(20)}
          stroke={FRAME_DIM}
          strokeWidth={0.9}
          opacity={0.55}
        />
        <line
          x1={bbPx.x + sx(54)}
          y1={bbPx.y + sx(48)}
          x2={rearPx.x + sx(54)}
          y2={rearPx.y + sx(52)}
          stroke={FRAME_DIM}
          strokeWidth={0.9}
          opacity={0.4}
        />
        {/* Система */}
        <circle cx={bbPx.x} cy={bbPx.y} r={sx(72)} stroke={RIM} strokeWidth={2.2} />
        <circle cx={bbPx.x} cy={bbPx.y} r={sx(58)} stroke={RIM} strokeWidth={0.7} opacity={0.5} />
        {/* Шатун и педаль */}
        {line(bb, { x: 150, y: 58 }, { stroke: FRAME, strokeWidth: 3.2 })}
        {(() => {
          const pedal = px({ x: 150, y: 58 })
          return (
            <rect
              x={pedal.x - 8}
              y={pedal.y - 1.6}
              width={16}
              height={3.2}
              rx={1.4}
              fill={FRAME}
              opacity={0.9}
            />
          )
        })()}
        <circle cx={bbPx.x} cy={bbPx.y} r={3.6} fill={ACID} />
      </g>

      {/* Размерная линия базы */}
      <g stroke="var(--color-line-strong)" strokeWidth={0.8} fill="none">
        <line x1={rearPx.x} y1={H - 12} x2={frontPx.x} y2={H - 12} />
        <line x1={rearPx.x} y1={H - 16} x2={rearPx.x} y2={H - 8} />
        <line x1={frontPx.x} y1={H - 16} x2={frontPx.x} y2={H - 8} />
        <path
          d={`M ${rearPx.x + 3} ${H - 14.5} L ${rearPx.x} ${H - 12} L ${rearPx.x + 3} ${H - 9.5}`}
        />
        <path
          d={`M ${frontPx.x - 3} ${H - 14.5} L ${frontPx.x} ${H - 12} L ${frontPx.x - 3} ${H - 9.5}`}
        />
      </g>
      <text
        x={(rearPx.x + frontPx.x) / 2}
        y={H - 14}
        textAnchor="middle"
        fill="var(--color-dim)"
        fontSize={6.5}
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
      >
        {Math.round(wb)} MM · {travel}/{rearTravel}
      </text>
    </svg>
  )
}
