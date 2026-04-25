import { useRouter } from 'next/router'
import DashboardPage from '../../components/DashboardPage'
import SiteLayout from '../../components/SiteLayout'
import { buildPageTitle } from '../../config/site'
import { ESTADOS } from '../../lib/prototypeData'
import { fetchGeoJsonForUf, fetchMunicipiosByUf } from '../../lib/municipios'

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

export async function getStaticPaths() {
  const paths = ESTADOS.filter((e) => e.ativo).map((estado) => ({
    params: { uf: estado.uf.toLowerCase() },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const uf = params.uf?.toUpperCase() || ''

  const estado = ESTADOS.find((e) => e.uf === uf)
  if (!estado) {
    return { notFound: true }
  }

  // Fetch data on the server for SSG/SEO
  let initialMunicipios = []
  let initialGeoData = null

  try {
    const [rows, geo] = await Promise.all([
      fetchMunicipiosByUf(uf),
      fetchGeoJsonForUf(uf),
    ])
    initialMunicipios = rows
    initialGeoData = geo
  } catch (error) {
    console.error(`Error fetching data for ${uf} during SSG:`, error)
  }

  return {
    props: {
      initialUf: uf,
      initialMunicipios,
      initialGeoData,
    },
    revalidate: 86400,
  }
}

export default function EstadoPage({ initialUf, initialMunicipios, initialGeoData }) {
  const router = useRouter()
  // Usa o initialUf vindo do servidor, garantindo que o SSR/SSG tenha a UF preenchida,
  // ou usa do router como fallback.
  const uf = initialUf || (typeof router.query.uf === 'string' ? router.query.uf.toUpperCase() : '')

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
        {uf ? (
          <DashboardPage 
            uf={uf} 
            initialMunicipios={initialMunicipios} 
            initialGeoData={initialGeoData} 
          />
        ) : (
          <div className="page-header"><p>Carregando estado…</p></div>
        )}
      </section>
    </SiteLayout>
  )
}
