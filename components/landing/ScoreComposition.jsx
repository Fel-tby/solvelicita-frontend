import Link from 'next/link'
import { Droplet, FileText, BarChart2, Shield, Percent, Lock } from 'lucide-react'

export default function ScoreComposition() {
  return (
    <div className="landing-section">
      <h3 className="landing-section-title">Composição do score</h3>
      <p className="landing-section-subtitle">
        Seis indicadores ponderados por relevância, todos de fontes oficiais.
      </p>

      <div className="composition-list">
        <div className="composition-row">
          <Droplet className="comp-icon" />
          <div className="comp-title">
            <strong>Liquidez Líquida</strong>
            <span>SICONFI / RGF Anexo 05</span>
          </div>
          <div className="comp-desc">
            Caixa disponível após dedução de todos os Restos a Pagar.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '35%' }} />
          </div>
          <div className="comp-weight">35%</div>
        </div>

        <div className="composition-row">
          <FileText className="comp-icon" />
          <div className="comp-title">
            <strong>RP Crônicos</strong>
            <span>SICONFI / RREO Anexo 07</span>
          </div>
          <div className="comp-desc">
            Padrão histórico de dívidas não pagas com fornecedores.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '15%' }} />
          </div>
          <div className="comp-weight">15%</div>
        </div>

        <div className="composition-row">
          <BarChart2 className="comp-icon" />
          <div className="comp-title">
            <strong>Execução Orçamentária</strong>
            <span>SICONFI / RREO Anexo 01</span>
          </div>
          <div className="comp-desc">
            Aderência entre receita prevista e efetivamente arrecadada.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '15%' }} />
          </div>
          <div className="comp-weight">15%</div>
        </div>

        <div className="composition-row">
          <Shield className="comp-icon" />
          <div className="comp-title">
            <strong>Transparência Fiscal</strong>
            <span>SICONFI</span>
          </div>
          <div className="comp-desc">
            Continuidade histórica de entrega de dados ao Tesouro Nacional.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '15%' }} />
          </div>
          <div className="comp-weight">15%</div>
        </div>

        <div className="composition-row">
          <Percent className="comp-icon" />
          <div className="comp-title">
            <strong>Autonomia Tributária</strong>
            <span>FINBRA / DCA</span>
          </div>
          <div className="comp-desc">
            Dependência de repasses federais (FPM) vs receita própria.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '10%' }} />
          </div>
          <div className="comp-weight">10%</div>
        </div>

        <div className="composition-row">
          <Lock className="comp-icon" />
          <div className="comp-title">
            <strong>Bloqueio Federal</strong>
            <span>CAUC / STN</span>
          </div>
          <div className="comp-desc">
            Pendências que bloqueiam recebimento de repasses federais.
          </div>
          <div className="comp-bar-wrapper">
            <div className="comp-bar color-accent" style={{ width: '10%' }} />
          </div>
          <div className="comp-weight">10%</div>
        </div>
      </div>

      <Link href="/docs" className="methodology-link">
        Ver metodologia completa →
      </Link>
    </div>
  )
}
