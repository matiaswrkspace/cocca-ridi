import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServer()
  const { playerId } = await req.json()
  const code = params.code.toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })

  const { data: player } = await supabase.from('players').select('*').eq('id', playerId).single()
  if (!player || !player.is_host) {
    return NextResponse.json({ error: 'Solo l\'host può terminare la partita' }, { status: 403 })
  }

  await supabase.from('rooms').update({
    phase: 'finished',
    phase_started_at: new Date().toISOString(),
  }).eq('id', room.id)

  return NextResponse.json({ success: true })
}
