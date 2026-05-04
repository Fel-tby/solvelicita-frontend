import Link from 'next/link'
import { BRAZIL_MAP_STATES, BRAZIL_MAP_VIEWBOX } from './brazilMapData'

function colorByScore(score) {
  if (score == null || Number.isNaN(Number(score))) return '#cbd5e1'
  if (Number(score) >= 80) return '#22c55e'
  if (Number(score) >= 60) return '#f59e0b'
  if (Number(score) >= 40) return '#ef4444'
  return '#991b1b'
}

export default function BrazilUfMap({ summariesByUf = {}, className }) {
  return (
    <svg className={className} viewBox={BRAZIL_MAP_VIEWBOX} role="img" aria-label="Mapa do Brasil por estado">
      <defs>
        <filter id="scoreMapShadow" x="-16%" y="-16%" width="132%" height="132%">
          <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#64748b" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter="url(#scoreMapShadow)">
        {BRAZIL_MAP_STATES.map((state) => {
          const summary = summariesByUf[state.uf]
          const fill = colorByScore(summary?.scoreMedio)
          const label = `${state.name}: ${summary?.scoreMedio != null ? Number(summary.scoreMedio).toFixed(1).replace('.', ',') : 'sem dados'}`

          return (
            <Link key={state.uf} href={`/score-municipios-brasil/${state.uf.toLowerCase()}`} aria-label={`Abrir ${label}`}>
              <path
                d={state.d}
                fill={fill}
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinejoin="round"
                className="score-map-state"
              >
                <title>{label}</title>
              </path>
            </Link>
          )
        })}
      </g>
    </svg>
  )
}
