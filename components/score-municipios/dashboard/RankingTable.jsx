import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { COLUNAS_RANKING_V2, ITEMS_PER_PAGE, CORES_RISCO, LABEL_RISCO } from './constants'
import { corPorScore, normalizeClassificacao, contarPendenciasGraves, calcularRecomendacao, fmtValorHomologado, fmtPct } from './utils'

// Generates a clean page list like [1, 2, '…', 7, 8, 9] — no duplicates, no bugs
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set()
  pages.add(1)
  pages.add(total)

  // Window around current
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

export default function RankingTable({
  municipiosFiltrados,
  sortField,
  sortAsc,
  onSort,
  onSelect
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(municipiosFiltrados.length / ITEMS_PER_PAGE))

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [municipiosFiltrados.length])

  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const currentData = municipiosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const pageNumbers = getPageNumbers(safePage, totalPages)

  return (
    <div className="dash-v3-section" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="dash-v3-section-header" style={{ padding: '16px 20px 0' }}>
        <h2 className="dash-v3-section-title">4. Ranking municipal</h2>
      </div>

      <div className="dash-v3-table-wrapper" style={{ border: 'none', borderRadius: 0, marginTop: 12 }}>
        <table className="dash-v3-table">
          <thead>
            <tr>
              {COLUNAS_RANKING_V2.map((col) => (
                <th
                  key={col.key}
                  className={col.field ? 'sortable' : ''}
                  onClick={() => col.field && onSort(col.field)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {sortField === col.field && col.field && (
                      <span style={{ opacity: 0.6, fontSize: '0.8em' }}>{sortAsc ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((municipio, idx) => {
              const globalIndex = startIndex + idx + 1
              const risco = municipio.classificacao_canonica || normalizeClassificacao(municipio.classificacao)
              const corRisco = CORES_RISCO[risco] || 'var(--risk-nd)'
              const pendencias = contarPendenciasGraves(municipio)
              const rec = calcularRecomendacao(municipio)

              return (
                <tr key={municipio.cod_ibge} className="clickable" onClick={() => onSelect(municipio)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-lo)', fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right', flexShrink: 0 }}>{globalIndex}</span>
                      <span style={{ fontWeight: 600 }}>{municipio.ente}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: corPorScore(municipio.score), fontVariantNumeric: 'tabular-nums' }}>
                    {municipio.score != null ? Number(municipio.score).toFixed(1) : '-'}
                  </td>
                  <td>
                    <span style={{
                      color: corRisco,
                      border: `1px solid ${corRisco}`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: `${corRisco}10`,
                      whiteSpace: 'nowrap',
                    }}>
                      {LABEL_RISCO[risco]}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmtValorHomologado(municipio.valor_homologado_total)}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPct(Number(municipio.pct_dispensa) * 100, 0)}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                    {pendencias}
                  </td>
                  <td>
                    <span style={{ color: rec.cor, fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {rec.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-lo)' }}>
                  Nenhum município encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="dash-v3-pagination">
        <span>
          Mostrando {municipiosFiltrados.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, municipiosFiltrados.length)} de {municipiosFiltrados.length} municípios
        </span>

        {totalPages > 1 && (
          <div className="dash-v3-pagination-controls">
            <button className="dash-v3-page-btn" disabled={safePage === 1} onClick={() => handlePageChange(safePage - 1)}>
              <ChevronLeft size={14} />
            </button>

            {pageNumbers.map((item, idx) => {
              if (item === '…') {
                return <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-lo)', display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>…</span>
              }
              return (
                <button
                  key={item}
                  className={`dash-v3-page-btn ${safePage === item ? 'active' : ''}`}
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              )
            })}

            <button className="dash-v3-page-btn" disabled={safePage === totalPages} onClick={() => handlePageChange(safePage + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
