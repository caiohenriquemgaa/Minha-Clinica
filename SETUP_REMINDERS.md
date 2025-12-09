# 📋 Guia Completo: Setup Reminders com WhatsApp Worker

## 🎯 Objetivo
Configurar o sistema automático de lembretes via WhatsApp que:
1. Monitora a tabela `reminders` no Supabase
2. Envia 2 mensagens por agendamento (24h e 2h antes)
3. Trata falhas com retry automático
4. Previne duplicatas com locking atômico

---

## ✅ PASSO 1: Executar SQL (Supabase)

### 1.1 - Limpar conflitos (execute PRIMEIRO se tiver erros)
Abra **Supabase → SQL Editor** e execute:

```sql
DROP TRIGGER IF EXISTS trg_create_reminder_on_sessions ON sessions;
DROP FUNCTION IF EXISTS create_reminders_multi_window();
DROP FUNCTION IF EXISTS build_reminder_message(text, text, text, integer);
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS unique_session_window;
ALTER TABLE reminders DROP COLUMN IF EXISTS window_type;
```

### 1.2 - Executar script 16 (tabela base)
Copie **todo** o conteúdo de `scripts/16-create-reminders-table.sql` e execute

### 1.3 - Executar script 18 (correção)
Copie **todo** o conteúdo de `scripts/18-fix-reminders-schema.sql` e execute

### 1.4 - Executar script 20 (teste com paciente)
Copie **todo** o conteúdo de `scripts/20-setup-test-reminders-with-phone.sql` e execute

**Resultado esperado:**
```
✅ Paciente criado/atualizado com telefone
✅ Procedimento criado/encontrado
✅ Sessão de teste criada
✅ 2 reminders geradas automaticamente (window_type='24h' e '2h')
```

---

## ✅ PASSO 2: Testar Worker Localmente

Após SQL estar OK:

```bash
cd services/wa-worker
npm install
cp .env.example .env
# Editar .env com suas credenciais:
# SUPABASE_URL=https://...
# SUPABASE_SERVICE_ROLE=ey...
npm start
```

**Primeira execução:**
- Verá um **QR Code** no terminal
- Escaneie com WhatsApp do seu telefone (o mesmo que está na DB)
- Sessão salva em `wa-session/` (persiste entre reinicializações)

**Resultado esperado:**
```
[INFO] Locked reminders for processing: 2
[INFO] Sending reminder: id=xxx, phone=551199999999, window=24h
[INFO] Reminder sent successfully
[INFO] Sending reminder: id=yyy, phone=551199999999, window=2h
[INFO] Reminder sent successfully
```

---

## ✅ PASSO 3: Deploy em Produção (VPS/Droplet)

Após testar localmente:

```bash
# Build Docker image
docker build -t wa-worker:latest .

# Run com volume persistente (importante!)
docker run -d \
  -v $(pwd)/wa-session:/usr/src/app/wa-session \
  --env-file .env \
  --name wa-worker \
  --restart unless-stopped \
  wa-worker:latest

# Ver logs
docker logs -f wa-worker
```

---

## ⚠️ Observações Críticas

1. **WhatsApp Web**: Usar automação WhatsApp Web pode resultar em bloqueio da conta
   - Recomendado apenas para POC ou uso interno (< 100 msgs/dia)
   - Para produção escalável: use API oficial (Twilio, 360dialog, etc)

2. **Telefone**: Deve estar no formato internacional: `5511999999999` (Brasil)

3. **Status Reminders**:
   - `pending` = aguardando envio
   - `processing` = worker está processando
   - `sent` = enviado com sucesso
   - `failed` = falhou após MAX_RETRIES

4. **Retry Automático**: Se falhar, tenta até 3x com 60s de delay entre tentativas

---

## 🔍 Troubleshooting

### Erro: "Nenhum paciente com telefone encontrado"
→ Execute script 20, que cria paciente + telefone automaticamente

### Erro: "invalid input syntax for type uuid"
→ Certifique-se que você está usando `::uuid` quando necessário

### Worker não conecta WhatsApp
→ Verifique:
  - QR code foi escaneado corretamente
  - Arquivo `wa-session/auth_info.json` existe
  - Credenciais Supabase estão corretas (check `.env`)

### Mensagens não estão sendo enviadas
→ Verifique:
  - Status de reminders na DB: `SELECT * FROM reminders WHERE status='pending'`
  - Logs do worker: `docker logs wa-worker`
  - Número de telefone tem `phone` preenchido na DB

---

## 📊 Monitorar em Tempo Real

```sql
-- Ver reminders pendentes
SELECT id, window_type, status, scheduled_at, patient_phone, attempts 
FROM reminders 
WHERE status IN ('pending', 'processing') 
ORDER BY scheduled_at ASC;

-- Ver histórico de enviados
SELECT id, window_type, sent_at, attempts, status 
FROM reminders 
WHERE status = 'sent' 
ORDER BY sent_at DESC 
LIMIT 10;

-- Ver falhas
SELECT id, window_type, attempts, last_error, scheduled_at 
FROM reminders 
WHERE status = 'failed' 
ORDER BY updated_at DESC;
```

---

## 📝 Fluxo Completo

```
1. Usuário cria SESSION com status='agendado' na app
   ↓
2. Trigger cria 2 REMINDERS automaticamente (24h + 2h antes)
   ↓
3. Worker query reminders WHERE status='pending' AND scheduled_at <= now
   ↓
4. Worker atualiza status → 'processing' (atomic lock)
   ↓
5. Worker envia via Baileys/WhatsApp
   ↓
6. Se sucesso: status → 'sent'
   Se falha: retry se attempts < MAX_RETRIES, senão status → 'failed'
```

---

**Comece pelo PASSO 1 e me avise quando terminar!** 🚀
