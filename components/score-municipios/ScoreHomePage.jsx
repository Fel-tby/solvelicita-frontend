import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronRight,
  FileBarChart2,
  Info,
  Map,
  Search,
  Trophy,
  TrendingUp,
} from 'lucide-react'
import ScoreAppShell from './ScoreAppShell'
import BrazilUfMap from './BrazilUfMap'
import styles from './ScoreMunicipios.module.css'
import { buildStateDashboardSummaries, fetchMunicipiosLandingSummary } from '../../lib/municipios'
import { UF_METADATA } from '../../lib/siteData'

const REGIOES = [
  { id: 'nordeste', nome: 'Nordeste', ufs: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'] },
  { id: 'sudeste', nome: 'Sudeste', ufs: ['MG', 'SP', 'RJ', 'ES'] },
  { id: 'sul', nome: 'Sul', ufs: ['PR', 'SC', 'RS'] },
  { id: 'centro-oeste', nome: 'Centro-Oeste', ufs: ['MS', 'MT', 'GO', 'DF'] },
  { id: 'norte', nome: 'Norte', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'] },
]

const RISK_ORDER = ['baixo', 'medio', 'alto', 'critico', 'sem_dados']
const RISK_COLORS = {
  baixo: '#22c55e',
  medio: '#f59e0b',
  alto: '#ef4444',
  critico: '#991b1b',
  sem_dados: '#94a3b8',
}
const RISK_LABELS = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico',
  sem_dados: 'Sem dados',
}

function fmtInt(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR')
}

function fmtScore(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(1).replace('.', ',')
}

function fmtPct(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(0)}%`
}

function scoreColor(score) {
  if (score == null || Number.isNaN(Number(score))) return RISK_COLORS.sem_dados
  if (Number(score) >= 80) return RISK_COLORS.baixo
  if (Number(score) >= 60) return RISK_COLORS.medio
  if (Number(score) >= 40) return RISK_COLORS.alto
  return RISK_COLORS.critico
}

const FEATURED_UFS = ['PB', 'PE', 'MG', 'SP', 'PR', 'ES', 'GO', 'PA', 'RO']
export default function ScoreHomePage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchMunicipiosLandingSummary()
        if (active) setSummaries(buildStateDashboardSummaries(rows))
      } catch {
        if (active) setSummaries([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const byUf = useMemo(() => Object.fromEntries(summaries.map((item) => [item.uf, item])), [summaries])

  const nacional = useMemo(() => {
    const withData = summaries.filter((item) => item.hasData)
    const totalMunicipios = withData.reduce((acc, item) => acc + (item.total || 0), 0)
    const totalBaixo = withData.reduce((acc, item) => acc + (item.baixo || 0), 0)
    const totalMedio = withData.reduce((acc, item) => acc + (item.medio || 0), 0)
    const totalAlto = withData.reduce((acc, item) => acc + (item.alto || 0), 0)
    const totalCritico = withData.reduce((acc, item) => acc + (item.critico || 0), 0)
    const totalSemDados = withData.reduce((acc, item) => acc + (item.sem_dados || 0), 0)
    const total = totalBaixo + totalMedio + totalAlto + totalCritico + totalSemDados
    const statesComScore = withData.filter((item) => item.scoreMedio != null)
    const scoreMedio = statesComScore.length
      ? statesComScore.reduce((acc, item) => acc + item.scoreMedio * (item.total || 1), 0) /
        statesComScore.reduce((acc, item) => acc + (item.total || 1), 0)
      : null

    return {
      totalMunicipios,
      estadosComDados: withData.length,
      scoreMedio,
      baixo: totalBaixo,
      medio: totalMedio,
      alto: totalAlto,
      critico: totalCritico,
      sem_dados: totalSemDados,
      total,
      pctBaixo: total ? (totalBaixo / total) * 100 : 0,
      pctAltoCritico: total ? ((totalAlto + totalCritico) / total) * 100 : 0,
    }
  }, [summaries])

  const featuredStates = useMemo(() => {
    const fallback = summaries.filter((item) => item.hasData).slice(0, 9)
    return FEATURED_UFS.map((uf) => byUf[uf]).filter(Boolean)
      .concat(fallback)
      .filter((item, index, arr) => arr.findIndex((candidate) => candidate.uf === item.uf) === index)
      .slice(0, 9)
  }, [byUf, summaries])

  const highlights = useMemo(() => {
    const ranked = summaries
      .filter((item) => item.hasData && item.scoreMedio != null)
      .sort((a, b) => b.scoreMedio - a.scoreMedio)

    return {
      bestScore: ranked[0],
      lowestScore: ranked[ranked.length - 1],
      attentionShare: [...ranked].sort((a, b) => {
        const bp = b.total ? (b.altoCritico || 0) / b.total : 0
        const ap = a.total ? (a.altoCritico || 0) / a.total : 0
        return bp - ap
      })[0],
      bestCoverage: [...ranked].sort((a, b) => (b.coverageRatio || 0) - (a.coverageRatio || 0))[0],
      mostMunicipios: [...ranked].sort((a, b) => (b.total || 0) - (a.total || 0))[0],
      leastMunicipios: ranked.filter((item) => item.uf !== 'DF').sort((a, b) => (a.total || 0) - (b.total || 0))[0],
    }
  }, [summaries])

  const searchMatches = useMemo(() => {
    const query = searchTerm
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (!query) return []

    return UF_METADATA
      .filter((state) => {
        const uf = state.uf.toLowerCase()
        const name = state.nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
        return uf.includes(query) || name.includes(query)
      })
      .slice(0, 6)
  }, [searchTerm])

  return (
    <ScoreAppShell path="/score-municipios-brasil">
      {loading ? (
        <div className={styles.loading}>
          <div>
            <strong>Carregando painel nacional</strong>
            <p>Cruzando scores e classificações dos municípios brasileiros.</p>
          </div>
        </div>
      ) : (
        <div className={styles.desktopBoard}>
          <section className={styles.boardIntro}>
            <div>
              <h1>Selecione um recorte para explorar o Brasil municipal</h1>
              <p>Compare cidades, estados e regiões com base em score de gestão, transparência, compras públicas e risco fiscal.</p>
            </div>

            <div className={styles.searchArea}>
              <div className={styles.searchBox}>
                <Search size={22} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar UF ou estado"
                  aria-label="Buscar UF ou estado"
                />
              </div>
              {searchMatches.length > 0 && (
                <div className={styles.searchResults}>
                  {searchMatches.map((state) => {
                    const summary = byUf[state.uf]
                    return (
                      <Link
                        key={state.uf}
                        href={`/score-municipios-brasil/${state.uf.toLowerCase()}`}
                        className={styles.searchResult}
                      >
                        <span>{state.uf}</span>
                        <strong>{state.nome}</strong>
                        <small>{summary?.scoreMedio != null ? `Score médio ${fmtScore(summary.scoreMedio)}` : 'Abrir dashboard'}</small>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <section className={styles.boardKpis}>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.blueIcon}`}><Building2 size={30} /></span>
              <div><strong>{fmtInt(nacional.totalMunicipios)}</strong><span>municípios analisados</span><small>100% do território nacional</small></div>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.purpleIcon}`}><TrendingUp size={30} /></span>
              <div><strong>{fmtScore(nacional.scoreMedio)}</strong><span>score médio nacional</span><small>em uma escala de 0 a 100</small></div>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.greenIcon}`}><Map size={30} /></span>
              <div><strong>27</strong><span>unidades federativas</span><small>26 estados + DF</small></div>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.orangeIcon}`}><AlertTriangle size={30} /></span>
              <div><strong>{fmtPct(nacional.pctAltoCritico)}</strong><span>cidades em atenção</span><small>em risco alto ou crítico</small></div>
            </div>
          </section>

          <section className={styles.boardGrid}>
            <article className={`${styles.panel} ${styles.mapPanel}`}>
              <div className={styles.panelTitle}>
                <h2>Mapa do Brasil por classificação</h2>
                <Info size={16} />
              </div>
              <div className={styles.mapBody}>
                <div className={styles.mapLegend}>
                  <span><i style={{ background: RISK_COLORS.baixo }} /> Alto desempenho</span>
                  <span><i style={{ background: RISK_COLORS.medio }} /> Estável</span>
                  <span><i style={{ background: RISK_COLORS.alto }} /> Atenção</span>
                  <span><i style={{ background: RISK_COLORS.critico }} /> Crítico</span>
                  <span><i style={{ background: RISK_COLORS.sem_dados }} /> Sem dados</span>
                </div>
                <BrazilUfMap summariesByUf={byUf} className={styles.brazilMap} />
              </div>
              <div className={styles.distribution}>
                <span>Distribuição nacional</span>
                <div className={styles.distBar} aria-label="Distribuição nacional por faixa de risco">
                  {RISK_ORDER.map((risk) => {
                    const value = nacional[risk] || 0
                    if (!value) return null
                    return <div key={risk} style={{ flex: value, background: RISK_COLORS[risk] }} />
                  })}
                </div>
                <div className={styles.distLabels}>
                  <span>{fmtPct(nacional.total ? (nacional.baixo / nacional.total) * 100 : 0)}</span>
                  <span>{fmtPct(nacional.total ? (nacional.medio / nacional.total) * 100 : 0)}</span>
                  <span>{fmtPct(nacional.total ? (nacional.alto / nacional.total) * 100 : 0)}</span>
                  <span>{fmtPct(nacional.total ? (nacional.critico / nacional.total) * 100 : 0)}</span>
                  <span>{fmtPct(nacional.total ? (nacional.sem_dados / nacional.total) * 100 : 0)}</span>
                </div>
              </div>
            </article>

            <article className={`${styles.panel} ${styles.statesPanel}`}>
              <div className={styles.panelTitle}>
                <h2>Explorar por estado</h2>
              </div>
              <div className={styles.compactStates}>
                {featuredStates.map((summary) => (
                  <Link key={summary.uf} href={`/score-municipios-brasil/${summary.uf.toLowerCase()}`} className={styles.compactState}>
                    <div>
                      <strong>{summary.uf}</strong>
                      <span>{summary.nome}</span>
                    </div>
                    <b style={{ color: scoreColor(summary.scoreMedio) }}>{fmtScore(summary.scoreMedio)}</b>
                    <div className={styles.scoreLine}>
                      <i style={{ width: `${Math.max(8, Math.min(100, Number(summary.scoreMedio) || 0))}%`, background: scoreColor(summary.scoreMedio) }} />
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/score-municipios-brasil/pb" className={styles.viewAll}>Ver todos os estados <ChevronRight size={16} /></Link>
            </article>

            <article className={`${styles.panel} ${styles.rankPanel}`}>
              <div className={styles.panelTitle}>
                <h2>Top rankings rápidos</h2>
              </div>
              <div className={styles.rankGrid}>
                <Link href={highlights.bestScore ? `/score-municipios-brasil/${highlights.bestScore.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.greenIcon}>1</span>
                  <div><strong>Maior score médio</strong><small>{highlights.bestScore ? `${highlights.bestScore.nome} · ${fmtScore(highlights.bestScore.scoreMedio)}` : 'Estados com maior score'}</small></div>
                </Link>
                <Link href={highlights.lowestScore ? `/score-municipios-brasil/${highlights.lowestScore.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.orangeIcon}><AlertTriangle size={18} /></span>
                  <div><strong>Menor score médio</strong><small>{highlights.lowestScore ? `${highlights.lowestScore.nome} · ${fmtScore(highlights.lowestScore.scoreMedio)}` : 'Estados com menor score'}</small></div>
                </Link>
                <Link href={highlights.attentionShare ? `/score-municipios-brasil/${highlights.attentionShare.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.purpleIcon}><BarChart3 size={18} /></span>
                  <div><strong>Maior % em atenção</strong><small>{highlights.attentionShare ? `${highlights.attentionShare.nome} · ${fmtPct(highlights.attentionShare.total ? ((highlights.attentionShare.altoCritico || 0) / highlights.attentionShare.total) * 100 : 0)}` : 'Risco alto ou crítico'}</small></div>
                </Link>
                <Link href={highlights.bestCoverage ? `/score-municipios-brasil/${highlights.bestCoverage.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.blueIcon}><FileBarChart2 size={18} /></span>
                  <div><strong>Maior cobertura</strong><small>{highlights.bestCoverage ? `${highlights.bestCoverage.nome} · ${fmtPct((highlights.bestCoverage.coverageRatio || 0) * 100)}` : 'Cobertura de municípios'}</small></div>
                </Link>
                <Link href={highlights.mostMunicipios ? `/score-municipios-brasil/${highlights.mostMunicipios.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.greenIcon}><TrendingUp size={18} /></span>
                  <div><strong>Mais municípios</strong><small>{highlights.mostMunicipios ? `${highlights.mostMunicipios.nome} · ${fmtInt(highlights.mostMunicipios.total)}` : 'Maior base analisada'}</small></div>
                </Link>
                <Link href={highlights.leastMunicipios ? `/score-municipios-brasil/${highlights.leastMunicipios.uf.toLowerCase()}` : '/score-municipios-brasil'} className={styles.rankItem}>
                  <span className={styles.blueIcon}><Building2 size={18} /></span>
                  <div><strong>Menos municípios</strong><small>{highlights.leastMunicipios ? `${highlights.leastMunicipios.nome} · ${fmtInt(highlights.leastMunicipios.total)}` : 'Menor base analisada'}</small></div>
                </Link>
              </div>
            </article>
          </section>
        </div>
      )}
    </ScoreAppShell>
  )
}
