import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { code, name, sessionId } = await req.json()

  if (!code || !name || !sessionId) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
  }
  if (name.trim().length < 1 || name.trim().length > 50) {
    return NextResponse.json({ error: 'Nome non valido' }, { status: 400 })
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
  }

  if (room.phase !== 'waiting') {
    return NextResponse.json({ error: 'La partita è già iniziata' }, { status: 403 })
  }

  // Check player count
  const { count } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)

  if ((count ?? 0) >= room.max_players) {
    return NextResponse.json({ error: 'Stanza piena' }, { status: 403 })
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({ room_id: room.id, name: name.trim(), is_host: false, session_id: sessionId })
    .select()
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Errore accesso stanza' }, { status: 500 })
  }

  return NextResponse.json({ playerId: player.id, roomId: room.id })
}
