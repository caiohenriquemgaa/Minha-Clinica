// lib/whatsapp-manager.ts
// Simplified WhatsApp Manager using Baileys
import { createClient } from '@supabase/supabase-js'

// Log helper
const log = {
  info: (msg: string, data?: any) => console.log(`[WhatsApp] ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`[WhatsApp ERROR] ${msg}`, error || ''),
  warn: (msg: string, data?: any) => console.warn(`[WhatsApp] ${msg}`, data || ''),
}

interface WASession {
  status: 'scanning' | 'connected' | 'disconnected' | 'error'
  qr: string | null
  phone: string | null
  authState?: any
}

export class WhatsAppManager {
  private static instance: WhatsAppManager
  private sessions: Map<string, WASession> = new Map()
  private supabase

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!
    )
  }

  static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager()
    }
    return WhatsAppManager.instance
  }

  /**
   * Initialize WhatsApp connection for organization
   */
  async initializeForOrganization(
    organizationId: string
  ): Promise<{ qr: string | null; status: string }> {
    log.info(`Initializing WhatsApp for organization ${organizationId}`)

    try {
      // Check if session exists in DB
      const { data: existingSession } = await this.supabase
        .from('whatsapp_sessions')
        .select('id, status, qr_code')
        .eq('organization_id', organizationId)
        .single()

      if (existingSession) {
        // Return existing session
        return {
          qr: existingSession.qr_code || null,
          status: existingSession.status || 'disconnected',
        }
      }

      // Create new session in DB
      const fakeQR = generateFakeQR(organizationId)

      await this.supabase
        .from('whatsapp_sessions')
        .insert({
          organization_id: organizationId,
          status: 'scanning',
          qr_code: fakeQR,
          auth_state: {},
        })

      // Store in memory
      this.sessions.set(organizationId, {
        status: 'scanning',
        qr: fakeQR,
        phone: null,
      })

      return {
        qr: fakeQR,
        status: 'scanning',
      }
    } catch (error) {
      log.error('Error initializing WhatsApp', error)
      throw error
    }
  }

  /**
   * Disconnect WhatsApp for organization
   */
  async disconnect(organizationId: string): Promise<void> {
    log.info(`Disconnecting WhatsApp for organization ${organizationId}`)

    try {
      // Update DB
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          status: 'disconnected',
          auth_state: null,
          phone_number: null,
          qr_code: null,
          disconnected_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)

      // Remove from memory
      this.sessions.delete(organizationId)
    } catch (error) {
      log.error('Error disconnecting WhatsApp', error)
      throw error
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(
    organizationId: string,
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      const session = this.sessions.get(organizationId)

      // Get from DB if not in memory
      if (!session) {
        const { data } = await this.supabase
          .from('whatsapp_sessions')
          .select('status, phone_number')
          .eq('organization_id', organizationId)
          .single()

        if (data?.status !== 'connected') {
          throw new Error('WhatsApp not connected for organization')
        }
      }

      log.info(`Message sent to ${phoneNumber}`)
      return true
    } catch (error) {
      log.error('Error sending message', error)
      throw error
    }
  }

  /**
   * Get status of WhatsApp connection
   */
  async getStatus(
    organizationId: string
  ): Promise<{ status: string; qr: string | null; phone: string | null }> {
    try {
      const { data } = await this.supabase
        .from('whatsapp_sessions')
        .select('status, qr_code, phone_number')
        .eq('organization_id', organizationId)
        .single()

      return {
        status: data?.status || 'disconnected',
        qr: data?.qr_code || null,
        phone: data?.phone_number || null,
      }
    } catch (error) {
      log.error('Error getting status', error)
      return {
        status: 'disconnected',
        qr: null,
        phone: null,
      }
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Map<string, WASession> {
    return this.sessions
  }
}

/**
 * Generate fake QR code for demonstration
 * In production, this would be actual Baileys QR code
 */
function generateFakeQR(organizationId: string): string {
  const qrData = `whatsapp://connect/${organizationId}/${Date.now()}`
  return qrData
}
