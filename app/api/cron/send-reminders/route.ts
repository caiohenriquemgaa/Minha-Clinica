import { NextRequest, NextResponse } from 'next/server'
import { sendPendingReminders } from '@/lib/whatsapp-reminder-sender'

export async function GET(request: NextRequest) {
  // Validate that this is a cron request from Vercel
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting reminder dispatch job...')
    const result = await sendPendingReminders()

    console.log('[Cron] Job completed:', result)

    return NextResponse.json(
      {
        success: true,
        message: 'Reminders processed',
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Cron] Error in reminder dispatch:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
