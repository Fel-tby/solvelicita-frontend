import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import CapitalTicker from './CapitalTicker'
import MapaBrasil from './MapaBrasil'
import {
  buildStateDashboardSummaries,
  fetchMunicipiosLandingSummary,
} from '../lib/municipios'

import MetricsSection from './landing/MetricsSection'
import AboutSection from './landing/AboutSection'
import ScoreLegend from './landing/ScoreLegend'
import ScoreComposition from './landing/ScoreComposition'
import SourcesSection from './landing/SourcesSection'
import ValidationSection from './landing/ValidationSection'
import FaqSection from './landing/FaqSection'
import LandingFooter from './landing/LandingFooter'

export default function AboutPage() {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState(true)
  const [stateSummaries, setStateSummaries] = useState([])

  useEffect(() => {
    let active = true

    async function loadStateSummaries() {
      try {
        const rows = await fetchMunicipiosLandingSummary()
        if (!active) return

        setStateSummaries(buildStateDashboardSummaries(rows))
      } catch {
        if (active) {
          setStateSummaries([])
        }
      } finally {
        if (active) {
          setLoadingStates(false)
        }
      }
    }

    loadStateSummaries()

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <div className="hero">
        <h1>Essa prefeitura tem capacidade de pagar o que contrata?</h1>
        <p>
          Municípios brasileiros licitam bilhões em serviços e fornecimentos por
          ano. Os dados para responder essa pergunta já existem, nos sistemas do
          Tesouro Nacional. O SolveLicita os cruza e transforma em um score por
          município.
        </p>
        <div className="hero-actions">
          <button
            className="btn-primary"
            onClick={() => router.push('/dados')}
            type="button"
          >
            Ver os dados
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push('/docs')}
            type="button"
          >
            Como funciona
          </button>
        </div>
      </div>

      <CapitalTicker />

      <div className="brazil-map-section landing-map-section-v2">
        <div className="brazil-map-inner wide">
          <MapaBrasil stateSummaries={stateSummaries} loading={loadingStates} />
        </div>
      </div>

      <MetricsSection />
      <AboutSection />
      <ScoreLegend />
      <ScoreComposition />
      <SourcesSection />
      <ValidationSection />
      <FaqSection />
      <LandingFooter />
    </>
  )
}
