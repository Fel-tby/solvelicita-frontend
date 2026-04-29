import { Map, BarChart, Bell, Filter, Info, ArrowRight } from 'lucide-react'

export default function ProductDemoSection() {
  const features = [
    {
      icon: <Map size={24} />,
      title: "Mapa de risco por município",
      desc: "Visualize o risco em todo o Brasil."
    },
    {
      icon: <BarChart size={24} />,
      title: "Ranking priorizado",
      desc: "Identifique os municípios com maior atenção."
    },
    {
      icon: <Bell size={24} />,
      title: "Alertas e sinais de atenção",
      desc: "Veja os fatores que mais impactam o score."
    },
    {
      icon: <Filter size={24} />,
      title: "Filtros por score, porte e contratação",
      desc: "Encontre o município ideal para o seu perfil."
    },
    {
      icon: <Info size={24} />,
      title: "Leitura explicável do score",
      desc: "Entenda os indicadores que compõem o resultado."
    }
  ]

  return (
    <div className="landing-section">
      <div className="product-demo-layout">
        {/* Lado Esquerdo: Quadrado Gigante (Placeholder do Mockup) */}
        <div className="demo-mockup-container">
          <div className="demo-placeholder-box">
            {/* O mockup será colocado aqui posteriormente */}
          </div>
        </div>

        {/* Lado Direito: Informações */}
        <div className="demo-info">
          <h2 className="demo-title">Da informação à decisão</h2>
          <p className="demo-subtitle">
            Uma visão completa para entender o risco e agir com antecedência.
          </p>

          <div className="demo-features-list">
            {features.map((feature, index) => (
              <div key={index} className="demo-feature-item">
                <div className="demo-feature-icon">
                  {feature.icon}
                </div>
                <div className="demo-feature-content">
                  <h4>{feature.title}</h4>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="demo-cta-button">
            Explorar produto <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
