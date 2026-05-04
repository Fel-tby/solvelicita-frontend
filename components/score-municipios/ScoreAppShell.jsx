import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Building2, Home, Info, Landmark, Map } from 'lucide-react'
import styles from './ScoreMunicipios.module.css'

const APP_NAME = 'Score Munic\u00edpios Brasil'
const APP_DESCRIPTION = 'Painel gratuito da SolveLicita para consultar scores, mapas e indicadores p\u00fablicos dos munic\u00edpios brasileiros.'
const SERVICE_WORKER_SCRIPT = `
  (function () {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/score-municipios-sw.js', {
      scope: '/score-municipios-brasil/'
    }).catch(function () {});
  })();
`

export default function ScoreAppShell({
  title = APP_NAME,
  description = APP_DESCRIPTION,
  path = '/score-municipios-brasil',
  children,
}) {
  const router = useRouter()
  const isStates = router.pathname === '/score-municipios-brasil/estados'
  const isUf = router.pathname === '/score-municipios-brasil/[uf]'
  const isHome = router.pathname === '/score-municipios-brasil'

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/score-municipios-sw.js', { scope: '/score-municipios-brasil/' }).catch(() => {})
  }, [])

  const canonical = `https://www.solvelicita.tech${path}`
  const fullTitle = title === APP_NAME ? APP_NAME : `${title} | ${APP_NAME}`

  return (
    <div className={styles.app}>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#185FA5" />
        <meta name="application-name" content={APP_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <link rel="canonical" href={canonical} />
        <link rel="manifest" href="/score-municipios-manifest.webmanifest" />
        <link rel="icon" href="/score-municipios-icon-192.png" />
        <link rel="apple-touch-icon" href="/score-municipios-icon-192.png" />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:locale" content="pt_BR" />
        <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_SCRIPT }} />
      </Head>

      <header className={styles.topbar}>
        <Link href="/score-municipios-brasil" className={styles.brand}>
          <img src="/logo.svg" alt="" className={styles.mark} />
          <span className={styles.brandText}>
            <span className={styles.name}>{APP_NAME}</span>
            <span className={styles.tagline}>Painel gratuito por SolveLicita</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Navegação do app">
          <Link href="/score-municipios-brasil" className={`${styles.navLink} ${isHome ? styles.activeNav : ''}`}><Home size={16} /> Brasil</Link>
          <Link href="/score-municipios-brasil/estados" className={`${styles.navLink} ${isStates ? styles.activeNav : ''}`}><Map size={16} /> Estados</Link>
          {isUf ? (
            <Link href={router.asPath} className={`${styles.navLink} ${styles.activeNav}`}><Building2 size={16} /> Municípios</Link>
          ) : (
            <span className={`${styles.navLink} ${styles.disabledNav}`} aria-disabled="true"><Building2 size={16} /> Municípios</span>
          )}
          <Link href="/docs" className={styles.navLink}><Landmark size={16} /> Metodologia</Link>
        </nav>

        <nav className={styles.windowActions} aria-label="Ações do app">
          <Link href="https://www.solvelicita.tech" className={styles.cta}>
            <Info size={16} /> Sobre a SolveLicita
          </Link>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <span>Dados públicos federais. Referência 2020-2026.</span>
        <span>
          {APP_NAME} por SolveLicita.{' '}
          <Link href="/score-municipios-brasil/privacidade">Privacidade</Link>
        </span>
      </footer>
    </div>
  )
}
