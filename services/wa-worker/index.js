require('dotenv').config()
const pino = require('pino')
const { makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const log = pino({ level: process.env.LOG_LEVEL || 'info' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
const POLL_INTERVAL_SECONDS = parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10)
const WA_SESSION_DIR = process.env.WA_SESSION_DIR || './wa-session'
const BATCH_LIMIT = parseInt(process.env.BATCH_LIMIT || '20', 10)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  log.error('Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in env.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

// Use single-file auth state to persist session
const authFile = path.join(WA_SESSION_DIR, 'auth_info.json')
if (!fs.existsSync(WA_SESSION_DIR)) fs.mkdirSync(WA_SESSION_DIR, { recursive: true })

const { state, saveState } = useSingleFileAuthState(authFile)

let sock = null

async function initSocket() {
  const { version } = await fetchLatestBaileysVersion()
  log.info({ version }, 'Baileys version')

  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    version,
  })

  sock.ev.on('creds.update', saveState)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      log.info('WhatsApp connection open')
    }
    if (connection === 'close') {
      const reason = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) ? lastDisconnect.error.output.statusCode : null
      log.warn({ lastDisconnect }, 'connection closed')
      // try reconnect
      setTimeout(() => {
        initSocket().catch(err => log.error(err))
      }, 5000)
    }
  })
}

async function fetchPendingReminders() {
  // Ajuste a query abaixo conforme sua estrutura de dados
  // Este exemplo assume existência de uma view ou tabela v_reminders com campos: id, phone, message, scheduled_at, status
  const windowStart = new Date().toISOString()
  // Seleciona lembretes com status 'pending' e scheduled_at <= now
  const { data, error } = await supabase
    .from('reminders')
    .select('id, phone, message, scheduled_at')
    .eq('status', 'pending')
    .lte('scheduled_at', windowStart)
    .limit(BATCH_LIMIT)

  if (error) {
    log.error({ error }, 'Error fetching reminders')
    return []
  }
  return data || []
}

async function markReminder(id, payload) {
  const { error } = await supabase
    .from('reminders')
    .update(payload)
    .eq('id', id)
  if (error) log.error({ error }, 'Error updating reminder')
}

async function sendWhatsAppMessage(phone, text) {
  // Baileys expects phone in format 'countrycodephonenumber@s.whatsapp.net'
  // e.g., for Brazil: 5511999999999 -> '5511999999999@s.whatsapp.net'
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
  try {
    await sock.sendMessage(jid, { text })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

async function workerLoop() {
  if (!sock) {
    log.warn('Socket not ready yet')
    return
  }

  const pending = await fetchPendingReminders()
  if (!pending.length) {
    log.info('No pending reminders')
    return
  }

  for (const r of pending) {
    log.info({ id: r.id, phone: r.phone }, 'Sending reminder')
    try {
      // send message
      const res = await sendWhatsAppMessage(r.phone, r.message)
      if (res.success) {
        await markReminder(r.id, { status: 'sent', sent_at: new Date().toISOString(), attempts: (r.attempts || 0) + 1 })
        log.info({ id: r.id }, 'Sent')
      } else {
        // update attempts and error
        await markReminder(r.id, { status: 'failed', last_error: res.error, attempts: (r.attempts || 0) + 1 })
        log.error({ id: r.id, error: res.error }, 'Send failed')
      }
    } catch (err) {
      log.error({ err }, 'Unexpected error sending reminder')
      await markReminder(r.id, { status: 'failed', last_error: String(err) })
    }
  }
}

async function start() {
  await initSocket()
  // Wait a bit to ensure socket ready
  setTimeout(() => {
    workerLoop().catch(err => log.error(err))
    setInterval(() => {
      workerLoop().catch(err => log.error(err))
    }, POLL_INTERVAL_SECONDS * 1000)
  }, 5000)
}

start().catch(err => {
  log.error(err)
  process.exit(1)
})
