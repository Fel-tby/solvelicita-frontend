import { useRouter } from 'next/router'
import { Bell, Landmark, Scale, RefreshCcw, Clock, Info, ArrowRight, AlertTriangle } from 'lucide-react'

import AboutSection from './landing/AboutSection'
import ProductDemoSection from './landing/ProductDemoSection'
import HowItWorksSection from './landing/HowItWorksSection'
import SourcesSection from './landing/SourcesSection'
import ValidationSection from './landing/ValidationSection'
import FaqSection from './landing/FaqSection'
import LandingFooter from './landing/LandingFooter'

export default function AboutPage() {
  const router = useRouter()

  return (
    <>
      <div className="block-wrapper block-light">
        <div className="hero-split">
          <div className="hero-content">
            <h1>
              Dados públicos <br />
              transformados em <span className="brand-blue">decisão</span> <br />
              para o fornecedor.
            </h1>
            <p>
              Inteligência aplicada a licitações e contratos públicos 
              para ajudar fornecedores a avaliar prefeituras, 
              antecipar risco de atraso e contratar com mais segurança.
            </p>
            <div className="hero-actions">
              <button
                className="hero-btn-primary"
                onClick={() => router.push('/dados')}
                type="button"
              >
                Ver dados dos municípios
                <ArrowRight size={18} />
              </button>
              <button
                className="hero-btn-secondary"
                onClick={() => router.push('/docs')}
                type="button"
              >
                Entender metodologia
              </button>
            </div>
          </div>

          <div className="hero-asset-container">
            <div className="hero-image-wrapper">
              <img 
                src="/male_notebook.png" 
                alt="Plataforma SolveLicita"
                className="hero-base-image"
              />
            </div>
            



            <div className="hero-floating-cards-wrapper">
              {/* Painel 3: Alerta (Bottom Left/Center) */}
              <div className="ui-panel panel-alert">
                <div className="ui-panel-alert-box">
                  <div className="alert-icon-ring">
                    <Bell size={16} />
                  </div>
                  <div className="alert-info">
                    <strong>Alerta Inteligente</strong>
                    <span>Novo edital de risco baixo</span>
                  </div>
                </div>
              </div>

              {/* Painel 4: Risco */}
              <div className="ui-panel panel-risk">
                <div className="ui-panel-alert-box">
                  <div className="alert-icon-ring risk">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="alert-info">
                    <strong>Atenção de risco</strong>
                    <span>Município com bloqueio federal e score baixo</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Features Bar (Destaques pós-hero) */}
        <div className="hero-features-bar">
          <div className="features-bar-container">
            <div className="feature-item">
              <Landmark size={18} className="feature-icon" />
              <span>Fontes oficiais</span>
            </div>
            <div className="feature-item">
              <Scale size={18} className="feature-icon" />
              <span>Metodologia transparente</span>
            </div>
            <div className="feature-item">
              <RefreshCcw size={18} className="feature-icon" />
              <span>Atualização contínua</span>
            </div>
            <div className="feature-item">
              <Clock size={18} className="feature-icon" />
              <span>Gratuito para consulta</span>
            </div>
            <div className="feature-item">
              <Info size={18} className="feature-icon" />
              <span>Score explicável</span>
            </div>
          </div>
        </div>
      </div>

      <div className="block-wrapper block-light">
        <AboutSection />
      </div>

      <div className="block-wrapper block-brand-blue">
        <ProductDemoSection />
      </div>

      <div className="block-wrapper block-light">
        <HowItWorksSection />
      </div>

      <div className="block-wrapper block-light">
        <SourcesSection />
        <ValidationSection />
      </div>

      <div className="block-wrapper block-dark">
        <FaqSection />
      </div>

      <LandingFooter />
    </>
  )
}
