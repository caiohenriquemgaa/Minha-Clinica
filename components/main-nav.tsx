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
  Settings,
  Menu,
  ArrowLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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

export function MainNav({ hide, brand = "EstetiTech" }: MainNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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
      } catch {
        // Ignora erro de rede para não quebrar menu.
      }
    }

    if (!shouldHide) checkMaster()
  }, [shouldHide])

  if (shouldHide) return null

  const mobileTitle = getMobileTitle(pathname ?? "", brand)
  const hasBackButton = shouldShowBack(pathname ?? "")

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    window.location.assign("/login")
  }

  return (
    <>
      <nav className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:block">
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
            <Link
              href="/settings/whatsapp"
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-muted",
                pathname?.startsWith("/settings") ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut} className="ml-4 min-h-10">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 top-0 z-50 px-3 py-2 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-xl border bg-card/90 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center gap-1">
            {hasBackButton && (
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => router.back()} aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Abrir menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[84vw] max-w-sm p-0">
                <SheetHeader className="border-b px-4 py-4 text-left">
                  <SheetTitle>{brand}</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col gap-2 px-3 py-3">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname?.startsWith(item.href)
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    )
                  })}

                  {isMasterAdmin && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
                          pathname?.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <ShieldCheck className="h-5 w-5" />
                        Admin
                      </Link>
                    </SheetClose>
                  )}

                  <SheetClose asChild>
                    <Link
                      href="/settings/whatsapp"
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
                        pathname?.startsWith("/settings") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Settings className="h-5 w-5" />
                      Configurações
                    </Link>
                  </SheetClose>

                  <Button
                    variant="outline"
                    className="mt-2 min-h-11 justify-start"
                    onClick={async () => {
                      setMobileOpen(false)
                      await handleLogout()
                    }}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <p className="truncate px-2 text-sm font-semibold text-foreground">{mobileTitle}</p>
          <div className="w-10" aria-hidden />
        </div>
      </nav>
    </>
  )
}

function getMobileTitle(pathname: string, fallback: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  if (pathname.startsWith("/calendar")) return "Agenda"
  if (pathname.startsWith("/patients")) return "Pacientes"
  if (pathname.startsWith("/procedures")) return "Procedimentos"
  if (pathname.startsWith("/professionals")) return "Profissionais"
  if (pathname.startsWith("/equipment")) return "Equipamentos"
  if (pathname.startsWith("/anamnesis")) return "Anamneses"
  if (pathname.startsWith("/settings")) return "Configurações"
  if (pathname.startsWith("/admin")) return "Admin"
  return fallback
}

function shouldShowBack(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)
  return segment.length >= 2
}
