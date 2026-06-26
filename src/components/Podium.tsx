'use client'

import { useMemo } from 'react'
import type { Player } from '@/types/game'

interface PodiumProps {
  players: Player[]
  onNewGame?: () => void
  isHost?: boolean
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#ec4899', '#fbbf24'][i % 8],
    dur: 3 + Math.random() * 2,
    size: 6 + Math.random() * 12,
    shape: i % 3,
  })), [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
      {pieces.map(p => (
        <div key={p.id}
          className={p.shape === 1 ? 'absolute rounded-full' : 'absolute rounded-sm'}
          style={{
            left: `${p.left}%`, top: -20,
            width: p.shape === 2 ? p.size * 2 : p.size,
            height: p.size,
            background: p.color,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  )
}

function PlayerAvatar({ name, index, size = 'md' }: { name: string; index: number; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base'
  return (
    <div className={`${dim} rounded-full avatar-${index % 12} flex items-center justify-center text-white font-black shrink-0 shadow-xl`}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function Podium({ players, onNewGame, isHost }: PodiumProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  type Ranked = { player: Player; rank: number }
  const ranked: Ranked[] = []
  let nextRank = 1
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]
    if (i > 0 && player.score === sorted[i - 1].score) {
      ranked.push({ player, rank: ranked[i - 1].rank })
    } else {
      ranked.push({ player, rank: nextRank })
    }
    nextRank = ranked[i].rank + 1
  }

  const firstPlace = ranked.filter(r => r.rank === 1).slice(0, 2)
  const secondPlace = ranked.filter(r => r.rank === 2).slice(0, 1)
  const thirdPlace = ranked.filter(r => r.rank === 3).slice(0, 1)
  const rest = ranked.filter(r => r.rank > 3)
  const isTied = firstPlace.length > 1
  const globalIndex = (id: string) => players.findIndex(p => p.id === id)

  return (
    <div className="min-h-screen flex flex-col items-center bg-phase-finished p-5 pt-8">
      <Confetti />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="text-6xl mb-2">🎊</div>
          <h1 className="text-4xl font-black text-white mb-1">Partita Finita!</h1>
          <p className="text-emerald-300 font-medium">Ecco i campioni di questa sera</p>
        </div>

        {/* Podium visual */}
        <div className="flex items-end justify-center gap-3 mb-8">

          {/* 2nd place */}
          {secondPlace[0] && (
            <div className="flex flex-col items-center animate-slide-up delay-200">
              <div className="text-3xl mb-2">🥈</div>
              <PlayerAvatar name={secondPlace[0].player.name} index={globalIndex(secondPlace[0].player.id)} />
              <div className="bg-white rounded-2xl p-3 text-center mt-2 mb-1 shadow-xl w-24">
                <p className="font-black text-xs text-gray-700 truncate">{secondPlace[0].player.name}</p>
                <p className="text-xl font-black text-gray-700">{secondPlace[0].player.score}</p>
                <p className="text-[10px] text-gray-400 font-semibold">punti</p>
              </div>
              <div className="podium-2 w-24 h-28 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-white font-black text-2xl">2</span>
              </div>
            </div>
          )}

          {/* 1st place — up to 2 players */}
          {firstPlace.map((r, i) => (
            <div key={r.player.id} className="flex flex-col items-center animate-pop-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`text-4xl mb-2 animate-bounce`} style={{ animationDelay: `${i * 200}ms` }}>
                {isTied ? '🤝' : '👑'}
              </div>
              <PlayerAvatar name={r.player.name} index={globalIndex(r.player.id)} size="lg" />
              <div className={`bg-white rounded-2xl p-3 text-center mt-2 mb-1 shadow-2xl w-28
                ${isTied ? 'ring-4 ring-teal-400' : 'ring-4 ring-yellow-400'}`}>
                <p className={`font-black text-xs truncate ${isTied ? 'text-teal-700' : 'text-yellow-700'}`}>
                  {r.player.name}
                </p>
                <p className={`text-2xl font-black ${isTied ? 'text-teal-600' : 'text-yellow-500'}`}>
                  {r.player.score}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold">punti</p>
              </div>
              <div className="podium-1 w-28 h-40 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-white font-black text-2xl">1</span>
              </div>
            </div>
          ))}

          {/* 3rd place */}
          {thirdPlace[0] && (
            <div className="flex flex-col items-center animate-slide-up delay-300">
              <div className="text-3xl mb-2">🥉</div>
              <PlayerAvatar name={thirdPlace[0].player.name} index={globalIndex(thirdPlace[0].player.id)} />
              <div className="bg-white rounded-2xl p-3 text-center mt-2 mb-1 shadow-xl w-24">
                <p className="font-black text-xs text-gray-700 truncate">{thirdPlace[0].player.name}</p>
                <p className="text-xl font-black text-orange-700">{thirdPlace[0].player.score}</p>
                <p className="text-[10px] text-gray-400 font-semibold">punti</p>
              </div>
              <div className="podium-3 w-24 h-20 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-white font-black text-2xl">3</span>
              </div>
            </div>
          )}
        </div>

        {/* Rest */}
        {rest.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6 animate-slide-up delay-400">
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3 text-center">Altri giocatori</p>
            <div className="space-y-2">
              {rest.map((r) => (
                <div key={r.player.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-white/30 font-black text-sm w-5">{r.rank}.</span>
                  <PlayerAvatar name={r.player.name} index={globalIndex(r.player.id)} size="sm" />
                  <span className="text-white font-bold text-sm flex-1">{r.player.name}</span>
                  <span className="text-white/60 font-black">{r.player.score}</span>
                  <span className="text-white/30 text-xs">pt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && onNewGame && (
          <div className="text-center animate-slide-up delay-500">
            <button onClick={onNewGame} className="btn-white px-12 py-4 text-lg">
              🏠 Torna al Menù
            </button>
          </div>
        )}
        {!isHost && (
          <div className="text-center glass py-3 px-6 rounded-2xl animate-fade-in">
            <p className="text-emerald-300 text-sm font-semibold">In attesa dell&apos;host...</p>
          </div>
        )}
      </div>
    </div>
  )
}
