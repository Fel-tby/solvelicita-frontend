import { useMemo } from 'react'
import { CONTRIBUTION_AXES } from './constants'

/**
 * 6-axis radar chart built entirely with SVG — zero external dependencies.
 * Each axis corresponds to a score contribution component, normalized to its max weight.
 */
export default function ScoreRadar({ municipio, size = 220 }) {
  const axes = CONTRIBUTION_AXES
  const center = size / 2
  const maxRadius = (size / 2) - 32

  const data = useMemo(() => {
    return axes.map((axis) => {
      const raw = municipio[axis.key]
      if (raw == null || Number.isNaN(Number(raw))) return { ...axis, value: 0, pct: 0 }
      const pct = Math.max(0, Math.min(1, Number(raw) / axis.max))
      return { ...axis, value: Number(raw), pct }
    })
  }, [municipio])

  const angleStep = (2 * Math.PI) / axes.length
  const startAngle = -Math.PI / 2 // start from top

  function pointAt(index, radius) {
    const angle = startAngle + index * angleStep
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  // Background rings
  const rings = [0.25, 0.5, 0.75, 1.0]
  const ringPaths = rings.map((r) => {
    const radius = maxRadius * r
    const points = axes.map((_, i) => pointAt(i, radius))
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  })

  // Data polygon
  const dataPoints = data.map((d, i) => pointAt(i, maxRadius * d.pct))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Axis lines
  const axisLines = axes.map((_, i) => ({
    from: { x: center, y: center },
    to: pointAt(i, maxRadius),
  }))

  // Labels
  const labelPoints = axes.map((axis, i) => {
    const p = pointAt(i, maxRadius + 18)
    return { ...axis, x: p.x, y: p.y }
  })

  return (
    <div className="dash-radar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background rings */}
        {ringPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth="0.7" opacity={0.7} />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity={0.6}
          />
        ))}

        {/* Data fill */}
        <path d={dataPath} fill="rgba(24, 95, 165, 0.15)" stroke="#185FA5" strokeWidth="2" />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#185FA5" stroke="#fff" strokeWidth="1.5" />
        ))}

        {/* Labels */}
        {labelPoints.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-mid)"
            fontSize="9"
            fontWeight="600"
            fontFamily="var(--sans)"
          >
            {lp.shortLabel}
          </text>
        ))}
      </svg>
    </div>
  )
}
