'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Lightbulb,
  Clock,
  Timer,
  MessageSquare,
  BarChart2,
  Settings,
  ChevronDown
} from 'lucide-react'

const coreNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/schedule', label: 'Content Plan', icon: Clock },
]

const workInProgressNav = [
  { href: '/dashboard/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/ideas', label: 'AI Ideas', icon: Lightbulb },
  { href: '/dashboard/calendar', label: 'Content Calendar', icon: Calendar },
  { href: '/dashboard/tracker', label: 'Time Tracker', icon: Timer },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
]

const adminNav = [
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [wipOpen, setWipOpen] = useState(false)
  const showWip = Boolean(user?.isSuperuser)

  const isWipActive = workInProgressNav.some(item => pathname === item.href || pathname.startsWith(item.href))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-background p-2 text-foreground shadow-sm lg:hidden"
        aria-label="Toggle menu"
      >
        <span className="sr-only">Menu</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex min-h-screen w-64 flex-col border-r border-border bg-muted/30 backdrop-blur transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-border px-4 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight text-foreground">
            AI Content Planner
          </Link>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Workflow utama difokuskan ke Content Plan.</p>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
            {coreNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                active ? 'bg-foreground text-background shadow-sm' : 'text-foreground/80 hover:bg-background hover:text-foreground'
              }`}
              onClick={() => setOpen(false)}
            >
              <Icon 
                className={`mr-3 w-5 h-5 transition-transform duration-300 ${
                  active ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'
                }`} 
              />
              {label}
            </Link>
          )
            })}
          </div>

          {showWip && (
            <div className="space-y-1 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setWipOpen(!wipOpen)}
                className={`group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isWipActive ? 'bg-background text-foreground shadow-sm' : 'text-foreground/80 hover:bg-background hover:text-foreground'
                }`}
              >
                <ChevronDown
                  className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                    wipOpen ? 'rotate-180' : ''
                  } ${
                    isWipActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
                <span>Lab Superuser</span>
              </button>

              {wipOpen && (
                <div className="ml-3 space-y-1 border-l border-border pl-3">
                  {workInProgressNav.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          active ? 'bg-background text-foreground shadow-sm' : 'text-foreground/70 hover:bg-background hover:text-foreground'
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                            active ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'
                          }`}
                        />
                        {label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {user?.isSuperuser && (
            <div className="space-y-1 border-t border-border pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active ? 'bg-destructive text-destructive-foreground' : 'text-destructive hover:bg-destructive/10'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon 
                    className={`mr-3 w-5 h-5 transition-transform duration-300 ${
                      active ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'
                    }`} 
                  />
                  {label}
                </Link>
              )
            })}
            </div>
          )}
        </nav>
        <div className="border-t border-border p-3">
          {user && (
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="truncate text-xs text-muted-foreground" title={user.email}>{user.email}</p>
              {user.isSuperuser ? (
                <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                  Superuser
                </span>
              ) : null}
            </div>
          )}
        <button
          type="button"
          onClick={() => {
            logout()
            router.push('/login')
            router.refresh()
          }}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:bg-background hover:text-foreground"
        >
          Logout
        </button>
        </div>
      </aside>
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          aria-label="Close menu"
        />
      )}
    </>
  )
}
