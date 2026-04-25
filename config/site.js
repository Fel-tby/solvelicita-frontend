export const siteConfig = {
  brandName: 'SolveLicita',
  brand: {
    leading: 'Solve',
    accent: 'Licita',
  },
  foundedYear: 2026,
  siteUrl: 'https://solvelicita.tech',
  repoUrl: 'https://github.com/Fel-tby/solvelicita',
  githubLabel: 'github.com/Fel-tby/solvelicita',
  contactEmail: 'contato@solvelicita.tech',
  license: 'AGPL-3.0',
  footerRegion: 'Paraíba',
  pilotRegion: 'Paraíba',
  legalName: 'SOLVELICITA INTELIGENCIA DE RISCO EM LICITACOES INOVA SIMPLES (I.S.)',
  cnpj: '66.418.109/0001-51',
  paths: {
    home: '/',
    about: '/sobre',
    data: '/dados',
    docs: '/docs',
    reports: '/relatorios',
    methodology: '/docs',
    contact: '/contato',
    privacy: '/privacidade',
    terms: '/termos',
  },
}

export function buildPageTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | ${siteConfig.brandName}` : siteConfig.brandName
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(path, siteConfig.siteUrl).toString()
}

export function buildFooterLabel(region = siteConfig.footerRegion) {
  const base = `${siteConfig.brandName} · ${siteConfig.foundedYear} · ${region}`
  return siteConfig.cnpj ? `${base} · CNPJ ${siteConfig.cnpj}` : base
}

export function buildOrganizationJsonLd() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.brandName,
    url: siteConfig.siteUrl,
    email: siteConfig.contactEmail,
    sameAs: [siteConfig.repoUrl],
  }
  if (siteConfig.cnpj) json.taxID = siteConfig.cnpj
  if (siteConfig.legalName) json.legalName = siteConfig.legalName
  return json
}

export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  }
}

export function buildDatasetJsonLd({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: buildAbsoluteUrl(path),
    creator: {
      '@type': 'Organization',
      name: siteConfig.brandName,
      url: siteConfig.siteUrl,
    },
    isAccessibleForFree: true,
    license: 'https://www.gnu.org/licenses/agpl-3.0.en.html',
  }
}
