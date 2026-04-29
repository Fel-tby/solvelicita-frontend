import { ShieldCheck, BarChart2, TrendingUp } from 'lucide-react'

export default function AboutSection() {
  return (
    <div className="landing-section">
      <div className="about-modern-layout">
        <div className="about-header">
          <h3 className="about-title">O que é o SolveLicita</h3>
          <p className="about-description">
            Plataforma para o fornecedor que transforma dados públicos em 
            inteligência sobre a capacidade de pagamento dos municípios brasileiros.
          </p>
          <p className="about-description">
            Com um score de risco explicável, ajudamos fornecedores, 
            cidadãos e gestores a tomar decisões mais seguras e a promover 
            uma gestão pública mais responsável e eficiente.
          </p>
        </div>
        
        <div className="about-cards">
          <div className="about-card">
            <div className="about-card-icon">
              <ShieldCheck size={40} strokeWidth={2} />
            </div>
            <h4>Avalie risco antes de vender</h4>
            <p>Reduza incertezas e proteja seu negócio identificando municípios com maior risco de inadimplência.</p>
          </div>
          
          <div className="about-card">
            <div className="about-card-icon">
              <BarChart2 size={40} strokeWidth={2} />
            </div>
            <h4>Compare municípios</h4>
            <p>Compare localidades com critérios objetivos e priorize oportunidades com mais segurança.</p>
          </div>
          
          <div className="about-card">
            <div className="about-card-icon">
              <TrendingUp size={40} strokeWidth={2} />
            </div>
            <h4>Acompanhe a evolução do score</h4>
            <p>Monitore mudanças ao longo do tempo e antecipe sinais de risco ou melhoria.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
