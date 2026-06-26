'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Room, Player, RoundSubmission, RoundVote, PlayerHand } from '@/types/game'
import { PHASE_DURATIONS, REVEAL_DURATION } from '@/types/game'
import { getAnswerById, getQuestionById } from '@/lib/cards'
import { QuestionCard, AnswerCard } from './CardComponent'

interface GameBoardProps {
  room: Room
  players: Player[]
  myPlayer: Player
  submissions: RoundSubmission[]
  votes: RoundVote[]
  myHand: PlayerHand[]
  onAdvance: (fromPhase: string, revealIndex?: number) => void
  onSubmit: (cardId: number) => Promise<{ allSubmitted?: boolean }>
  onVote: (submissionId: string) => Promise<{ allVoted?: boolean }>
  onEndGame: () => void
}

function Timer({ seconds, className }: { seconds: number; className?: string }) {
  const isUrgent = seconds <= 10
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-black
        ${isUrgent ? 'border-red-400 text-red-400 animate-pulse' : 'border-white/50 text-white'}`}>
        {seconds}
      </div>
    </div>
  )
}

export default function GameBoard({
  room, players, myPlayer, submissions, votes, myHand,
  onAdvance, onSubmit, onVote, onEndGame
}: GameBoardProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  // Optimistic states — set immediately on user action, reset on phase change
  const [submittedThisPhase, setSubmittedThisPhase] = useState(false)
  const [votedThisPhase, setVotedThisPhase] = useState(false)
  const advancedRef = useRef<string>('')
  const currentPhaseKey = `${room.phase}-${room.current_round}`

  // Reset optimistic states when phase/round changes
  useEffect(() => {
    setSubmittedThisPhase(false)
    setVotedThisPhase(false)
    setSelectedCardId(null)
  }, [currentPhaseKey])

  const question = room.current_question_id ? getQuestionById(room.current_question_id) : null

  // Check if already submitted/voted via DB state (in case of reconnect)
  const mySubmission = submissions.find(s => s.player_id === myPlayer.id)
  const myVote = votes.find(v => v.voter_id === myPlayer.id)
  const hasSubmitted = submittedThisPhase || !!mySubmission
  const hasVoted = votedThisPhase || !!myVote

  // Phase timer — drives the UI countdown and triggers advance when it hits 0
  useEffect(() => {
    if (!room.phase_started_at) return
    const duration = PHASE_DURATIONS[room.phase]
    if (!duration) return

    const startTime = new Date(room.phase_started_at).getTime()
    const endTime = startTime + duration * 1000
    const advanceKey = `timer-${room.phase}-${room.phase_started_at}`

    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && advancedRef.current !== advanceKey) {
        advancedRef.current = advanceKey
        onAdvance(room.phase)
      }
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [room.phase, room.phase_started_at, onAdvance])

  // Auto-advance when all players submitted (detecting via realtime updates)
  useEffect(() => {
    if (room.phase !== 'selecting') return
    if (submissions.length >= players.length) {
      const advanceKey = `allsubmit-${room.current_round}-${submissions.length}`
      if (advancedRef.current !== advanceKey) {
        advancedRef.current = advanceKey
        onAdvance('selecting')
      }
    }
  }, [submissions.length, players.length, room.phase, room.current_round, onAdvance])

  // Auto-advance when all players voted
  useEffect(() => {
    if (room.phase !== 'voting') return
    if (votes.length >= players.length) {
      const advanceKey = `allvote-${room.current_round}-${votes.length}`
      if (advancedRef.current !== advanceKey) {
        advancedRef.current = advanceKey
        onAdvance('voting')
      }
    }
  }, [votes.length, players.length, room.phase, room.current_round, onAdvance])

  // Auto-advance reveal index every REVEAL_DURATION seconds
  useEffect(() => {
    if (room.phase !== 'revealing' || !room.phase_started_at) return
    const revealKey = `reveal-${room.current_round}-${room.reveal_index}`
    const timeout = setTimeout(() => {
      if (advancedRef.current !== revealKey) {
        advancedRef.current = revealKey
        onAdvance('revealing', room.reveal_index)
      }
    }, REVEAL_DURATION * 1000)
    return () => clearTimeout(timeout)
  }, [room.phase, room.current_round, room.reveal_index, room.phase_started_at, onAdvance])

  const handleSubmit = useCallback(async () => {
    if (!selectedCardId || hasSubmitted) return
    setSubmittedThisPhase(true) // optimistic
    const result = await onSubmit(selectedCardId)
    setSelectedCardId(null)
    // If server confirms everyone submitted, advance immediately
    if (result?.allSubmitted) {
      const advanceKey = `allsubmit-server-${room.current_round}`
      if (advancedRef.current !== advanceKey) {
        advancedRef.current = advanceKey
        onAdvance('selecting')
      }
    }
  }, [selectedCardId, hasSubmitted, onSubmit, onAdvance, room.current_round])

  const handleVote = useCallback(async (submissionId: string) => {
    if (hasVoted) return
    setVotedThisPhase(true) // optimistic
    const result = await onVote(submissionId)
    // If server confirms everyone voted, advance immediately
    if (result?.allVoted) {
      const advanceKey = `allvote-server-${room.current_round}`
      if (advancedRef.current !== advanceKey) {
        advancedRef.current = advanceKey
        onAdvance('voting')
      }
    }
  }, [hasVoted, onVote, onAdvance, room.current_round])

  // Sorted submissions by display_order
  const sortedSubmissions = [...submissions].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
  const currentRevealSubmission = sortedSubmissions[room.reveal_index]

  // Vote counts for results phase
  const voteCounts: Record<string, number> = {}
  for (const v of votes) {
    voteCounts[v.submission_id] = (voteCounts[v.submission_id] ?? 0) + 1
  }
  const maxVotes = votes.length > 0 ? Math.max(...Object.values(voteCounts)) : 0
  const winnerSubmissions = submissions.filter(s => (voteCounts[s.id] ?? 0) === maxVotes && maxVotes > 0)
  const winnerPlayers = winnerSubmissions.map(s => players.find(p => p.id === s.player_id)).filter(Boolean)

  const submittedCount = submissions.length
  const votedCount = votes.length
  const totalPlayers = players.length

  const EndGameButton = () =>
    myPlayer.is_host ? (
      <button onClick={onEndGame} className="btn-danger mt-8 text-sm opacity-50 hover:opacity-100 transition-opacity">
        Termina Partita
      </button>
    ) : null

  // ─── COUNTDOWN ───────────────────────────────────────────────────────────────
  if (room.phase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800 p-6">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-3xl font-black text-white mb-2">La partita inizia!</h2>
          <p className="text-teal-200 mb-8">Preparatevi...</p>
          <div className="w-32 h-32 rounded-full border-4 border-white/50 flex items-center justify-center mx-auto mb-8">
            <span className="text-6xl font-black text-white">{timeLeft}</span>
          </div>
          <p className="text-teal-200 text-sm">Round 1 di {room.total_rounds}</p>
        </div>
      </div>
    )
  }

  // ─── CARDS PHASE ─────────────────────────────────────────────────────────────
  if (room.phase === 'cards') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800 p-6">
        <div className="text-center mb-6 animate-fade-in">
          <span className="phase-badge mb-3 inline-block">Round {room.current_round} / {room.total_rounds}</span>
          <h2 className="text-2xl font-black text-white mb-1">Le tue carte!</h2>
          <p className="text-teal-200 text-sm">Studia bene le tue risposte...</p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center mb-8">
          {myHand.map((hand) => {
            const card = getAnswerById(hand.card_id)
            if (!card) return null
            return <AnswerCard key={hand.card_id} text={card.text} disabled size="lg" className="animate-slide-up" />
          })}
        </div>
        <Timer seconds={timeLeft} />
        <EndGameButton />
      </div>
    )
  }

  // ─── QUESTION PHASE ───────────────────────────────────────────────────────────
  if (room.phase === 'question') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800 p-6">
        <div className="text-center mb-6 animate-fade-in">
          <span className="phase-badge mb-3 inline-block">Jack Black chiede...</span>
        </div>
        <div className="flex items-center gap-6 mb-8 flex-col sm:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="jack-avatar w-20 h-20 text-3xl">JB</div>
            <p className="text-white font-bold">Jack Black</p>
          </div>
          {question && <QuestionCard text={question.text} className="animate-bounce-in" />}
        </div>
        <Timer seconds={timeLeft} />
        <EndGameButton />
      </div>
    )
  }

  // ─── SELECTING PHASE ─────────────────────────────────────────────────────────
  if (room.phase === 'selecting') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-900 to-teal-800 p-6 pt-8">
        <div className="text-center mb-4 animate-fade-in">
          <span className="phase-badge mb-2 inline-block">Scegli la tua risposta!</span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Timer seconds={timeLeft} className="scale-75" />
          </div>
        </div>

        <div className="w-full max-w-md bg-white/10 rounded-2xl p-4 mb-6 flex gap-4 items-start">
          <div className="jack-avatar w-12 h-12 text-xl flex-shrink-0">JB</div>
          <div>
            <p className="text-teal-200 text-xs font-semibold mb-1">JACK BLACK CHIEDE:</p>
            <p className="text-white font-semibold text-sm leading-snug">{question?.text}</p>
          </div>
        </div>

        {hasSubmitted ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white text-xl font-bold">Risposta inviata!</p>
            <p className="text-teal-200 mt-2">Aspetta gli altri giocatori...</p>
            <p className="text-teal-300 text-sm mt-2">{submittedCount}/{totalPlayers} hanno risposto</p>
          </div>
        ) : (
          <>
            <p className="text-teal-200 text-sm mb-4">Tocca una carta per selezionarla</p>
            <div className="flex gap-4 flex-wrap justify-center mb-6">
              {myHand.map((hand) => {
                const card = getAnswerById(hand.card_id)
                if (!card) return null
                return (
                  <AnswerCard
                    key={hand.card_id}
                    text={card.text}
                    selected={selectedCardId === hand.card_id}
                    onClick={() => setSelectedCardId(hand.card_id === selectedCardId ? null : hand.card_id)}
                    size="lg"
                    className="animate-slide-up"
                  />
                )
              })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selectedCardId}
              className="btn-primary px-10 py-4 text-lg bg-white text-teal-900 hover:bg-gray-50 disabled:opacity-50"
            >
              Invia Risposta →
            </button>
          </>
        )}
        <EndGameButton />
      </div>
    )
  }

  // ─── REVEALING PHASE ─────────────────────────────────────────────────────────
  if (room.phase === 'revealing') {
    const submission = currentRevealSubmission
    const card = submission ? getAnswerById(submission.card_id) : null

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800 p-6">
        <div className="text-center mb-6">
          <span className="phase-badge mb-3 inline-block">Le risposte...</span>
          <p className="text-teal-200 text-sm">{room.reveal_index + 1} di {sortedSubmissions.length}</p>
        </div>
        {card && (
          <div className="animate-bounce-in">
            <AnswerCard text={card.text} disabled size="lg" />
          </div>
        )}
        <div className="flex gap-1 mt-8">
          {sortedSubmissions.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i <= room.reveal_index ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <EndGameButton />
      </div>
    )
  }

  // ─── VOTING PHASE ────────────────────────────────────────────────────────────
  if (room.phase === 'voting') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-900 to-teal-800 p-6 pt-8">
        <div className="text-center mb-4">
          <span className="phase-badge mb-2 inline-block">Vota la più divertente!</span>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Timer seconds={timeLeft} className="scale-75" />
            <span className="text-teal-200 text-sm">{votedCount}/{totalPlayers} hanno votato</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-white/10 rounded-2xl p-4 mb-6 flex gap-4 items-start">
          <div className="jack-avatar w-12 h-12 text-xl flex-shrink-0">JB</div>
          <div>
            <p className="text-teal-200 text-xs font-semibold mb-1">DOMANDA:</p>
            <p className="text-white font-semibold text-sm leading-snug">{question?.text}</p>
          </div>
        </div>

        {hasVoted && (
          <div className="text-center mb-4">
            <p className="text-teal-200 text-sm">Voto inviato! Aspetta gli altri...</p>
          </div>
        )}

        <div className="flex gap-4 flex-wrap justify-center">
          {sortedSubmissions.map((submission) => {
            const card = getAnswerById(submission.card_id)
            if (!card) return null
            const isMySubmission = submission.player_id === myPlayer.id
            const isVotedByMe = myVote?.submission_id === submission.id
            return (
              <div key={submission.id} className="flex flex-col items-center gap-2">
                <AnswerCard
                  text={card.text}
                  voted={isVotedByMe}
                  disabled={isMySubmission || hasVoted}
                  onClick={() => !isMySubmission && !hasVoted && handleVote(submission.id)}
                  size="lg"
                  className="animate-slide-up"
                />
                {isMySubmission && (
                  <span className="text-xs text-teal-300 font-semibold bg-white/10 px-3 py-1 rounded-full">
                    La tua carta
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <EndGameButton />
      </div>
    )
  }

  // ─── RESULTS PHASE ───────────────────────────────────────────────────────────
  if (room.phase === 'results') {
    const isTie = winnerSubmissions.length > 1

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800 p-6">
        <div className="text-center animate-bounce-in">
          <div className="text-5xl mb-4">{isTie ? '🤝' : '🏆'}</div>
          <span className="phase-badge mb-4 inline-block">Risultati Round {room.current_round}</span>
          <h2 className="text-2xl font-black text-white mb-6">
            {winnerPlayers.length === 0
              ? 'Nessun vincitore'
              : isTie
              ? `Pareggio! ${winnerPlayers.map(p => p?.name).join(' e ')} vincono!`
              : `${winnerPlayers[0]?.name} vince il round!`}
          </h2>

          <div className="flex gap-4 justify-center flex-wrap mb-6">
            {winnerSubmissions.map(ws => {
              const card = getAnswerById(ws.card_id)
              return card ? (
                <div key={ws.id} className="flex flex-col items-center gap-2">
                  <p className="text-teal-200 text-xs">La risposta vincente:</p>
                  <AnswerCard text={card.text} disabled size="md" />
                </div>
              ) : null
            })}
          </div>

          <div className="mt-4">
            <p className="text-teal-200 text-sm mb-3">Punteggi:</p>
            <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p) => (
                <div key={p.id} className="flex justify-between bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-teal-200 font-bold">{p.score} pt</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6"><Timer seconds={timeLeft} /></div>
          <EndGameButton />
        </div>
      </div>
    )
  }

  return null
}
