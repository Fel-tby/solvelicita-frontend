import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import ScoreAppShell from './ScoreAppShell'
import styles from './ScoreMunicipios.module.css'
import { fetchGeoJsonForUf, fetchMunicipiosByUf, getStateName, normalizeUf } from '../../lib/municipios'
import {
  normalizeText,
  normalizeClassificacao,
  contarPendenciasGraves,
  corPorScoreHex,
  mediana,
  fmtValorHomologado,
  temAtrasosFornecedores,
  temBloqueioSemAutonomia,
} from './dashboard/utils'
import FilterBar from './dashboard/FilterBar'
import KPIStrip from './dashboard/KPIStrip'
import AlertsSidebar from './dashboard/AlertsSidebar'
import ScoreHistogram from './dashboard/ScoreHistogram'
import RiskMatrix from './dashboard/RiskMatrix'
import RankingTable from './dashboard/RankingTable'
import MunicipioFicha from './dashboard/MunicipioFicha'

const MapaCoropletico = dynamic(() => import('../MapaCoropletico'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', fontSize: '0.85rem' }}>
      Carregando mapa...
    </div>
  ),
})

function enrichMunicipios(rows) {
  if (!rows?.length) return []
  return rows.map((item) => ({
    ...item,
    classificacao_canonica: item.classificacao_canonica || normalizeClassificacao(item.classificacao),
  }))
}

export default function ScoreDashboardPage({ uf }) {
  const normalizedUf = normalizeUf(uf)
  const ufName = getStateName(normalizedUf)

  const [municipios, setMunicipios] = useState([])
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
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

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setErro(null)
      try {
        const [rows, geo] = await Promise.all([
          fetchMunicipiosByUf(normalizedUf),
          fetchGeoJsonForUf(normalizedUf),
        ])
        if (!active) return
        setMunicipios(enrichMunicipios(rows))
        setGeoData(geo)
      } catch (error) {
        if (active) setErro(error.message || 'Erro ao carregar dados.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [normalizedUf])

  useEffect(() => {
    if (!municipioSelecionado) return
    const next = municipios.find((item) => item.cod_ibge === municipioSelecionado.cod_ibge) || null
    setMunicipioSelecionado(next)
  }, [municipios, municipioSelecionado])

  const limparFiltros = () => {
    setFiltros({
      classificacao: 'Todos',
      faixaScore: 'Todos',
      dispensa: 'Todos',
      pendencias: 'Todos',
      populacao: 'Todos',
      valor: 'Todos',
      sinal: 'Todos',
    })
    setBuscaInput('')
  }

  const handleSort = useCallback((field) => {
    if (sortField === field) setSortAsc((value) => !value)
    else {
      setSortField(field)
      setSortAsc(field !== 'score' && field !== 'valor_homologado_total')
    }
  }, [sortField])

  const municipiosFiltrados = useMemo(() => {
    let filtered = municipios || []

    if (buscaInput.trim()) {
      const query = normalizeText(buscaInput)
      filtered = filtered.filter((item) => normalizeText(item.ente).includes(query))
    }
    if (filtros.classificacao !== 'Todos') filtered = filtered.filter((item) => item.classificacao_canonica === filtros.classificacao)
    if (filtros.faixaScore !== 'Todos') {
      filtered = filtered.filter((item) => {
        const score = Number(item.score)
        if (Number.isNaN(score)) return false
        const map = {
          '90-100': score >= 90,
          '80-89': score >= 80 && score < 90,
          '70-79': score >= 70 && score < 80,
          '60-69': score >= 60 && score < 70,
          '50-59': score >= 50 && score < 60,
          '40-49': score >= 40 && score < 50,
          '<40': score < 40,
        }
        return map[filtros.faixaScore] ?? true
      })
    }
    if (filtros.dispensa !== 'Todos') {
      filtered = filtered.filter((item) => {
        const value = Number(item.pct_dispensa) * 100
        if (Number.isNaN(value)) return false
        const map = { '0-10': value <= 10, '10-30': value > 10 && value <= 30, '30-50': value > 30 && value <= 50, '>50': value > 50 }
        return map[filtros.dispensa] ?? true
      })
    }
    if (filtros.pendencias !== 'Todos') {
      filtered = filtered.filter((item) => {
        const graves = contarPendenciasGraves(item)
        const map = { '0': graves === 0, '1': graves === 1, '2+': graves >= 2 }
        return map[filtros.pendencias] ?? true
      })
    }
    if (filtros.populacao !== 'Todos') {
      filtered = filtered.filter((item) => {
        const value = Number(item.populacao)
        if (Number.isNaN(value)) return false
        const map = { '<10k': value <= 10000, '10k-50k': value > 10000 && value <= 50000, '50k-200k': value > 50000 && value <= 200000, '>200k': value > 200000 }
        return map[filtros.populacao] ?? true
      })
    }
    if (filtros.valor !== 'Todos') {
      filtered = filtered.filter((item) => {
        const value = Number(item.valor_homologado_total)
        if (Number.isNaN(value)) return false
        const map = { '<10mi': value <= 1e7, '10-100mi': value > 1e7 && value <= 1e8, '100mi-1bi': value > 1e8 && value <= 1e9, '>1bi': value > 1e9 }
        return map[filtros.valor] ?? true
      })
    }
    if (filtros.sinal !== 'Todos') {
      filtered = filtered.filter((item) => {
        if (filtros.sinal === 'critico') return item.classificacao_canonica === 'critico'
        if (filtros.sinal === 'atrasos') return temAtrasosFornecedores(item)
        if (filtros.sinal === 'bloqueio') return temBloqueioSemAutonomia(item)
        if (filtros.sinal === 'dispensa') return Boolean(item.alerta_dispensa)
        if (filtros.sinal === 'defasado') return Boolean(item.dado_defasado)
        if (filtros.sinal === 'pncp') return item.n_licitacoes == null || Number(item.n_licitacoes) === 0
        return true
      })
    }

    return [...filtered].sort((a, b) => {
      if (sortField === 'ente') {
        return sortAsc ? String(a.ente).localeCompare(String(b.ente)) : String(b.ente).localeCompare(String(a.ente))
      }
      const va = Number(a[sortField]) || 0
      const vb = Number(b[sortField]) || 0
      return sortAsc ? va - vb : vb - va
    })
  }, [municipios, buscaInput, filtros, sortField, sortAsc])

  const ibgesFiltrados = useMemo(() => new Set(municipiosFiltrados.map((item) => String(item.cod_ibge))), [municipiosFiltrados])
  const scoreMedio = useMemo(() => {
    const withScore = municipiosFiltrados.filter((item) => item.score != null && !Number.isNaN(Number(item.score)))
    return withScore.length ? withScore.reduce((acc, item) => acc + Number(item.score), 0) / withScore.length : null
  }, [municipiosFiltrados])
  const medianaEstado = useMemo(() => mediana((municipios || []).map((item) => item.score)), [municipios])
  const stats = useMemo(() => {
    let riscoAltoCritico = 0
    let valHomologado = 0
    let alertasDispensa = 0
    let semDados = 0
    let defasado = 0
    let critico = 0
    let atrasosFornecedores = 0
    let bloqueioSemAutonomia = 0

    municipiosFiltrados.forEach((item) => {
      const cls = item.classificacao_canonica
      if (cls === 'alto' || cls === 'critico') riscoAltoCritico += 1
      if (cls === 'critico') critico += 1
      valHomologado += Number(item.valor_homologado_total) || 0
      if (item.alerta_dispensa) alertasDispensa += 1
      if (item.n_licitacoes == null || Number(item.n_licitacoes) === 0) semDados += 1
      if (item.dado_defasado) defasado += 1
      if (temAtrasosFornecedores(item)) atrasosFornecedores += 1
      if (temBloqueioSemAutonomia(item)) bloqueioSemAutonomia += 1
    })

    return { riscoAltoCritico, valHomologado, alertasDispensa, semDados, defasado, critico, atrasosFornecedores, bloqueioSemAutonomia }
  }, [municipiosFiltrados])

  return (
    <ScoreAppShell
      title={`Municípios de ${ufName}`}
      description={`Mapa, score, indicadores públicos e ranking dos municípios de ${ufName}.`}
      path={`/score-municipios-brasil/${normalizedUf.toLowerCase()}`}
    >
      <div className={styles.dashboardWrap}>
        <header className={styles.dashboardHeader}>
          <div>
            <h1>Municípios de {ufName}</h1>
            <p>Mapa, score, alertas públicos e ranking das cidades do estado.</p>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>Carregando dados de {ufName}...</div>
        ) : erro ? (
          <div className={styles.loading}>{erro}</div>
        ) : (
          <>
            <FilterBar filtros={filtros} setFiltros={setFiltros} buscaInput={buscaInput} setBuscaInput={setBuscaInput} limparFiltros={limparFiltros} />

            <div className="dash-v3-content">
              <KPIStrip
                nMunicipios={municipiosFiltrados.length}
                scoreMedio={scoreMedio}
                nRiscoAltoCritico={stats.riscoAltoCritico}
                valorHomologado={fmtValorHomologado(stats.valHomologado)}
                nAlertasDispensa={stats.alertasDispensa}
                nSemDados={stats.semDados}
              />

              <div className="dash-v3-body">
                <div className="dash-v3-center-column">
                  <div className="dash-v3-split">
                    <div className="dash-v3-section" style={{ padding: 12 }}>
                      <h2 className="dash-v3-section-title" style={{ marginBottom: 8 }}>Mapa municipal por classificação</h2>
                      <div className="dash-v3-map-container">
                        {geoData ? (
                          <MapaCoropletico
                            geoData={geoData}
                            municipios={municipios}
                            ibgesFiltrados={ibgesFiltrados}
                            corPorScore={corPorScoreHex}
                            onSelect={setMunicipioSelecionado}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', fontSize: '0.85rem' }}>
                            Mapa indisponível para este estado.
                          </div>
                        )}
                      </div>
                    </div>
                    <ScoreHistogram municipios={municipiosFiltrados} medianaEstado={medianaEstado} />
                  </div>

                  <RiskMatrix municipios={municipiosFiltrados} onSelect={setMunicipioSelecionado} />
                  <RankingTable municipiosFiltrados={municipiosFiltrados} sortField={sortField} sortAsc={sortAsc} onSort={handleSort} onSelect={setMunicipioSelecionado} />
                </div>

                <div className="dash-v3-right-column">
                  <AlertsSidebar
                    nCritico={stats.critico}
                    nDispensa={stats.alertasDispensa}
                    nDefasado={stats.defasado}
                    nSemDados={stats.semDados}
                    nAtrasos={stats.atrasosFornecedores}
                    nBloqueioAutonomia={stats.bloqueioSemAutonomia}
                    applyFilter={(key, value) => setFiltros((prev) => ({ ...prev, [key]: value }))}
                  />
                  <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--text-lo)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-mid)' }}>Fontes:</strong> SICONFI, CAUC, PNCP e portais públicos.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {municipioSelecionado && (
        <div
          className="dash-drawer-overlay"
          onClick={(event) => { if (event.target === event.currentTarget) setMunicipioSelecionado(null) }}
        >
          <div className="dash-drawer-panel">
            <div className="dash-drawer-content">
              <MunicipioFicha municipio={municipioSelecionado} onClear={() => setMunicipioSelecionado(null)} />
            </div>
          </div>
        </div>
      )}
    </ScoreAppShell>
  )
}
