"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Calendar,
  Layers3,
  LayoutDashboard,
  Users2,
  Stethoscope,
  Boxes,
  ClipboardList,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { useTransition } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Agenda", icon: Calendar },
  { href: "/patients", label: "Pacientes", icon: Users2 },
  { href: "/professionals", label: "Profissionais", icon: Stethoscope },
  { href: "/procedures", label: "Procedimentos", icon: Layers3 },
  { href: "/equipment", label: "Equipamentos", icon: Boxes },
  { href: "/anamnesis", label: "Anamneses", icon: ClipboardList },
]

interface MainNavProps {
  hide?: boolean
  brand?: string
}

export function MainNav({ hide, brand = "Minha Clínica" }: MainNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const publicRoutes = ["/", "/login", "/register"]
  const shouldHide = hide || publicRoutes.includes(pathname ?? "")

  useEffect(() => {
    const checkMaster = async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setIsMasterAdmin(Boolean(data?.isMaster))
        }
      } catch (err) {
        // Silencia erros de rede para não quebrar o menu
      }
    }
    
    if (!shouldHide) {
      checkMaster()
    }
  }, [shouldHide])

  if (shouldHide) {
    return null
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    // Hard redirect after sign out so the server/middleware state is fresh
    window.location.assign('/login')
  }

  return (
    <nav className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex flex-col">
          <span className="text-sm font-semibold text-primary">{brand}</span>
          <span className="text-xs text-muted-foreground">Central da clínica</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-muted",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          {isMasterAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-muted",
                pathname?.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut} className="ml-4">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}
