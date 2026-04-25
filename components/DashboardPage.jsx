import { useCallback, useEffect, useMemo, useState } from 'react'
import { Map } from 'lucide-react'
import dynamic from 'next/dynamic'
import { fetchGeoJsonForUf, fetchMunicipiosByUf, getStateName, normalizeUf } from '../lib/municipios'

const MapaCoropletico = dynamic(() => import('./MapaCoropletico'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-lo)',
        fontFamily: 'var(--sans)',
        fontSize: '0.9rem',
        fontWeight: 500,
      }}
    >
      CARREGANDO MAPA...
    </div>
  ),
})

const ORDEM_RISCO = ['baixo', 'medio', 'alto', 'critico', 'sem_dados']

const CORES_RISCO = {
  baixo: 'var(--risk-baixo)',
  medio: 'var(--risk-medio)',
  alto: 'var(--risk-alto)',
  critico: 'var(--risk-critico)',
  sem_dados: 'var(--risk-nd)',
}

const LABEL_RISCO = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico',
  sem_dados: 'S/D',
}

const COLUNAS = [
  { key: '#', label: '#', field: null },
  { key: 'ente', label: 'Municipio', field: 'ente' },
  { key: 'score', label: 'Score', field: 'score' },
  { key: 'class', label: 'Risco', field: 'classificacao_canonica' },
  { key: 'pop', label: 'Pop.', field: 'populacao' },
  { key: 'eorcam', label: 'Exec.Orc.%', field: 'eorcam_raw' },
  { key: 'rproc', label: 'RP Proc. %', field: 'rproc_pct_atual' },
  { key: 'siconfi', label: 'SICONFI', field: 'qsiconfi' },
  { key: 'cauc', label: 'CAUC', field: 'ccauc' },
  { key: 'lliq', label: 'Lliq', field: 'lliq_raw' },
  { key: 'autonomia', label: 'Autonomia', field: 'autonomia_media' },
  { key: 'licit', label: 'Licitacoes', field: 'n_licitacoes' },
  { key: 'valor', label: 'Val.Homolog.', field: 'valor_homologado_total' },
  { key: 'dispensa', label: '% Dispensa', field: 'pct_dispensa' },
]

const PREVIEW_LINHAS = 10

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizeClassificacao(value) {
  const text = normalizeText(value)
  if (text.includes('sem dados') || text.includes('s/d')) return 'sem_dados'
  if (text.includes('baixo')) return 'baixo'
  if (text.includes('medio')) return 'medio'
  if (text.includes('alto')) return 'alto'
  if (text.includes('critico')) return 'critico'
  return 'sem_dados'
}

function ordemRiscoIndex(value) {
  return ORDEM_RISCO.indexOf(normalizeClassificacao(value))
}

function corPorScore(score) {
  if (score == null || Number.isNaN(Number(score))) return 'var(--risk-nd)'
  if (Number(score) >= 80) return 'var(--risk-baixo)'
  if (Number(score) >= 60) return 'var(--risk-medio)'
  if (Number(score) >= 40) return 'var(--risk-alto)'
  return 'var(--risk-critico)'
}

function fmtNum(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(decimals)
}

function fmtPct(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(decimals)}%`
}

function fmtBRL(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1)} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)} mi`
  return `R$ ${Number(value).toLocaleString('pt-BR')}`
}

function mediana(values) {
  const sorted = values
    .filter((value) => value != null && !Number.isNaN(Number(value)))
    .map(Number)
    .sort((left, right) => left - right)

  if (!sorted.length) return null

  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function BadgeRisco({ classe }) {
  const risco = normalizeClassificacao(classe)
  const cor = CORES_RISCO[risco] || 'var(--risk-nd)'

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontFamily: 'var(--sans)',
        fontWeight: 600,
        color: cor,
        background: `${cor}22`,
        border: `1px solid ${cor}44`,
      }}
    >
      {LABEL_RISCO[risco] || 'S/D'}
    </span>
  )
}

function AlertaBadge({ label, cor = '#f59e0b' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '999px',
        fontSize: '0.68rem',
        fontFamily: 'var(--sans)',
        fontWeight: 600,
        color: cor,
        background: `${cor}18`,
        border: `1px solid ${cor}33`,
        lineHeight: 1.3,
        whiteSpace: 'normal',
        maxWidth: '100%',
      }}
    >
      ! {label}
    </span>
  )
}

function parsePendenciasCauc(value) {
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

function corPendenciaCauc(gravidade) {
  if (gravidade === 'GRAVE') return '#ef4444'
  if (gravidade === 'MODERADA') return '#f59e0b'
  return '#38bdf8'
}

function stateNameWithArticle(uf) {
  const normalizedUf = normalizeUf(uf)
  const name = getStateName(normalizedUf)
  const feminine = new Set(['PB', 'BA'])
  return `${feminine.has(normalizedUf) ? 'da' : 'do'} ${name}`
}

function KPI({ label, value, destaque }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${destaque || 'var(--border-dim)'}`,
        padding: '12px 14px',
        borderRadius: '10px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          color: 'var(--text-lo)',
          fontFamily: 'var(--sans)',
          fontWeight: 500,
          marginBottom: '6px',
          lineHeight: 1.35,
          wordBreak: 'break-word',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-hi)',
          fontFamily: 'var(--sans)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function PainelTitulo({ children }) {
  return (
    <div
      style={{
        fontSize: '0.78rem',
        color: 'var(--text-mid)',
        fontFamily: 'var(--sans)',
        fontWeight: 600,
        paddingBottom: '10px',
        marginBottom: '12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  )
}

function Painel({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px 18px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function getMunicipioAlertasCauc(municipio) {
  const pendencias = municipio.pendencias_list || parsePendenciasCauc(municipio.pendencias_cauc_json)

  return pendencias.map((pendencia) => ({
    label: `CAUC ${pendencia.codigo}: ${pendencia.descricao}`,
    cor: corPendenciaCauc(pendencia.gravidade),
    gravidade: pendencia.gravidade || 'LEVE',
    descricao: pendencia.descricao || pendencia.label || 'Pendencia federal',
  }))
}

function clampPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Math.max(0, Math.min(100, Number(value)))
}

function statusColor(status) {
  if (status === 'ok') return 'var(--risk-baixo)'
  if (status === 'warn') return 'var(--risk-medio)'
  if (status === 'bad') return 'var(--risk-alto)'
  return 'var(--text-lo)'
}

function statusByRange(value, { ok, warn, direction = 'higher' }) {
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

function DetailSectionTitle({ children }) {
  return (
    <div
      style={{
        color: 'var(--text-lo)',
        fontFamily: 'var(--sans)',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  )
}

function MetricGroup({ title, children }) {
  return (
    <div
      style={{
        background: 'var(--bg-card-alt)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        minWidth: 0,
      }}
    >
      <DetailSectionTitle>{title}</DetailSectionTitle>
      <div style={{ display: 'grid', gap: '6px' }}>{children}</div>
    </div>
  )
}

function MetricRow({ label, value, status = 'na' }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        alignItems: 'baseline',
        fontFamily: 'var(--sans)',
        fontSize: '0.78rem',
        lineHeight: 1.35,
      }}
    >
      <span style={{ color: 'var(--text-mid)' }}>{label}</span>
      <span
        style={{
          color: statusColor(status),
          fontWeight: 700,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums lining-nums',
          maxWidth: '56%',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ContributionBar({ label, value, max, displayValue, exact }) {
  const percent = max ? clampPercent((Number(value) / max) * 100) : clampPercent(value)
  const color = percent == null ? 'var(--risk-nd)' : percent >= 66 ? 'var(--risk-baixo)' : percent >= 33 ? 'var(--risk-medio)' : 'var(--risk-alto)'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(118px, 150px) minmax(90px, 1fr) minmax(44px, auto)',
        gap: '12px',
        alignItems: 'center',
        fontFamily: 'var(--sans)',
        fontSize: '0.76rem',
      }}
    >
      <div style={{ color: 'var(--text-mid)', minWidth: 0 }}>
        {label}
        {exact && max ? <span style={{ color: 'var(--text-lo)', fontSize: '0.68rem' }}> / {max}</span> : null}
      </div>
      <div
        style={{
          height: '5px',
          background: 'var(--border)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent || 0}%`,
            height: '100%',
            background: color,
            borderRadius: '999px',
          }}
        />
      </div>
      <div
        style={{
          color: 'var(--text-hi)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontWeight: 700,
        }}
      >
        {displayValue}
      </div>
    </div>
  )
}

function PendenciaTag({ pendencia }) {
  const gravidade = String(pendencia.gravidade || 'LEVE').toUpperCase()
  const color = corPendenciaCauc(gravidade)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '6px',
        background: `${color}14`,
        border: `1px solid ${color}33`,
        color,
        fontFamily: 'var(--sans)',
        fontSize: '0.72rem',
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: color, flexShrink: 0 }} />
      {pendencia.descricao || pendencia.label || 'Pendencia federal'}
    </span>
  )
}

function QualityFlag({ label, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '6px',
        border: `1px solid ${color}44`,
        background: `${color}12`,
        color,
        fontFamily: 'var(--sans)',
        fontSize: '0.7rem',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  )
}

function FilterChip({ label, count, color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        minHeight: '28px',
        borderRadius: '999px',
        border: `1px solid ${active ? `${color}55` : 'transparent'}`,
        background: active ? `${color}12` : 'transparent',
        color: active ? 'var(--text-hi)' : 'var(--text-mid)',
        cursor: 'pointer',
        padding: '5px 8px',
        fontFamily: 'var(--sans)',
        fontSize: '0.75rem',
        fontWeight: active ? 700 : 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
      title={`Filtrar ${label}`}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: color, flexShrink: 0 }} />
      <span>{label}</span>
      <span
        style={{
          color: active ? 'var(--text-mid)' : 'var(--text-lo)',
          fontFamily: 'var(--mono)',
          fontSize: '0.72rem',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {count}
      </span>
    </button>
  )
}

function MunicipioSelecionado({ municipio, onClear }) {
  if (!municipio) {
    return (
      <Painel>
        <PainelTitulo>Municipio Selecionado</PainelTitulo>
        <div
          style={{
            color: 'var(--text-lo)',
            fontFamily: 'var(--sans)',
            fontSize: '0.92rem',
            lineHeight: 1.8,
          }}
        >
          Clique em um municipio no mapa ou na tabela para ver os indicadores detalhados.
        </div>
      </Painel>
    )
  }

  const alertasCauc = getMunicipioAlertasCauc(municipio)
  const pendenciasPorGravidade = alertasCauc.reduce(
    (acc, pendencia) => {
      const gravidade = String(pendencia.gravidade || 'LEVE').toUpperCase()
      if (gravidade === 'GRAVE') acc.graves.push(pendencia)
      else if (gravidade === 'MODERADA') acc.moderadas.push(pendencia)
      else acc.leves.push(pendencia)
      return acc
    },
    { graves: [], moderadas: [], leves: [] },
  )
  const totalPendencias = alertasCauc.length
  const exactContributions = [
    { key: 'contrib_eorcam', label: 'Exec. Orcamentaria', max: 15 },
    { key: 'contrib_lliq', label: 'Liquidez Liquida', max: 35 },
    { key: 'contrib_qsiconfi', label: 'Qualidade SICONFI', max: 15 },
    { key: 'contrib_ccauc', label: 'Regularidade CAUC', max: 10 },
    { key: 'contrib_autonomia', label: 'Autonomia Fiscal', max: 10 },
    { key: 'contrib_rproc', label: 'Proc. em Dia', max: 15 },
  ]
  const contributionRows = exactContributions.map((item) => ({
    ...item,
    value: municipio[item.key],
    displayValue: municipio[item.key] != null ? fmtNum(municipio[item.key], 2) : '-',
    exact: true,
  }))
  const hasContributions = contributionRows.some((item) => item.value != null)
  const qualityFlags = [
    { label: 'Dado Suspeito', active: Boolean(municipio.dado_suspeito), color: '#f59e0b' },
    { label: 'Dado Defasado', active: Boolean(municipio.dado_defasado), color: '#64748b' },
    { label: 'Autonomia Critica', active: Boolean(municipio.autonomia_critica), color: '#f59e0b' },
    { label: 'RP Cronico', active: Number(municipio.n_anos_cronicos) >= 5, color: '#ef4444' },
    { label: 'Alerta Dispensa', active: Boolean(municipio.alerta_dispensa), color: '#ef4444' },
  ]
  const activeQualityFlags = qualityFlags.filter((flag) => flag.active)

  return (
    <Painel>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
        }}
      >
        <div>
          <PainelTitulo>Municipio Selecionado</PainelTitulo>
          <div
            style={{
              fontSize: '1.35rem',
              color: 'var(--text-hi)',
              fontWeight: 700,
              fontFamily: 'var(--sans)',
              lineHeight: 1.2,
            }}
          >
            {municipio.ente}
          </div>
          <div
            style={{
              color: 'var(--text-lo)',
              fontFamily: 'var(--sans)',
              fontSize: '0.78rem',
              marginTop: '4px',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {municipio.cod_ibge ? `IBGE ${municipio.cod_ibge}` : 'Codigo IBGE indisponivel'} · {municipio.populacao?.toLocaleString('pt-BR') || '-'} hab.
          </div>
        </div>
        <div style={{ display: 'grid', justifyItems: 'end', gap: '6px' }}>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-lo)',
                borderRadius: '8px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              Resumo
            </button>
          ) : null}
          <BadgeRisco classe={municipio.classificacao} />
          <div
            style={{
              color: corPorScore(municipio.score),
              fontFamily: 'var(--sans)',
              fontSize: '1.35rem',
              fontWeight: 800,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {municipio.score != null ? Number(municipio.score).toFixed(1) : '-'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        <MetricGroup title="Indicadores Fiscais">
          <MetricRow label="Exec. Orcamentaria" value={fmtPct(municipio.eorcam_raw)} status={statusByRange(municipio.eorcam_raw, { ok: 90, warn: 75 })} />
          <MetricRow label="Liquidez Liquida" value={fmtNum(municipio.lliq_raw, 4)} status={statusByRange(municipio.lliq_raw, { ok: 0.2, warn: 0.05 })} />
          <MetricRow label="Autonomia Fiscal" value={municipio.autonomia_media != null ? fmtPct(Number(municipio.autonomia_media) * 100) : '-'} status={statusByRange(municipio.autonomia_media, { ok: 0.15, warn: 0.05 })} />
          <MetricRow label="RP Processados" value={fmtPct(municipio.rproc_pct_atual)} status={statusByRange(municipio.rproc_pct_atual, { ok: 1, warn: 3, direction: 'lower' })} />
          <MetricRow label="Anos Cronicos" value={municipio.n_anos_cronicos != null ? municipio.n_anos_cronicos : '-'} status={statusByRange(municipio.n_anos_cronicos, { ok: 0, warn: 2, direction: 'lower' })} />
        </MetricGroup>

        <MetricGroup title="Conformidade e Entrega">
          <MetricRow label="SICONFI" value={municipio.qsiconfi != null ? fmtPct(Number(municipio.qsiconfi) * 100, 0) : '-'} status={statusByRange(municipio.qsiconfi, { ok: 1, warn: 0.5 })} />
          <MetricRow label="CAUC" value={fmtNum(municipio.ccauc, 2)} status={statusByRange(municipio.ccauc, { ok: 0, warn: 0.25, direction: 'lower' })} />
          <MetricRow label="Pendencias" value={totalPendencias ? totalPendencias : 'Regular'} status={totalPendencias ? (pendenciasPorGravidade.graves.length ? 'bad' : 'warn') : 'ok'} />
          <MetricRow label="Dado Defasado" value={municipio.dado_defasado ? 'Sim' : 'Nao'} status={municipio.dado_defasado ? 'bad' : 'ok'} />
          <MetricRow label="Score Bruto" value={municipio.score_bruto != null ? fmtNum(municipio.score_bruto, 2) : municipio.score != null ? fmtNum(municipio.score, 2) : '-'} />
        </MetricGroup>

        <MetricGroup title="Licitacoes e Dispensas">
          <MetricRow label="No. Licitacoes" value={municipio.n_licitacoes?.toLocaleString('pt-BR') || '-'} />
          <MetricRow label="Valor Homologado" value={fmtBRL(municipio.valor_homologado_total)} />
          <MetricRow label="Dispensas" value={municipio.n_dispensa?.toLocaleString('pt-BR') || '-'} />
          <MetricRow label="Valor em Dispensa" value={fmtBRL(municipio.valor_hom_dispensa)} />
          <MetricRow label="% Dispensa / Total" value={municipio.pct_dispensa != null ? fmtPct(Number(municipio.pct_dispensa) * 100) : '-'} status={statusByRange(municipio.pct_dispensa, { ok: 0.3, warn: 0.5, direction: 'lower' })} />
        </MetricGroup>
      </div>

      <div style={{ display: 'grid', gap: '8px', marginTop: '14px' }}>
        <DetailSectionTitle>Contribuicoes ao Score Final</DetailSectionTitle>
        {hasContributions ? (
          contributionRows.map((item) => (
            <ContributionBar
              key={item.label}
              label={item.label}
              value={item.value}
              max={item.max}
              displayValue={item.displayValue}
              exact={item.exact}
            />
          ))
        ) : (
          <div
            style={{
              color: 'var(--text-lo)',
              fontFamily: 'var(--sans)',
              fontSize: '0.78rem',
              lineHeight: 1.5,
              background: 'var(--bg-card-alt)',
              border: '1px solid var(--border-dim)',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            Contribuicoes indisponiveis para este municipio.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
        <DetailSectionTitle>
          Pendencias - {pendenciasPorGravidade.graves.length} grave(s) · {pendenciasPorGravidade.moderadas.length} moderada(s) ·{' '}
          {pendenciasPorGravidade.leves.length} leve(s)
        </DetailSectionTitle>
        {totalPendencias ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {alertasCauc.map((pendencia) => (
              <PendenciaTag key={pendencia.label} pendencia={pendencia} />
            ))}
          </div>
        ) : (
          <AlertaBadge label="REGULAR - sem pendencias federais" cor="var(--risk-baixo)" />
        )}
      </div>

      <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
        <DetailSectionTitle>Alertas de Qualidade do Dado</DetailSectionTitle>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {activeQualityFlags.length ? (
            activeQualityFlags.map((flag) => (
              <QualityFlag key={flag.label} label={flag.label} color={flag.color} />
            ))
          ) : (
            <QualityFlag label="Sem alertas de qualidade" color="var(--risk-baixo)" />
          )}
        </div>
      </div>
    </Painel>
  )
}

function ResumoEstadoPainel({ municipios, distribuicao, medianas, alertas }) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <Painel>
        <PainelTitulo>Resumo Estadual</PainelTitulo>
        <div
          style={{
            color: 'var(--text-lo)',
            fontFamily: 'var(--sans)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            marginBottom: '6px',
          }}
        >
          Selecione um municipio no mapa ou no ranking para abrir a leitura detalhada.
        </div>
      </Painel>

      <Painel>
        <PainelTitulo>Distribuicao por Faixa de Risco</PainelTitulo>
        {ORDEM_RISCO.map((classe) => {
          const total = municipios.length || 1
          const quantidade = distribuicao[classe] || 0
          const percentual = (quantidade / total) * 100
          const cor = CORES_RISCO[classe]

          return (
            <div
              key={classe}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-dim)',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: cor, minWidth: '52px', fontFamily: 'var(--sans)', fontWeight: 600 }}>{LABEL_RISCO[classe]}</span>
              <div
                style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  borderRadius: '999px',
                  height: '6px',
                }}
              >
                <div
                  style={{
                    width: `${percentual}%`,
                    height: '6px',
                    background: cor,
                    borderRadius: '999px',
                    transition: 'width 0.4s',
                  }}
                />
              </div>
              <span style={{ color: 'var(--text-mid)', minWidth: '26px', textAlign: 'right', fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {quantidade}
              </span>
              <span style={{ color: 'var(--text-lo)', minWidth: '34px', textAlign: 'right', fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {percentual.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </Painel>

      <Painel>
        <PainelTitulo>Indicadores - Mediana Estadual</PainelTitulo>
        {Object.entries(medianas).map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-dim)',
              fontSize: '0.82rem',
              gap: '10px',
            }}
          >
            <span style={{ color: 'var(--text-lo)', fontFamily: 'var(--sans)' }}>{label}</span>
            <span style={{ color: 'var(--text-hi)', fontWeight: 600, fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums lining-nums' }}>{value}</span>
          </div>
        ))}
      </Painel>

      <Painel>
        <PainelTitulo>Alertas por Tipo</PainelTitulo>
        {[
          { label: 'Dispensa > 30%', value: alertas.dispensa, cor: '#ef4444' },
          { label: 'Dado suspeito', value: alertas.suspeito, cor: '#f59e0b' },
          { label: 'Autonomia critica', value: alertas.autonomia, cor: '#f59e0b' },
          { label: 'RP cronico (>=5 anos)', value: alertas.cronicos, cor: '#ef4444' },
          { label: 'Dado defasado', value: alertas.defasado, cor: '#64748b' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-dim)',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-lo)',
                fontFamily: 'var(--sans)',
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--mono)',
                fontVariantNumeric: 'tabular-nums lining-nums',
                color: item.value > 0 ? item.cor : 'var(--text-lo)',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </Painel>
    </div>
  )
}

export default function DashboardPage({ uf, initialMunicipios = [] }) {
  const normalizedUf = normalizeUf(uf)
  const [municipios, setMunicipios] = useState(initialMunicipios)
  const [geoData, setGeoData] = useState(null)
    const [loading, setLoading] = useState(() => {
    // No servidor, se temos dados iniciais, não mostramos loading (para o Google indexar)
    if (typeof window === 'undefined') {
      return !initialMunicipios || initialMunicipios.length === 0
    }
    // No cliente, começamos com loading para evitar o "pop" de conteúdo incompleto
    return true
  })
  const [erro, setErro] = useState(null)
  const [filtroRisco, setFiltroRisco] = useState(new Set(ORDEM_RISCO))
  const [scoreRange, setScoreRange] = useState([0, 100])
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [munSelecionado, setMunSelecionado] = useState(null)
  const [sortField, setSortField] = useState('classificacao_canonica')
  const [sortAsc, setSortAsc] = useState(true)
  const [tabelaExpandida, setTabelaExpandida] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checar() {
      setIsMobile(window.innerWidth < 768)
    }

    checar()
    window.addEventListener('resize', checar)
    return () => window.removeEventListener('resize', checar)
  }, [])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      // Se já temos os municípios, não mostramos o loading (SEO/UX)
      // Mas ainda precisamos buscar o GeoJSON no cliente
      const temMunicipios = initialMunicipios?.length && municipios?.length && normalizedUf === municipios[0]?.uf
      
      if (!temMunicipios) {
        setLoading(true)
      }
      
      setErro(null)

      try {
        const promises = [fetchMunicipiosByUf(normalizedUf)]
        
        // Sempre buscamos o GeoJSON no cliente para não pesar o payload do servidor
        if (!geoData || normalizedUf !== geoData.uf_ref) {
          promises.push(fetchGeoJsonForUf(normalizedUf))
        }

        const [rows, geo] = await Promise.all(promises)

        if (!ativo) return

        const enriquecidos = rows.map((item) => ({
          ...item,
          classificacao_canonica: normalizeClassificacao(item.classificacao),
        }))

        setMunicipios(enriquecidos)
        if (geo) {
          setGeoData({ ...geo, uf_ref: normalizedUf })
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message || 'Erro ao carregar dados.')
        }
      } finally {
        if (ativo) {
          setLoading(false)
        }
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [normalizedUf])

  useEffect(() => {
    if (!munSelecionado) return
    const proximo = municipios.find((item) => item.cod_ibge === munSelecionado.cod_ibge) || null
    setMunSelecionado(proximo)
  }, [municipios, munSelecionado])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setBusca(buscaInput)
    }, 220)

    return () => window.clearTimeout(timeout)
  }, [buscaInput])

  const handleSort = useCallback((field) => {
    if (!field) return

    setSortField((anterior) => {
      if (anterior === field) {
        setSortAsc((valor) => !valor)
        return field
      }

      setSortAsc(true)
      return field
    })
  }, [])

  const buscaNormalizada = useMemo(() => normalizeText(busca.trim()), [busca])
  const buscaPendente = buscaInput !== busca

  const municipiosFiltrados = useMemo(() => {
    const filtrados = municipios.filter((municipio) => {
      const risco = municipio.classificacao_canonica || 'sem_dados'

      if (!filtroRisco.has(risco)) return false
      if (municipio.score != null && (municipio.score < scoreRange[0] || municipio.score > scoreRange[1])) return false
      if (buscaNormalizada && !normalizeText(municipio.ente).includes(buscaNormalizada)) return false

      return true
    })

    return [...filtrados].sort((left, right) => {
      if (sortField === 'classificacao_canonica') {
        const indexLeft = ordemRiscoIndex(left.classificacao_canonica)
        const indexRight = ordemRiscoIndex(right.classificacao_canonica)

        if (indexLeft !== indexRight) {
          return sortAsc ? indexLeft - indexRight : indexRight - indexLeft
        }

        return (Number(right.score) || -1) - (Number(left.score) || -1)
      }

      const valueLeft = left[sortField]
      const valueRight = right[sortField]

      if (valueLeft == null && valueRight == null) return 0
      if (valueLeft == null) return 1
      if (valueRight == null) return -1

      if (typeof valueLeft === 'string') {
        return sortAsc
          ? valueLeft.localeCompare(valueRight, 'pt-BR')
          : valueRight.localeCompare(valueLeft, 'pt-BR')
      }

      return sortAsc ? valueLeft - valueRight : valueRight - valueLeft
    })
  }, [municipios, filtroRisco, scoreRange, buscaNormalizada, sortField, sortAsc])

  const ibgesFiltrados = useMemo(
    () => new Set(municipiosFiltrados.map((municipio) => String(municipio.cod_ibge))),
    [municipiosFiltrados],
  )

  const comScore = useMemo(
    () => municipios.filter((municipio) => municipio.score != null && !Number.isNaN(Number(municipio.score))),
    [municipios],
  )

  const mediaEstado = useMemo(() => {
    if (!comScore.length) return null
    return comScore.reduce((total, municipio) => total + Number(municipio.score), 0) / comScore.length
  }, [comScore])

  const medianaEstado = useMemo(() => mediana(comScore.map((municipio) => municipio.score)), [comScore])

  const nBaixo = useMemo(
    () => municipios.filter((municipio) => municipio.classificacao_canonica === 'baixo').length,
    [municipios],
  )

  const nAlto = useMemo(
    () =>
      municipios.filter((municipio) =>
        ['alto', 'critico'].includes(municipio.classificacao_canonica),
      ).length,
    [municipios],
  )

  const nAlertas = useMemo(
    () =>
      municipios.filter(
        (municipio) =>
          municipio.alerta_dispensa ||
          municipio.dado_suspeito ||
          municipio.autonomia_critica ||
          municipio.dado_defasado ||
          Number(municipio.n_anos_cronicos) >= 5,
      ).length,
    [municipios],
  )

  const distribuicao = useMemo(() => {
    const contagem = { baixo: 0, medio: 0, alto: 0, critico: 0, sem_dados: 0 }

    municipios.forEach((municipio) => {
      const risco = municipio.classificacao_canonica || 'sem_dados'
      contagem[risco] += 1
    })

    return contagem
  }, [municipios])

  const medianas = useMemo(
    () => ({
      'Exec. Orcamentaria (%)': fmtPct(mediana(municipios.map((municipio) => municipio.eorcam_raw))),
      'RP Processados (%)': fmtPct(mediana(municipios.map((municipio) => municipio.rproc_pct_atual))),
      'Conformidade SICONFI':
        mediana(municipios.map((municipio) => municipio.qsiconfi)) != null
          ? fmtPct(mediana(municipios.map((municipio) => municipio.qsiconfi)) * 100, 0)
          : '-',
      'Lliq / Rec. (RGF A05)': fmtNum(mediana(municipios.map((municipio) => municipio.lliq_raw)), 3),
      'Autonomia Tributaria': fmtNum(mediana(municipios.map((municipio) => municipio.autonomia_media)), 3),
    }),
    [municipios],
  )

  const alertas = useMemo(
    () => ({
      dispensa: municipios.filter((municipio) => municipio.alerta_dispensa).length,
      suspeito: municipios.filter((municipio) => municipio.dado_suspeito).length,
      autonomia: municipios.filter((municipio) => municipio.autonomia_critica).length,
      cronicos: municipios.filter((municipio) => Number(municipio.n_anos_cronicos) >= 5).length,
      defasado: municipios.filter((municipio) => municipio.dado_defasado).length,
    }),
    [municipios],
  )

  const todosRiscosAtivos = ORDEM_RISCO.every((classe) => filtroRisco.has(classe))
  const scoreAlterado = scoreRange[0] !== 0 || scoreRange[1] !== 100
  const temFiltrosAtivos = !todosRiscosAtivos || scoreAlterado || Boolean(buscaInput.trim())

  const toggleRisco = useCallback((classe) => {
    setFiltroRisco((anterior) => {
      const anteriorEraTodos = ORDEM_RISCO.every((item) => anterior.has(item))
      if (anteriorEraTodos) return new Set([classe])

      const proximo = new Set(anterior)
      if (proximo.has(classe)) proximo.delete(classe)
      else proximo.add(classe)

      if (proximo.size === 0) return new Set(ORDEM_RISCO)
      return proximo
    })
  }, [])

  const limparFiltros = useCallback(() => {
    setFiltroRisco(new Set(ORDEM_RISCO))
    setScoreRange([0, 100])
    setBuscaInput('')
    setBusca('')
  }, [])

  const filtrarTodosRiscos = useCallback(() => {
    setFiltroRisco(new Set(ORDEM_RISCO))
  }, [])

  // SEO: Se temos dados, não retornamos antecipadamente com o loading, 
  // para que o Google sempre veja o conteúdo no HTML. 
  // O loading será tratado como um overlay no final do render.
  if (loading && (!municipios || municipios.length === 0)) {
    return (
      <div className="loading-state-container">
        <div className="loading-pulse-icon">
          <Map size={48} className="pulse" />
        </div>
        <h2 className="loading-text">Carregando dados do estado...</h2>
        <p className="loading-subtext">Buscando indicadores fiscais e malha geográfica municipal.</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--bg-page)',
          color: 'var(--risk-alto)',
          fontFamily: 'var(--mono)',
          fontSize: '0.8rem',
        }}
      >
        <span>ERRO AO CARREGAR DADOS</span>
        <span style={{ color: 'var(--text-lo)', fontSize: '0.7rem' }}>{erro}</span>
      </div>
    )
  }

  const sidebarConteudo = (
    <>
      {isMobile ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '10px',
          }}
        >
          <button
            onClick={() => setSidebarAberta(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-lo)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
      ) : null}

      <div>
        <div
          style={{
            fontSize: '0.76rem',
            color: 'var(--text-lo)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          Classificacao
        </div>
        {ORDEM_RISCO.map((classe) => {
          const ativo = filtroRisco.has(classe)
          const cor = CORES_RISCO[classe]

          return (
            <div
              key={classe}
              onClick={() => toggleRisco(classe)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '4px',
                background: ativo ? `${cor}14` : 'transparent',
                border: `1px solid ${ativo ? `${cor}44` : 'transparent'}`,
                opacity: ativo ? 1 : 0.6,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: ativo ? cor : 'var(--text-lo)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  color: ativo ? 'var(--text-hi)' : 'var(--text-lo)',
                  fontFamily: 'var(--sans)',
                  fontWeight: ativo ? 600 : 500,
                }}
              >
                {LABEL_RISCO[classe]}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.72rem',
                  color: 'var(--text-lo)',
                  fontFamily: 'var(--mono)',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {distribuicao[classe] || 0}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '12px', marginTop: '10px' }}>
        <div
          style={{
            fontSize: '0.76rem',
            color: 'var(--text-lo)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Score
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-mid)',
            marginBottom: '6px',
            fontFamily: 'var(--sans)',
            fontWeight: 500,
          }}
        >
          {scoreRange[0]} - {scoreRange[1]}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={scoreRange[0]}
          onChange={(event) => setScoreRange([Number(event.target.value), scoreRange[1]])}
          style={{ width: '100%', marginBottom: '3px', accentColor: 'var(--accent)' }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={scoreRange[1]}
          onChange={(event) => setScoreRange([scoreRange[0], Number(event.target.value)])}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '12px', marginTop: '10px' }}>
        <div
          style={{
            fontSize: '0.76rem',
            color: 'var(--text-lo)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Municipio
        </div>
        <input
          type="text"
          placeholder="Ex: Campina Grande"
          value={buscaInput}
          onChange={(event) => setBuscaInput(event.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: 'var(--text-hi)',
            fontSize: '0.9rem',
            fontFamily: 'var(--sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && municipios.length > 0 && (
        <div className="loading-state-overlay">
          <div className="loading-pulse-icon">
            <Map size={48} className="pulse" />
          </div>
          <h2 className="loading-text">Carregando mapa...</h2>
          <p className="loading-subtext">Processando malha geográfica municipal.</p>
        </div>
      )}
    </>
  )

  return (
    <>
      {isMobile && sidebarAberta ? (
        <div
          onClick={() => setSidebarAberta(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,24,39,0.22)',
            zIndex: 99,
          }}
        />
      ) : null}

      {isMobile ? (
        <aside
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            bottom: 0,
            width: '240px',
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 14px',
            overflowY: 'auto',
            transform: sidebarAberta ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            zIndex: 100,
          }}
        >
          {sidebarConteudo}
        </aside>
      ) : null}

      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 56px)',
          background: 'var(--bg-page)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '12px' : '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', gap: isMobile ? '10px' : '11px' }}>
            {isMobile ? (
              <button
                onClick={() => setSidebarAberta(true)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-hi)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontSize: '1rem',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                ≡
              </button>
            ) : null}

            <div
              style={{
                width: '3px',
                background: 'var(--accent)',
                borderRadius: '2px',
                flexShrink: 0,
                alignSelf: 'flex-start',
                height: isMobile ? '54px' : '82px',
              }}
            />

            <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: isMobile ? '0' : '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <h1
                    style={{
                      fontSize: isMobile ? '1.05rem' : '1.45rem',
                      fontWeight: 700,
                      color: 'var(--text-hi)',
                      fontFamily: 'var(--sans)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    Capacidade de Pagamento dos Municipios {stateNameWithArticle(normalizedUf)}
                  </h1>
                  <p
                    style={{
                      fontSize: isMobile ? '0.78rem' : '0.84rem',
                      color: 'var(--text-lo)',
                      fontFamily: 'var(--sans)',
                      marginTop: '4px',
                      marginBottom: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    Score de solvencia · {municipios.length} municipios · Referencia 2020-2026
                  </p>
                </div>

                {!isMobile ? (
                  <div style={{ width: 'min(360px, 34vw)', flexShrink: 0 }}>
                    <input
                      id="busca-municipio"
                      type="text"
                      placeholder="Buscar municipio..."
                      value={buscaInput}
                      onChange={(event) => setBuscaInput(event.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '38px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        color: 'var(--text-hi)',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--sans)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {!isMobile ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px 10px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '10px',
                  }}
                >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '28px',
                    color: 'var(--text-lo)',
                    fontFamily: 'var(--sans)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {municipiosFiltrados.length} de {municipios.length}
                  {buscaPendente ? <span style={{ color: 'var(--accent)' }}> · filtrando</span> : null}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <FilterChip
                    label="Todos"
                    count={municipios.length}
                    color="var(--accent)"
                    active={todosRiscosAtivos}
                    onClick={filtrarTodosRiscos}
                  />
                  {ORDEM_RISCO.map((classe) => (
                    <FilterChip
                      key={classe}
                      label={LABEL_RISCO[classe]}
                      count={distribuicao[classe] || 0}
                      color={CORES_RISCO[classe]}
                      active={!todosRiscosAtivos && filtroRisco.has(classe)}
                      onClick={() => toggleRisco(classe)}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '260px',
                  marginLeft: 'auto',
                }}
              >
                <span
                  style={{
                    color: 'var(--text-lo)',
                    fontFamily: 'var(--sans)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Score {scoreRange[0]}-{scoreRange[1]}
                </span>
                <div style={{ display: 'grid', gap: '2px', flex: 1, minWidth: '120px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreRange[0]}
                    onChange={(event) => setScoreRange([Number(event.target.value), scoreRange[1]])}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreRange[1]}
                    onChange={(event) => setScoreRange([scoreRange[0], Number(event.target.value)])}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
                {temFiltrosAtivos ? (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-mid)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontFamily: 'var(--sans)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
              gap: '8px',
            }}
          >
            <KPI label={`Score medio ${normalizedUf}`} value={mediaEstado ? mediaEstado.toFixed(1) : '-'} />
            <KPI label="Score mediano" value={medianaEstado ? medianaEstado.toFixed(1) : '-'} />
            <KPI label="Risco baixo" value={nBaixo} destaque="var(--risk-baixo)" />
            <KPI label="Alto + Critico" value={nAlto} destaque="var(--risk-alto)" />
            <div style={isMobile ? { gridColumn: '1 / -1' } : undefined}>
              <KPI label="Alertas ativos" value={nAlertas} destaque="var(--risk-medio)" />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
              height: isMobile ? 'auto' : '480px',
              minHeight: isMobile ? 'auto' : '480px',
            }}
          >
            <div
              style={{
                flex: isMobile ? 'none' : '1 1 0',
                height: isMobile ? '290px' : '100%',
                minWidth: 0,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 0,
              }}
            >
              {geoData ? (
                <MapaCoropletico
                  geoData={geoData}
                  municipios={municipios}
                  ibgesFiltrados={ibgesFiltrados}
                  corPorScore={corPorScore}
                  onSelect={setMunSelecionado}
                />
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-lo)',
                    fontFamily: 'var(--mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  MAPA NAO DISPONIVEL PARA {normalizedUf}
                </div>
              )}
            </div>

            <div
              style={{
                width: isMobile ? '100%' : '360px',
                minWidth: isMobile ? 'unset' : '360px',
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'nowrap',
                overflowY: isMobile ? 'visible' : 'auto',
              }}
            >
              {munSelecionado ? (
                <MunicipioSelecionado municipio={munSelecionado} onClear={() => setMunSelecionado(null)} />
              ) : (
                <ResumoEstadoPainel municipios={municipios} distribuicao={distribuicao} medianas={medianas} alertas={alertas} />
              )}
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                padding: '7px 12px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-header)',
                fontSize: '0.78rem',
                color: 'var(--text-lo)',
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span>
                Ranking - {tabelaExpandida ? municipiosFiltrados.length : Math.min(PREVIEW_LINHAS, municipiosFiltrados.length)} de{' '}
                {municipiosFiltrados.length} municipios
              </span>
              {!isMobile ? (
                <span style={{ color: 'var(--text-lo)' }}>
                  clique nas colunas para ordenar
                  {buscaInput ? (
                    <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>
                      {buscaPendente ? 'filtrando' : 'filtrado'}: "{buscaInput}"
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', lineHeight: 1.45 }}>
              <thead>
                <tr style={{ background: 'var(--bg-header)' }}>
                  {COLUNAS.map((coluna) => {
                    const ativo = sortField === coluna.field
                    const clicavel = coluna.field !== null

                    return (
                      <th
                        key={coluna.key}
                        onClick={() => {
                          if (clicavel) handleSort(coluna.field)
                        }}
                        style={{
                          padding: '10px 10px',
                          textAlign: 'left',
                          color: ativo ? 'var(--text-hi)' : 'var(--text-lo)',
                          fontWeight: 600,
                          fontSize: '0.74rem',
                          fontFamily: 'var(--sans)',
                          borderBottom: `1px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                          whiteSpace: 'nowrap',
                          cursor: clicavel ? 'pointer' : 'default',
                          userSelect: 'none',
                          transition: 'color 0.1s',
                        }}
                      >
                        {coluna.label}
                        {ativo ? <span style={{ marginLeft: '4px', opacity: 0.7 }}>{sortAsc ? '↑' : '↓'}</span> : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody>
                {(tabelaExpandida ? municipiosFiltrados : municipiosFiltrados.slice(0, PREVIEW_LINHAS)).map((municipio, index) => {
                  return (
                    <tr
                      key={municipio.cod_ibge || `${municipio.ente}-${index}`}
                      onClick={() => setMunSelecionado(municipio)}
                      style={{
                        borderBottom: '1px solid var(--border-dim)',
                        cursor: 'pointer',
                        background:
                          munSelecionado?.cod_ibge === municipio.cod_ibge
                            ? 'rgba(var(--accent-rgb), 0.12)'
                            : index % 2 === 0
                              ? 'var(--bg-card)'
                              : 'var(--bg-card-alt)',
                        transition: 'background 0.1s',
                      }}
                    >
                      <td style={{ padding: '10px 10px', color: 'var(--text-lo)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-hi)', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
                        {municipio.ente}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: corPorScore(municipio.score),
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {municipio.score != null ? Number(municipio.score).toFixed(1) : '-'}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <BadgeRisco classe={municipio.classificacao} />
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-mid)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {municipio.populacao?.toLocaleString('pt-BR') || '-'}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-mid)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {fmtPct(municipio.eorcam_raw)}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: Number(municipio.rproc_pct_atual) > 3 ? '#ef4444' : 'var(--text-mid)',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {fmtPct(municipio.rproc_pct_atual)}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-mid)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {municipio.qsiconfi != null ? fmtPct(Number(municipio.qsiconfi) * 100, 0) : '-'}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: Number(municipio.ccauc) > 0 ? '#ef4444' : 'var(--text-mid)',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {fmtNum(municipio.ccauc, 2)}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: Number(municipio.lliq_raw) < 0 ? '#ef4444' : 'var(--text-mid)',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {fmtNum(municipio.lliq_raw, 3)}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: Number(municipio.autonomia_media) < 0.08 ? '#f59e0b' : 'var(--text-mid)',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {fmtNum(municipio.autonomia_media, 3)}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-mid)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {municipio.n_licitacoes?.toLocaleString('pt-BR') || '-'}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-mid)', fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {fmtBRL(municipio.valor_homologado_total)}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'var(--sans)',
                          color: Number(municipio.pct_dispensa) > 0.3 ? '#ef4444' : 'var(--text-mid)',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {municipio.pct_dispensa != null ? fmtPct(Number(municipio.pct_dispensa) * 100) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {municipiosFiltrados.length > PREVIEW_LINHAS ? (
              <div
                onClick={() => setTabelaExpandida((valor) => !valor)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  cursor: 'pointer',
                  borderTop: '1px solid var(--border)',
                  color: 'var(--text-lo)',
                  fontFamily: 'var(--sans)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  background: 'var(--bg-header)',
                }}
              >
                {tabelaExpandida ? <span>▲ Colapsar - mostrar apenas top {PREVIEW_LINHAS}</span> : <span>▼ Ver todos os municipios</span>}
              </div>
            ) : null}
          </div>

        </main>
      </div>
      {loading && municipios.length > 0 && (
        <div className="loading-state-overlay">
          <div className="loading-pulse-icon">
            <Map size={48} className="pulse" />
          </div>
          <h2 className="loading-text">Carregando mapa...</h2>
          <p className="loading-subtext">Processando malha geográfica municipal.</p>
        </div>
      )}
    </>
  )
}
