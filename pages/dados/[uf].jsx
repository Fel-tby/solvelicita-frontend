import { useRouter } from 'next/router'
import DashboardPage from '../../components/DashboardPage'
import SiteLayout from '../../components/SiteLayout'
import SiteFooter from '../../components/SiteFooter'
import { buildPageTitle } from '../../config/site'
import { ESTADOS } from '../../lib/prototypeData'

const NOME_COMPLETO = {
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  DF: 'Distrito Federal',
}

function getPreposition(uf) {
  const feminine = new Set(['PB', 'BA'])
  const neutral = new Set(['SP', 'MG', 'SC', 'RR', 'RO', 'GO', 'MT', 'PE', 'AL', 'SE'])
  if (feminine.has(uf)) return 'da'
  if (neutral.has(uf)) return 'de'
  return 'do'
}

function getLocationPreposition(uf) {
  const feminine = new Set(['PB', 'BA'])
  const neutral = new Set(['SP', 'MG', 'SC', 'RR', 'RO', 'GO', 'MT', 'PE', 'AL', 'SE'])
  if (feminine.has(uf)) return 'na'
  if (neutral.has(uf)) return 'em'
  return 'no'
}

export default function EstadoPage() {
  const router = useRouter()
  const uf = typeof router.query.uf === 'string' ? router.query.uf.toUpperCase() : ''
  
  let stateName = uf
  let preposition = 'do'
  let locPreposition = 'no'
  
  if (uf) {
    const estado = ESTADOS.find((e) => e.uf === uf)
    if (estado) {
      stateName = NOME_COMPLETO[uf] || estado.nome
      preposition = getPreposition(uf)
      locPreposition = getLocationPreposition(uf)
    }
  }

  const pageTitle = uf ? `Score dos Municípios ${preposition} ${stateName}` : 'Dados'
  const pageDesc = uf
    ? `Descubra quais prefeituras são mais seguras para licitar ${locPreposition} ${stateName}. Consulte o Score de Solvência e o ranking oficial de risco fiscal.`
    : 'Descubra quais prefeituras são mais seguras para licitar em cada estado. Consulte o Score de Solvência e o ranking oficial de risco fiscal.'

  return (
    <SiteLayout
      title={buildPageTitle(pageTitle)}
      description={pageDesc}
      activeNav="dados"
    >
      <section id="dados" className="section active">
        {uf ? <DashboardPage uf={uf} /> : <div className="page-header"><p>Carregando estado…</p></div>}
        <SiteFooter />
      </section>
    </SiteLayout>
  )
}
