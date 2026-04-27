import { useState } from 'react'
import { CONTRIBUTION_AXES, CORES_RISCO, LABEL_RISCO } from './constants'
import {
  normalizeClassificacao,
  corPorScore,
  fmtNum,
  fmtPct,
  fmtBRL,
  statusByRange,
  statusColor,
  getMunicipioAlertasCauc,
  corPendenciaCauc,
  clampPercent,
} from './utils'
import ScoreRadar from './ScoreRadar'
import Semaforo from './Semaforo'

const TABS = [
  { id: 'visao', label: 'Visão Geral' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'licitacoes', label: 'Licitações' },
  { id: 'conformidade', label: 'Conformidade' },
]

function MetricRow({ label, value, status = 'na' }) {
  return (
    <div className="dash-ficha-metric-row">
      <span className="dash-ficha-metric-label">{label}</span>
      <span className="dash-ficha-metric-value" style={{ color: statusColor(status) }}>
        {value}
      </span>
    </div>
  )
}

function ContributionBar({ label, value, max, displayValue }) {
  const pct = max ? clampPercent((Number(value) / max) * 100) : 0
  const color = pct == null ? 'var(--risk-nd)' : pct >= 66 ? 'var(--risk-baixo)' : pct >= 33 ? 'var(--risk-medio)' : 'var(--risk-alto)'

  return (
    <div className="dash-ficha-contrib-row">
      <div className="dash-ficha-contrib-label">
        {label}
        <span className="dash-ficha-contrib-max"> / {max}</span>
      </div>
      <div className="dash-ficha-contrib-track">
        <div className="dash-ficha-contrib-fill" style={{ width: `${pct || 0}%`, background: color }} />
      </div>
      <div className="dash-ficha-contrib-value">{displayValue}</div>
    </div>
  )
}

function PendenciaTag({ pendencia }) {
  const gravidade = String(pendencia.gravidade || 'LEVE').toUpperCase()
  const color = corPendenciaCauc(gravidade)

  return (
    <span className="dash-ficha-pendencia" style={{ background: `${color}14`, borderColor: `${color}33`, color }}>
      <span className="dash-ficha-pendencia-dot" style={{ background: color }} />
      {pendencia.descricao || pendencia.label || 'Pendência federal'}
    </span>
  )
}

function TabVisaoGeral({ municipio }) {
  const contributionRows = CONTRIBUTION_AXES.map((item) => ({
    ...item,
    value: municipio[item.key],
    displayValue: municipio[item.key] != null ? fmtNum(municipio[item.key], 2) : '-',
  }))
  const hasContributions = contributionRows.some((item) => item.value != null)

  return (
    <div className="dash-ficha-tab-content">
      {/* Semáforo */}
      <Semaforo municipio={municipio} />

      {/* Radar + Contributions side by side */}
      <div className="dash-ficha-radar-section">
        <div className="dash-ficha-radar-chart">
          <ScoreRadar municipio={municipio} size={200} />
        </div>
        <div className="dash-ficha-contrib-list">
          <div className="dash-ficha-section-title">Contribuições ao Score</div>
          {hasContributions ? (
            contributionRows.map((item) => (
              <ContributionBar
                key={item.label}
                label={item.label}
                value={item.value}
                max={item.max}
                displayValue={item.displayValue}
              />
            ))
          ) : (
            <div className="dash-ficha-empty">Contribuições indisponíveis para este município.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabIndicadores({ municipio }) {
  return (
    <div className="dash-ficha-tab-content">
      <div className="dash-ficha-metrics-grid">
        <div className="dash-ficha-metric-group">
          <div className="dash-ficha-section-title">Indicadores Fiscais</div>
          <MetricRow label="Exec. Orçamentária" value={fmtPct(municipio.eorcam_raw)} status={statusByRange(municipio.eorcam_raw, { ok: 90, warn: 75 })} />
          <MetricRow label="Liquidez Líquida" value={fmtNum(municipio.lliq_raw, 4)} status={statusByRange(municipio.lliq_raw, { ok: 0.2, warn: 0.05 })} />
          <MetricRow label="Autonomia Fiscal" value={municipio.autonomia_media != null ? fmtPct(Number(municipio.autonomia_media) * 100) : '-'} status={statusByRange(municipio.autonomia_media, { ok: 0.15, warn: 0.05 })} />
          <MetricRow label="RP Processados" value={fmtPct(municipio.rproc_pct_atual)} status={statusByRange(municipio.rproc_pct_atual, { ok: 1, warn: 3, direction: 'lower' })} />
          <MetricRow label="Anos Crônicos" value={municipio.n_anos_cronicos != null ? municipio.n_anos_cronicos : '-'} status={statusByRange(municipio.n_anos_cronicos, { ok: 0, warn: 2, direction: 'lower' })} />
        </div>

        <div className="dash-ficha-metric-group">
          <div className="dash-ficha-section-title">Conformidade e Entrega</div>
          <MetricRow label="SICONFI" value={municipio.qsiconfi != null ? fmtPct(Number(municipio.qsiconfi) * 100, 0) : '-'} status={statusByRange(municipio.qsiconfi, { ok: 1, warn: 0.5 })} />
          <MetricRow label="CAUC" value={fmtNum(municipio.ccauc, 2)} status={statusByRange(municipio.ccauc, { ok: 0, warn: 0.25, direction: 'lower' })} />
          <MetricRow label="Dado Defasado" value={municipio.dado_defasado ? 'Sim' : 'Não'} status={municipio.dado_defasado ? 'bad' : 'ok'} />
          <MetricRow label="Score Bruto" value={municipio.score_bruto != null ? fmtNum(municipio.score_bruto, 2) : municipio.score != null ? fmtNum(municipio.score, 2) : '-'} />
        </div>
      </div>
    </div>
  )
}

function TabLicitacoes({ municipio }) {
  return (
    <div className="dash-ficha-tab-content">
      <div className="dash-ficha-metric-group">
        <div className="dash-ficha-section-title">Licitações e Dispensas</div>
        <MetricRow label="Nº Licitações" value={municipio.n_licitacoes?.toLocaleString('pt-BR') || '-'} />
        <MetricRow label="Valor Homologado" value={fmtBRL(municipio.valor_homologado_total)} />
        <MetricRow label="Dispensas" value={municipio.n_dispensa?.toLocaleString('pt-BR') || '-'} />
        <MetricRow label="Valor em Dispensa" value={fmtBRL(municipio.valor_hom_dispensa)} />
        <MetricRow
          label="% Dispensa / Total"
          value={municipio.pct_dispensa != null ? fmtPct(Number(municipio.pct_dispensa) * 100) : '-'}
          status={statusByRange(municipio.pct_dispensa, { ok: 0.3, warn: 0.5, direction: 'lower' })}
        />
      </div>
    </div>
  )
}

function TabConformidade({ municipio }) {
  const alertasCauc = getMunicipioAlertasCauc(municipio)
  const pendenciasPorGravidade = alertasCauc.reduce(
    (acc, p) => {
      const g = String(p.gravidade || 'LEVE').toUpperCase()
      if (g === 'GRAVE') acc.graves.push(p)
      else if (g === 'MODERADA') acc.moderadas.push(p)
      else acc.leves.push(p)
      return acc
    },
    { graves: [], moderadas: [], leves: [] },
  )
  const totalPendencias = alertasCauc.length

  const qualityFlags = [
    { label: 'Dado Suspeito', active: Boolean(municipio.dado_suspeito), color: '#f59e0b' },
    { label: 'Dado Defasado', active: Boolean(municipio.dado_defasado), color: '#64748b' },
    { label: 'Autonomia Crítica', active: Boolean(municipio.autonomia_critica), color: '#f59e0b' },
    { label: 'RP Crônico', active: Number(municipio.n_anos_cronicos) >= 5, color: '#ef4444' },
    { label: 'Alerta Dispensa', active: Boolean(municipio.alerta_dispensa), color: '#ef4444' },
  ]
  const activeFlags = qualityFlags.filter((f) => f.active)

  return (
    <div className="dash-ficha-tab-content">
      {/* Pendências */}
      <div className="dash-ficha-section-title">
        Pendências — {pendenciasPorGravidade.graves.length} grave(s) · {pendenciasPorGravidade.moderadas.length} moderada(s) · {pendenciasPorGravidade.leves.length} leve(s)
      </div>
      {totalPendencias ? (
        <div className="dash-ficha-pendencias-list">
          {alertasCauc.map((p) => (
            <PendenciaTag key={p.label} pendencia={p} />
          ))}
        </div>
      ) : (
        <div className="dash-ficha-regular-badge">✅ REGULAR — sem pendências federais</div>
      )}

      {/* Quality flags */}
      <div className="dash-ficha-section-title" style={{ marginTop: '16px' }}>Alertas de Qualidade</div>
      <div className="dash-ficha-pendencias-list">
        {activeFlags.length ? (
          activeFlags.map((f) => (
            <span
              key={f.label}
              className="dash-ficha-quality-flag"
              style={{ color: f.color, borderColor: `${f.color}44`, background: `${f.color}12` }}
            >
              {f.label}
            </span>
          ))
        ) : (
          <span
            className="dash-ficha-quality-flag"
            style={{ color: 'var(--risk-baixo)', borderColor: 'var(--risk-baixo)44', background: 'var(--risk-baixo)12' }}
          >
            Sem alertas de qualidade
          </span>
        )}
      </div>
    </div>
  )
}

export default function MunicipioFicha({ municipio, onClear }) {
  const [activeTab, setActiveTab] = useState('visao')

  if (!municipio) {
    return (
      <div className="dash-ficha dash-ficha-empty-state">
        <div className="dash-ficha-empty-title">Selecione um município</div>
        <div className="dash-ficha-empty-desc">
          Clique em um município no mapa ou no ranking para ver a ficha detalhada com score, indicadores e semáforo de decisão.
        </div>
      </div>
    )
  }

  const risco = normalizeClassificacao(municipio.classificacao)
  const cor = CORES_RISCO[risco] || 'var(--risk-nd)'

  return (
    <div className="dash-ficha">
      {/* Header */}
      <div className="dash-ficha-header">
        <div className="dash-ficha-header-left">
          <div className="dash-ficha-name">{municipio.ente}</div>
          <div className="dash-ficha-meta">
            {municipio.cod_ibge ? `IBGE ${municipio.cod_ibge}` : 'Código IBGE indisponível'} · {municipio.populacao?.toLocaleString('pt-BR') || '-'} hab.
          </div>
        </div>
        <div className="dash-ficha-header-right">
          {onClear && (
            <button type="button" className="dash-ficha-close" onClick={onClear}>
              ✕
            </button>
          )}
          <span className="dash-badge-risco" style={{ color: cor, background: `${cor}22`, borderColor: `${cor}44` }}>
            {LABEL_RISCO[risco] || 'S/D'}
          </span>
          <div className="dash-ficha-score" style={{ color: corPorScore(municipio.score) }}>
            {municipio.score != null ? Number(municipio.score).toFixed(1) : '-'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-ficha-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dash-ficha-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'visao' && <TabVisaoGeral municipio={municipio} />}
      {activeTab === 'indicadores' && <TabIndicadores municipio={municipio} />}
      {activeTab === 'licitacoes' && <TabLicitacoes municipio={municipio} />}
      {activeTab === 'conformidade' && <TabConformidade municipio={municipio} />}
    </div>
  )
}
