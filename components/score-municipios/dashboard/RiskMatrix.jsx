import { useMemo, useState } from 'react'
import { CORES_RISCO_HEX } from './constants'
import { fmtValorHomologado, mediana } from './utils'

const PADDING = { top: 35, right: 30, bottom: 45, left: 65 }
const WIDTH = 950
const HEIGHT = 400

function logScale(value, min, max, height) {
  if (value <= min) return height
  if (value >= max) return 0
  const logValue = Math.log(value)
  const logMin = Math.log(min)
  const logMax = Math.log(max)
  return height - ((logValue - logMin) / (logMax - logMin)) * height
}

export default function RiskMatrix({ municipios, onSelect }) {
  const [hoveredNode, setHoveredNode] = useState(null)

  const data = useMemo(() => {
    return municipios.filter((m) =>
      m.score != null && !Number.isNaN(Number(m.score)) &&
      m.valor_homologado_total != null && Number(m.valor_homologado_total) > 0
    ).map(m => ({
      ...m,
      scoreNum: Number(m.score),
      valorNum: Number(m.valor_homologado_total),
      licitacoesNum: Number(m.n_licitacoes) || 1,
    }))
  }, [municipios])

  if (!data.length) {
    return (
      <div className="dash-v3-section" style={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-lo)', fontSize: '0.85rem' }}>Dados insuficientes para a matriz.</p>
      </div>
    )
  }

  const minValor = Math.max(100000, Math.min(...data.map(d => d.valorNum)) * 0.5)
  const maxValor = Math.max(...data.map(d => d.valorNum)) * 1.5

  const thresholdScore = 60
  const thresholdValor = mediana(data.map(d => d.valorNum)) || 10000000

  const minScoreX = Math.max(0, Math.floor(Math.min(...data.map(d => d.scoreNum)) / 10) * 10 - 10)
  const rangeX = 100 - minScoreX

  const innerW = WIDTH - PADDING.left - PADDING.right
  const innerH = HEIGHT - PADDING.top - PADDING.bottom

  const nodes = data.map(d => {
    const x = PADDING.left + ((d.scoreNum - minScoreX) / rangeX) * innerW
    const y = PADDING.top + logScale(d.valorNum, minValor, maxValor, innerH)
    const sizeScore = Math.max(0, Math.log10(d.licitacoesNum))
    const radius = 4 + sizeScore * 3

    let color = CORES_RISCO_HEX.baixo
    if (d.classificacao_canonica === 'medio') color = CORES_RISCO_HEX.medio
    if (d.classificacao_canonica === 'alto') color = CORES_RISCO_HEX.alto
    if (d.classificacao_canonica === 'critico') color = CORES_RISCO_HEX.critico

    return { ...d, cx: x, cy: y, r: radius, color }
  })

  const midX = PADDING.left + ((thresholdScore - minScoreX) / rangeX) * innerW
  const midY = PADDING.top + logScale(thresholdValor, minValor, maxValor, innerH)

  // Y ticks
  const yTickCandidates = [1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9, 5e9, 1e10]
  const yTicks = yTickCandidates.filter(t => t >= minValor && t <= maxValor)

  function fmtTick(v) {
    if (v >= 1e9) return `${v / 1e9}bi`
    if (v >= 1e6) return `${v / 1e6}mi`
    if (v >= 1e3) return `${v / 1e3}k`
    return String(v)
  }

  // Quadrant labels
  const quadrants = [
    { label: 'Atenção prioritária', x: PADDING.left + 6, y: PADDING.top + 14, color: '#ef4444' },
    { label: 'Em destaque', x: midX + 6, y: PADDING.top + 14, color: '#16a34a' },
    { label: 'Baixa prioridade', x: PADDING.left + 6, y: HEIGHT - PADDING.bottom - 8, color: '#94a3b8' },
    { label: 'Monitoramento recomendado', x: midX + 6, y: HEIGHT - PADDING.bottom - 8, color: '#f59e0b' },
  ]

  // Legend items
  const legend = [
    { label: 'Alto desempenho', color: CORES_RISCO_HEX.baixo },
    { label: 'Estável', color: CORES_RISCO_HEX.medio },
    { label: 'Atenção', color: CORES_RISCO_HEX.alto },
    { label: 'Crítico', color: CORES_RISCO_HEX.critico },
  ]

  return (
    <div className="dash-v3-section">
      <div className="dash-v3-section-header" style={{ marginBottom: 0 }}>
        <h2 className="dash-v3-section-title">3. Matriz desempenho × atenção</h2>
        {/* Inline legend */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-mid)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--text-lo)', marginLeft: 8 }}>
            <span style={{ fontSize: '0.6rem' }}>◯</span> tamanho = volume financeiro
          </div>
        </div>
      </div>

      <div className="dash-v3-matrix-container">
        <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          {/* Quadrant backgrounds */}
          <rect x={PADDING.left} y={PADDING.top} width={midX - PADDING.left} height={midY - PADDING.top} fill="rgba(239, 68, 68, 0.03)" />
          <rect x={midX} y={PADDING.top} width={WIDTH - PADDING.right - midX} height={midY - PADDING.top} fill="rgba(34, 197, 94, 0.04)" />
          <rect x={PADDING.left} y={midY} width={midX - PADDING.left} height={HEIGHT - PADDING.bottom - midY} fill="rgba(148, 163, 184, 0.03)" />
          <rect x={midX} y={midY} width={WIDTH - PADDING.right - midX} height={HEIGHT - PADDING.bottom - midY} fill="rgba(245, 158, 11, 0.03)" />

          {/* Quadrant labels */}
          {quadrants.map(q => (
            <text key={q.label} x={q.x} y={q.y} fill={q.color} fontSize="9" fontWeight="600" fontFamily="var(--sans)" opacity={0.8}>{q.label}</text>
          ))}

          {/* Threshold lines */}
          <line x1={midX} y1={PADDING.top} x2={midX} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" strokeDasharray="5 4" strokeWidth="0.8" />
          <line x1={PADDING.left} y1={midY} x2={WIDTH - PADDING.right} y2={midY} stroke="var(--border)" strokeDasharray="5 4" strokeWidth="0.8" />

          {/* X Axis */}
          <line x1={PADDING.left} y1={HEIGHT - PADDING.bottom} x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" />
          {Array.from({ length: Math.floor(rangeX / 10) + 1 }, (_, i) => minScoreX + i * 10).map(tick => (
            <text key={`x-${tick}`} x={PADDING.left + ((tick - minScoreX) / rangeX) * innerW} y={HEIGHT - PADDING.bottom + 16} fill="var(--text-lo)" fontSize="10" textAnchor="middle" fontFamily="var(--sans)">{tick}</text>
          ))}
          <text x={PADDING.left + innerW / 2} y={HEIGHT - 4} fill="var(--text-mid)" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="var(--sans)">Score geral</text>

          {/* Y Axis */}
          <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" />
          {yTicks.map(tick => {
            const yPos = PADDING.top + logScale(tick, minValor, maxValor, innerH)
            if (yPos > HEIGHT - PADDING.bottom || yPos < PADDING.top) return null
            return (
              <g key={`y-${tick}`}>
                <line x1={PADDING.left - 4} y1={yPos} x2={PADDING.left} y2={yPos} stroke="var(--border)" />
                <text x={PADDING.left - 8} y={yPos + 4} fill="var(--text-lo)" fontSize="9" textAnchor="end" fontFamily="var(--sans)">{fmtTick(tick)}</text>
              </g>
            )
          })}
          <text x={15} y={PADDING.top + innerH / 2} fill="var(--text-mid)" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="var(--sans)" transform={`rotate(-90 15 ${PADDING.top + innerH / 2})`}>Volume financeiro</text>

          {/* Bubbles */}
          {nodes.map(node => {
            const isHovered = hoveredNode?.cod_ibge === node.cod_ibge
            return (
              <circle
                key={node.cod_ibge}
                cx={node.cx}
                cy={node.cy}
                r={isHovered ? node.r + 2 : node.r}
                fill={node.color}
                fillOpacity={isHovered ? 1 : 0.65}
                stroke={isHovered ? 'var(--text-hi)' : '#fff'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                style={{ cursor: 'pointer', transition: 'r 0.15s, fill-opacity 0.15s' }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelect?.(node)}
              />
            )
          })}

          {/* Tooltip */}
          {hoveredNode && (() => {
            const tw = 170, th = 68
            let tx = hoveredNode.cx + hoveredNode.r + 8
            let ty = hoveredNode.cy - th / 2
            // Clamp to chart area
            if (tx + tw > WIDTH - PADDING.right) tx = hoveredNode.cx - hoveredNode.r - tw - 8
            if (ty < PADDING.top) ty = PADDING.top
            if (ty + th > HEIGHT - PADDING.bottom) ty = HEIGHT - PADDING.bottom - th

            return (
              <foreignObject x={tx} y={ty} width={tw} height={th} style={{ pointerEvents: 'none' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'var(--sans)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-hi)', marginBottom: 2 }}>{hoveredNode.ente}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-mid)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1px 8px' }}>
                    <span>Score:</span><span style={{ fontWeight: 600 }}>{hoveredNode.scoreNum.toFixed(1)}</span>
                    <span>Compras:</span><span style={{ fontWeight: 600 }}>{fmtValorHomologado(hoveredNode.valorNum)}</span>
                    <span>Registros:</span><span style={{ fontWeight: 600 }}>{hoveredNode.licitacoesNum}</span>
                  </div>
                </div>
              </foreignObject>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
