import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { QUESTIONS, ANSWERS, shuffleArray } from '@/lib/cards'
import type { GamePhase } from '@/types/game'

const NEXT_PHASE: Partial<Record<GamePhase, GamePhase>> = {
  countdown: 'cards',
  cards: 'question',
  question: 'selecting',
  selecting: 'revealing',
  revealing: 'voting',
  voting: 'results',
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServer()
  const { fromPhase, revealIndex } = await req.json()
  const code = params.code.toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })

  // Optimistic check — another client may have already advanced
  if (room.phase !== fromPhase) {
    return NextResponse.json({ success: true, phase: room.phase })
  }

  const now = new Date().toISOString()
  let nextPhase: GamePhase
  const extraUpdates: Record<string, unknown> = {}

  // Handle revealing sub-advances (reveal_index)
  if (fromPhase === 'revealing') {
    // Get total submissions
    const { count } = await supabase
      .from('round_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .eq('round_num', room.current_round)

    const totalSubmissions = count ?? 0
    const expectedIndex = revealIndex ?? room.reveal_index

    if (room.reveal_index !== expectedIndex) {
      return NextResponse.json({ success: true, phase: room.phase })
    }

    if (room.reveal_index < totalSubmissions - 1) {
      // Advance reveal index, stay in revealing phase
      await supabase
        .from('rooms')
        .update({ reveal_index: room.reveal_index + 1 })
        .eq('code', code)
        .eq('reveal_index', room.reveal_index)
      return NextResponse.json({ success: true, phase: 'revealing' })
    }
    // All revealed, go to voting
    nextPhase = 'voting'
  } else if (fromPhase === 'selecting') {
    // Auto-submit for players who didn't pick a card
    await autoSubmitMissingPlayers(supabase, room)
    nextPhase = 'revealing'
    extraUpdates.reveal_index = 0
    // Shuffle and assign display orders to submissions
    await assignDisplayOrders(supabase, room.id, room.current_round)
  } else if (fromPhase === 'voting') {
    // Auto-vote for players who didn't vote
    await autoVoteMissingPlayers(supabase, room)
    // Determine winner and award point
    await determineAndAwardWinner(supabase, room)
    nextPhase = 'results'
  } else if (fromPhase === 'results') {
    if (room.current_round >= room.total_rounds) {
      nextPhase = 'finished'
    } else {
      nextPhase = 'cards'
      // Deal replacement cards
      await dealReplacementCards(supabase, room)
      // Pick new question
      const newQuestionId = await pickNewQuestion(supabase, room)
      extraUpdates.current_round = room.current_round + 1
      extraUpdates.current_question_id = newQuestionId
    }
  } else {
    nextPhase = NEXT_PHASE[fromPhase as GamePhase] ?? fromPhase
  }

  const { data: updated } = await supabase
    .from('rooms')
    .update({ phase: nextPhase, phase_started_at: now, ...extraUpdates })
    .eq('code', code)
    .eq('phase', fromPhase)
    .select()
    .single()

  return NextResponse.json({ success: true, phase: updated?.phase ?? nextPhase })
}

async function autoSubmitMissingPlayers(supabase: ReturnType<typeof getSupabaseServer>, room: { id: string; current_round: number }) {
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', room.id)

  if (!players) return

  const { data: submitted } = await supabase
    .from('round_submissions')
    .select('player_id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  const submittedIds = new Set(submitted?.map(s => s.player_id) ?? [])
  const missing = players.filter(p => !submittedIds.has(p.id))

  for (const player of missing) {
    const { data: hand } = await supabase
      .from('player_hands')
      .select('card_id')
      .eq('player_id', player.id)
      .eq('room_id', room.id)
      .limit(1)

    if (hand && hand.length > 0) {
      const cardId = hand[0].card_id
      await supabase.from('round_submissions').upsert({
        room_id: room.id,
        round_num: room.current_round,
        player_id: player.id,
        card_id: cardId,
      }, { onConflict: 'room_id,round_num,player_id' })
      // Remove from hand
      await supabase.from('player_hands')
        .delete()
        .eq('player_id', player.id)
        .eq('card_id', cardId)
    }
  }
}

async function assignDisplayOrders(supabase: ReturnType<typeof getSupabaseServer>, roomId: string, roundNum: number) {
  const { data: submissions } = await supabase
    .from('round_submissions')
    .select('id')
    .eq('room_id', roomId)
    .eq('round_num', roundNum)

  if (!submissions) return
  const shuffled = shuffleArray(submissions)
  for (let i = 0; i < shuffled.length; i++) {
    await supabase.from('round_submissions').update({ display_order: i }).eq('id', shuffled[i].id)
  }
}

async function autoVoteMissingPlayers(supabase: ReturnType<typeof getSupabaseServer>, room: { id: string; current_round: number }) {
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', room.id)

  if (!players) return

  const { data: voted } = await supabase
    .from('round_votes')
    .select('voter_id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  const votedIds = new Set(voted?.map(v => v.voter_id) ?? [])
  const missing = players.filter(p => !votedIds.has(p.id))

  // Get all submissions
  const { data: submissions } = await supabase
    .from('round_submissions')
    .select('id, player_id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  if (!submissions || submissions.length === 0) return

  for (const player of missing) {
    // Can't vote for own submission
    const eligible = submissions.filter(s => s.player_id !== player.id)
    if (eligible.length === 0) continue
    const randomSubmission = eligible[Math.floor(Math.random() * eligible.length)]
    await supabase.from('round_votes').upsert({
      room_id: room.id,
      round_num: room.current_round,
      voter_id: player.id,
      submission_id: randomSubmission.id,
    }, { onConflict: 'room_id,round_num,voter_id' })
  }
}

async function determineAndAwardWinner(supabase: ReturnType<typeof getSupabaseServer>, room: { id: string; current_round: number }) {
  const { data: votes } = await supabase
    .from('round_votes')
    .select('submission_id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  if (!votes || votes.length === 0) return

  // Count votes per submission
  const voteCounts: Record<string, number> = {}
  for (const v of votes) {
    voteCounts[v.submission_id] = (voteCounts[v.submission_id] ?? 0) + 1
  }

  const maxVotes = Math.max(...Object.values(voteCounts))
  // All submissions tied at the top get +1 point
  const winnerIds = Object.entries(voteCounts)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id)

  for (const winnerId of winnerIds) {
    const { data: submission } = await supabase
      .from('round_submissions')
      .select('player_id')
      .eq('id', winnerId)
      .single()

    if (!submission) continue

    const { data: player } = await supabase
      .from('players')
      .select('score')
      .eq('id', submission.player_id)
      .single()

    if (player) {
      await supabase.from('players').update({ score: player.score + 1 }).eq('id', submission.player_id)
    }
  }
}

async function dealReplacementCards(supabase: ReturnType<typeof getSupabaseServer>, room: { id: string; current_round: number }) {
  const { data: submissions } = await supabase
    .from('round_submissions')
    .select('player_id, card_id')
    .eq('room_id', room.id)
    .eq('round_num', room.current_round)

  if (!submissions) return

  const { data: usedCards } = await supabase
    .from('used_answer_cards')
    .select('card_id')
    .eq('room_id', room.id)

  const usedIds = new Set(usedCards?.map(c => c.card_id) ?? [])
  const available = ANSWERS.map(a => a.id).filter(id => !usedIds.has(id))
  const shuffledAvailable = shuffleArray(available)
  let idx = 0

  for (const submission of submissions) {
    if (idx >= shuffledAvailable.length) break
    const newCardId = shuffledAvailable[idx++]
    await supabase.from('player_hands').insert({
      player_id: submission.player_id,
      room_id: room.id,
      card_id: newCardId,
    })
    await supabase.from('used_answer_cards').insert({ room_id: room.id, card_id: newCardId })
  }
}

async function pickNewQuestion(supabase: ReturnType<typeof getSupabaseServer>, room: { id: string }): Promise<number> {
  const { data: usedQuestions } = await supabase
    .from('used_question_cards')
    .select('card_id')
    .eq('room_id', room.id)

  const usedIds = new Set(usedQuestions?.map(q => q.card_id) ?? [])
  const available = QUESTIONS.map(q => q.id).filter(id => !usedIds.has(id))

  if (available.length === 0) {
    // All questions used, start over
    const qId = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].id
    return qId
  }

  const newQId = available[Math.floor(Math.random() * available.length)]
  await supabase.from('used_question_cards').insert({ room_id: room.id, card_id: newQId })
  return newQId
}
