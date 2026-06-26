'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('cocca_session_id')
  if (!id) {
    id = generateSessionId()
    localStorage.setItem('cocca_session_id', id)
  }
  return id
}

export default function Home() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [totalRounds, setTotalRounds] = useState(10)
  const [hostName, setHostName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roomExists, setRoomExists] = useState(false)

  useEffect(() => {
    // Check if a room already exists
    async function checkRoom() {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase-client')
        const supabase = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('rooms') as any)
          .select('id')
          .in('phase', ['waiting', 'countdown', 'cards', 'question', 'selecting', 'revealing', 'voting', 'results'])
          .limit(1)
        setRoomExists(!!(data && (data as unknown[]).length > 0))
      } catch {
        // ignore
      }
    }
    checkRoom()
    const interval = setInterval(checkRoom, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleCreate() {
    if (!hostName.trim()) { setError('Inserisci il tuo nome'); return }
    setLoading(true)
    setError('')
    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPlayers, totalRounds, sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore'); setLoading(false); return }

      // Update player name
      const { getSupabaseClient } = await import('@/lib/supabase-client')
      const supabase = getSupabaseClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('players') as any).update({ name: hostName.trim() }).eq('id', data.playerId)

      localStorage.setItem(`player_${data.code}`, data.playerId)
      router.push(`/game/${data.code}`)
    } catch {
      setError('Errore di rete')
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError('Inserisci il codice'); return }
    if (!joinName.trim()) { setError('Inserisci il tuo nome'); return }
    setLoading(true)
    setError('')
    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase(), name: joinName.trim(), sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore'); setLoading(false); return }

      localStorage.setItem(`player_${joinCode.trim().toUpperCase()}`, data.playerId)
      router.push(`/game/${joinCode.trim().toUpperCase()}`)
    } catch {
      setError('Errore di rete')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0d3d39 0%, #0f4f4a 50%, #136158 100%)' }}>
      {/* Logo */}
      <div className="text-center mb-12 animate-bounce-in">
        <div className="text-7xl mb-4">🌴</div>
        <h1 className="text-6xl font-black text-white tracking-tight mb-2" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          Cocca Ridi
        </h1>
        <p className="text-teal-200 text-lg font-medium">Il gioco di carte più divertente d&apos;Italia</p>
        <div className="flex items-center justify-center gap-3 mt-4 text-teal-300 text-sm">
          <span>🎴 100 domande</span>
          <span>·</span>
          <span>🃏 500 risposte</span>
          <span>·</span>
          <span>👥 4-12 giocatori</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm animate-slide-up">
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
          className="w-full py-5 rounded-2xl text-white font-black text-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.25)' }}
        >
          🚪 Accedi alla Stanza
        </button>

        <button
          onClick={() => { if (!roomExists) { setShowCreate(true); setShowJoin(false); setError('') } }}
          disabled={roomExists}
          className="w-full py-5 rounded-2xl font-black text-xl transition-all duration-200"
          style={{
            background: roomExists ? 'rgba(255,255,255,0.05)' : 'white',
            color: roomExists ? 'rgba(255,255,255,0.3)' : '#0f4f4a',
            border: roomExists ? '2px solid rgba(255,255,255,0.1)' : '2px solid white',
            cursor: roomExists ? 'not-allowed' : 'pointer',
          }}
        >
          {roomExists ? '🔒 Stanza già in corso' : '✨ Crea Stanza'}
        </button>
        {roomExists && (
          <p className="text-center text-teal-300 text-sm -mt-2">
            C&apos;è già una stanza attiva. Aspetta che finisca oppure accedi con il codice.
          </p>
        )}
      </div>

      {/* Jack Black info */}
      <div className="mt-10 flex items-center gap-3 text-teal-300 text-sm animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-base font-black text-white">JB</div>
        <span>Il banco è <strong className="text-white">Jack Black</strong>, il re delle domande assurde</span>
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Crea Stanza</h2>
            <p className="text-gray-500 text-sm mb-6">Configura la tua partita</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Il tuo nome</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={e => setHostName(e.target.value)}
                  placeholder="Come ti chiami?"
                  maxLength={30}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-teal-600 transition"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Numero di giocatori: <span className="text-teal-700">{maxPlayers}</span>
                </label>
                <input
                  type="range" min={4} max={12} value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                  className="w-full accent-teal-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>4</span><span>12</span></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Numero di round: <span className="text-teal-700">{totalRounds}</span>
                </label>
                <input
                  type="range" min={5} max={15} value={totalRounds}
                  onChange={e => setTotalRounds(Number(e.target.value))}
                  className="w-full accent-teal-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5</span><span>15</span></div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: '#0f4f4a' }}>
                {loading ? 'Creando...' : 'Crea Stanza →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Accedi alla Stanza</h2>
            <p className="text-gray-500 text-sm mb-6">Inserisci il codice ricevuto dall&apos;host</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Codice stanza</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Es. ABC123"
                  maxLength={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-black tracking-widest text-center focus:outline-none focus:border-teal-600 transition uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Il tuo nome</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  placeholder="Come ti chiami?"
                  maxLength={30}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-teal-600 transition"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowJoin(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleJoin} disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: '#0f4f4a' }}>
                {loading ? 'Accedendo...' : 'Entra →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
