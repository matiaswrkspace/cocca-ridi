import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServer()
  const { playerId, cardId } = await req.json()
  const code = params.code.toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
  if (room.phase !== 'selecting') {
    return NextResponse.json({ error: 'Non puoi inviare in questa fase' }, { status: 400 })
  }

  // Verify card is in player's hand
  const { data: handCard } = await supabase
    .from('player_hands')
    .select('id')
    .eq('player_id', playerId)
    .eq('card_id', cardId)
    .eq('room_id', room.id)
    .single()

  if (!handCard) {
    return NextResponse.json({ error: 'Carta non in mano' }, { status: 400 })
  }

  // Check not already submitted
  const { data: existing } = await supabase
    .from('round_submissions')
    .select('id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)
    .eq('player_id', playerId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Hai già scelto una carta' }, { status: 400 })
  }

  // Submit
  await supabase.from('round_submissions').insert({
    room_id: room.id,
    round_num: room.current_round,
    player_id: playerId,
    card_id: cardId,
  })

  // Remove from hand
  await supabase.from('player_hands').delete().eq('player_id', playerId).eq('card_id', cardId)

  // Check if all players submitted — auto advance
  const { count: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)

  const { count: totalSubmissions } = await supabase
    .from('round_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  if ((totalSubmissions ?? 0) >= (totalPlayers ?? 0)) {
    // Auto-advance to revealing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/room/${code}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPhase: 'selecting' }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
