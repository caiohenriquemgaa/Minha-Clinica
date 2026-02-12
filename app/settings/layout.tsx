'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Settings, MessageSquare } from 'lucide-react'

const settingsPages = [
  { href: '/settings/whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-2">
            {settingsPages.map((page) => {
              const Icon = page.icon
              const isActive = pathname === page.href

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {page.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  )
}
