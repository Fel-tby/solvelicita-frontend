import { Building2, ShieldCheck, AlertTriangle, Users } from 'lucide-react'

export default function MetricsSection() {
  return (
    <div className="landing-section">
      <div className="metrics-grid">
        <div className="metric-card">
          <Building2 className="metric-icon" size={32} />
          <div className="metric-value">5.570</div>
          <div className="metric-label">municípios brasileiros<br />analisados</div>
        </div>
        
        <div className="metric-card">
          <ShieldCheck className="metric-icon" size={32} />
          <div className="metric-value">97,6%</div>
          <div className="metric-label">Assertividade na classificação<br />de Risco Baixo</div>
        </div>

        <div className="metric-card">
          <AlertTriangle className="metric-icon" size={32} />
          <div className="metric-value">20,2x</div>
          <div className="metric-label">Risco de atraso crônico de pagamentos em<br />municípios de Risco Alto</div>
        </div>

        <div className="metric-card">
          <Users className="metric-icon" size={32} />
          <div className="metric-value">1 em 2</div>
          <div className="metric-label">Cidades de Risco Alto<br />atrasaram pagamentos</div>
        </div>
      </div>
    </div>
  )
}
