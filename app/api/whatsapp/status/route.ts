// app/api/whatsapp/status/route.ts
import { createClient } from '@supabase/supabase-js'
import { WhatsAppManager } from '@/lib/whatsapp-manager'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    // Obter usuário autenticado
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obter organização
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.default_organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Obter status
    const manager = WhatsAppManager.getInstance()
    const status = await manager.getStatus(profile.default_organization_id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
