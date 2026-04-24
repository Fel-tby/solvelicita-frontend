import { Landmark, ClipboardCheck, BarChart4, FileSignature } from 'lucide-react'

export default function SourcesSection() {
  return (
    <div className="landing-section">
      <h3 className="landing-section-title">Fontes oficiais</h3>
      
      <div className="sources-grid">
        <div className="source-card">
          <div className="source-header">
            <div className="source-icon-wrap">
              <Landmark size={20} />
            </div>
            <strong>SICONFI</strong>
          </div>
          <p>
            Relatórios fiscais bimestrais declarados pelos municípios (RREO e RGF).
          </p>
        </div>

        <div className="source-card">
          <div className="source-header">
            <div className="source-icon-wrap">
              <ClipboardCheck size={20} />
            </div>
            <strong>CAUC</strong>
          </div>
          <p>
            Cadastro de pendências que bloqueiam repasses federais, atualizado diariamente.
          </p>
        </div>

        <div className="source-card">
          <div className="source-header">
            <div className="source-icon-wrap">
              <BarChart4 size={20} />
            </div>
            <strong>DCA / FINBRA</strong>
          </div>
          <p>
            Receitas tributárias próprias e transferências constitucionais anuais.
          </p>
        </div>

        <div className="source-card">
          <div className="source-header">
            <div className="source-icon-wrap">
              <FileSignature size={20} />
            </div>
            <strong>PNCP</strong>
          </div>
          <p>
            Portal Nacional de Contratações Públicas, histórico de licitações e contratos.
          </p>
        </div>
      </div>
    </div>
  )
}
