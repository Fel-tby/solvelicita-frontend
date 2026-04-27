import { Users, BarChart2, AlertTriangle, Banknote, Bell, FileWarning } from 'lucide-react'

export default function KPIStrip({
  nMunicipios,
  scoreMedio,
  nRiscoAltoCritico,
  valorHomologado,
  nAlertasDispensa,
  nSemDados,
}) {
  const kpis = [
    {
      label: 'municípios analisados',
      value: nMunicipios,
      icon: <Users size={20} color="#3b82f6" />,
      bgIcon: 'rgba(59, 130, 246, 0.1)',
      borderTop: '#3b82f6',
    },
    {
      label: 'Score médio',
      value: scoreMedio != null ? scoreMedio.toFixed(1).replace('.', ',') : '-',
      icon: <BarChart2 size={20} color="#8b5cf6" />,
      bgIcon: 'rgba(139, 92, 246, 0.1)',
      borderTop: '#8b5cf6',
    },
    {
      label: 'em risco alto ou crítico',
      value: nRiscoAltoCritico,
      icon: <AlertTriangle size={20} color="#ef4444" />,
      bgIcon: 'rgba(239, 68, 68, 0.1)',
      borderTop: '#ef4444',
    },
    {
      label: 'homologados',
      value: valorHomologado, // already formatted by fmtValorHomologado
      icon: <Banknote size={20} color="#22c55e" />,
      bgIcon: 'rgba(34, 197, 94, 0.1)',
      borderTop: '#22c55e',
    },
    {
      label: 'alertas de dispensa',
      value: nAlertasDispensa,
      icon: <Bell size={20} color="#f97316" />,
      bgIcon: 'rgba(249, 115, 22, 0.1)',
      borderTop: '#f97316',
    },
    {
      label: 'sem dados PNCP',
      value: nSemDados,
      icon: <FileWarning size={20} color="#8b5cf6" />,
      bgIcon: 'rgba(139, 92, 246, 0.1)',
      borderTop: '#e2e8f0', // Neutral border as per mockup (greyish)
    },
  ]

  return (
    <div className="dash-v3-kpis">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="dash-v3-kpi-card" style={{ borderTop: `3px solid ${kpi.borderTop}` }}>
          <div className="dash-v3-kpi-header">
            <div className="dash-v3-kpi-icon-wrapper" style={{ background: kpi.bgIcon }}>
              {kpi.icon}
            </div>
            <div className="dash-v3-kpi-value-col">
              <span className="dash-v3-kpi-value">{kpi.value}</span>
              <span className="dash-v3-kpi-label">{kpi.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
