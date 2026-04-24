import Link from 'next/link'
import AboutPage from '../components/AboutPage'
import SiteLayout from '../components/SiteLayout'
import { buildPageTitle } from '../config/site'

export default function SobrePage() {
  return (
    <SiteLayout
      title="SolveLicita"
      description="Visão geral do SolveLicita."
      activeNav="sobre"
    >
      <section id="sobre" className="section active">
        <AboutPage />
      </section>
    </SiteLayout>
  )
}
