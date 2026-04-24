import Link from 'next/link'
import { TrendingUp, AlertTriangle, ShieldCheck, Target } from 'lucide-react'

export default function ValidationSection() {
  return (
    <div className="landing-section">
      <h3 className="landing-section-title">Validação histórica</h3>
      <p className="landing-section-subtitle">
        O score foi testado com dados históricos em 4.671 avaliações anuais de municípios entre 2021 e 2025, 
        <br />
        simulando cenários reais sem acesso a informações do futuro.
      </p>

      <div className="validation-grid">
        <div className="val-card">
          <TrendingUp className="val-icon" size={36} />
          <div className="val-content">
            <strong>4.671</strong>
            <p>avaliações anuais<br />testadas</p>
          </div>
        </div>

        <div className="val-card">
          <AlertTriangle className="val-icon" size={36} />
          <div className="val-content">
            <strong>51,9%</strong>
            <p>atrasos crônicos<br />no grupo de Risco Alto</p>
          </div>
        </div>

        <div className="val-card">
          <ShieldCheck className="val-icon" size={36} />
          <div className="val-content">
            <strong>9,2%</strong>
            <p>atrasos crônicos<br />no grupo de Risco Baixo</p>
          </div>
        </div>
        <div className="val-card">
          <Target className="val-icon" size={36} />
          <div className="val-content">
            <strong>74,4%</strong>
            <p>acerto ao separar<br />bons e maus pagadores</p>
          </div>
        </div>
      </div>

      <Link href="/docs" className="methodology-link">
        Ver validação completa →
      </Link>
    </div>
  )
}
