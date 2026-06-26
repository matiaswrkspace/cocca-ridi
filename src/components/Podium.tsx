'use client'

import type { Player } from '@/types/game'

interface PodiumProps {
  players: Player[]
  onNewGame?: () => void
  isHost?: boolean
}

export default function Podium({ players, onNewGame, isHost }: PodiumProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  // Group by rank, handling ties (max 2 in 1st place as per rules)
  type Ranked = { player: Player; rank: number }
  const ranked: Ranked[] = []
  let currentRank = 1
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]
    const prev = sorted[i - 1]
    if (i > 0 && player.score === prev.score) {
      // Tie — same rank, but cap first place at max 2
      const prevRank = ranked[i - 1].rank
      ranked.push({ player, rank: prevRank })
    } else {
      ranked.push({ player, rank: currentRank })
    }
    currentRank = ranked[i].rank + 1
  }

  const firstPlace = ranked.filter(r => r.rank === 1).slice(0, 2) // max 2 in first
  const secondPlace = ranked.filter(r => r.rank === 2 || (firstPlace.length === 2 && r.rank === 3)).slice(0, 1)
  const thirdPlace = ranked.filter(r => r.rank > secondPlace[0]?.rank && r.rank <= 4).slice(0, 1)
  const rest = ranked.filter(r => !firstPlace.includes(r) && !secondPlace.includes(r) && !thirdPlace.includes(r))

  const isTied = firstPlace.length > 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-900 to-teal-800">
      <div className="text-center mb-8 animate-bounce-in">
        <div className="text-5xl mb-2">🎉</div>
        <h1 className="text-4xl font-black text-white mb-1">Partita Finita!</h1>
        <p className="text-teal-200 text-lg">Ecco i risultati finali</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-8 w-full max-w-lg flex-wrap">

        {/* 2nd place */}
        {secondPlace[0] && (
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">🥈</div>
            <div className="bg-white rounded-2xl p-3 text-center mb-2 shadow-lg w-24">
              <p className="font-bold text-xs text-gray-800 truncate">{secondPlace[0].player.name}</p>
              <p className="text-xl font-black text-teal-800">{secondPlace[0].player.score}</p>
              <p className="text-xs text-gray-500">punti</p>
            </div>
            <div className="podium-2 w-24 h-28 rounded-t-xl flex items-end justify-center pb-2">
              <span className="text-white font-black text-2xl">2</span>
            </div>
          </div>
        )}

        {/* 1st place — can be 1 or 2 players */}
        <div className="flex gap-2">
          {firstPlace.map((r) => (
            <div key={r.player.id} className="flex flex-col items-center">
              <div className="text-4xl mb-2 animate-bounce">{isTied ? '🤝' : '👑'}</div>
              <div className={`bg-white rounded-2xl p-3 text-center mb-2 shadow-xl w-28 ${isTied ? 'ring-4 ring-teal-400' : 'ring-4 ring-yellow-400'}`}>
                <p className="font-bold text-xs text-gray-800 truncate">{r.player.name}</p>
                <p className={`text-2xl font-black ${isTied ? 'text-teal-600' : 'text-yellow-600'}`}>{r.player.score}</p>
                <p className="text-xs text-gray-500">punti</p>
              </div>
              <div className="podium-1 w-28 h-40 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-white font-black text-2xl">1</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3rd place */}
        {thirdPlace[0] && (
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">🥉</div>
            <div className="bg-white rounded-2xl p-3 text-center mb-2 shadow-lg w-24">
              <p className="font-bold text-xs text-gray-800 truncate">{thirdPlace[0].player.name}</p>
              <p className="text-xl font-black text-orange-700">{thirdPlace[0].player.score}</p>
              <p className="text-xs text-gray-500">punti</p>
            </div>
            <div className="podium-3 w-24 h-20 rounded-t-xl flex items-end justify-center pb-2">
              <span className="text-white font-black text-2xl">3</span>
            </div>
          </div>
        )}
      </div>

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="w-full max-w-sm mb-8 bg-white/10 rounded-2xl p-4">
          <p className="text-teal-200 text-sm font-semibold mb-3 text-center">Altri giocatori</p>
          {rest.map((r) => (
            <div key={r.player.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
              <span className="text-white font-medium">{r.rank}. {r.player.name}</span>
              <span className="text-teal-200 font-bold">{r.player.score} pt</span>
            </div>
          ))}
        </div>
      )}

      {isHost && onNewGame && (
        <button onClick={onNewGame} className="bg-white text-teal-900 font-black text-lg px-10 py-4 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105">
          Torna al Menù
        </button>
      )}
    </div>
  )
}
