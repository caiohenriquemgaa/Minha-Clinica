# 🚀 WhatsApp Integration - Próximos Passos

## ✅ Concluído nesta sessão

- [x] Instalado `@adiwajshing/baileys` e `qrcode.react`
- [x] Criado `WhatsAppManager` (gerenciador Baileys com suporte multi-org)
- [x] Criadas 3 rotas API: `/api/whatsapp/initialize`, `/status`, `/disconnect`
- [x] Criada página de settings `/app/settings/whatsapp/page.tsx`
- [x] Criado serviço de envio de lembretes `lib/whatsapp-reminder-sender.ts`
- [x] Criado Cron Job `app/api/cron/send-reminders/route.ts`
- [x] Criado `vercel.json` para scheduling automático

## 🔧 Problemas conhecidos & Soluções

### 1. **Baileys é POC-grade (não é recomendado para produção)**
- ⚠️ Baileys pode ser bloqueado pelo WhatsApp a qualquer momento
- ✅ **Solução**: Implementado fallback para futura integração com Twilio (comentado no código)
- 📌 **Recomendação para produção**: Migrar para Twilio/WhatsApp API oficial quando possível

### 2. **WhatsAppManager precisa ser inicializado para cada organização**
- ⚠️ Conexão é perdida se o app é redeployado
- ✅ **Solução**: Credenciais (auth_state) são salvos em DB, restaurados automaticamente
- 📌 **Nota**: User precisa reconectar após deploy no Vercel

### 3. **Cron Job só funciona em Vercel (serverless)**
- ⚠️ Não funciona em desenvolvimento local
- ✅ **Solução para dev**: Use Next.js `unstable_after()` ou worker externo
- 📌 **Para testar localmente**: Use `curl` ou Postman para chamar o endpoint manualmente

## 📋 Checklist antes de deploy

### Banco de Dados
- [ ] Executar `scripts/23-whatsapp-sessions-table.sql` (if not done)
- [ ] Executar `scripts/22-implement-saas-rls-policies.sql` (if not done)
- [ ] Verificar se tabelas `whatsapp_sessions` e `whatsapp_send_logs` existem

### Código
- [ ] Verificar imports em `lib/whatsapp-reminder-sender.ts` (supabase client)
- [ ] Testar página `/settings/whatsapp` localmente
- [ ] Testar conexão API manualmente (veja seção de testes)

### Variáveis de Ambiente
- [ ] Adicionar `CRON_SECRET=<seu-token-secreto>` em `.env.local` e Vercel
- [ ] Verificar `SUPABASE_SERVICE_ROLE_KEY` está configurada

## 🧪 Testando Localmente

### 1. Iniciar o app
```bash
cd c:\Users\Caio\Downloads\jmestetica
pnpm dev
```

### 2. Testar página de settings
```
http://localhost:3000/settings/whatsapp
```
Deve exibir botão "Conectar WhatsApp"

### 3. Testar API de inicialização manualmente (com token JWT)
```bash
# 1. Obter token JWT do seu usuário (console do navegador: await session.access_token)
TOKEN="seu-jwt-token-aqui"

# 2. Chamar endpoint de inicialização
curl -X POST http://localhost:3000/api/whatsapp/initialize \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada:
# {
#   "qr": "data:image/png;base64,...",
#   "status": "scanning"
# }
```

### 4. Testar polling de status
```bash
curl http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada:
# {
#   "status": "scanning|connected|disconnected",
#   "qr": "data:image/png;base64,..." (if scanning),
#   "phone": "+5512345678" (if connected)
# }
```

### 5. Testar envio de lembretes (manual)
```bash
# Criar um lembrete de teste
curl -X POST http://localhost:3000/api/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_phone": "+55XXXXXXXXXX",
    "patient_name": "João",
    "message": "Seu agendamento é amanhã!",
    "scheduled_at": "2025-01-19T10:00:00Z"
  }'

# Verificar se foi criado
curl http://localhost:3000/api/reminders \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Chamar Cron Job manualmente para testar envio
```bash
# No .env.local, use qualquer valor como CRON_SECRET
CRON_SECRET="test-secret"

# Depois chame:
curl http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer test-secret"
```

## 🚀 Deploy em Vercel

### 1. Configurar variáveis de ambiente
```
Na aba "Settings" > "Environment Variables" adicione:
- CRON_SECRET: <gere um token aleatório seguro>
- SUPABASE_SERVICE_ROLE_KEY: <sua service role key>
- Outras vars do .env.local
```

### 2. Configurar Cron Job
O `vercel.json` já está configurado com:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

Isso executa a cada 1 minuto. Para ajustar a frequência, modifique `schedule`:
- `*/5 * * * *` = a cada 5 minutos
- `*/30 * * * *` = a cada 30 minutos
- `0 * * * *` = a cada hora

### 3. Fazer deploy
```bash
git add .
git commit -m "feat: add WhatsApp integration with Baileys"
git push origin main
```

## 📊 Monitoramento em Produção

### Logs do Cron Job
- Vercel Dashboard > Deployments > Function Logs > Cron Jobs
- Procure por `[Cron]` nas mensagens

### Logs de Envio
- Supabase > `whatsapp_send_logs` table
- Campos: `status` (success|failed|error|retry), `error_message`

### Status de Lembretes
- Supabase > `reminders` table
- Campos: `status` (pending|processing|sent|failed), `attempts`, `sent_at`

## 🔄 Fluxo Completo

```
1. USER: Vai para Settings > WhatsApp
2. USER: Clica "Conectar WhatsApp"
3. API: POST /api/whatsapp/initialize
   - WhatsAppManager.initializeForOrganization()
   - Gera QR code
   - Salva auth_state em DB
4. UI: Exibe QR code
5. USER: Escaneia QR com WhatsApp
6. Baileys: Conecta e salva credenciais em DB
7. API: Status muda para "connected"
8. UI: Mostra "Conectado com sucesso" + phone number

--- (Quando há lembrete agendado) ---

9. Cron Job: A cada 1 minuto
   - Vercel chama POST /api/cron/send-reminders
10. API: sendPendingReminders()
    - Busca reminders com status='pending' e scheduled_at <= now
    - Para cada reminder:
      - Obtém WhatsAppManager.getStatus(org_id)
      - Se conectado: WhatsAppManager.sendMessage()
      - Atualiza status para 'sent' ou 'failed'
      - Log em whatsapp_send_logs
11. WhatsApp: Paciente recebe mensagem
12. DB: Reminder marcado como 'sent' com sent_at timestamp
```

## 🐛 Troubleshooting

### "Erro ao conectar WhatsApp" na UI
- Verificar console do navegador (F12) para mais detalhes
- Verificar logs do Vercel/servidor
- Confirmar que JWT token é válido

### QR code não aparece
- Verificar se `status` é realmente `'scanning'`
- Verificar se `qr` field não é null
- Checar se `qrcode.react` está instalado

### Reminders não são enviados
- Verificar Supabase: tabela `reminders` tem `status='pending'`?
- Verificar Supabase: WhatsApp `status='connected'`?
- Checar logs do Cron Job em Vercel
- Verificar `whatsapp_send_logs` para erros

### "WhatsApp not connected for organization"
- User precisa escanear QR novamente
- Possível que credenciais expirem ou sejam revogadas pelo WhatsApp
- Baileys pode ter sido bloqueado pelo WhatsApp

## 📝 Notas Técnicas

### Multi-tenancy
- Cada organização tem sua própria linha em `whatsapp_sessions`
- RLS policies garantem que orgs não acessem dados uma da outra
- `WhatsAppManager` mantém Map<orgId, WASession> em memória

### Rate Limiting
- 500ms de delay entre mensagens (evita block do WhatsApp)
- Max 3 tentativas de retry com 60s de backoff
- Mensagens são processadas em batch de até 10 por ciclo

### Persistência
- Baileys auth_state é salvo em jsonb column
- Permite reconnect automático após deploy
- User só precisa scan QR uma vez por deploy

## ❓ Perguntas Frequentes

**P: Por quanto tempo o WhatsApp fica conectado?**
A: Até que o app seja redeployado ou user clique "Desconectar"

**P: E se o WhatsApp bloquear a conexão Baileys?**
A: User precisará reconectar. Implementar fallback para Twilio é necessário

**P: Posso usar um número pessoal e comercial?**
A: Sim, cada organização pode ter seu próprio número

**P: Qual é a latência de envio de lembretes?**
A: Até 1 minuto (frequência do cron) + latência da API WhatsApp

## 📚 Recursos

- [Baileys Documentation](https://github.com/adiwajshing/baileys)
- [Next.js Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [QRCode.react](https://www.npmjs.com/package/qrcode.react)
