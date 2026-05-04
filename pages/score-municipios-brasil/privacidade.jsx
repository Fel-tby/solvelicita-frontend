import ScoreAppShell from '../../components/score-municipios/ScoreAppShell'
import styles from '../../components/score-municipios/ScoreMunicipios.module.css'

export default function ScoreMunicipiosPrivacidadePage() {
  return (
    <ScoreAppShell
      title="Privacidade"
      description="Política de privacidade do Score Municípios Brasil."
      path="/score-municipios-brasil/privacidade"
    >
      <section className={styles.dashboardWrap}>
        <header className={styles.dashboardHeader}>
          <div>
            <h1>Privacidade</h1>
            <p>Informações sobre dados, uso e contato do Score Municípios Brasil.</p>
          </div>
        </header>

        <div className="dash-v3-section" style={{ maxWidth: 860, lineHeight: 1.7, color: '#334155' }}>
          <p>
            O Score Municípios Brasil é um painel gratuito da SolveLicita baseado em dados públicos federais,
            como SICONFI, CAUC, PNCP e portais públicos. O app não solicita cadastro para consulta do painel.
          </p>
          <p>
            Podemos usar métricas técnicas agregadas para entender funcionamento, estabilidade e navegação do app,
            sem vender dados pessoais. Quando houver links para a SolveLicita, a navegação passa a seguir as políticas
            aplicáveis ao site principal da empresa.
          </p>
          <p>
            Solicitações sobre privacidade podem ser enviadas pelo site oficial da SolveLicita em
            {' '}
            <a href="https://www.solvelicita.tech" target="_blank" rel="noreferrer">www.solvelicita.tech</a>.
          </p>
        </div>
      </section>
    </ScoreAppShell>
  )
}
