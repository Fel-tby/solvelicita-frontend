import ScoreDashboardPage from '../../components/score-municipios/ScoreDashboardPage'
import { UF_METADATA } from '../../lib/siteData'

export async function getStaticPaths() {
  return {
    paths: UF_METADATA.map((estado) => ({
      params: { uf: estado.uf.toLowerCase() },
    })),
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const uf = String(params?.uf || '').toUpperCase()
  const estado = UF_METADATA.find((item) => item.uf === uf)

  if (!estado) {
    return { notFound: true }
  }

  return {
    props: { uf },
    revalidate: 86400,
  }
}

export default function ScoreMunicipiosEstadoPage({ uf }) {
  return <ScoreDashboardPage uf={uf} />
}
