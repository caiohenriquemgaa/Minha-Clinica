import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { MainNav } from "@/components/main-nav"
import { getServerSession } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "EstetiTech - Sistema de Gestão",
  description: "Sistema completo de gestão para a sua clínica",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
export const revalidate = 3600

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession()
  const hasSession = Boolean(session)

  return (
    <html lang="pt-BR">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-background overflow-x-hidden`}>
        <MainNav hide={!hasSession} brand="EstetiTech" />
        <main className={`min-h-screen overflow-x-hidden ${hasSession ? "pt-20 lg:pt-20" : ""}`}>
          <Suspense fallback={null}>{children}</Suspense>
        </main>
        <Analytics />
      </body>
    </html>
  )
}
