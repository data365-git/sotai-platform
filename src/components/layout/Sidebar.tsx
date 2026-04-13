'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Phone, CheckSquare, BarChart3, Settings, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLocale } from '@/hooks/useLocale'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLocale()

  const MAIN_NAV = [
    { href: '/analytics', label: t.nav.analytics, icon: BarChart3 },
    { href: '/', label: t.nav.leads, icon: Phone },
    { href: '/checklists', label: t.nav.checklists, icon: CheckSquare },
  ]

  const BOTTOM_NAV = [
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium',
          active
            ? 'bg-accent/15 text-accent border border-accent/25 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.05]'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 shrink-0 transition-colors',
            active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
          )}
        />
        {label}
      </Link>
    )
  }

  return (
    <aside className="flex flex-col h-full w-60 bg-bg-secondary border-r border-black/[0.06] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-black/[0.06]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/20 border border-accent/30">
          <Radio className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-base font-bold text-text-primary tracking-tight">SotAI</div>
          <div className="text-xs text-text-muted leading-none">Sales Intelligence</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {MAIN_NAV.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Bottom section: locale switcher + Settings + Demo badge */}
      <div className="px-3 py-3 border-t border-black/[0.06] space-y-2">
        <div className="px-1">
          <LocaleSwitcher />
        </div>
        {BOTTOM_NAV.map((item) => <NavLink key={item.href} {...item} />)}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-amber-400">{t.nav.demoMode}</div>
            <div className="text-[10px] text-amber-400/60 mt-0.5">v1.0 demo • sample leads</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
