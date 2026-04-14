'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/calendar', label: 'Content Calendar' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/ideas', label: 'AI Ideas' },
  { href: '/dashboard/schedule', label: 'AI Schedule' },
  { href: '/dashboard/tracker', label: 'Time Tracker' },
  { href: '/dashboard/chat', label: 'AI Chat' },
  { href: '/dashboard/analytics', label: 'Analytics' },
]

const adminNav = [
  { href: '/dashboard/admin', label: '⚙ Admin Panel' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-100 border border-gray-200"
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
        className={`w-56 min-h-screen border-r border-gray-200 bg-gray-50 flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform lg:transform-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="font-semibold text-gray-900">
          AI Content Planner
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ href, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </Link>
          )
        })}

        {/* Superuser-only admin section */}
        {user?.isSuperuser && (
          <div className="pt-2 mt-2 border-t border-gray-200">
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            {adminNav.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>
      <div className="p-2 border-t border-gray-200">
        {user && (
          <div className="px-3 py-1">
            <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
            {user.isSuperuser && (
              <span className="inline-block mt-0.5 text-xs font-medium text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                Superuser
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout()
            router.push('/login')
            router.refresh()
          }}
          className="w-full mt-1 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-200 rounded-lg"
        >
          Logout
        </button>
      </div>
    </aside>
    {open && (
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="lg:hidden fixed inset-0 z-30 bg-black/20"
        aria-label="Close menu"
      />
    )}
    </>
  )
}
