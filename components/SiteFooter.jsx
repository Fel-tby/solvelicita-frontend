import Link from 'next/link'
import { buildFooterLabel, siteConfig } from '../config/site'

export default function SiteFooter() {
  return (
    <footer className="landing-footer" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)' }}>
            {siteConfig.brandName}
          </div>
          <p>
            Os dados são públicos. A forma que avaliamos, também.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <Link href={siteConfig.paths.methodology}>Docs</Link>
            <Link href={`${siteConfig.paths.methodology}#metodologia`}>Metodologia</Link>
            <a href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div className="footer-col">
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            <Link href={siteConfig.paths.privacy}>Privacidade</Link>
            <Link href={siteConfig.paths.terms}>Termos</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        {buildFooterLabel()}
      </div>
    </footer>
  )
}

