export default function ScoreLegend() {
  return (
    <div className="landing-section">
      <h3 className="landing-section-title">Como interpretar o score</h3>
      <p className="landing-section-subtitle">
        Quanto menor o score, maior o risco estrutural de inadimplência.
      </p>
      
      <div className="score-legend-pills">
        <div className="score-pill pill-baixo">
          <strong>BAIXO</strong> ≥ 80
        </div>
        <div className="score-pill pill-medio">
          <strong>MÉDIO</strong> 60–79
        </div>
        <div className="score-pill pill-alto">
          <strong>ALTO</strong> 40–59
        </div>
        <div className="score-pill pill-critico">
          <strong>CRÍTICO</strong> {'< 40'}
        </div>
        <div className="score-pill pill-nd">
          <strong>S/D</strong> sem dados
        </div>
      </div>
    </div>
  )
}
