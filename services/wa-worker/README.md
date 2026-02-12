WhatsApp Worker (Baileys) - README

Objetivo

Este worker consulta a tabela `reminders` no Supabase e envia mensagens via WhatsApp Web (Baileys). A ideia é rodar em um servidor (VM/Droplet) com persistência para a sessão do WhatsApp (QR scan único).

Pré-requisitos

- Node.js 18+
- Conta Supabase com `SUPABASE_SERVICE_ROLE_KEY` configurada
- Ambiente onde o worker rodará (VPS/Droplet/Server) com acesso a terminal para escanear QR pelo primeiro run

Variáveis de ambiente (use `.env` ou configurar no container)

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (server-only)
- `POLL_INTERVAL_SECONDS` - intervalo de polling (default 30)
- `WA_SESSION_DIR` - diretório onde a sessão do WhatsApp será persistida (default `./wa-session`)
- `BATCH_LIMIT` - número máximo de mensagens por execução (default 20)
- `MAX_RETRIES` - tentativas máximas de reenvio (default 3)
- `RETRY_BACKOFF_SECONDS` - delay de espera para retry (default 60s)
- `LOG_LEVEL` - nível de log (default 'info')

Como rodar localmente

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Instale dependências:
   ```bash
   cd services/wa-worker
   npm install
   ```
3. Rode o worker:
   ```bash
   npm start
   ```
4. Na primeira vez, o Baileys imprimirá um QR no terminal. Escaneie com o WhatsApp do número que enviará mensagens.
5. Após o scan, a sessão será persistida em `WA_SESSION_DIR` (por exemplo `./wa-session/auth_info.json`).

Como rodar em Docker

1. Build e run:
   ```bash
   docker build -t wa-worker:latest .
   docker run -v $(pwd)/wa-session:/usr/src/app/wa-session --env-file .env wa-worker:latest
   ```
2. No primeiro run, abra os logs do container para ver o QR e escaneie.

Observações importantes

- Esta solução usa WhatsApp Web e pode violar termos do WhatsApp para usos em grande escala. Use apenas para POC ou em aplicações internas com baixo volume, ciente do risco de bloqueio.
- Para produção escalável e cumprimento das políticas, prefira um provedor oficial do WhatsApp Business (Twilio, 360dialog, MessageBird).
- Certifique-se de que os pacientes consentiram em receber mensagens via WhatsApp.

Estrutura da tabela `reminders` (esperada)

A query do worker espera uma tabela `reminders` com os seguintes campos:
- `id` (uuid) - identificador único
- `patient_phone` (string) - número no formato internacional (ex: 5511999999999)
- `patient_name` (string) - nome do paciente
- `message` (string) - texto da mensagem
- `scheduled_at` (timestamp) - quando enviar
- `status` (string) - 'pending' | 'processing' | 'sent' | 'failed'
- `attempts` (int) - número de tentativas
- `sent_at` (timestamp) - quando foi enviado com sucesso
- `last_error` (text) - mensagem de erro se falhar
- `window_type` (string) - '24h' ou '2h' (tipo de janela de lembrete)

Mecanismo de Locking e Retry

- **Locking atômico**: Quando um batch de reminders é processado, o status muda de 'pending' → 'processing' em uma transação, prevenindo que múltiplas instâncias do worker processem o mesmo reminder.
- **Retry automático**: Se o envio falhar e `attempts < MAX_RETRIES`, o reminder retorna a 'pending' com `scheduled_at` adiado por `RETRY_BACKOFF_SECONDS`. Se atingir `MAX_RETRIES`, é marcado como 'failed'.
- **Rate limiting**: Delay de 500ms entre envios sucessivos para evitar throttling do WhatsApp.
- **Concorrência**: Flag `isProcessing` impede processamento paralelo na mesma instância do worker.

Adaptações

- A tabela `reminders` é alimentada automaticamente por um trigger do banco quando uma sessão (appointment) é criada. Veja `scripts/17-improve-reminders-multi-window.sql`.
- Se sua estrutura for diferente, ajuste `fetchPendingRemindersWithLock()` em `index.js` para adequar as colunas.
