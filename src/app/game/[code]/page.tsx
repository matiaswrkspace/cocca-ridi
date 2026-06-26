'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Room, Player, RoundSubmission, RoundVote, PlayerHand } from '@/types/game'
import { getSupabaseClient } from '@/lib/supabase-client'
import Lobby from '@/components/Lobby'
import GameBoard from '@/components/GameBoard'
import Podium from '@/components/Podium'
import OtterLogo from '@/components/OtterLogo'

interface PageProps {
  params: { code: string }
}

export default function GamePage({ params }: PageProps) {
  const code = params.code.toUpperCase()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [submissions, setSubmissions] = useState<RoundSubmission[]>([])
  const [votes, setVotes] = useState<RoundVote[]>([])
  const [myHand, setMyHand] = useState<PlayerHand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)

  // Direct-link join states
  const [joinName, setJoinName] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Read playerId from localStorage once on client
  useEffect(() => {
    const stored = localStorage.getItem(`player_${code}`)
    setPlayerId(stored)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Load initial data
  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawRoom } = await supabase.from('rooms').select('*').eq('code', code).single() as any
      if (!rawRoom) { setError('Stanza non trovata'); setLoading(false); return }
      const roomData = rawRoom as Room
      setRoom(roomData)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawPlayers } = await supabase.from('players').select('*').eq('room_id', roomData.id).order('created_at') as any
      const playersData = (rawPlayers ?? []) as Player[]
      setPlayers(playersData)

      if (playerId) {
        const me = playersData.find((p: Player) => p.id === playerId)
        setMyPlayer(me ?? null)

        // Load hand
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawHand } = await supabase.from('player_hands').select('*').eq('player_id', playerId).eq('room_id', roomData.id) as any
        setMyHand((rawHand ?? []) as PlayerHand[])
      }

      if (roomData.current_round > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawSubs } = await supabase.from('round_submissions').select('*').eq('room_id', roomData.id).eq('round_num', roomData.current_round) as any
        setSubmissions((rawSubs ?? []) as RoundSubmission[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawVotes } = await supabase.from('round_votes').select('*').eq('room_id', roomData.id).eq('round_num', roomData.current_round) as any
        setVotes((rawVotes ?? []) as RoundVote[])
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, playerId])

  // Realtime subscriptions
  useEffect(() => {
    if (!room) return

    const channel = supabase.channel(`game:${code}`)

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        async (payload) => {
          const newRoom = payload.new as Room
          setRoom(newRoom)
          if (newRoom.current_round > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: s } = await supabase.from('round_submissions').select('*').eq('room_id', newRoom.id).eq('round_num', newRoom.current_round) as any
            setSubmissions((s ?? []) as RoundSubmission[])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: v } = await supabase.from('round_votes').select('*').eq('room_id', newRoom.id).eq('round_num', newRoom.current_round) as any
            setVotes((v ?? []) as RoundVote[])
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
        async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await supabase.from('players').select('*').eq('room_id', room.id).order('created_at') as any
          const ps = (data ?? []) as Player[]
          setPlayers(ps)
          if (playerId) {
            const me = ps.find((p: Player) => p.id === playerId)
            setMyPlayer(me ?? null)
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_hands', filter: `room_id=eq.${room.id}` },
        async () => {
          if (!playerId) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await supabase.from('player_hands').select('*').eq('player_id', playerId).eq('room_id', room.id) as any
          setMyHand((data ?? []) as PlayerHand[])
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_submissions', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const newSub = payload.new as RoundSubmission
          if (room && newSub.round_num === room.current_round) {
            setSubmissions(prev => [...prev.filter(s => s.id !== newSub.id), newSub])
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'round_submissions', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as RoundSubmission
          setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s))
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_votes', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const newVote = payload.new as RoundVote
          if (room && newVote.round_num === room.current_round) {
            setVotes(prev => [...prev.filter(v => v.id !== newVote.id), newVote])
          }
        })
      .subscribe()

    return () => { channel.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, code, playerId])

  const advance = useCallback(async (fromPhase: string, revealIndex?: number) => {
    await fetch(`/api/room/${code}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPhase, revealIndex }),
    })
  }, [code])

  const handleStart = useCallback(async () => {
    if (!myPlayer) return
    await fetch(`/api/room/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id }),
    })
  }, [code, myPlayer])

  const handleSubmit = useCallback(async (cardId: number) => {
    if (!myPlayer) return {}
    const res = await fetch(`/api/room/${code}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id, cardId }),
    })
    return res.ok ? res.json() : {}
  }, [code, myPlayer])

  const handleVote = useCallback(async (submissionId: string) => {
    if (!myPlayer) return {}
    const res = await fetch(`/api/room/${code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id, submissionId }),
    })
    return res.ok ? res.json() : {}
  }, [code, myPlayer])

  const handleEndGame = useCallback(async () => {
    if (!myPlayer) return
    await fetch(`/api/room/${code}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id }),
    })
  }, [code, myPlayer])

  const handleNewGame = useCallback(() => {
    localStorage.removeItem(`player_${code}`)
    router.push('/')
  }, [code, router])

  const handleDirectJoin = useCallback(async () => {
    const name = joinName.trim()
    if (!name || !room) return
    setJoinLoading(true)
    setJoinError('')
    const sessionId = crypto.randomUUID()
    const res = await fetch(`/api/room/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name, sessionId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setJoinError(data.error ?? 'Errore durante il join')
      setJoinLoading(false)
      return
    }
    localStorage.setItem(`player_${code}`, data.playerId)
    setPlayerId(data.playerId)
    setJoinLoading(false)
  }, [joinName, room, code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-phase-lobby">
        <div className="text-center animate-fade-in">
          <OtterLogo size={100} className="mx-auto mb-3 animate-bounce" />
          <p className="text-white font-black text-2xl mb-1">Cocca Ridi</p>
          <p className="text-emerald-300 font-medium">Caricamento in corso...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-phase-lobby p-6">
        <div className="glass p-8 rounded-3xl text-center max-w-sm w-full animate-bounce-in">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-bold text-xl mb-2">{error || 'Stanza non trovata'}</p>
          <p className="text-emerald-300 text-sm mb-6">Il link potrebbe non essere più valido.</p>
          <button onClick={() => router.push('/')} className="btn-green w-full py-3">
            Torna al Menù
          </button>
        </div>
      </div>
    )
  }

  // Direct join via link — room in waiting phase, no player session
  if (!myPlayer && room && room.phase === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phase-lobby p-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="w-full max-w-sm relative z-10 animate-bounce-in">
          <div className="text-center mb-8">
            <OtterLogo size={90} className="mx-auto mb-1" />
            <h1 className="text-3xl font-black text-white">Cocca Ridi</h1>
            <p className="text-emerald-300 text-sm mt-1 font-medium">Stanza <span className="font-black text-white">{room.code}</span></p>
          </div>
          <div className="glass p-6 rounded-3xl">
            <h2 className="text-xl font-black text-white mb-1">Entra nella stanza!</h2>
            <p className="text-emerald-300 text-sm mb-5 font-medium">
              {players.length} {players.length === 1 ? 'giocatore' : 'giocatori'} già dentro
            </p>
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wide mb-2">
              Il tuo nome
            </label>
            <input
              className="input-field mb-4"
              placeholder="Come ti chiami?"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDirectJoin()}
              maxLength={20}
              autoFocus
            />
            {joinError && (
              <p className="text-red-400 text-sm font-semibold mb-3 bg-red-500/10 px-3 py-2 rounded-xl">{joinError}</p>
            )}
            <button
              onClick={handleDirectJoin}
              disabled={joinLoading || !joinName.trim()}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300
                ${joinName.trim() && !joinLoading
                  ? 'btn-green'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
            >
              {joinLoading ? 'Entro...' : 'Entra nella stanza →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-phase-lobby">
        <div className="text-center glass p-8 rounded-3xl max-w-sm mx-5">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-white font-bold text-xl mb-4">Sessione non trovata</p>
          <p className="text-emerald-300 text-sm mb-6">La partita è già iniziata o la stanza non esiste.</p>
          <button onClick={() => router.push('/')} className="btn-green w-full py-3">
            Torna al Menù
          </button>
        </div>
      </div>
    )
  }

  if (room.phase === 'waiting') {
    return <Lobby room={room} players={players} myPlayer={myPlayer} onStart={handleStart} />
  }

  if (room.phase === 'finished') {
    return <Podium players={players} isHost={myPlayer.is_host} onNewGame={handleNewGame} />
  }

  return (
    <GameBoard
      room={room}
      players={players}
      myPlayer={myPlayer}
      submissions={submissions}
      votes={votes}
      myHand={myHand}
      onAdvance={advance}
      onSubmit={handleSubmit}
      onVote={handleVote}
      onEndGame={handleEndGame}
    />
  )
}
