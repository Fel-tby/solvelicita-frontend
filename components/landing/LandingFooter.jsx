import Link from 'next/link'
import { buildFooterLabel, siteConfig } from '../../config/site'

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)' }}>
            SolveLicita
          </div>
          <p>
            Os dados são públicos. A forma que avaliamos, também.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <Link href="/docs">Docs</Link>
            <a href={siteConfig.methodologyUrl} target="_blank" rel="noopener noreferrer">Metodologia</a>
            <a href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div className="footer-col">
            <a href="mailto:contato@solvelicita.tech">contato@solvelicita.tech</a>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        {buildFooterLabel()}
      </div>
    </footer>
  )
}
