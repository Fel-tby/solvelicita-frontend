import Link from 'next/link'
import AboutPage from '../components/AboutPage'
import SiteLayout from '../components/SiteLayout'
import { buildPageTitle } from '../config/site'

export default function SobrePage() {
  return (
    <SiteLayout
      title={buildPageTitle('Score de Solvência de Prefeituras')}
      description="Entenda como o SolveLicita cruza dados do Tesouro Nacional para estimar o risco estrutural de atrasos de pagamento em licitações e contratos municipais."
      activeNav="sobre"
    >
      <section id="sobre" className="section active">
        <AboutPage />
      </section>
    </SiteLayout>
  )
}
