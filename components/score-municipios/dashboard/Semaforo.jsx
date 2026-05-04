import { calcularSemaforo } from './utils'

const STATUS_ICONS = {
  ok: '✅',
  warn: '⚠️',
  bad: '❌',
}

export default function Semaforo({ municipio }) {
  const { checks, veredito, vereditoColor } = calcularSemaforo(municipio)

  return (
    <div className="dash-semaforo">
      <div className="dash-semaforo-title">Semáforo de Decisão</div>
      <div className="dash-semaforo-checks">
        {checks.map((check, i) => (
          <div key={i} className={`dash-semaforo-check dash-semaforo-${check.status}`}>
            <span className="dash-semaforo-icon">{STATUS_ICONS[check.status]}</span>
            <span className="dash-semaforo-label">{check.label}</span>
          </div>
        ))}
      </div>
      <div className="dash-semaforo-verdict" style={{ color: vereditoColor, borderColor: vereditoColor }}>
        {veredito}
      </div>
    </div>
  )
}
