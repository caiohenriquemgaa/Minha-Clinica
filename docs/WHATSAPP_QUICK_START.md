# 🚀 Quick Start - WhatsApp Integration

## O que foi implementado?

Uma integração completa de WhatsApp usando Baileys (WhatsApp Web) integrada diretamente no seu app Next.js:

1. **WhatsApp Manager** - Gerencia conexões Baileys por organização
2. **Settings Page** - Interface para conectar/desconectar WhatsApp
3. **Reminder Sender** - Envia lembretes via WhatsApp automaticamente
4. **Cron Job** - Vercel Cron executa o sender a cada minuto

## ⚡ Setup Rápido (5 minutos)

### 1. Bancos de dados
```bash
# Execute o script SQL no Supabase
# Go to: Supabase > SQL Editor > New Query
# Cole o conteúdo de: scripts/23-whatsapp-sessions-table.sql
# Click: Run
```

### 2. Variáveis de Ambiente
```bash
# Em .env.local, adicione:
CRON_SECRET=seu-token-secreto-aqui

# Em Vercel (Settings > Environment Variables), adicione também
```

### 3. Testar localmente
```bash
cd c:\Users\Caio\Downloads\jmestetica
pnpm dev

# Acesse: http://localhost:3000/settings/whatsapp
```

## 🧪 Teste Passo a Passo

### Teste 1: Conectar WhatsApp
1. Abra `http://localhost:3000/settings/whatsapp`
2. Clique "Conectar WhatsApp"
3. Você deve ver um QR code
4. Use outro celular para escanear (não use o seu WhatsApp principal)
5. Depois de alguns segundos, deve aparecer "Conectado com sucesso!"

### Teste 2: Criar um lembrete de teste
```bash
# Com Postman ou curl, crie um lembrete:
POST http://localhost:3000/api/reminders
Authorization: Bearer {seu-jwt-token}
Content-Type: application/json

{
  "patient_phone": "+5512345678",
  "patient_name": "João",
  "message": "Seu agendamento é amanhã!",
  "scheduled_at": "2025-01-20T10:00:00Z"
}
```

### Teste 3: Disparar o Cron Job
```bash
# Em .env.local, verifique CRON_SECRET
# Depois:
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer seu-token-secreto-aqui"
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

## 📋 Checklist antes de Deploy

- [ ] SQL script 23 executado no Supabase
- [ ] `CRON_SECRET` adicionada a `.env.local`
- [ ] Testou conectar WhatsApp localmente
- [ ] Testou envio de reminder local
- [ ] `pnpm build` roda sem erros
- [ ] Adicionou `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` no Vercel

## 🚀 Deploy em Vercel

```bash
# 1. Push para git
git add .
git commit -m "feat: add WhatsApp integration"
git push origin main

# 2. Vercel faz deploy automaticamente
# 3. Após deploy, ative Cron em: Vercel > Settings > Cron Jobs

# 4. Teste cron job em produção:
curl -X GET https://seu-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer seu-cron-secret"
```

## ⚠️ Pontos Importantes

**Baileys é POC-grade**: Pode ser bloqueado pelo WhatsApp a qualquer momento. Para produção real, considere Twilio.

**QR Code expira**: User precisa reconectar após ~7 dias ou qualquer ban do WhatsApp.

**Latência**: Lembretes são enviados em até 1 minuto (intervalo do cron), não são instantâneos.

**Rate limiting**: Sistema envia 1 mensagem a cada 500ms para evitar ban.

## 🐛 Problemas Comuns

**P: "WhatsApp not connected for organization"**
A: User precisa ir em Settings > WhatsApp e escanear QR novamente

**P: Reminders não são enviados**
A: Verificar Supabase > `reminders` table se status é 'pending'

**P: QR code não aparece**
A: Verificar console (F12) para erros. Pode ser JWT token inválido.

## 📚 Documentação Completa

Veja `docs/whatsapp-integration.md` para guia detalhado com:
- Troubleshooting
- Monitoramento em produção
- Fluxo completo
- Recursos

## 💬 Próximas Features (Opcional)

1. Fallback para Twilio (quando Baileys é bloqueado)
2. Dashboard com stats de mensagens enviadas
3. Webhooks para confirmar leitura de mensagens
4. Agendamento com melhor UX
5. Templates de mensagens customizáveis

---

**Tá pronto para testar!** 🎉
