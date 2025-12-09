WhatsApp Worker (Baileys) - README

Objetivo

Este worker consulta a tabela `reminders` no Supabase e envia mensagens via WhatsApp Web (Baileys). A ideia é rodar em um servidor (VM/Droplet) com persistência para a sessão do WhatsApp (QR scan único).

Pré-requisitos

- Node.js 18+
- Conta Supabase com `SUPABASE_SERVICE_ROLE` configurada
- Ambiente onde o worker rodará (VPS/Droplet/Server) com acesso a terminal para escanear QR pelo primeiro run

Variáveis de ambiente (use `.env` ou configurar no container)

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE` - Service Role Key (server-only)
- `POLL_INTERVAL_SECONDS` - intervalo de polling (default 30)
- `WA_SESSION_DIR` - diretório onde a sessão do WhatsApp será persistida (default `./wa-session`)
- `BATCH_LIMIT` - número máximo de mensagens por execução

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

Estrutura da tabela `reminders` (exemplo)

A query do worker espera uma tabela `reminders` com, pelo menos, os seguintes campos:
- `id` (uuid ou int)
- `phone` (string) - número no formato internacional (ex: 5511999999999)
- `message` (string) - texto a ser enviado
- `scheduled_at` (timestamp)
- `status` (string) - 'pending' | 'sent' | 'failed'
- `attempts` (int)
- `sent_at` (timestamp)
- `last_error` (text)

Adaptações

- Se sua tabela de consultas for diferente, ajuste a função `fetchPendingReminders()` em `index.js` para construir os lembretes desejados.
- Para melhor resiliência, adicione locking/transaction para evitar duplicatas ao enviar em múltiplas instâncias.

Quer que eu:
- A) implemente a integração deste worker com a estrutura atual do banco (faço a query correta), ou
- B) apenas forneça este worker e instruções para você adaptar a sua tabela?
