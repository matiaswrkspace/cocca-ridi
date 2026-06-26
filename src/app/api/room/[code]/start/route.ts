import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { QUESTIONS, ANSWERS, shuffleArray } from '@/lib/cards'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServer()
  const { playerId } = await req.json()
  const code = params.code.toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })

  const { data: player } = await supabase.from('players').select('*').eq('id', playerId).single()
  if (!player || !player.is_host) {
    return NextResponse.json({ error: 'Solo l\'host può avviare la partita' }, { status: 403 })
  }
  if (room.phase !== 'waiting') {
    return NextResponse.json({ error: 'Partita già avviata' }, { status: 400 })
  }

  // Get all players
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', room.id)

  if (!players || players.length < 2) {
    return NextResponse.json({ error: 'Servono almeno 2 giocatori' }, { status: 400 })
  }

  const playerIds = players.map(p => p.id)

  // Deal 3 answer cards to each player
  const shuffledAnswers = shuffleArray(ANSWERS.map(a => a.id))
  const handInserts: { player_id: string; room_id: string; card_id: number }[] = []
  const usedAnswerInserts: { room_id: string; card_id: number }[] = []

  let cardIdx = 0
  for (const pid of playerIds) {
    for (let i = 0; i < 3; i++) {
      const cardId = shuffledAnswers[cardIdx++]
      handInserts.push({ player_id: pid, room_id: room.id, card_id: cardId })
      usedAnswerInserts.push({ room_id: room.id, card_id: cardId })
    }
  }

  await supabase.from('player_hands').insert(handInserts)
  await supabase.from('used_answer_cards').insert(usedAnswerInserts)

  // Pick first question
  const shuffledQuestions = shuffleArray(QUESTIONS.map(q => q.id))
  const firstQuestionId = shuffledQuestions[0]
  await supabase.from('used_question_cards').insert({ room_id: room.id, card_id: firstQuestionId })

  // Start countdown
  await supabase.from('rooms').update({
    phase: 'countdown',
    phase_started_at: new Date().toISOString(),
    current_round: 1,
    current_question_id: firstQuestionId,
  }).eq('id', room.id)

  return NextResponse.json({ success: true })
}
