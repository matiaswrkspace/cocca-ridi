'use client'

import type { Player } from '@/types/game'

interface PodiumProps {
  players: Player[]
  onNewGame?: () => void
  isHost?: boolean
}

export default function Podium({ players, onNewGame, isHost }: PodiumProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const [first, second, third] = sorted
  const rest = sorted.slice(3)

  const medals = ['🥇', '🥈', '🥉']
  const heights = ['h-40', 'h-28', 'h-20']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-900 to-teal-800">
      <div className="text-center mb-8 animate-bounce-in">
        <div className="text-5xl mb-2">🎉</div>
        <h1 className="text-4xl font-black text-white mb-1">Partita Finita!</h1>
        <p className="text-teal-200 text-lg">Ecco i risultati finali</p>
      </div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-4 mb-8 w-full max-w-md">
        {/* 2nd place */}
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">{second ? '🥈' : ''}</div>
          <div className="bg-white rounded-2xl p-4 text-center mb-2 shadow-lg w-24">
            <p className="font-bold text-sm text-gray-800 truncate">{second?.name ?? '—'}</p>
            <p className="text-2xl font-black text-teal-800">{second?.score ?? 0}</p>
            <p className="text-xs text-gray-500">punti</p>
          </div>
          <div className="podium-2 w-24 h-28 rounded-t-xl flex items-end justify-center pb-2">
            <span className="text-white font-black text-2xl">2</span>
          </div>
        </div>

        {/* 1st place */}
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2 animate-bounce">👑</div>
          <div className="bg-white rounded-2xl p-4 text-center mb-2 shadow-xl w-28 ring-4 ring-yellow-400">
            <p className="font-bold text-sm text-gray-800 truncate">{first?.name ?? '—'}</p>
            <p className="text-3xl font-black text-yellow-600">{first?.score ?? 0}</p>
            <p className="text-xs text-gray-500">punti</p>
          </div>
          <div className="podium-1 w-28 h-40 rounded-t-xl flex items-end justify-center pb-2">
            <span className="text-white font-black text-2xl">1</span>
          </div>
        </div>

        {/* 3rd place */}
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">{third ? '🥉' : ''}</div>
          <div className="bg-white rounded-2xl p-4 text-center mb-2 shadow-lg w-24">
            <p className="font-bold text-sm text-gray-800 truncate">{third?.name ?? '—'}</p>
            <p className="text-2xl font-black text-orange-700">{third?.score ?? 0}</p>
            <p className="text-xs text-gray-500">punti</p>
          </div>
          <div className="podium-3 w-24 h-20 rounded-t-xl flex items-end justify-center pb-2">
            <span className="text-white font-black text-2xl">3</span>
          </div>
        </div>
      </div>

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="w-full max-w-sm mb-8 bg-white/10 rounded-2xl p-4">
          <p className="text-teal-200 text-sm font-semibold mb-3 text-center">Altri giocatori</p>
          {rest.map((player, i) => (
            <div key={player.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
              <span className="text-white font-medium">{i + 4}. {player.name}</span>
              <span className="text-teal-200 font-bold">{player.score} pt</span>
            </div>
          ))}
        </div>
      )}

      {isHost && onNewGame && (
        <button onClick={onNewGame} className="btn-primary text-lg px-8 py-4 bg-white text-teal-900 hover:bg-gray-100">
          Torna al Menù
        </button>
      )}
    </div>
  )
}
