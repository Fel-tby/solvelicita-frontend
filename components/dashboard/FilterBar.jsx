import { Filter, X } from 'lucide-react'

export default function FilterBar({
  filtros,
  setFiltros,
  buscaInput,
  setBuscaInput,
  limparFiltros,
}) {
  const handleChange = (chave, valor) => {
    setFiltros((prev) => ({ ...prev, [chave]: valor }))
  }

  const temFiltros = Object.values(filtros).some((val) => val !== 'Todos') || buscaInput.trim() !== ''

  return (
    <div className="dash-v3-filters">
      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> Classificação</span>
        <select className="dash-v3-select" value={filtros.classificacao} onChange={(e) => handleChange('classificacao', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="baixo">Risco Baixo</option>
          <option value="medio">Risco Médio</option>
          <option value="alto">Risco Alto</option>
          <option value="critico">Risco Crítico</option>
        </select>
      </div>

      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> Faixa de score</span>
        <select className="dash-v3-select" value={filtros.faixaScore} onChange={(e) => handleChange('faixaScore', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="90-100">90 a 100</option>
          <option value="80-89">80 a 89,9</option>
          <option value="70-79">70 a 79,9</option>
          <option value="60-69">60 a 69,9</option>
          <option value="50-59">50 a 59,9</option>
          <option value="40-49">40 a 49,9</option>
          <option value="<40">Abaixo de 40</option>
        </select>
      </div>

      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> % de dispensa</span>
        <select className="dash-v3-select" value={filtros.dispensa} onChange={(e) => handleChange('dispensa', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="0-10">Até 10%</option>
          <option value="10-30">10% a 30%</option>
          <option value="30-50">30% a 50%</option>
          <option value=">50">Acima de 50%</option>
        </select>
      </div>

      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> Pendências graves</span>
        <select className="dash-v3-select" value={filtros.pendencias} onChange={(e) => handleChange('pendencias', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2+">2 ou mais</option>
        </select>
      </div>

      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> População</span>
        <select className="dash-v3-select" value={filtros.populacao} onChange={(e) => handleChange('populacao', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="<10k">Até 10k</option>
          <option value="10k-50k">10k a 50k</option>
          <option value="50k-200k">50k a 200k</option>
          <option value=">200k">Acima de 200k</option>
        </select>
      </div>

      <div className="dash-v3-filter-group">
        <span className="dash-v3-filter-label"><Filter size={12} /> Valor homologado</span>
        <select className="dash-v3-select" value={filtros.valor} onChange={(e) => handleChange('valor', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="<10mi">Até R$ 10 mi</option>
          <option value="10-100mi">R$ 10 mi a R$ 100 mi</option>
          <option value="100mi-1bi">R$ 100 mi a R$ 1 bi</option>
          <option value=">1bi">Acima de R$ 1 bi</option>
        </select>
      </div>

      <div className="dash-v3-search-wrapper">
        <input
          type="text"
          placeholder="Buscar município..."
          className="dash-v3-search-input"
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
        />
        {temFiltros && (
          <button className="dash-v3-btn-outline" onClick={limparFiltros} title="Limpar filtros">
            <Filter size={14} /> Limpar
          </button>
        )}
      </div>
    </div>
  )
}
