'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Room, Player, RoundSubmission, RoundVote, PlayerHand } from '@/types/game'
import { getSupabaseClient } from '@/lib/supabase-client'
import Lobby from '@/components/Lobby'
import GameBoard from '@/components/GameBoard'
import Podium from '@/components/Podium'

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

  const playerId = typeof window !== 'undefined' ? localStorage.getItem(`player_${code}`) : null

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
    if (!myPlayer) return
    await fetch(`/api/room/${code}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id, cardId }),
    })
  }, [code, myPlayer])

  const handleVote = useCallback(async (submissionId: string) => {
    if (!myPlayer) return
    await fetch(`/api/room/${code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayer.id, submissionId }),
    })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin">🌴</div>
          <p className="text-white font-bold text-xl">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-bold text-xl mb-4">{error || 'Stanza non trovata'}</p>
          <button onClick={() => router.push('/')} className="btn-primary bg-white text-teal-900">
            Torna al Menù
          </button>
        </div>
      </div>
    )
  }

  if (!myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-900 to-teal-800">
        <div className="text-center">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-white font-bold text-xl mb-4">Sessione non trovata</p>
          <button onClick={() => router.push('/')} className="btn-primary bg-white text-teal-900">
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
