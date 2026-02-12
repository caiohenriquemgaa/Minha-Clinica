// app/api/whatsapp/initialize/route.ts
import { createClient } from '@supabase/supabase-js'
import { WhatsAppManager } from '@/lib/whatsapp-manager'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey!
    )

    // Obter organização do token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obter organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.default_organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Inicializar WhatsApp
    const manager = WhatsAppManager.getInstance()
    const result = await manager.initializeForOrganization(profile.default_organization_id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
