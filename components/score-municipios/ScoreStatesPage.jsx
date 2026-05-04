import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ScoreAppShell from './ScoreAppShell'
import styles from './ScoreMunicipios.module.css'
import { buildStateDashboardSummaries, fetchMunicipiosLandingSummary } from '../../lib/municipios'

const REGIOES = [
  { id: 'nordeste', nome: 'Nordeste', ufs: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'] },
  { id: 'sudeste', nome: 'Sudeste', ufs: ['MG', 'SP', 'RJ', 'ES'] },
  { id: 'sul', nome: 'Sul', ufs: ['PR', 'SC', 'RS'] },
  { id: 'centro-oeste', nome: 'Centro-Oeste', ufs: ['MS', 'MT', 'GO', 'DF'] },
  { id: 'norte', nome: 'Norte', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'] },
]

function fmtInt(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR')
}

function fmtScore(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(1).replace('.', ',')
}

function scoreColor(score) {
  if (score == null || Number.isNaN(Number(score))) return '#64748b'
  if (Number(score) >= 80) return '#22c55e'
  if (Number(score) >= 60) return '#f59e0b'
  if (Number(score) >= 40) return '#ef4444'
  return '#b91c1c'
}

export default function ScoreStatesPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <ScoreAppShell
      title="Estados"
      description="Explore todos os estados brasileiros por região no Score Municípios Brasil."
      path="/score-municipios-brasil/estados"
    >
      <section className={styles.statesPage}>
        <div className={styles.statesHero}>
          <h1>Estados por região do Brasil</h1>
          <p>Abra o dashboard de cada UF para ver mapa municipal, rankings, filtros e indicadores de risco.</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando estados...</div>
        ) : (
          <div className={styles.regions}>
            {REGIOES.map((regiao) => (
              <section key={regiao.id} className={styles.region}>
                <h2>{regiao.nome}</h2>
                <div className={styles.stateGrid}>
                  {regiao.ufs.map((uf) => {
                    const summary = byUf[uf]
                    if (!summary) return null
                    const total = summary.total || summary.municipios || 0

                    return (
                      <Link key={uf} href={`/score-municipios-brasil/${uf.toLowerCase()}`} className={styles.stateCard}>
                        <div className={styles.stateTop}>
                          <div>
                            <div className={styles.uf}>{uf}</div>
                            <div className={styles.stateName}>{summary.nome}</div>
                          </div>
                          <div className={styles.stateScore} style={{ color: scoreColor(summary.scoreMedio) }}>
                            {fmtScore(summary.scoreMedio)}
                          </div>
                        </div>
                        <div className={styles.miniBar}>
                          {['baixo', 'medio', 'alto', 'critico'].map((risk) => (
                            <div
                              key={risk}
                              style={{
                                flex: Math.max(summary[risk] || 0, 0),
                                background: {
                                  baixo: '#22c55e',
                                  medio: '#f59e0b',
                                  alto: '#ef4444',
                                  critico: '#b91c1c',
                                }[risk],
                              }}
                            />
                          ))}
                        </div>
                        <div className={styles.stateFooter}>
                          <span>{fmtInt(total)} municípios</span>
                          <span>{fmtInt(summary.altoCritico || 0)} em atenção</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </ScoreAppShell>
  )
}
