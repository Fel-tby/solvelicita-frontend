import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { fetchGeoJsonForUf, fetchMunicipiosByUf, getStateName, normalizeUf } from '../lib/municipios'

import { normalizeText, normalizeClassificacao, contarPendenciasGraves, corPorScoreHex, mediana, fmtValorHomologado, temAtrasosFornecedores, temBloqueioSemAutonomia } from './dashboard/utils'
import DashboardSidebar from './dashboard/DashboardSidebar'
import FilterBar from './dashboard/FilterBar'
import KPIStrip from './dashboard/KPIStrip'
import AlertsSidebar from './dashboard/AlertsSidebar'
import ScoreHistogram from './dashboard/ScoreHistogram'
import RiskMatrix from './dashboard/RiskMatrix'
import RankingTable from './dashboard/RankingTable'
import MunicipioFicha from './dashboard/MunicipioFicha'

const MapaCoropletico = dynamic(() => import('./MapaCoropletico'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', fontSize: '0.85rem' }}>
      Carregando mapa…
    </div>
  ),
})

// Enrich raw rows with classificacao_canonica
function enrichMunicipios(rows) {
  if (!rows?.length) return []
  return rows.map((item) => ({
    ...item,
    classificacao_canonica: item.classificacao_canonica || normalizeClassificacao(item.classificacao),
  }))
}

export default function DashboardPage({ uf, initialMunicipios = [] }) {
  const normalizedUf = normalizeUf(uf)
  const ufName = getStateName(normalizedUf)

  // Enrich immediately so SSR data also has classificacao_canonica
  const [municipios, setMunicipios] = useState(() => enrichMunicipios(initialMunicipios))
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return !initialMunicipios?.length
    return true
  })
  const [erro, setErro] = useState(null)

  // UI state
  const [municipioSelecionado, setMunicipioSelecionado] = useState(null)
  const [buscaInput, setBuscaInput] = useState('')
  const [sortField, setSortField] = useState('score')
  const [sortAsc, setSortAsc] = useState(false)
  const [filtros, setFiltros] = useState({
    classificacao: 'Todos',
    faixaScore: 'Todos',
    dispensa: 'Todos',
    pendencias: 'Todos',
    populacao: 'Todos',
    valor: 'Todos',
    sinal: 'Todos',
  })

  // Data fetching
  useEffect(() => {
    let ativo = true
    async function carregar() {
      const temMunicipios = municipios?.length && normalizedUf === municipios[0]?.uf
      if (!temMunicipios) setLoading(true)
      setErro(null)
      try {
        const promises = [fetchMunicipiosByUf(normalizedUf)]
        if (!geoData || normalizedUf !== geoData.uf_ref) {
          promises.push(fetchGeoJsonForUf(normalizedUf))
        }
        const [rows, geo] = await Promise.all(promises)
        if (!ativo) return
        setMunicipios(enrichMunicipios(rows))
        if (geo) setGeoData({ ...geo, uf_ref: normalizedUf })
      } catch (error) {
        if (ativo) setErro(error.message || 'Erro ao carregar dados.')
      } finally {
        if (ativo) setLoading(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [normalizedUf])

  useEffect(() => {
    if (!municipioSelecionado) return
    const proximo = municipios.find((m) => m.cod_ibge === municipioSelecionado.cod_ibge) || null
    setMunicipioSelecionado(proximo)
  }, [municipios])

  // Handlers
  const limparFiltros = () => {
    setFiltros({ classificacao: 'Todos', faixaScore: 'Todos', dispensa: 'Todos', pendencias: 'Todos', populacao: 'Todos', valor: 'Todos', sinal: 'Todos' })
    setBuscaInput('')
  }

  const handleSort = useCallback((field) => {
    if (sortField === field) setSortAsc((v) => !v)
    else { setSortField(field); setSortAsc(field !== 'score' && field !== 'valor_homologado_total') }
  }, [sortField])

  const handleSelectMunicipio = useCallback((mun) => setMunicipioSelecionado(mun), [])

  // Filtering
  const municipiosFiltrados = useMemo(() => {
    let f = municipios || []
    if (buscaInput.trim()) { const q = normalizeText(buscaInput); f = f.filter(m => normalizeText(m.ente).includes(q)) }
    if (filtros.classificacao !== 'Todos') f = f.filter(m => m.classificacao_canonica === filtros.classificacao)
    if (filtros.faixaScore !== 'Todos') {
      f = f.filter(m => {
        const s = Number(m.score); if (Number.isNaN(s)) return false
        const map = { '90-100': s>=90, '80-89': s>=80&&s<90, '70-79': s>=70&&s<80, '60-69': s>=60&&s<70, '50-59': s>=50&&s<60, '40-49': s>=40&&s<50, '<40': s<40 }
        return map[filtros.faixaScore] ?? true
      })
    }
    if (filtros.dispensa !== 'Todos') {
      f = f.filter(m => {
        const d = Number(m.pct_dispensa)*100; if (Number.isNaN(d)) return false
        const map = { '0-10': d<=10, '10-30': d>10&&d<=30, '30-50': d>30&&d<=50, '>50': d>50 }
        return map[filtros.dispensa] ?? true
      })
    }
    if (filtros.pendencias !== 'Todos') {
      f = f.filter(m => {
        const g = contarPendenciasGraves(m)
        const map = { '0': g===0, '1': g===1, '2+': g>=2 }
        return map[filtros.pendencias] ?? true
      })
    }
    if (filtros.populacao !== 'Todos') {
      f = f.filter(m => {
        const p = Number(m.populacao); if (Number.isNaN(p)) return false
        const map = { '<10k': p<=10000, '10k-50k': p>10000&&p<=50000, '50k-200k': p>50000&&p<=200000, '>200k': p>200000 }
        return map[filtros.populacao] ?? true
      })
    }
    if (filtros.valor !== 'Todos') {
      f = f.filter(m => {
        const v = Number(m.valor_homologado_total); if (Number.isNaN(v)) return false
        const map = { '<10mi': v<=1e7, '10-100mi': v>1e7&&v<=1e8, '100mi-1bi': v>1e8&&v<=1e9, '>1bi': v>1e9 }
        return map[filtros.valor] ?? true
      })
    }
    if (filtros.sinal !== 'Todos') {
      f = f.filter(m => {
        if (filtros.sinal === 'critico') return m.classificacao_canonica === 'critico'
        if (filtros.sinal === 'atrasos') return temAtrasosFornecedores(m)
        if (filtros.sinal === 'bloqueio') return temBloqueioSemAutonomia(m)
        if (filtros.sinal === 'dispensa') return Boolean(m.alerta_dispensa)
        if (filtros.sinal === 'defasado') return Boolean(m.dado_defasado)
        if (filtros.sinal === 'pncp') return m.n_licitacoes == null || Number(m.n_licitacoes) === 0
        return true
      })
    }
    return [...f].sort((a, b) => {
      if (sortField === 'ente') return sortAsc ? String(a.ente).localeCompare(String(b.ente)) : String(b.ente).localeCompare(String(a.ente))
      const va = Number(a[sortField]) || 0, vb = Number(b[sortField]) || 0
      return sortAsc ? va - vb : vb - va
    })
  }, [municipios, buscaInput, filtros, sortField, sortAsc])

  // Derived
  const ibgesFiltrados = useMemo(() => new Set(municipiosFiltrados.map(m => String(m.cod_ibge))), [municipiosFiltrados])
  const scoreMedio = useMemo(() => {
    const c = municipiosFiltrados.filter(m => m.score != null && !Number.isNaN(Number(m.score)))
    return c.length ? c.reduce((a, m) => a + Number(m.score), 0) / c.length : null
  }, [municipiosFiltrados])
  const stats = useMemo(() => {
    let riscoAltoCritico=0, valHomologado=0, alertasDispensa=0, semDados=0, defasado=0, critico=0, atrasosFornecedores=0, bloqueioSemAutonomia=0
    municipiosFiltrados.forEach(m => {
      const cls = m.classificacao_canonica
      if (cls === 'alto' || cls === 'critico') riscoAltoCritico++
      if (cls === 'critico') critico++
      valHomologado += Number(m.valor_homologado_total) || 0
      if (m.alerta_dispensa) alertasDispensa++
      if (m.n_licitacoes == null || Number(m.n_licitacoes) === 0) semDados++
      if (m.dado_defasado) defasado++
      if (temAtrasosFornecedores(m)) atrasosFornecedores++
      if (temBloqueioSemAutonomia(m)) bloqueioSemAutonomia++
    })
    return { riscoAltoCritico, valHomologado, alertasDispensa, semDados, defasado, critico, atrasosFornecedores, bloqueioSemAutonomia }
  }, [municipiosFiltrados])
  const medianaEstado = useMemo(() => mediana((municipios || []).map(m => m.score)), [municipios])

  // Loading/Error
  if (loading && !municipios?.length) {
    return (
      <div className="dash-v3-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-lo)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Carregando dados de {ufName}…</div>
        </div>
      </div>
    )
  }
  if (erro) {
    return (
      <div className="dash-v3-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--risk-alto)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Erro ao carregar dados</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-lo)' }}>{erro}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-v3-layout">
      <DashboardSidebar />

      <main className="dash-v3-main">
        {/* Header */}
        <header className="dash-v3-header">
          <div className="dash-v3-title-area">
            <h1>Inteligência de Risco para Fornecedores</h1>
            <p>Municípios de {ufName} • Score de Confiabilidade do Comprador Público</p>
          </div>
          <div className="dash-v3-header-actions">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-lo)' }}>Referência: 2020–2026</span>
            <button className="dash-v3-btn-outline"><Download size={14} /> Exportar</button>
            <button className="dash-v3-btn-primary"><Share2 size={14} /> Compartilhar</button>
          </div>
        </header>

        {/* Filters */}
        <FilterBar filtros={filtros} setFiltros={setFiltros} buscaInput={buscaInput} setBuscaInput={setBuscaInput} limparFiltros={limparFiltros} />

        {/* Content */}
        <div className="dash-v3-content">
          {/* KPIs — full width above body */}
          <KPIStrip
            nMunicipios={municipiosFiltrados.length}
            scoreMedio={scoreMedio}
            nRiscoAltoCritico={stats.riscoAltoCritico}
            valorHomologado={fmtValorHomologado(stats.valHomologado)}
            nAlertasDispensa={stats.alertasDispensa}
            nSemDados={stats.semDados}
          />

          {/* Body: center column + right alerts */}
          <div className="dash-v3-body">
            <div className="dash-v3-center-column">
              {/* Map + Histogram */}
              <div className="dash-v3-split">
                <div className="dash-v3-section" style={{ padding: 12 }}>
                  <h2 className="dash-v3-section-title" style={{ marginBottom: 8 }}>1. Mapa de risco por município</h2>
                  <div className="dash-v3-map-container">
                    {geoData ? (
                      <MapaCoropletico geoData={geoData} municipios={municipios} ibgesFiltrados={ibgesFiltrados} corPorScore={corPorScoreHex} onSelect={handleSelectMunicipio} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', fontSize: '0.85rem' }}>Carregando mapa…</div>
                    )}
                  </div>
                </div>
                <ScoreHistogram municipios={municipiosFiltrados} medianaEstado={medianaEstado} />
              </div>

              {/* Risk Matrix */}
              <RiskMatrix municipios={municipiosFiltrados} onSelect={handleSelectMunicipio} />

              {/* Ranking */}
              <RankingTable municipiosFiltrados={municipiosFiltrados} sortField={sortField} sortAsc={sortAsc} onSort={handleSort} onSelect={handleSelectMunicipio} />
            </div>

            {/* Right: Alerts */}
            <div className="dash-v3-right-column">
              <AlertsSidebar nCritico={stats.critico} nDispensa={stats.alertasDispensa} nDefasado={stats.defasado} nSemDados={stats.semDados} nAtrasos={stats.atrasosFornecedores} nBloqueioAutonomia={stats.bloqueioSemAutonomia} applyFilter={(key, value) => setFiltros(prev => ({ ...prev, [key]: value }))} />
              <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--text-lo)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-mid)' }}>Fontes:</strong> SICONFI, CAUC, PNCP, Portal da Transparência.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Municipality Drawer */}
      {municipioSelecionado && (
        <div
          className="dash-drawer-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setMunicipioSelecionado(null) }}
        >
          <div className="dash-drawer-panel">
            <div className="dash-drawer-content">
              <MunicipioFicha municipio={municipioSelecionado} onClear={() => setMunicipioSelecionado(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
