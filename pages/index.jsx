import Link from 'next/link'
import AboutPage from '../components/AboutPage'
import SiteLayout from '../components/SiteLayout'
import { buildPageTitle } from '../config/site'

export default function HomePage() {
  return (
    <SiteLayout
      title="SolveLicita, o score dos municípios brasileiros"
      description="Consulte a capacidade de pagamento e a saúde financeira das prefeituras brasileiras. O score oficial para fornecedores avaliarem risco de atraso e solvência."
      activeNav="sobre"
    >
      <section id="sobre" className="section active">
        <AboutPage />
      </section>
    </SiteLayout>
  )
}
