# 📋 Guia Completo: Setup Reminders com WhatsApp Worker (SaaS Multi-Tenant)

## 🎯 Objetivo
Configurar o sistema automático de lembretes via WhatsApp que:
1. **Isolado por Clínica**: Cada clínica só acessa seus próprios dados (RLS)
2. **Monitora** a tabela `reminders` no Supabase
3. **Envia 2 mensagens** por agendamento (24h e 2h antes)
4. **Trata falhas** com retry automático
5. **Previne duplicatas** com locking atômico
6. **Multi-Tenant**: Worker processa lembretes para TODAS as clínicas

---

## 🔐 Arquitetura SaaS (Isolamento Garantido)

```
┌─────────────────────────────────────────────────────────────┐
│ Clínica A (Organization A)                                  │
│  ├─ Usuário A1 ──────┐                                      │
│  ├─ Usuário A2 ──────┼─→ RLS Filter: org_id = A             │
│  ├─ Pacientes (org A) │   • SELECT * FROM patients ──→ só A │
│  ├─ Sessões (org A)   │   • UPDATE patients ──→ só org A    │
│  └─ Reminders (org A) │                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Clínica B (Organization B)                                  │
│  ├─ Usuário B1 ──────┐                                      │
│  ├─ Pacientes (org B) ├─→ RLS Filter: org_id = B            │
│  ├─ Sessões (org B)   │   • SELECT * FROM patients ──→ só B │
│  └─ Reminders (org B) │                                      │
└─────────────────────────────────────────────────────────────┘

Worker (Service Role - Bypass RLS)
  ├─→ Fetch reminders from ORG A + ORG B + ORG C...
  ├─→ Process all pending reminders
  └─→ Send via WhatsApp
```

---

## ✅ PASSO 1: Executar Migrações SQL (Supabase)

### 1.1 - Limpar conflitos (execute PRIMEIRO se tiver erros)
Abra **Supabase → SQL Editor** e execute:

```sql
DROP TRIGGER IF EXISTS trg_create_reminder_on_sessions ON sessions;
DROP FUNCTION IF EXISTS create_reminders_multi_window();
DROP FUNCTION IF EXISTS build_reminder_message(text, text, text, integer);
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS unique_session_window;
ALTER TABLE reminders DROP COLUMN IF EXISTS window_type;
```

### 1.2 - Script 16: Criar tabela reminders base
Copie **todo** o conteúdo de `scripts/16-create-reminders-table.sql` e execute

### 1.3 - Script 18: Corrigir schema e triggers
Copie **todo** o conteúdo de `scripts/18-fix-reminders-schema.sql` e execute

### 1.4 - Script 21: Suporte Multi-Organization
Copie **todo** o conteúdo de `scripts/21-fix-reminders-multi-org.sql` e execute

### 1.5 - Script 22: Implementar RLS (CRÍTICO!)
Copie **todo** o conteúdo de `scripts/22-implement-saas-rls-policies.sql` e execute

**Este script ativa Row Level Security que garante isolamento entre clínicas!**

### 1.6 - Script 20: Criar dados de teste
Copie **todo** o conteúdo de `scripts/20-setup-test-reminders-with-phone.sql` e execute

---

## ✅ PASSO 2: Testar Isolamento de Dados (SaaS)

Após SQL estar OK, verifique que RLS está funcionando:

```sql
-- Como usuário AUTENTICADO da Clínica A:
SELECT organization_id, name, phone FROM patients;
-- Resultado: Apenas pacientes com organization_id = Clínica A

-- Tente inserir paciente com org_id de outra clínica:
INSERT INTO patients (organization_id, name, phone)
VALUES ('org-b-uuid', 'Teste', '551199999999');
-- ERRO: RLS bloqueará porque organization_id ≠ sua clínica!

-- Como usuário da Clínica B, verá DIFERENTES dados:
SELECT organization_id, name, phone FROM patients;
-- Resultado: Apenas pacientes com organization_id = Clínica B
```

✅ **Se RLS está funcionando, você verá:**
- Clínica A vê SÓ seus pacientes/procedimentos/sessões
- Clínica B vê SÓ seus pacientes/procedimentos/sessões
- Tentativas de acessar dados de outra clínica são **bloqueadas no DB**

---

## ✅ PASSO 3: Testar Worker Localmente

O worker usa **Service Role** que **bypassa RLS** (por design - precisa acessar reminders de todas as clínicas).

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

## 🔐 Segurança Multi-Tenant (CRÍTICO!)

### Como RLS Protege Seus Dados

**Script 22 ativa Row Level Security com:**

```sql
-- Função helper que busca a organização do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
  SELECT default_organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Política de SELECT: usuário só vê dados da sua organização
CREATE POLICY "patients_select_own_org" ON patients
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());
```

**Resultado:**
- ✅ User A da Clínica 1 não consegue ver dados da Clínica 2
- ✅ Queries SQL são **bloqueadas no banco de dados**
- ✅ Não depende de código da aplicação (segurança em camada)
- ✅ Service Role (worker) pode acessar tudo (intencional)

### O que é Service Role?

O worker usa `SUPABASE_SERVICE_ROLE` que:
- ✅ **Bypassa RLS** - pode acessar ALL organizations
- ✅ É necessário para processar reminders de todas as clínicas
- ✅ Deve ficar **apenas em variáveis de ambiente** do servidor
- ❌ NUNCA deve ser exposto no cliente (navegador)
- ❌ NUNCA deve estar em código público

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
