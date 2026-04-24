import { Users, Briefcase, Search, ShieldCheck } from 'lucide-react'

export default function AboutSection() {
  return (
    <div className="landing-section">
      <div className="about-split">
        <div className="about-text">
          <h3 className="landing-section-title">O que é o SolveLicita</h3>
          <p>
            O SolveLicita organiza dados fiscais e orçamentários para fornecer 
            um score que estima a capacidade estrutural 
            de pagamento dos municípios brasileiros.
          </p>
          <p>
            A partir de bases oficiais do Tesouro Nacional e do Governo Federal, 
            produzimos um score de solvência que ajuda a sociedade a tomar decisões 
            informadas e a promover uma gestão pública mais transparente e eficiente.
          </p>
        </div>
        
        <div className="about-uses">
          <h3 className="landing-section-title">Para que serve</h3>
          <div className="uses-list">
            <div className="use-item">
              <Users className="use-icon" size={20} />
              <div className="use-content">
                <strong>Cidadãos</strong>
                <p>Acompanhar a saúde fiscal do seu município.</p>
              </div>
            </div>
            
            <div className="use-item">
              <Briefcase className="use-icon" size={20} />
              <div className="use-content">
                <strong>Fornecedores</strong>
                <p>Avaliar riscos antes de contratar com o setor público.</p>
              </div>
            </div>
            
            <div className="use-item">
              <Search className="use-icon" size={20} />
              <div className="use-content">
                <strong>Pesquisadores e jornalistas</strong>
                <p>Analisar e comparar a situação fiscal entre municípios.</p>
              </div>
            </div>
            
            <div className="use-item">
              <ShieldCheck className="use-icon" size={20} />
              <div className="use-content">
                <strong>Gestores públicos</strong>
                <p>Monitorar fragilidades e apoiar decisões baseadas em dados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
