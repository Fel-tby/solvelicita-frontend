import { ORDEM_RISCO, CORES_RISCO } from './constants'

// ── Text normalization ──────────────────────────────────────────────────────

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function normalizeClassificacao(value) {
  const text = normalizeText(value)
  if (text.includes('sem dados') || text.includes('s/d')) return 'sem_dados'
  if (text.includes('baixo')) return 'baixo'
  if (text.includes('medio')) return 'medio'
  if (text.includes('alto')) return 'alto'
  if (text.includes('critico')) return 'critico'
  return 'sem_dados'
}

export function ordemRiscoIndex(value) {
  return ORDEM_RISCO.indexOf(normalizeClassificacao(value))
}

// ── Score colors ────────────────────────────────────────────────────────────

export function corPorScore(score) {
  if (score == null || Number.isNaN(Number(score))) return 'var(--risk-nd)'
  if (Number(score) >= 80) return 'var(--risk-baixo)'
  if (Number(score) >= 60) return 'var(--risk-medio)'
  if (Number(score) >= 40) return 'var(--risk-alto)'
  return 'var(--risk-critico)'
}

export function corPorScoreHex(score) {
  if (score == null || Number.isNaN(Number(score))) return '#64748b'
  if (Number(score) >= 80) return '#22c55e'
  if (Number(score) >= 60) return '#f59e0b'
  if (Number(score) >= 40) return '#ef4444'
  return '#b91c1c'
}

export function faixaDeScore(score) {
  if (score == null || Number.isNaN(Number(score))) return 'sem_dados'
  if (Number(score) >= 80) return 'baixo'
  if (Number(score) >= 60) return 'medio'
  if (Number(score) >= 40) return 'alto'
  return 'critico'
}

// ── Number formatters ───────────────────────────────────────────────────────

export function fmtNum(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(decimals)
}

export function fmtPct(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(decimals)}%`
}

export function fmtBRL(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1)} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)} mi`
  return `R$ ${Number(value).toLocaleString('pt-BR')}`
}

export function fmtInt(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR')
}

// ── Statistics ──────────────────────────────────────────────────────────────

export function mediana(values) {
  const sorted = values
    .filter((value) => value != null && !Number.isNaN(Number(value)))
    .map(Number)
    .sort((left, right) => left - right)

  if (!sorted.length) return null

  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// ── Status helpers ──────────────────────────────────────────────────────────

export function statusColor(status) {
  if (status === 'ok') return 'var(--risk-baixo)'
  if (status === 'warn') return 'var(--risk-medio)'
  if (status === 'bad') return 'var(--risk-alto)'
  return 'var(--text-lo)'
}

export function statusByRange(value, { ok, warn, direction = 'higher' }) {
  if (value == null || Number.isNaN(Number(value))) return 'na'
  const number = Number(value)

  if (direction === 'lower') {
    if (number <= ok) return 'ok'
    if (number <= warn) return 'warn'
    return 'bad'
  }

  if (number >= ok) return 'ok'
  if (number >= warn) return 'warn'
  return 'bad'
}

// ── CAUC parsing ────────────────────────────────────────────────────────────

export function parsePendenciasCauc(value) {
  if (Array.isArray(value)) return value
  if (!value) return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

export function corPendenciaCauc(gravidade) {
  if (gravidade === 'GRAVE') return '#ef4444'
  if (gravidade === 'MODERADA') return '#f59e0b'
  return '#38bdf8'
}

export function getMunicipioAlertasCauc(municipio) {
  const pendencias = municipio.pendencias_list || parsePendenciasCauc(municipio.pendencias_cauc_json)

  return pendencias.map((pendencia) => ({
    label: `CAUC ${pendencia.codigo}: ${pendencia.descricao}`,
    cor: corPendenciaCauc(pendencia.gravidade),
    gravidade: pendencia.gravidade || 'LEVE',
    descricao: pendencia.descricao || pendencia.label || 'Pendência federal',
  }))
}

// ── Semáforo de decisão ─────────────────────────────────────────────────────

export function calcularSemaforo(municipio) {
  const alertasCauc = getMunicipioAlertasCauc(municipio)
  const graves = alertasCauc.filter((p) => String(p.gravidade).toUpperCase() === 'GRAVE')
  const score = Number(municipio.score)
  const temDadoDefasado = Boolean(municipio.dado_defasado)
  const temDadoSuspeito = Boolean(municipio.dado_suspeito)

  const checks = []

  // Score check
  if (!Number.isNaN(score)) {
    if (score >= 80) checks.push({ status: 'ok', label: `Score Alto (${score.toFixed(1)}/100)` })
    else if (score >= 60) checks.push({ status: 'warn', label: `Score Moderado (${score.toFixed(1)}/100)` })
    else checks.push({ status: 'bad', label: `Score Baixo (${score.toFixed(1)}/100)` })
  } else {
    checks.push({ status: 'bad', label: 'Score indisponível' })
  }

  // CAUC check
  if (graves.length > 0) checks.push({ status: 'bad', label: `${graves.length} pendência(s) CAUC grave(s)` })
  else if (alertasCauc.length > 0) checks.push({ status: 'warn', label: `${alertasCauc.length} pendência(s) CAUC` })
  else checks.push({ status: 'ok', label: 'CAUC Regular' })

  // Data quality
  if (temDadoDefasado) checks.push({ status: 'bad', label: 'Dado defasado' })
  if (temDadoSuspeito) checks.push({ status: 'warn', label: 'Dado suspeito' })
  if (!temDadoDefasado && !temDadoSuspeito) checks.push({ status: 'ok', label: 'Sem alertas de qualidade' })

  // Dispensa
  if (Number(municipio.pct_dispensa) > 0.5) checks.push({ status: 'bad', label: '% Dispensa acima de 50%' })
  else if (Number(municipio.pct_dispensa) > 0.3) checks.push({ status: 'warn', label: '% Dispensa acima de 30%' })

  // RP Crônico
  if (Number(municipio.n_anos_cronicos) >= 5) checks.push({ status: 'bad', label: `RP Crônico (${municipio.n_anos_cronicos} anos)` })

  // Verdict
  const hasBad = checks.some((c) => c.status === 'bad')
  const hasWarn = checks.some((c) => c.status === 'warn')

  let veredito = 'FAVORÁVEL'
  let vereditoColor = 'var(--risk-baixo)'
  if (hasBad) {
    veredito = 'DESFAVORÁVEL'
    vereditoColor = 'var(--risk-alto)'
  } else if (hasWarn) {
    veredito = 'FAVORÁVEL COM RESSALVAS'
    vereditoColor = 'var(--risk-medio)'
  }

  return { checks, veredito, vereditoColor }
}

export function clampPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Math.max(0, Math.min(100, Number(value)))
}

export function contarPendenciasGraves(municipio) {
  const alertasCauc = getMunicipioAlertasCauc(municipio)
  return alertasCauc.filter((p) => String(p.gravidade).toUpperCase() === 'GRAVE').length
}

export function calcularRecomendacao(municipio) {
  const pendenciasGraves = contarPendenciasGraves(municipio)
  const score = Number(municipio.score)

  if (pendenciasGraves >= 2) return { label: 'Requer atenção', cor: 'var(--risk-alto)' }
  
  if (Number.isNaN(score)) return { label: '-', cor: 'var(--text-lo)' }

  if (score >= 80) {
    if (pendenciasGraves === 0) return { label: 'Cidade em destaque', cor: 'var(--risk-baixo)' }
    return { label: 'Acompanhar indicadores', cor: 'var(--risk-medio)' }
  }
  
  if (score >= 60) {
    if (pendenciasGraves === 0) return { label: 'Acompanhar indicadores', cor: 'var(--risk-medio)' }
    return { label: 'Requer atenção', cor: 'var(--risk-alto)' }
  }
  
  if (score >= 40) return { label: 'Requer atenção', cor: 'var(--risk-alto)' }
  
  return { label: 'Atenção prioritária', cor: 'var(--risk-critico)' }
}

export function fmtValorHomologado(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  const num = Number(value)
  if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(1).replace('.', ',')} bi`
  if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(1).replace('.', ',')} mi`
  if (num >= 1e3) return `R$ ${(num / 1e3).toFixed(1).replace('.', ',')} mil`
  return `R$ ${num.toLocaleString('pt-BR')}`
}

// ── Sinais de atenção cruzados ──────────────────────────────────────────────

/** Sinal 1: Acúmulo de atrasos a fornecedores (RP elevado ou crônico) */
export function temAtrasosFornecedores(municipio) {
  const rproc = Number(municipio.rproc_pct_atual)
  const cronico = Number(municipio.n_anos_cronicos)
  return (!Number.isNaN(rproc) && rproc > 3) || (!Number.isNaN(cronico) && cronico >= 3)
}

/** Sinal 2: Bloqueio CAUC grave + dependência federal (autonomia < 8%) */
export function temBloqueioSemAutonomia(municipio) {
  const alertasCauc = getMunicipioAlertasCauc(municipio)
  const temGrave = alertasCauc.some((p) => String(p.gravidade).toUpperCase() === 'GRAVE')
  const autonomia = Number(municipio.autonomia_media)
  return temGrave && !Number.isNaN(autonomia) && autonomia < 0.08
}
