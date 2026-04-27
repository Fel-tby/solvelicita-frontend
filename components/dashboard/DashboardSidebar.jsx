import Link from 'next/link'
import { LayoutDashboard, Building2, BarChart3, Bell, FileText, Star, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: null, active: true },
  { icon: Building2, label: 'Municípios', href: '/dados', active: false },
  { icon: BarChart3, label: 'Análises', href: null, disabled: true },
  { icon: Bell, label: 'Alertas', href: null, disabled: true },
  { icon: FileText, label: 'Relatórios', href: '/relatorios', active: false },
  { icon: null, label: 'divider' },
  { icon: Star, label: 'Favoritos', href: null, disabled: true },
  { icon: Settings, label: 'Configurações', href: null, disabled: true },
]

export default function DashboardSidebar() {
  return (
    <aside className="dash-sidebar">
      <nav className="dash-sidebar-nav">
        {NAV_ITEMS.map((item, idx) => {
          if (item.label === 'divider') {
            return <div key={idx} className="dash-sidebar-divider" />
          }

          const Icon = item.icon
          const classes = [
            'dash-sidebar-item',
            item.active ? 'active' : '',
            item.disabled ? 'disabled' : '',
          ].filter(Boolean).join(' ')

          const content = (
            <>
              <Icon size={20} />
              <span className="dash-sidebar-tooltip">{item.label}</span>
            </>
          )

          if (item.href && !item.disabled) {
            return (
              <Link key={idx} href={item.href} className={classes} title={item.label}>
                {content}
              </Link>
            )
          }

          return (
            <div key={idx} className={classes} title={item.disabled ? 'Em breve' : item.label}>
              {content}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
