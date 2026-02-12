"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Phone } from "lucide-react"

export default function TrialExpiredPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>Período de testes encerrado</CardTitle>
          <CardDescription>
            O período demo de 7 dias finalizou. Entre em contato para ativar seu plano e continuar usando o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum dado foi excluído. Assim que o pagamento for confirmado, sua clínica volta a ter acesso completo.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="gap-2"
              onClick={() => window.open("https://wa.me/5544997139390?text=Quero%20ativar%20Minha%20Clínica", "_blank")}
            >
              <Phone className="h-4 w-4" />
              Falar no WhatsApp
            </Button>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
