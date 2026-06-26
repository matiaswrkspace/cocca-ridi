import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { maxPlayers, totalRounds, sessionId, hostName } = await req.json()

  if (!maxPlayers || !totalRounds || !sessionId || !hostName?.trim()) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
  }
  if (maxPlayers < 4 || maxPlayers > 12 || totalRounds < 5 || totalRounds > 15) {
    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 })
  }

  // Check if any active room already exists
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .in('phase', ['waiting', 'countdown', 'cards', 'question', 'selecting', 'revealing', 'voting', 'results'])
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Esiste già una stanza attiva. Attendi che finisca.' }, { status: 409 })
  }

  // Generate unique code
  let code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase.from('rooms').select('id').eq('code', code).single()
    if (!existing) break
    code = generateCode()
    attempts++
  }

  // Create room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ code, max_players: maxPlayers, total_rounds: totalRounds })
    .select()
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Errore creazione stanza' }, { status: 500 })
  }

  // Create host player with the provided name
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({ room_id: room.id, name: hostName.trim(), is_host: true, session_id: sessionId })
    .select()
    .single()

  if (playerError || !player) {
    await supabase.from('rooms').delete().eq('id', room.id)
    return NextResponse.json({ error: 'Errore creazione giocatore' }, { status: 500 })
  }

  // Update room with host_player_id
  await supabase.from('rooms').update({ host_player_id: player.id }).eq('id', room.id)

  return NextResponse.json({ code, playerId: player.id, roomId: room.id })
}
