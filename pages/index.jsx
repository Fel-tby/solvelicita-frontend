import Link from 'next/link'
import AboutPage from '../components/AboutPage'
import SiteLayout from '../components/SiteLayout'
import { buildPageTitle } from '../config/site'

export default function HomePage() {
  return (
    <SiteLayout
      title="SolveLicita, o score dos municípios brasileiros"
      description="O primeiro score a analisar a capacidade fiscal dos municípios para fornecedores. Confira a saúde financeira e o risco de atraso de pagamentos das prefeituras em todo o Brasil."
      activeNav="sobre"
    >
      <section id="sobre" className="section active">
        <AboutPage />
      </section>
    </SiteLayout>
  )
}
