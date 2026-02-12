require('dotenv').config()
const pino = require('pino')
const { makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const log = pino({ level: process.env.LOG_LEVEL || 'info' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
const POLL_INTERVAL_SECONDS = parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10)
const WA_SESSION_DIR = process.env.WA_SESSION_DIR || './wa-session'
const BATCH_LIMIT = parseInt(process.env.BATCH_LIMIT || '20', 10)
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10)
const RETRY_BACKOFF_SECONDS = parseInt(process.env.RETRY_BACKOFF_SECONDS || '60', 10)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  log.error('Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Use single-file auth state to persist session
const authFile = path.join(WA_SESSION_DIR, 'auth_info.json')
if (!fs.existsSync(WA_SESSION_DIR)) fs.mkdirSync(WA_SESSION_DIR, { recursive: true })

const { state, saveState } = useSingleFileAuthState(authFile)

let sock = null
let isProcessing = false

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

/**
 * Fetch pending reminders using lock-like mechanism to prevent duplicate processing
 * Queries reminders from ALL organizations (service role bypasses RLS)
 * Selects reminders where status='pending' and scheduled_at <= now, within batch limit
 */
async function fetchPendingRemindersWithLock() {
  const now = new Date().toISOString()
  
  // IMPORTANT: Service role bypasses RLS, so worker can fetch from ALL organizations
  // This is intentional - worker processes reminders for all clinics
  const { data: pending, error: fetchError } = await supabase
    .from('reminders')
    .select('id, organization_id, patient_phone, patient_name, message, scheduled_at, attempts, window_type')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(BATCH_LIMIT)

  if (fetchError) {
    log.error({ fetchError }, 'Error fetching reminders')
    return []
  }

  if (!pending || pending.length === 0) {
    return []
  }

  // Update status to 'processing' atomically to prevent duplicate processing by parallel workers
  const ids = pending.map(r => r.id)
  const { error: updateError } = await supabase
    .from('reminders')
    .update({ status: 'processing' })
    .in('id', ids)

  if (updateError) {
    log.error({ updateError }, 'Error locking reminders for processing')
    return []
  }

  log.info({ count: pending.length }, 'Locked reminders for processing')
  return pending
}

/**
 * Mark reminder with new status and metadata
 */
async function markReminder(id, payload) {
  const { error } = await supabase
    .from('reminders')
    .update(payload)
    .eq('id', id)
  if (error) {
    log.error({ error, id }, 'Error updating reminder status')
  }
}

/**
 * Send WhatsApp message via Baileys
 */
async function sendWhatsAppMessage(phone, text) {
  // Baileys expects: 'countrycodephonenumber@s.whatsapp.net'
  // e.g., Brazil: 5511999999999 -> '5511999999999@s.whatsapp.net'
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
  try {
    await sock.sendMessage(jid, { text })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Main worker loop: fetch reminders, send, update status with retry logic
 * Processes reminders for ALL organizations (multi-tenant aware)
 */
async function workerLoop() {
  if (!sock || sock.user === undefined) {
    log.warn('Socket not ready yet (WhatsApp connection pending)')
    return
  }

  // Prevent concurrent processing in same instance
  if (isProcessing) {
    log.debug('Worker already processing, skipping this cycle')
    return
  }

  isProcessing = true

  try {
    const pending = await fetchPendingRemindersWithLock()
    if (!pending.length) {
      log.debug('No pending reminders')
      return
    }

    log.info({ count: pending.length }, 'Processing pending reminders')

    for (const reminder of pending) {
      try {
        log.info({ 
          id: reminder.id, 
          org: reminder.organization_id,
          phone: reminder.patient_phone, 
          window: reminder.window_type 
        }, 'Sending reminder')

        // Send message via WhatsApp
        const res = await sendWhatsAppMessage(reminder.patient_phone, reminder.message)

        if (res.success) {
          // Successfully sent
          await markReminder(reminder.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: (reminder.attempts || 0) + 1,
          })
          log.info({ id: reminder.id, org: reminder.organization_id }, 'Reminder sent successfully')
        } else {
          // Retry logic: check if we should retry or fail
          const newAttempts = (reminder.attempts || 0) + 1
          const shouldRetry = newAttempts < MAX_RETRIES

          if (shouldRetry) {
            // Reschedule for retry: set status back to pending with delay
            const retryAt = new Date(Date.now() + RETRY_BACKOFF_SECONDS * 1000).toISOString()
            await markReminder(reminder.id, {
              status: 'pending',
              scheduled_at: retryAt,
              attempts: newAttempts,
              last_error: res.error,
            })
            log.warn({ 
              id: reminder.id, 
              org: reminder.organization_id,
              attempt: newAttempts, 
              nextRetry: retryAt, 
              error: res.error 
            }, 'Reminder send failed, scheduled for retry')
          } else {
            // Max retries reached, mark as failed permanently
            await markReminder(reminder.id, {
              status: 'failed',
              attempts: newAttempts,
              last_error: res.error,
            })
            log.error({ 
              id: reminder.id, 
              org: reminder.organization_id,
              error: res.error, 
              attempts: newAttempts 
            }, 'Reminder send failed after max retries')
          }
        }
      } catch (err) {
        log.error({ err, reminderId: reminder.id, org: reminder.organization_id }, 'Unexpected error processing reminder')
        // Reset status to pending on unexpected error (will retry)
        await markReminder(reminder.id, {
          status: 'pending',
          attempts: (reminder.attempts || 0) + 1,
          last_error: String(err),
        })
      }

      // Rate limiting: small delay between messages to avoid WhatsApp throttling/blocking
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  } catch (err) {
    log.error({ err }, 'Unexpected error in worker loop')
  } finally {
    isProcessing = false
  }
}

async function start() {
  log.info('Starting WhatsApp Reminder Worker')
  log.info({ supabaseUrl: SUPABASE_URL }, 'Configured Supabase')
  log.info({ pollInterval: POLL_INTERVAL_SECONDS, maxRetries: MAX_RETRIES }, 'Worker settings')
  log.info('Service Role enabled - processing reminders for ALL organizations (multi-tenant)')
  
  await initSocket()
  
  // Wait for socket to be ready before starting poll
  setTimeout(() => {
    log.info({ pollInterval: POLL_INTERVAL_SECONDS }, 'Starting reminder poll loop')
    workerLoop().catch(err => log.error(err, 'Error in initial worker loop'))
    
    setInterval(() => {
      workerLoop().catch(err => log.error(err, 'Error in worker loop interval'))
    }, POLL_INTERVAL_SECONDS * 1000)
  }, 5000)
}

start().catch(err => {
  log.error(err, 'Fatal error starting worker')
  process.exit(1)
})
