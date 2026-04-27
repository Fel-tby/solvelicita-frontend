import { useMemo } from 'react'
import { FAIXAS_SCORE } from './constants'

// Use 7 bins matching the 7 score ranges, not 25
export default function ScoreHistogram({ municipios, medianaEstado }) {
  const bins = useMemo(() => {
    const result = FAIXAS_SCORE.map(faixa => ({
      ...faixa,
      count: 0,
    }))

    municipios.forEach((m) => {
      const score = Number(m.score)
      if (Number.isNaN(score) || m.score == null) return
      // Find the correct bin
      for (let i = 0; i < result.length; i++) {
        if (score >= result[i].min && score <= result[i].max) {
          result[i].count++
          break
        }
      }
    })

    return result
  }, [municipios])

  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  const chartW = 460
  const chartH = 190
  const barAreaTop = 36
  const barAreaBottom = chartH - 30
  const barAreaH = barAreaBottom - barAreaTop
  const barWidth = chartW / bins.length
  const barGap = 6

  return (
    <div className="dash-v3-section">
      <div className="dash-v3-section-header">
        <h2 className="dash-v3-section-title">2. Distribuição do score</h2>
      </div>

      <div className="dash-v3-histogram-chart">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
          {/* Horizontal grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = barAreaBottom - barAreaH * ratio
            return (
              <g key={ratio}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="var(--border-dim)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x={2} y={y - 3} fill="var(--text-lo)" fontSize="9" fontFamily="var(--sans)">
                  {Math.round(maxCount * ratio)}
                </text>
              </g>
            )
          })}

          {/* Median Line */}
          {medianaEstado != null && (() => {
            // Position median on X relative to the bins
            const medX = (() => {
              for (let i = 0; i < bins.length; i++) {
                if (medianaEstado >= bins[i].min && medianaEstado <= bins[i].max) {
                  const pct = (medianaEstado - bins[i].min) / (bins[i].max - bins[i].min)
                  return (i + pct) * barWidth
                }
              }
              return chartW / 2
            })()

            return (
              <g>
                <line x1={medX} y1={18} x2={medX} y2={barAreaBottom} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" />
                <rect x={medX - 30} y={4} width={60} height={12} fill="var(--bg-card)" opacity={0.8} rx={2} />
                <text x={medX} y={13} fill="#3b82f6" fontSize="10" fontWeight="700" fontFamily="var(--sans)" textAnchor="middle">
                  Mediana {medianaEstado.toFixed(1)}
                </text>
              </g>
            )
          })()}

          {/* Bars */}
          {bins.map((bin, i) => {
            const barH = maxCount > 0 ? (bin.count / maxCount) * barAreaH : 0
            const x = i * barWidth + barGap / 2
            const y = barAreaBottom - barH
            const w = barWidth - barGap

            return (
              <g key={bin.id}>
                <rect x={x} y={y} width={w} height={barH} fill={bin.color} opacity={0.85} rx={3} />
                {/* Count label on top of bar */}
                {bin.count > 0 && (
                  <text x={x + w / 2} y={y - 4} fill="var(--text-mid)" fontSize="10" fontWeight="700" fontFamily="var(--sans)" textAnchor="middle">
                    {bin.count}
                  </text>
                )}
              </g>
            )
          })}

          {/* X Axis labels */}
          {bins.map((bin, i) => {
            const cx = i * barWidth + barWidth / 2
            return (
              <text key={bin.id} x={cx} y={barAreaBottom + 14} fill="var(--text-mid)" fontSize="9" fontWeight="600" fontFamily="var(--sans)" textAnchor="middle">
                {bin.id}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend — compact horizontal */}
      <div className="dash-v3-histogram-legend">
        {FAIXAS_SCORE.map((faixa) => (
          <div key={faixa.id} className="dash-v3-histogram-legend-item">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: faixa.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-hi)', fontWeight: 500 }}>{faixa.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
