import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServer()
  const { playerId, submissionId } = await req.json()
  const code = params.code.toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
  if (room.phase !== 'voting') {
    return NextResponse.json({ error: 'Non puoi votare in questa fase' }, { status: 400 })
  }

  // Verify submission belongs to this round
  const { data: submission } = await supabase
    .from('round_submissions')
    .select('player_id')
    .eq('id', submissionId)
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Risposta non trovata' }, { status: 404 })
  }

  // Can't vote for your own card
  if (submission.player_id === playerId) {
    return NextResponse.json({ error: 'Non puoi votare la tua carta' }, { status: 400 })
  }

  // Check not already voted
  const { data: existing } = await supabase
    .from('round_votes')
    .select('id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)
    .eq('voter_id', playerId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Hai già votato' }, { status: 400 })
  }

  await supabase.from('round_votes').insert({
    room_id: room.id,
    round_num: room.current_round,
    voter_id: playerId,
    submission_id: submissionId,
  })

  // Check if all players voted — auto-advance
  const { count: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)

  const { count: totalVotes } = await supabase
    .from('round_votes')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  if ((totalVotes ?? 0) >= (totalPlayers ?? 0)) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/room/${code}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPhase: 'voting' }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
