import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, Map, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react'
import SiteFooter from '../../components/SiteFooter'
import SiteLayout from '../../components/SiteLayout'
import { buildPageTitle } from '../../config/site'
import { buildStateDashboardSummaries, fetchMunicipiosLandingSummary } from '../../lib/municipios'

const REGIOES = [
  { id: 'nordeste', nome: 'Nordeste', ufs: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'] },
  { id: 'sudeste', nome: 'Sudeste', ufs: ['MG', 'SP', 'RJ', 'ES'] },
  { id: 'sul', nome: 'Sul', ufs: ['PR', 'SC', 'RS'] },
  { id: 'centro-oeste', nome: 'Centro-Oeste', ufs: ['MS', 'MT', 'GO', 'DF'] },
  { id: 'norte', nome: 'Norte', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'] },
]

const RISK_ORDER = ['baixo', 'medio', 'alto', 'critico', 'sem_dados']

const RISK_COLORS = {
  baixo: 'var(--risk-baixo)',
  medio: 'var(--risk-medio)',
  alto: 'var(--risk-alto)',
  critico: 'var(--risk-critico)',
  sem_dados: 'var(--risk-nd)',
}

const RISK_LABELS = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico',
  sem_dados: 'S/D',
}

function scoreColor(score) {
  if (score == null || Number.isNaN(Number(score))) return 'var(--risk-nd)'
  if (Number(score) >= 80) return 'var(--risk-baixo)'
  if (Number(score) >= 60) return 'var(--risk-medio)'
  if (Number(score) >= 40) return 'var(--risk-alto)'
  return 'var(--risk-critico)'
}

function fmtScore(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(1)
}

function fmtInt(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('pt-BR')
}

function fmtPct(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(0)}%`
}

export default function DadosPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchMunicipiosLandingSummary()
        if (!active) return
        setSummaries(buildStateDashboardSummaries(rows))
      } catch {
        if (active) setSummaries([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const byUf = useMemo(
    () => Object.fromEntries(summaries.map((s) => [s.uf, s])),
    [summaries],
  )

  const nacional = useMemo(() => {
    const withData = summaries.filter((s) => s.hasData)
    const totalMunicipios = withData.reduce((acc, s) => acc + (s.total || 0), 0)
    const totalBaixo = withData.reduce((acc, s) => acc + (s.baixo || 0), 0)
    const totalMedio = withData.reduce((acc, s) => acc + (s.medio || 0), 0)
    const totalAlto = withData.reduce((acc, s) => acc + (s.alto || 0), 0)
    const totalCritico = withData.reduce((acc, s) => acc + (s.critico || 0), 0)
    const totalSemDados = withData.reduce((acc, s) => acc + (s.sem_dados || 0), 0)
    const totalAll = totalBaixo + totalMedio + totalAlto + totalCritico + totalSemDados

    const statesComScore = withData.filter((s) => s.scoreMedio != null)
    const scoreMedioNacional = statesComScore.length
      ? statesComScore.reduce((acc, s) => acc + s.scoreMedio * (s.total || 1), 0) /
        statesComScore.reduce((acc, s) => acc + (s.total || 1), 0)
      : null

    return {
      totalMunicipios,
      estadosComDados: withData.length,
      scoreMedio: scoreMedioNacional,
      pctBaixo: totalAll ? (totalBaixo / totalAll) * 100 : 0,
      pctAltoCritico: totalAll ? ((totalAlto + totalCritico) / totalAll) * 100 : 0,
      baixo: totalBaixo,
      medio: totalMedio,
      alto: totalAlto,
      critico: totalCritico,
      sem_dados: totalSemDados,
      total: totalAll,
    }
  }, [summaries])

  const highlights = useMemo(() => {
    const withScore = summaries
      .filter((s) => s.hasData && s.scoreMedio != null)
      .sort((a, b) => b.scoreMedio - a.scoreMedio)

    return {
      top: withScore.slice(0, 5),
      bottom: withScore.slice(-5).reverse(),
      totalRanked: withScore.length,
    }
  }, [summaries])

  return (
    <SiteLayout
      title={buildPageTitle('Panorama Nacional de Risco Fiscal')}
      description="Explore a capacidade de pagamento de todas as prefeituras do Brasil. Acesse indicadores de liquidez, execução orçamentária e transparência por estado."
      activeNav="dados"
    >
      <section id="dados" className="section active">
        {/* Hero */}
        <div className="dados-hero">
          <h1 className="dados-hero-title">Panorama Nacional</h1>
          <p className="dados-hero-subtitle">
            {loading
              ? 'Carregando indicadores...'
              : `${fmtInt(nacional.totalMunicipios)} municípios em ${nacional.estadosComDados} estados · Score de solvência · Referência 2020–2026`}
          </p>
        </div>

        {/* KPIs */}
        {!loading && (
          <div className="dados-section">
            <div className="dados-kpis">
              <div className="dados-kpi-card">
                <Building2 className="dados-kpi-icon" size={28} />
                <div className="dados-kpi-value">{fmtInt(nacional.totalMunicipios)}</div>
                <div className="dados-kpi-label">{'municípios'}<br />{'analisados'}</div>
              </div>
              <div className="dados-kpi-card">
                <TrendingUp className="dados-kpi-icon" size={28} />
                <div className="dados-kpi-value" style={{ color: scoreColor(nacional.scoreMedio) }}>
                  {fmtScore(nacional.scoreMedio)}
                </div>
                <div className="dados-kpi-label">{'score médio'}<br />{'nacional'}</div>
              </div>
              <div className="dados-kpi-card">
                <Map className="dados-kpi-icon" size={28} />
                <div className="dados-kpi-value" style={{ color: 'var(--risk-baixo)' }}>
                  {fmtPct(nacional.pctBaixo)}
                </div>
                <div className="dados-kpi-label">{'municípios com'}<br />{'risco baixo'}</div>
              </div>
              <div className="dados-kpi-card">
                <AlertTriangle className="dados-kpi-icon" size={28} />
                <div className="dados-kpi-value" style={{ color: 'var(--risk-alto)' }}>
                  {fmtPct(nacional.pctAltoCritico)}
                </div>
                <div className="dados-kpi-label">{'risco alto'}<br />{'+ crítico'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Distribution */}
        {!loading && nacional.total > 0 && (
          <div className="dados-section">
            <h2 className="dados-section-title">Distribuição nacional por faixa de risco</h2>
            <div className="dados-dist-bar">
              {RISK_ORDER.map((risk) => {
                const value = nacional[risk] || 0
                if (value < 1) return null
                return (
                  <div
                    key={risk}
                    className="dados-dist-segment"
                    style={{ flex: value, background: RISK_COLORS[risk] }}
                    title={`${RISK_LABELS[risk]}: ${value}`}
                  />
                )
              })}
            </div>
            <div className="dados-dist-legend">
              {RISK_ORDER.map((risk) => {
                const value = nacional[risk] || 0
                const pct = nacional.total ? (value / nacional.total) * 100 : 0
                return (
                  <div key={risk} className="dados-dist-legend-item">
                    <span className="dados-dist-dot" style={{ background: RISK_COLORS[risk] }} />
                    <span className="dados-dist-legend-label">{RISK_LABELS[risk]}</span>
                    <span className="dados-dist-legend-value">{fmtInt(value)}</span>
                    <span className="dados-dist-legend-pct">{fmtPct(pct)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* States by Region */}
        <div className="dados-section">
          <h2 className="dados-section-title">Selecione um estado</h2>
          <p className="dados-section-subtitle">
            Clique em um estado para abrir o dashboard interativo com mapa, ranking e indicadores detalhados.
          </p>

          {REGIOES.map((regiao) => (
            <div key={regiao.id} className="dados-region">
              <h3 className="dados-region-title">{regiao.nome}</h3>
              <div className="dados-state-grid">
                {regiao.ufs.map((uf) => {
                  const summary = byUf[uf]
                  if (!summary) return null

                  const hasScore = summary.hasData && summary.scoreMedio != null
                  const total = summary.total || summary.municipios || 0

                  return (
                    <Link
                      key={uf}
                      href={`/dados/${uf.toLowerCase()}`}
                      className={`dados-state-card${!summary.hasData ? ' no-data' : ''}`}
                    >
                      <div className="dados-sc-header">
                        <div>
                          <div className="dados-sc-sigla">{uf}</div>
                          <div className="dados-sc-nome">{summary.nome}</div>
                        </div>
                        {hasScore && (
                          <div
                            className="dados-sc-score"
                            style={{ color: scoreColor(summary.scoreMedio) }}
                          >
                            {fmtScore(summary.scoreMedio)}
                          </div>
                        )}
                      </div>

                      {summary.hasData && total > 0 ? (
                        <div className="dados-sc-bar">
                          {RISK_ORDER.filter((r) => r !== 'sem_dados').map((risk) => (
                            <div
                              key={risk}
                              style={{
                                flex: Math.max(summary[risk] || 0, 0),
                                background: RISK_COLORS[risk],
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="dados-sc-bar empty" />
                      )}

                      <div className="dados-sc-footer">
                        <span className="dados-sc-mun">{fmtInt(total)} municípios</span>
                        <ArrowUpRight size={14} className="dados-sc-arrow" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Highlights */}
        {!loading && highlights.top.length > 0 && (
          <div className="dados-section">
            <h2 className="dados-section-title">Destaques por score médio</h2>
            <p className="dados-section-subtitle">
              Estados ranqueados pela média ponderada do score de solvência dos seus municípios.
            </p>
            <div className="dados-highlights">
              <div className="dados-hl-col">
                <div className="dados-hl-col-title" style={{ color: 'var(--risk-baixo)' }}>
                  Maiores scores
                </div>
                {highlights.top.map((s, i) => (
                  <Link key={s.uf} href={`/dados/${s.uf.toLowerCase()}`} className="dados-hl-row">
                    <span className="dados-hl-rank">{i + 1}</span>
                    <span className="dados-hl-name">{s.nome}</span>
                    <span className="dados-hl-uf">{s.uf}</span>
                    <span className="dados-hl-score" style={{ color: scoreColor(s.scoreMedio) }}>
                      {fmtScore(s.scoreMedio)}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="dados-hl-col">
                <div className="dados-hl-col-title" style={{ color: 'var(--risk-alto)' }}>
                  Menores scores
                </div>
                {highlights.bottom.map((s, i) => (
                  <Link key={s.uf} href={`/dados/${s.uf.toLowerCase()}`} className="dados-hl-row">
                    <span className="dados-hl-rank">{highlights.totalRanked - i}</span>
                    <span className="dados-hl-name">{s.nome}</span>
                    <span className="dados-hl-uf">{s.uf}</span>
                    <span className="dados-hl-score" style={{ color: scoreColor(s.scoreMedio) }}>
                      {fmtScore(s.scoreMedio)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <SiteFooter />
      </section>
    </SiteLayout>
  )
}
