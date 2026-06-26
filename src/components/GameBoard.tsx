'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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

// ── CircularTimer ─────────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, size = 96 }: { seconds: number; total: number; size?: number }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, seconds / total)
  const urgent = seconds <= 10

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={urgent ? '#f87171' : 'rgba(255,255,255,0.9)'}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s' }}
        />
      </svg>
      <span
        className={`relative font-black z-10 ${urgent ? 'text-red-400 animate-countdown' : 'text-white'}`}
        style={{ fontSize: size * 0.28 }}
      >
        {seconds}
      </span>
    </div>
  )
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#ec4899', '#06b6d4'][i % 8],
    dur: 2.5 + Math.random() * 2,
    size: 7 + Math.random() * 10,
    shape: i % 3,
  })), [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          className={p.shape === 1 ? 'absolute rounded-full' : 'absolute rounded-sm'}
          style={{
            left: `${p.left}%`, top: -20,
            width: p.shape === 2 ? p.size * 1.8 : p.size,
            height: p.size,
            background: p.color,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── PlayerAvatar ──────────────────────────────────────────────────────────────
function PlayerAvatar({ name, index, size = 'md' }: { name: string; index: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full avatar-${index % 12} flex items-center justify-center text-white font-black shrink-0 shadow-lg`}>
      {name[0].toUpperCase()}
    </div>
  )
}

// ── Phase header ─────────────────────────────────────────────────────────────
function PhaseHeader({ label, round, total }: { label: string; round?: number; total?: number }) {
  return (
    <div className="text-center mb-4 animate-slide-down">
      {round !== undefined && (
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">
          Round {round} / {total}
        </p>
      )}
      <span className="phase-badge">{label}</span>
    </div>
  )
}

// ── EndGame button ────────────────────────────────────────────────────────────
function EndGameBtn({ onClick, isHost }: { onClick: () => void; isHost: boolean }) {
  if (!isHost) return null
  return (
    <button onClick={onClick} className="btn-danger mt-8 opacity-40 hover:opacity-90 transition-opacity text-xs">
      ✕ Termina Partita
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function GameBoard({
  room, players, myPlayer, submissions, votes, myHand,
  onAdvance, onSubmit, onVote, onEndGame
}: GameBoardProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [submittedThisPhase, setSubmittedThisPhase] = useState(false)
  const [votedThisPhase, setVotedThisPhase] = useState(false)
  const advancedRef = useRef<string>('')
  const phaseKey = `${room.phase}-${room.current_round}`

  useEffect(() => {
    setSubmittedThisPhase(false)
    setVotedThisPhase(false)
    setSelectedCardId(null)
  }, [phaseKey])

  const question = room.current_question_id ? getQuestionById(room.current_question_id) : null
  const mySubmission = submissions.find(s => s.player_id === myPlayer.id)
  const myVote = votes.find(v => v.voter_id === myPlayer.id)
  const hasSubmitted = submittedThisPhase || !!mySubmission
  const hasVoted = votedThisPhase || !!myVote

  // Phase timer
  useEffect(() => {
    if (!room.phase_started_at) return
    const duration = PHASE_DURATIONS[room.phase]
    if (!duration) return
    const startTime = new Date(room.phase_started_at).getTime()
    const endTime = startTime + duration * 1000
    const advKey = `timer-${room.phase}-${room.phase_started_at}`
    const tick = () => {
      const rem = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(rem)
      if (rem === 0 && advancedRef.current !== advKey) {
        advancedRef.current = advKey
        onAdvance(room.phase)
      }
    }
    tick()
    const iv = setInterval(tick, 250)
    return () => clearInterval(iv)
  }, [room.phase, room.phase_started_at, onAdvance])

  // Auto-advance when all submitted
  useEffect(() => {
    if (room.phase !== 'selecting') return
    if (submissions.length >= players.length) {
      const k = `allsubmit-${room.current_round}-${submissions.length}`
      if (advancedRef.current !== k) { advancedRef.current = k; onAdvance('selecting') }
    }
  }, [submissions.length, players.length, room.phase, room.current_round, onAdvance])

  // Auto-advance when all voted
  useEffect(() => {
    if (room.phase !== 'voting') return
    if (votes.length >= players.length) {
      const k = `allvote-${room.current_round}-${votes.length}`
      if (advancedRef.current !== k) { advancedRef.current = k; onAdvance('voting') }
    }
  }, [votes.length, players.length, room.phase, room.current_round, onAdvance])

  // Reveal timer
  useEffect(() => {
    if (room.phase !== 'revealing' || !room.phase_started_at) return
    const k = `reveal-${room.current_round}-${room.reveal_index}`
    const t = setTimeout(() => {
      if (advancedRef.current !== k) { advancedRef.current = k; onAdvance('revealing', room.reveal_index) }
    }, REVEAL_DURATION * 1000)
    return () => clearTimeout(t)
  }, [room.phase, room.current_round, room.reveal_index, room.phase_started_at, onAdvance])

  const handleSubmit = useCallback(async () => {
    if (!selectedCardId || hasSubmitted) return
    setSubmittedThisPhase(true)
    const result = await onSubmit(selectedCardId)
    setSelectedCardId(null)
    if (result?.allSubmitted) {
      const k = `allsubmit-server-${room.current_round}`
      if (advancedRef.current !== k) { advancedRef.current = k; onAdvance('selecting') }
    }
  }, [selectedCardId, hasSubmitted, onSubmit, onAdvance, room.current_round])

  const handleVote = useCallback(async (submissionId: string) => {
    if (hasVoted) return
    setVotedThisPhase(true)
    const result = await onVote(submissionId)
    if (result?.allVoted) {
      const k = `allvote-server-${room.current_round}`
      if (advancedRef.current !== k) { advancedRef.current = k; onAdvance('voting') }
    }
  }, [hasVoted, onVote, onAdvance, room.current_round])

  const phaseDuration = PHASE_DURATIONS[room.phase] ?? 30
  const sortedSubmissions = [...submissions].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
  const currentRevealSubmission = sortedSubmissions[room.reveal_index]
  const voteCounts: Record<string, number> = {}
  for (const v of votes) voteCounts[v.submission_id] = (voteCounts[v.submission_id] ?? 0) + 1
  const maxVotes = votes.length > 0 ? Math.max(...Object.values(voteCounts)) : 0
  const winnerSubs = submissions.filter(s => (voteCounts[s.id] ?? 0) === maxVotes && maxVotes > 0)
  const winnerPlayers = winnerSubs.map(s => players.find(p => p.id === s.player_id)).filter(Boolean)
  const playerIndex = (id: string) => players.findIndex(p => p.id === id)

  // ── COUNTDOWN ─────────────────────────────────────────────────────────────
  if (room.phase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phase-countdown p-6 overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="text-center animate-bounce-in relative z-10">
          <div className="text-7xl mb-6 animate-bounce">🚀</div>
          <h2 className="text-4xl font-black text-white mb-2">La partita inizia!</h2>
          <p className="text-purple-300 mb-10 font-medium">Preparatevi alle risate...</p>
          <div className="mb-8">
            <CircularTimer seconds={timeLeft} total={phaseDuration} size={140} />
          </div>
          <div className="glass px-8 py-3 inline-block">
            <p className="text-purple-200 text-sm font-semibold">Round 1 di {room.total_rounds}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── CARDS ─────────────────────────────────────────────────────────────────
  if (room.phase === 'cards') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-phase-cards p-5 pt-8">
        <PhaseHeader label="Le tue carte!" round={room.current_round} total={room.total_rounds} />
        <p className="text-emerald-300 text-sm mb-6 font-medium animate-fade-in">
          Studia le tue risposte con cura...
        </p>
        <div className="flex gap-4 flex-wrap justify-center mb-8">
          {myHand.map((hand, i) => {
            const card = getAnswerById(hand.card_id)
            if (!card) return null
            return (
              <div key={hand.card_id} className="animate-flip-in" style={{ animationDelay: `${i * 150}ms` }}>
                <AnswerCard text={card.text} disabled size="lg" />
              </div>
            )
          })}
        </div>
        <CircularTimer seconds={timeLeft} total={phaseDuration} />
        <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
      </div>
    )
  }

  // ── QUESTION ──────────────────────────────────────────────────────────────
  if (room.phase === 'question') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phase-question p-5">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl" />
        </div>
        <PhaseHeader label="Jack Black chiede..." round={room.current_round} total={room.total_rounds} />
        <div className="relative z-10 flex flex-col items-center gap-6 animate-bounce-in">
          <div className="flex items-center gap-3 glass px-5 py-3 rounded-full">
            <div className="jack-avatar w-10 h-10 text-xs">JB</div>
            <div>
              <p className="text-white font-black text-sm">Jack Black</p>
              <p className="text-purple-300 text-xs">Il Mazziere</p>
            </div>
          </div>
          {question && <QuestionCard text={question.text} size="lg" className="animate-flip-in" />}
        </div>
        <div className="mt-8">
          <CircularTimer seconds={timeLeft} total={phaseDuration} />
        </div>
        <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
      </div>
    )
  }

  // ── SELECTING ─────────────────────────────────────────────────────────────
  if (room.phase === 'selecting') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-phase-selecting p-5 pt-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4 animate-slide-down">
            <PhaseHeader label="Scegli la risposta!" round={room.current_round} total={room.total_rounds} />
            <CircularTimer seconds={timeLeft} total={phaseDuration} size={72} />
          </div>

          <div className="glass-dark flex gap-3 items-start p-4 rounded-2xl mb-5 animate-slide-down">
            <div className="jack-avatar w-9 h-9 text-xs shrink-0">JB</div>
            <p className="text-white font-semibold text-sm leading-snug pt-0.5">{question?.text}</p>
          </div>

          <div className="glass px-4 py-2.5 flex items-center justify-between rounded-2xl mb-4 animate-fade-in">
            <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">Risposte inviate</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {players.map((p, i) => {
                  const hasSub = submissions.some(s => s.player_id === p.id)
                  return (
                    <div key={p.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300
                      ${hasSub ? `avatar-${i % 12} scale-110` : 'bg-white/10'}`}>
                      {hasSub ? p.name[0].toUpperCase() : ''}
                    </div>
                  )
                })}
              </div>
              <span className="text-white font-black text-sm">{submissions.length}/{players.length}</span>
            </div>
          </div>

          {hasSubmitted ? (
            <div className="text-center py-12 animate-bounce-in">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white text-2xl font-black">Risposta inviata!</p>
              <p className="text-amber-300 mt-2 font-medium">Aspetta gli altri giocatori...</p>
            </div>
          ) : (
            <>
              <p className="text-amber-200/70 text-xs font-semibold text-center mb-4 uppercase tracking-wide">
                Tocca una carta per selezionarla
              </p>
              <div className="flex gap-4 flex-wrap justify-center mb-6">
                {myHand.map((hand, i) => {
                  const card = getAnswerById(hand.card_id)
                  if (!card) return null
                  return (
                    <div key={hand.card_id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <AnswerCard
                        text={card.text}
                        selected={selectedCardId === hand.card_id}
                        onClick={() => setSelectedCardId(hand.card_id === selectedCardId ? null : hand.card_id)}
                        size="lg"
                      />
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!selectedCardId}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300
                  ${selectedCardId
                    ? 'bg-white text-orange-900 shadow-2xl hover:scale-105'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                {selectedCardId ? 'Invia Risposta →' : 'Seleziona una carta prima'}
              </button>
            </>
          )}
          <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
        </div>
      </div>
    )
  }

  // ── REVEALING ────────────────────────────────────────────────────────────
  if (room.phase === 'revealing') {
    const card = currentRevealSubmission ? getAnswerById(currentRevealSubmission.card_id) : null
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phase-revealing p-5">
        <div className="relative z-10 text-center w-full max-w-sm animate-fade-in">
          <PhaseHeader label="Le risposte..." />
          <p className="text-slate-400 text-xs mb-6 font-medium">
            {room.reveal_index + 1} di {sortedSubmissions.length}
          </p>
          <div key={`reveal-${room.reveal_index}`} className="flex justify-center mb-6 animate-flip-in">
            {card ? <AnswerCard text={card.text} disabled size="lg" /> : null}
          </div>
          <div className="flex gap-2 justify-center mb-8">
            {sortedSubmissions.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-500
                ${i < room.reveal_index ? 'w-3 h-3 bg-white/60' :
                  i === room.reveal_index ? 'w-5 h-3 bg-white' : 'w-3 h-3 bg-white/20'}`} />
            ))}
          </div>
          <p className="text-slate-400 text-xs animate-pulse">Prossima carta tra pochi secondi...</p>
        </div>
        <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
      </div>
    )
  }

  // ── VOTING ───────────────────────────────────────────────────────────────
  if (room.phase === 'voting') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-phase-voting p-5 pt-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4 animate-slide-down">
            <PhaseHeader label="Vota la più divertente!" round={room.current_round} total={room.total_rounds} />
            <CircularTimer seconds={timeLeft} total={phaseDuration} size={72} />
          </div>

          <div className="glass-dark flex gap-3 items-start p-4 rounded-2xl mb-4 animate-slide-down">
            <div className="jack-avatar w-9 h-9 text-xs shrink-0">JB</div>
            <p className="text-white font-semibold text-sm leading-snug pt-0.5">{question?.text}</p>
          </div>

          <div className="glass px-4 py-2.5 flex items-center justify-between rounded-2xl mb-4">
            <p className="text-rose-300 text-xs font-bold uppercase tracking-wide">Voti espressi</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {players.map((p, i) => {
                  const hasVotedP = votes.some(v => v.voter_id === p.id)
                  return (
                    <div key={p.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300
                      ${hasVotedP ? `avatar-${i % 12} scale-110` : 'bg-white/10'}`}>
                      {hasVotedP ? p.name[0].toUpperCase() : ''}
                    </div>
                  )
                })}
              </div>
              <span className="text-white font-black text-sm">{votes.length}/{players.length}</span>
            </div>
          </div>

          {hasVoted && (
            <div className="glass px-4 py-2 rounded-xl mb-3 text-center animate-pop-in">
              <p className="text-rose-200 text-sm font-semibold">✓ Voto inviato! Aspetta gli altri...</p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap justify-center">
            {sortedSubmissions.map((submission, i) => {
              const card = getAnswerById(submission.card_id)
              if (!card) return null
              const isMySubmission = submission.player_id === myPlayer.id
              const isVotedByMe = myVote?.submission_id === submission.id
              const voteCount = voteCounts[submission.id] ?? 0
              return (
                <div key={submission.id} className="flex flex-col items-center gap-2 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <AnswerCard
                    text={card.text}
                    voted={isVotedByMe}
                    disabled={isMySubmission || hasVoted}
                    onClick={() => !isMySubmission && !hasVoted && handleVote(submission.id)}
                    size="lg"
                  />
                  <div className="flex items-center gap-2">
                    {isMySubmission && (
                      <span className="text-xs text-rose-300 font-bold bg-white/10 px-3 py-1 rounded-full">
                        La tua carta
                      </span>
                    )}
                    {voteCount > 0 && (
                      <span className="text-xs text-amber-300 font-black bg-amber-500/20 px-2 py-1 rounded-full">
                        {voteCount} {voteCount === 1 ? 'voto' : 'voti'} ★
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
        </div>
      </div>
    )
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (room.phase === 'results') {
    const isTie = winnerSubs.length > 1
    const isLastRound = room.current_round >= room.total_rounds
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phase-results p-5">
        {winnerPlayers.length > 0 && <Confetti />}
        <div className="relative z-10 text-center w-full max-w-md animate-bounce-in">
          <div className="text-6xl mb-3">{isTie ? '🤝' : '🏆'}</div>
          <span className="phase-badge mb-4 inline-block">Round {room.current_round} / {room.total_rounds}</span>
          <h2 className="text-2xl font-black text-white mb-4">
            {winnerPlayers.length === 0
              ? 'Nessun vincitore...'
              : isTie
              ? 'Pareggio! +1 a tutti i vincitori!'
              : `${winnerPlayers[0]?.name} vince il round!`}
          </h2>

          <div className="flex gap-3 justify-center flex-wrap mb-5">
            {winnerSubs.map(ws => {
              const card = getAnswerById(ws.card_id)
              const wp = players.find(p => p.id === ws.player_id)
              return card ? (
                <div key={ws.id} className="flex flex-col items-center gap-2">
                  <AnswerCard text={card.text} disabled size="md" />
                  {isTie && wp && (
                    <div className="flex items-center gap-1.5">
                      <PlayerAvatar name={wp.name} index={playerIndex(wp.id)} size="sm" />
                      <span className="text-white text-xs font-bold">{wp.name}</span>
                    </div>
                  )}
                </div>
              ) : null
            })}
          </div>

          <div className="glass-dark rounded-2xl p-4 mb-4">
            <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">Classifica</p>
            <div className="space-y-2">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => {
                const isWinner = winnerPlayers.some(wp => wp?.id === p.id)
                return (
                  <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2
                    ${isWinner ? 'bg-amber-500/20 ring-1 ring-amber-500/40' : 'bg-white/5'}`}>
                    <span className="text-white/40 font-black text-sm w-4">{i + 1}</span>
                    <PlayerAvatar name={p.name} index={playerIndex(p.id)} size="sm" />
                    <span className={`font-bold text-sm flex-1 ${isWinner ? 'text-amber-300' : 'text-white'}`}>{p.name}</span>
                    <span className={`font-black text-lg ${isWinner ? 'text-amber-300' : 'text-white'}`}>{p.score}</span>
                    <span className="text-white/40 text-xs">pt</span>
                    {isWinner && <span className="text-amber-400 text-xs ml-1">+1★</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-amber-300/60 text-xs">
            <CircularTimer seconds={timeLeft} total={phaseDuration} size={40} />
            <span>{isLastRound ? 'Verso il podio...' : 'Prossimo round tra...'}</span>
          </div>
          <EndGameBtn onClick={onEndGame} isHost={myPlayer.is_host} />
        </div>
      </div>
    )
  }

  return null
}
