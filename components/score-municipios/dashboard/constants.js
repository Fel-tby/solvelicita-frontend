export const ORDEM_RISCO = ['baixo', 'medio', 'alto', 'critico', 'sem_dados']

export const CORES_RISCO = {
  baixo: 'var(--risk-baixo)',
  medio: 'var(--risk-medio)',
  alto: 'var(--risk-alto)',
  critico: 'var(--risk-critico)',
  sem_dados: 'var(--risk-nd)',
}

// Hex versions for SVG / canvas where CSS vars can't be used
export const CORES_RISCO_HEX = {
  baixo: '#22c55e',
  medio: '#f59e0b',
  alto: '#ef4444',
  critico: '#b91c1c',
  sem_dados: '#64748b',
}

export const LABEL_RISCO = {
  baixo: 'Alto desempenho',
  medio: 'Estável',
  alto: 'Atenção',
  critico: 'Crítico',
  sem_dados: 'Sem dados',
}

export const SCORE_THRESHOLDS = {
  baixo: 80,
  medio: 60,
  alto: 40,
}

export const FAIXAS_SCORE = [
  { id: '90-100', label: 'Alto desempenho', min: 90, max: 100, color: '#16a34a' },
  { id: '80-89', label: 'Bom desempenho', min: 80, max: 89.99, color: '#4ade80' },
  { id: '70-79', label: 'Estável', min: 70, max: 79.99, color: '#fcd34d' },
  { id: '60-69', label: 'Estável', min: 60, max: 69.99, color: '#fbbf24' },
  { id: '50-59', label: 'Atenção', min: 50, max: 59.99, color: '#fb923c' },
  { id: '40-49', label: 'Crítico', min: 40, max: 49.99, color: '#ef4444' },
  { id: '<40', label: 'Crítico', min: 0, max: 39.99, color: '#b91c1c' },
]

export const CONTRIBUTION_AXES = [
  { key: 'contrib_eorcam', label: 'Exec. Orçamentária', shortLabel: 'Exec.Orç', max: 15 },
  { key: 'contrib_lliq', label: 'Liquidez Líquida', shortLabel: 'Liquidez', max: 35 },
  { key: 'contrib_qsiconfi', label: 'Transparência', shortLabel: 'Transpar.', max: 15 },
  { key: 'contrib_ccauc', label: 'Regularidade Fiscal', shortLabel: 'CAUC', max: 10 },
  { key: 'contrib_autonomia', label: 'Autonomia', shortLabel: 'Autonomia', max: 10 },
  { key: 'contrib_rproc', label: 'Processamento', shortLabel: 'RP em Dia', max: 15 },
]

export const COLUNAS_RANKING_V2 = [
  { key: '#', label: 'Município', field: 'ente' },
  { key: 'score', label: 'Score', field: 'score' },
  { key: 'classificacao', label: 'Classificação', field: 'classificacao_canonica' },
  { key: 'valor', label: 'Volume de compras', field: 'valor_homologado_total' },
  { key: 'dispensa', label: '% compras diretas', field: 'pct_dispensa' },
  { key: 'pendencias', label: 'Alertas públicos', field: null },
  { key: 'recomendacao', label: 'Leitura', field: null },
]

export const ITEMS_PER_PAGE = 20
