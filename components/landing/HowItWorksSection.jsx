import { Database, Calculator, Gauge, Users, ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      id: 1,
      icon: <Database size={40} strokeWidth={2} />,
      title: "Coletamos dados oficiais",
      description: "Integramos informações do CAUC, SICONFI, Tesouro Nacional e PNCP com atualização contínua."
    },
    {
      id: 2,
      icon: <Calculator size={40} strokeWidth={2} />,
      title: "Calculamos o score",
      description: "Aplicamos uma metodologia transparente que combina 6 indicadores financeiros e fiscais."
    },
    {
      id: 3,
      icon: <Gauge size={40} strokeWidth={2} />,
      title: "Classificamos o risco",
      description: "O score posiciona o município em faixas de risco para facilitar a interpretação."
    },
    {
      id: 4,
      icon: <Users size={40} strokeWidth={2} />,
      title: "Ajudamos na evolução",
      description: "Você entende o contexto, compara alternativas e decide com mais segurança e eficiência."
    }
  ]

  return (
    <div className="landing-section">
      <h3 className="how-it-works-title">Como funciona</h3>
      
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={step.id} className="step-wrapper">
            <div className="step-item">
              <div className="step-badge">{step.id}</div>
              <div className="step-icon-box">
                {step.icon}
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="step-arrow">
                <ArrowRight size={20} strokeWidth={1} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
