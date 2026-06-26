'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OtterLogo from '@/components/OtterLogo'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('cocca_session_id')
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36)
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
  const [jackTyping, setJackTyping] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setJackTyping(false), 7000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
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
      } catch { /* ignore */ }
    }
    checkRoom()
    const iv = setInterval(checkRoom, 5000)
    return () => clearInterval(iv)
  }, [])

  async function handleCreate() {
    if (!hostName.trim()) { setError('Inserisci il tuo nome'); return }
    setLoading(true); setError('')
    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPlayers, totalRounds, sessionId, hostName: hostName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore'); setLoading(false); return }
      localStorage.setItem(`player_${data.code}`, data.playerId)
      router.push(`/game/${data.code}`)
    } catch { setError('Errore di rete'); setLoading(false) }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError('Inserisci il codice'); return }
    if (!joinName.trim()) { setError('Inserisci il tuo nome'); return }
    setLoading(true); setError('')
    try {
      const sessionId = getSessionId()
      const code = joinCode.trim().toUpperCase()
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: joinName.trim(), sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore'); setLoading(false); return }
      localStorage.setItem(`player_${code}`, data.playerId)
      router.push(`/game/${code}`)
    } catch { setError('Errore di rete'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-phase-lobby overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-300/5 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center mb-12 animate-bounce-in">
        <OtterLogo size={110} className="mx-auto mb-2" />
        <h1 className="text-6xl font-black text-white tracking-tight mb-2"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
          Cocca Ridi
        </h1>
        <p className="text-emerald-300 text-lg font-medium mb-5">
          Ma se ridi escile...
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="glass px-4 py-2 rounded-full text-emerald-200 font-semibold">🎴 100 domande</div>
          <div className="glass px-4 py-2 rounded-full text-emerald-200 font-semibold">🃏 500 risposte</div>
          <div className="glass px-4 py-2 rounded-full text-emerald-200 font-semibold">👥 4-12 giocatori</div>
        </div>
      </div>

      {/* Main buttons */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-sm animate-slide-up">
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
          className="w-full py-5 rounded-2xl font-black text-xl text-white transition-all duration-200 hover:scale-105 active:scale-95 glass"
          style={{ border: '2px solid rgba(255,255,255,0.2)' }}
        >
          🚪 Accedi alla Stanza
        </button>

        <button
          onClick={() => { if (!roomExists) { setShowCreate(true); setShowJoin(false); setError('') } }}
          disabled={roomExists}
          className={`w-full py-5 rounded-2xl font-black text-xl transition-all duration-200
            ${roomExists
              ? 'cursor-not-allowed opacity-40 glass text-white'
              : 'bg-white text-teal-900 hover:scale-105 active:scale-95 shadow-2xl shadow-white/10'}`}
        >
          {roomExists ? '🔒 Stanza già in corso' : '✨ Crea Stanza'}
        </button>

        {roomExists && (
          <p className="text-center text-emerald-300/70 text-sm -mt-1 animate-fade-in">
            Partita già attiva — accedi con il codice ricevuto
          </p>
        )}
      </div>

      {/* Jack Black chat bubble */}
      <div className="relative z-10 mt-10 flex items-end gap-3 animate-fade-in max-w-sm">
        <div className="jack-avatar w-10 h-10 text-xs shrink-0">JB</div>
        <div className="flex flex-col gap-0.5">
          <span className="text-emerald-400 text-xs font-bold ml-1">Jack Black</span>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg min-h-[44px] flex items-center">
            {jackTyping ? (
              <div className="flex gap-1.5 items-center py-0.5">
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <p className="text-white text-sm leading-snug animate-fade-in">Sono il mazziere, cala le mutandine sciocchina!</p>
            )}
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-xl">✨</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Crea Stanza</h2>
                <p className="text-gray-400 text-sm">Configura la tua partita</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Il tuo nome</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={e => setHostName(e.target.value)}
                  placeholder="Come ti chiami?"
                  maxLength={20}
                  className="input-field"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                  Giocatori: <span className="text-teal-700 font-black text-base">{maxPlayers}</span>
                </label>
                <input type="range" min={4} max={12} value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                  className="w-full accent-teal-600 h-2" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>4</span><span>12</span></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                  Round: <span className="text-teal-700 font-black text-base">{totalRounds}</span>
                </label>
                <input type="range" min={5} max={15} value={totalRounds}
                  onChange={e => setTotalRounds(Number(e.target.value))}
                  className="w-full accent-teal-600 h-2" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>5</span><span>15</span></div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setError('') }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Annulla
              </button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-2 px-8 py-3 rounded-xl font-black text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)', flex: 2 }}>
                {loading ? '⏳ Creando...' : 'Crea Stanza →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl">🚪</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Accedi alla Stanza</h2>
                <p className="text-gray-400 text-sm">Usa il codice o il link ricevuto</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Codice stanza</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-black tracking-[0.3em] text-center focus:outline-none focus:border-indigo-500 transition"
                  style={{ fontFamily: 'monospace' }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Il tuo nome</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  placeholder="Come ti chiami?"
                  maxLength={20}
                  className="input-field"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowJoin(false); setError('') }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Annulla
              </button>
              <button onClick={handleJoin} disabled={loading}
                className="flex-2 px-8 py-3 rounded-xl font-black text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', flex: 2 }}>
                {loading ? '⏳ Accedendo...' : 'Entra →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
