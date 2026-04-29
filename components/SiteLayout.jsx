import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight } from 'lucide-react'
import SeoHead from './SeoHead'
import { navigationItems } from '../config/navigation'
import {
  buildBreadcrumbJsonLd,
  buildDatasetJsonLd,
  buildOrganizationJsonLd,
  siteConfig,
} from '../config/site'
import { ESTADOS } from '../lib/prototypeData'

const PATH_LABELS = {
  '/sobre': 'Sobre',
  '/dados': 'Dados',
  '/docs': 'Docs',
  '/relatorios': 'Relatórios',
  '/contato': 'Contato',
  '/privacidade': 'Privacidade',
  '/termos': 'Termos',
}

function normalizePath(value) {
  if (!value) return '/'
  const [pathWithoutQuery] = value.split('?')
  const [pathWithoutHash] = pathWithoutQuery.split('#')
  return pathWithoutHash || '/'
}

function resolveStateMeta(path) {
  if (!path.startsWith('/dados/')) return null

  const uf = path.split('/')[2]
  if (!uf) return null

  const requestedUf = uf.toUpperCase()
  const state = ESTADOS.find((item) => item.uf === requestedUf)

  return {
    uf: requestedUf,
    name: state?.nome || requestedUf,
    isActive: Boolean(state?.ativo),
  }
}

function buildDefaultRobots(path, stateMeta) {
  if (path === siteConfig.paths.contact || path === siteConfig.paths.privacy || path === siteConfig.paths.terms) {
    return 'noindex,follow'
  }

  if (stateMeta && !stateMeta.isActive) {
    return 'noindex,follow'
  }

  return 'index,follow'
}

function buildDefaultJsonLd(path, stateMeta) {
  if (path === siteConfig.paths.home) {
    return buildOrganizationJsonLd()
  }

  if (stateMeta) {
    return [
      buildBreadcrumbJsonLd([
        { name: 'Início', path: siteConfig.paths.home },
        { name: 'Dados', path: siteConfig.paths.data },
        { name: stateMeta.name, path },
      ]),
      buildDatasetJsonLd({
        name: `Score de Solvência Municipal — ${stateMeta.name}`,
        description: `Dashboard do ${siteConfig.brandName} para ${stateMeta.name}, com score de solvência municipal e distribuição de risco.`,
        path,
      }),
    ]
  }

  if (path === siteConfig.paths.data) {
    return [
      buildBreadcrumbJsonLd([
        { name: 'Início', path: siteConfig.paths.home },
        { name: 'Dados', path: siteConfig.paths.data },
      ]),
      buildDatasetJsonLd({
        name: 'Score de Solvência Municipal por estado',
        description:
          'Base do SolveLicita com dashboards estaduais e cobertura municipal do score de solvência.',
        path,
      }),
    ]
  }

  if (PATH_LABELS[path]) {
    return buildBreadcrumbJsonLd([
      { name: 'Início', path: siteConfig.paths.home },
      { name: PATH_LABELS[path], path },
    ])
  }

  return null
}

export default function SiteLayout({
  title,
  description,
  activeNav,
  canonicalPath,
  robots,
  jsonLd,
  ogType = 'website',
  children,
}) {
  const router = useRouter()
  const resolvedPath = canonicalPath || normalizePath(router.asPath || router.pathname)
  const stateMeta = resolveStateMeta(resolvedPath)
  const resolvedRobots = robots || buildDefaultRobots(resolvedPath, stateMeta)
  const resolvedJsonLd = jsonLd || buildDefaultJsonLd(resolvedPath, stateMeta)

  return (
    <>
      <SeoHead
        title={title}
        description={description}
        path={resolvedPath}
        robots={resolvedRobots}
        jsonLd={resolvedJsonLd}
        ogType={ogType}
      />

      <nav className="site-nav">
        <div className="nav-container">
          <Link className="nav-logo" href="/">
            <img 
              src="/assets/solvelicita-icon-light.png" 
              alt="SolveLicita Icon" 
              height="32" 
              style={{ objectFit: 'contain' }}
            />
            <div className="nav-brand-text">
              <span className="brand-solve">Solve</span>
              <span className="brand-licita">Licita</span>
            </div>
          </Link>

          <div className="nav-links">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                className={`nav-link ${activeNav === item.key ? 'active' : ''}`}
                href={item.href}
                aria-current={activeNav === item.key ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="nav-right">
            <Link href="/dados" className="nav-cta-button">
              <span>Painel</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </>
  )
}
