import Link from 'next/link'
import { useMemo, useState, useEffect, useRef } from 'react'
import { BRAZIL_MAP_STATES, BRAZIL_MAP_VIEWBOX } from '../lib/brazilMapData'
import { UF_METADATA_BY_UF } from '../lib/siteData'

function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) return '--'
  return Number(value).toFixed(1).replace('.', ',')
}

function formatInt(value) {
  if (value == null || Number.isNaN(Number(value))) return '--'
  return Number(value).toLocaleString('pt-BR')
}

function buildDefaultSummary(state) {
  const meta = UF_METADATA_BY_UF[state.uf]

  return {
    uf: state.uf,
    nome: meta?.nome || state.name,
    municipios: meta?.municipios || 0,
    total: 0,
    baixo: 0,
    medio: 0,
    alto: 0,
    critico: 0,
    sem_dados: 0,
    altoCritico: 0,
    scoreMedio: null,
    hasData: false,
  }
}

export default function MapaBrasil({ stateSummaries = [], loading = false }) {
  const [selectedUf, setSelectedUf] = useState(null)
  const [hoveredUf, setHoveredUf] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0, isLeft: false })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.tagName.toLowerCase() === 'path') return;
      if (e.target.closest('.landing-state-card')) return;
      setSelectedUf(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const summariesByUf = useMemo(
    () => Object.fromEntries(stateSummaries.map((summary) => [summary.uf, summary])),
    [stateSummaries],
  )

  const states = useMemo(
    () =>
      BRAZIL_MAP_STATES.map((state) => ({
        ...state,
        summary: summariesByUf[state.uf] || buildDefaultSummary(state),
      })),
    [summariesByUf],
  )

  const activeState = states.find((state) => state.uf === selectedUf)

  return (
    <div className="landing-map-shell">
      <div className="landing-map-copy">
        <h2 className="landing-map-kicker" style={{ marginTop: 0 }}>SCORE CALCULADO PARA TODO BRASIL</h2>
      </div>

      <div className="landing-map-board">
        <div className="landing-map-panel" aria-label="Mapa do Brasil interativo">
          <svg
            className="brazil-map-svg interactive"
            viewBox={BRAZIL_MAP_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Mapa do Brasil com resumo por estado"
          >
            {states.map((state) => {
              const isSelected = state.uf === selectedUf
              const isHovered = state.uf === hoveredUf
              const stateClassName = [
                'landing-state',
                'is-available',
                (isSelected || isHovered) ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <path
                  key={state.uf}
                  d={state.d}
                  className={stateClassName}
                  data-uf={state.uf}
                  data-name={state.summary?.nome || state.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isSelected) {
                      setSelectedUf(null)
                    } else {
                      setSelectedUf(state.uf)
                      
                      const rect = e.currentTarget.getBoundingClientRect()
                      const board = e.currentTarget.closest('.landing-map-board').getBoundingClientRect()
                      
                      let left = rect.right - board.left + 15
                      let isLeft = false
                      
                      // Previne que o tooltip estoure a largura máxima da tela no lado direito
                      if (left + 310 > board.width) {
                        left = rect.left - board.left - 305
                        isLeft = true
                      }

                      const top = rect.top + (rect.height / 2) - board.top
                      setTooltipPos({ left, top, isLeft })
                    }
                  }}
                  onMouseEnter={() => setHoveredUf(state.uf)}
                  onMouseLeave={() => setHoveredUf(null)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Selecionar ${state.summary?.nome || state.name}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedUf(isSelected ? null : state.uf)
                    }
                  }}
                />
              )
            })}
          </svg>
        </div>

        {activeState && (
          <aside 
            key={activeState.uf} 
            className="landing-state-card"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
            data-align-left={tooltipPos.isLeft}
          >
            <div className="landing-state-card-pointer" aria-hidden="true" />
            <div className="landing-state-card-head">
              <div>
                <div className="landing-state-card-title">
                  {activeState.summary?.nome || activeState.name}
                </div>
                <div className="landing-state-card-status">
                  {loading ? 'Carregando indicadores...' : 'Base disponível'}
                </div>
              </div>
              <span className="landing-state-card-uf">{activeState.uf}</span>
            </div>

            <div className="landing-state-card-grid">
              <div className="landing-state-metric">
                <strong>{formatInt(activeState.summary?.total || activeState.summary?.municipios)}</strong>
                <span>municípios</span>
              </div>
              <div className="landing-state-metric">
                <strong>{formatScore(activeState.summary?.scoreMedio)}</strong>
                <span>score médio</span>
              </div>
              <div className="landing-state-metric">
                <strong>{formatInt(activeState.summary?.baixo)}</strong>
                <span>baixo risco</span>
              </div>
              <div className="landing-state-metric danger">
                <strong>{formatInt(activeState.summary?.altoCritico)}</strong>
                <span>alto + crítico</span>
              </div>
            </div>

            <Link
              className="landing-state-card-link"
              href={`/dados/${activeState.uf.toLowerCase()}`}
            >
              Abrir dashboard →
            </Link>
          </aside>
        )}
      </div>
    </div>
  )
}

