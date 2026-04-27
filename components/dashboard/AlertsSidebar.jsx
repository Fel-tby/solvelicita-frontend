import { AlertTriangle, Bell, Clock, FileWarning, Banknote, ShieldAlert, ArrowRight } from 'lucide-react'

export default function AlertsSidebar({ nCritico, nDispensa, nDefasado, nSemDados, nAtrasos, nBloqueioAutonomia, applyFilter }) {
  const alerts = [
    {
      id: 'critico',
      count: nCritico,
      label: 'municípios em situação crítica',
      icon: <AlertTriangle size={16} />,
      color: '#ef4444',
      filterAction: () => applyFilter('sinal', 'critico'),
    },
    {
      id: 'atrasos',
      count: nAtrasos,
      label: 'municípios com acúmulo de atrasos a fornecedores',
      icon: <Banknote size={16} />,
      color: '#dc2626',
      filterAction: () => applyFilter('sinal', 'atrasos'),
    },
    {
      id: 'bloqueio',
      count: nBloqueioAutonomia,
      label: 'municípios bloqueados e sem autonomia fiscal',
      icon: <ShieldAlert size={16} />,
      color: '#7c3aed',
      filterAction: () => applyFilter('sinal', 'bloqueio'),
    },
    {
      id: 'dispensa',
      count: nDispensa,
      label: 'municípios com alerta de dispensa',
      icon: <Bell size={16} />,
      color: '#f97316',
      filterAction: () => applyFilter('sinal', 'dispensa'),
    },
    {
      id: 'defasado',
      count: nDefasado,
      label: 'municípios com dado defasado',
      icon: <Clock size={16} />,
      color: '#f59e0b',
      filterAction: () => applyFilter('sinal', 'defasado'),
    },
    {
      id: 'pncp',
      count: nSemDados,
      label: 'municípios sem dados PNCP',
      icon: <FileWarning size={16} />,
      color: '#8b5cf6',
      filterAction: () => applyFilter('sinal', 'pncp'),
    },
  ]

  return (
    <div className="dash-v3-alerts-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Bell size={14} color="var(--text-mid)" />
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0, color: 'var(--text-hi)' }}>Sinais de atenção</h3>
      </div>

      {alerts.map((alert) => (
        <div key={alert.id} className="dash-v3-alert-card" style={{ borderLeft: `3px solid ${alert.color}` }}>
          <div className="dash-v3-alert-header">
            <div className="dash-v3-alert-icon" style={{ backgroundColor: `${alert.color}10`, color: alert.color }}>
              {alert.icon}
            </div>
            <div className="dash-v3-alert-content">
              <h3>{alert.count}</h3>
              <p>{alert.label}</p>
            </div>
          </div>
          {alert.filterAction && (
            <button
              onClick={alert.filterAction}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: alert.color, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.7rem', fontWeight: 600,
                fontFamily: 'var(--sans)',
              }}
            >
              Ver detalhes <ArrowRight size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

