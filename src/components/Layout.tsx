import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useApp } from '../lib/store'
import { Icon } from './ui/Icon'
import { cn } from '../lib/cn'

const nav = [
  { to: '/', label: 'Гараж', icon: 'bike' as const },
  { to: '/settings', label: 'Настройки', icon: 'settings' as const },
]

export function Layout({ children }: { children: ReactNode }) {
  const riders = useApp((s) => s.riders)
  const activeRiderId = useApp((s) => s.activeRiderId)
  const setActiveRider = useApp((s) => s.setActiveRider)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-3 sm:px-5">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-acid/30 bg-acid/10 text-acid">
              <Icon name="bike" size={18} />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[13px] font-bold uppercase tracking-[0.18em] text-ink">
                Bikesetup
              </span>
              <span className="hidden text-[9.5px] uppercase tracking-[0.14em] text-dim sm:block">
                гараж · подвеска · давление
              </span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors',
                    isActive ? 'bg-white/5 text-ink' : 'text-dim hover:text-ink',
                  )
                }
              >
                <Icon name={item.icon} size={14} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {riders.length > 0 && (
              <label className="relative flex items-center">
                <Icon
                  name="user"
                  size={13}
                  className="pointer-events-none absolute left-2.5 text-acid"
                />
                <select
                  value={activeRiderId}
                  onChange={(e) => setActiveRider(e.target.value)}
                  aria-label="Активный райдер"
                  className="appearance-none rounded-full border border-line-strong bg-surface-2 py-1.5 pl-7 pr-7 font-mono text-[10.5px] text-ink transition-colors hover:border-line-strong/80 focus:border-acid focus:outline-none"
                >
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.weightKg} кг
                    </option>
                  ))}
                </select>
                <Icon
                  name="chevron-down"
                  size={12}
                  className="pointer-events-none absolute right-2 text-dim"
                />
              </label>
            )}
            <Link
              to="/settings"
              aria-label="Настройки"
              className="grid h-8 w-8 place-items-center rounded-full border border-line-strong text-dim transition-colors hover:border-line-strong hover:text-ink sm:hidden"
            >
              <Icon name="settings" size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-5 sm:px-5 sm:py-7">{children}</main>

      <footer className="mt-6 border-t border-line/60">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 px-3 py-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim sm:px-5">
          <span>Bikesetup · локальный гараж, данные только в вашем браузере</span>
          <span>Расчёты — стартовая точка, не заменяют мануал производителя</span>
        </div>
      </footer>
    </div>
  )
}
