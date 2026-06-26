'use client'

import type { Room, Player } from '@/types/game'

interface LobbyProps {
  room: Room
  players: Player[]
  myPlayer: Player | null
  onStart: () => void
}

export default function Lobby({ room, players, myPlayer, onStart }: LobbyProps) {
  const isHost = myPlayer?.is_host ?? false

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-900 to-teal-800">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🌴</div>
          <h1 className="text-4xl font-black text-white tracking-tight">Cocca Ridi</h1>
          <p className="text-teal-200 mt-1">Il gioco che fa ridere tutti</p>
        </div>

        {/* Room code */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 text-center">
          <p className="text-teal-200 text-sm font-semibold mb-2 uppercase tracking-widest">Codice Stanza</p>
          <div className="text-5xl font-black text-white tracking-widest mb-3 font-mono">
            {room.code}
          </div>
          <p className="text-teal-200 text-sm">Condividi questo codice con gli amici</p>
        </div>

        {/* Game info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-white">{room.total_rounds}</p>
            <p className="text-teal-200 text-xs mt-1">Round</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-white">{room.max_players}</p>
            <p className="text-teal-200 text-xs mt-1">Max Giocatori</p>
          </div>
        </div>

        {/* Players list */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6">
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Giocatori ({players.length}/{room.max_players})
          </p>
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {player.name[0].toUpperCase()}
                </div>
                <span className="text-white font-semibold flex-1">{player.name}</span>
                {player.is_host && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                    Host
                  </span>
                )}
                {player.id === myPlayer?.id && !player.is_host && (
                  <span className="text-xs bg-teal-400 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                    Tu
                  </span>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, room.max_players - players.length) }).slice(0, 3).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-dashed border-white/20">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-sm">?</div>
                <span className="text-white/30 text-sm">In attesa...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jack Black presentation */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="jack-avatar flex-shrink-0">JB</div>
          <div>
            <p className="text-white font-bold">Jack Black</p>
            <p className="text-teal-200 text-sm">Il banco — farà le domande</p>
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 2}
            className="w-full btn-primary text-lg py-4 bg-white text-teal-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {players.length < 2 ? 'Aspetta almeno 2 giocatori...' : '▶ Avvia la Partita!'}
          </button>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-teal-200">
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
              <span>In attesa che l&apos;host avvii la partita...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
