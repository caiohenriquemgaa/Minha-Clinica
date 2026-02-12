# ⚙️ Configuração Passo a Passo

## Passo 1: Executar SQL no Supabase (2 minutos)

### 1.1 Acessar Supabase
```
https://app.supabase.com
→ Seu projeto
→ SQL Editor
→ New Query
```

### 1.2 Cole o SQL
Copie todo o conteúdo de `scripts/23-whatsapp-sessions-table.sql` e cole na query

### 1.3 Execute
Clique em "Run" (ou Ctrl+Enter)

Resultado esperado:
```
Query executed successfully

Tables:
- whatsapp_sessions (created)
- whatsapp_send_logs (created)

Policies:
- RLS enabled on whatsapp_sessions
- RLS enabled on whatsapp_send_logs
```

---

## Passo 2: Configurar Variáveis de Ambiente (2 minutos)

### 2.1 Arquivo `.env.local` (desenvolvimento)
```bash
# Abra o arquivo .env.local e adicione:
CRON_SECRET=meu-super-secret-token-123456789
```

**Nota**: Use um token aleatório real. Pode gerar assim:
```bash
# PowerShell:
[guid]::NewGuid().ToString()

# Ou online: https://www.uuidgenerator.net
```

### 2.2 Verificar variáveis existentes
Seu `.env.local` deve ter:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  ← Crucial para Cron Job
CRON_SECRET=...                 ← Acabou de adicionar
```

Se não tiver `SUPABASE_SERVICE_ROLE_KEY`:
1. Supabase > Settings > API
2. Copie "service_role" (não anon!)
3. Adicione em `.env.local`

### 2.3 Vercel (para deploy)
```
https://vercel.com
→ Seu projeto
→ Settings
→ Environment Variables
→ Add
```

Adicione as mesmas variáveis:
```
CRON_SECRET = meu-super-secret-token-123456789
SUPABASE_SERVICE_ROLE_KEY = eyJ...
NEXT_PUBLIC_SUPABASE_URL = https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

---

## Passo 3: Testar Localmente (10 minutos)

### 3.1 Instalar dependências
```bash
cd c:\Users\Caio\Downloads\jmestetica

# Verificar se Baileys está instalado
pnpm list @adiwajshing/baileys

# Se não estiver, instale:
pnpm add @adiwajshing/baileys qrcode.react
```

### 3.2 Iniciar app
```bash
pnpm dev

# Espere até ver:
# ▲ Next.js 14.x
# - Local: http://localhost:3000
```

### 3.3 Acessar Settings
```
http://localhost:3000/settings/whatsapp
```

Você deve ver:
- Título "Configurar WhatsApp"
- Botão verde "Conectar WhatsApp"

### 3.4 Testar Conexão
1. Clique "Conectar WhatsApp"
2. Espere 2-3 segundos (QR está sendo gerado)
3. Você deve ver um QR code
4. Use **OUTRO celular** (não seu WhatsApp principal!)
5. Escaneia o QR com WhatsApp
6. Após ~5 segundos, deve mudar para "Conectado com sucesso!"

### 3.5 Testar Desconexão
1. Clique "Desconectar"
2. Confirme no popup
3. Deve voltar para "Desconectado"

---

## Passo 4: Testar Envio de Lembretes (5 minutos)

### 4.1 Obter JWT Token
No navegador enquanto está logado:

```javascript
// Abra console (F12)
// Cole isso:
const session = await fetch('/api/auth/session').then(r => r.json())
const token = session.user?.user_metadata?.token || session.access_token
console.log("Token:", token)
// Copie o resultado
```

### 4.2 Criar Lembrete de Teste
```bash
# PowerShell:
$token = "seu-token-jwt-aqui"
$body = @{
    "patient_phone" = "+5512987654321"
    "patient_name" = "João"
    "message" = "Seu agendamento é amanhã às 10h!"
    "scheduled_at" = (Get-Date).ToUniversalTime().ToString("O")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/reminders" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

Resultado esperado:
```json
{
  "id": "uuid...",
  "status": "pending",
  "created_at": "2025-01-20T..."
}
```

### 4.3 Disparar Cron Job Manualmente
```bash
$secret = "seu-cron-secret"

Invoke-WebRequest -Uri "http://localhost:3000/api/cron/send-reminders" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $secret"
  }
```

Resultado esperado:
```json
{
  "success": true,
  "message": "Reminders processed",
  "data": {
    "success": true,
    "sent": 1,
    "failed": 0
  }
}
```

### 4.4 Verificar se a mensagem foi enviada
- Verifique o número +5512987654321 (aquele outro celular)
- Deve ter recebido uma mensagem WhatsApp

Se não recebeu:
- Verificar console do navegador (F12)
- Verificar Supabase > SQL > checar tabela `whatsapp_send_logs`
- Ver qual foi o erro

---

## Passo 5: Deploy em Vercel (5 minutos)

### 5.1 Fazer Commit
```bash
cd c:\Users\Caio\Downloads\jmestetica

git add .
git commit -m "feat: WhatsApp integration with Baileys (QR scanner, auto reminders)"
git push origin main
```

### 5.2 Vercel faz deploy automático
```
https://vercel.com > seu-projeto > Deployments
```

Espere até dizer "✓ Ready"

### 5.3 Testar em Produção
```
https://seu-projeto.vercel.app/settings/whatsapp
```

Deve funcionar igual ao local

### 5.4 Testar Cron Job
```bash
# Copie a URL do seu Vercel e rode:
curl -X GET https://seu-projeto.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer seu-cron-secret"
```

Resultado esperado: `{"success": true, ...}`

### 5.5 Ativar Cron (Opcional, já está no vercel.json)
```
Vercel > Settings > Cron Jobs
```

Deve mostrar:
```
/api/cron/send-reminders
Schedule: */1 * * * * (every 1 minute)
```

---

## Passo 6: Monitorar em Produção

### 6.1 Logs de Cron
```
Vercel > Deployments > Function Logs > send-reminders
```

Você verá:
```
[Cron] Starting reminder dispatch job...
[Reminders] Found 1 reminders to send
[Reminders] Sent reminder uuid-123 to +5512987654321
[Cron] Job completed: { sent: 1, failed: 0 }
```

### 6.2 Logs de Envio
```
Supabase > SQL Editor > Query:
SELECT * FROM whatsapp_send_logs 
ORDER BY sent_at DESC 
LIMIT 10;
```

Colunas importantes:
- `status`: success | failed | error | retry
- `error_message`: motivo se falhou
- `sent_at`: quando foi enviado

### 6.3 Status de Reminders
```
Supabase > SQL Editor > Query:
SELECT id, patient_phone, status, attempts, sent_at 
FROM reminders 
ORDER BY created_at DESC;
```

Status possíveis:
- `pending`: Aguardando envio
- `processing`: Sendo enviado agora
- `sent`: ✅ Enviado com sucesso
- `failed`: ❌ Falhou após 3 tentativas

---

## 🆘 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| QR code não aparece | JWT token inválido. Faça logout/login novamente |
| "WhatsApp not connected" | User precisa escanear QR novamente em /settings/whatsapp |
| Reminders não são enviados | Verificar se `SUPABASE_SERVICE_ROLE_KEY` está em .env.local |
| Cron job retorna 401 | Verificar se `CRON_SECRET` está correto |
| Baileys é bloqueado pelo WhatsApp | Usar outro número de celular ou esperar 24h |

---

## ✅ Checklist Final

- [ ] SQL script 23 executado no Supabase
- [ ] `CRON_SECRET` adicionada em `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (se não estava)
- [ ] `pnpm dev` roda sem erros
- [ ] Conseguiu conectar WhatsApp em /settings/whatsapp
- [ ] Testou envio de reminder manualmente
- [ ] Testou cron job em localhost
- [ ] Fez push para git (Vercel faz deploy automático)
- [ ] Adicionou env vars no Vercel Dashboard
- [ ] Testou em produção (https://seu-projeto.vercel.app)

---

**🎉 Depois disso, a integração estará 100% funcional!**

Qualquer dúvida, verifique:
- `docs/WHATSAPP_QUICK_START.md` (resumido)
- `docs/whatsapp-integration.md` (completo)
