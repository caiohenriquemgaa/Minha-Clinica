import { createClient } from '@supabase/supabase-js'
import { WhatsAppManager } from './whatsapp-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const manager = WhatsAppManager.getInstance()

interface Reminder {
  id: string
  organization_id: string
  patient_phone: string
  patient_name: string
  message: string
  scheduled_at: string
  status: string
  attempts: number
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 60000 // 60 seconds
const MESSAGE_DELAY_MS = 500 // 500ms between messages to avoid rate limiting

export async function sendPendingReminders() {
  try {
    console.log('[Reminders] Starting reminder dispatch...')

    // Fetch reminders que estão pending e passaram do horário agendado
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10) // Process 10 at a time to avoid overload

    if (error) {
      console.error('[Reminders] Error fetching reminders:', error)
      return { success: false, error: error.message }
    }

    if (!reminders || reminders.length === 0) {
      console.log('[Reminders] No pending reminders to send')
      return { success: true, sent: 0, failed: 0 }
    }

    console.log(`[Reminders] Found ${reminders.length} reminders to send`)

    let sent = 0
    let failed = 0

    for (const reminder of reminders as Reminder[]) {
      try {
        // Mark as processing
        await supabase
          .from('reminders')
          .update({ status: 'processing' })
          .eq('id', reminder.id)

        // Send message via WhatsApp
        const result = await sendReminderMessage(reminder)

        if (result.success) {
          // Mark as sent
          await supabase
            .from('reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', reminder.id)

          // Log success
          await logSendAttempt(reminder, 'success', null)
          sent++
          console.log(`[Reminders] Sent reminder ${reminder.id} to ${reminder.patient_phone}`)
        } else {
          // Increment attempts
          const newAttempts = reminder.attempts + 1

          if (newAttempts >= MAX_RETRIES) {
            // Max retries reached, mark as failed
            await supabase
              .from('reminders')
              .update({
                status: 'failed',
                attempts: newAttempts,
              })
              .eq('id', reminder.id)

            await logSendAttempt(reminder, 'failed', result.error)
            failed++
            console.error(
              `[Reminders] Failed to send reminder ${reminder.id} after ${newAttempts} attempts:`,
              result.error
            )
          } else {
            // Retry later
            const retryAt = new Date(Date.now() + RETRY_DELAY_MS).toISOString()
            await supabase
              .from('reminders')
              .update({
                status: 'pending',
                attempts: newAttempts,
                scheduled_at: retryAt,
              })
              .eq('id', reminder.id)

            await logSendAttempt(reminder, 'retry', result.error)
            console.warn(
              `[Reminders] Retrying reminder ${reminder.id} in ${RETRY_DELAY_MS}ms (attempt ${newAttempts}/${MAX_RETRIES})`
            )
          }
        }

        // Delay between messages
        await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY_MS))
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Reminders] Error processing reminder ${reminder.id}:`, error)

        // Mark as failed on unexpected error
        await supabase
          .from('reminders')
          .update({
            status: 'failed',
            attempts: reminder.attempts + 1,
          })
          .eq('id', reminder.id)

        await logSendAttempt(reminder, 'error', errorMsg)
        failed++
      }
    }

    return { success: true, sent, failed }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Reminders] Unexpected error in sendPendingReminders:', error)
    return { success: false, error: errorMsg }
  }
}

async function sendReminderMessage(
  reminder: Reminder
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get WhatsApp connection status for this organization
    const status = await manager.getStatus(reminder.organization_id)

    if (status.status !== 'connected') {
      return {
        success: false,
        error: `WhatsApp not connected for organization ${reminder.organization_id}`,
      }
    }

    // Send message
    const result = await manager.sendMessage(
      reminder.organization_id,
      reminder.patient_phone,
      reminder.message
    )

    if (!result) {
      return { success: false, error: 'Failed to send message' }
    }

    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

async function logSendAttempt(
  reminder: Reminder,
  status: 'success' | 'failed' | 'error' | 'retry',
  errorMessage: string | null | undefined
) {
  try {
    await supabase.from('whatsapp_send_logs').insert({
      organization_id: reminder.organization_id,
      reminder_id: reminder.id,
      phone: reminder.patient_phone,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Reminders] Error logging send attempt:', error)
    // Don't throw, just log the error
  }
}
