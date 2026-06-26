'use client'

import { useState } from 'react'
import type { Room, Player } from '@/types/game'
import OtterLogo from './OtterLogo'

interface LobbyProps {
  room: Room
  players: Player[]
  myPlayer: Player | null
  onStart: () => void
}

function PlayerAvatar({ name, index }: { name: string; index: number }) {
  return (
    <div className={`w-9 h-9 rounded-full avatar-${index % 12} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg`}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function Lobby({ room, players, myPlayer, onStart }: LobbyProps) {
  const isHost = myPlayer?.is_host ?? false
  const [copied, setCopied] = useState(false)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/game/${room.code}`
    : `/game/${room.code}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = joinUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-phase-lobby">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <OtterLogo size={88} className="mx-auto mb-1 animate-bounce" />
          <h1 className="text-4xl font-black text-white tracking-tight">Cocca Ridi</h1>
          <p className="text-emerald-300 mt-1 text-sm font-medium">Il gioco che fa ridere tutti</p>
        </div>

        {/* Room code + share link */}
        <div className="glass p-5 mb-4 text-center animate-slide-up">
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">Codice Stanza</p>
          <div className="text-5xl font-black text-white tracking-[0.25em] mb-4 font-mono">
            {room.code}
          </div>

          {/* Shareable link */}
          <div className="bg-black/20 rounded-2xl p-3 mb-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1 uppercase tracking-wide">Link diretto</p>
            <p className="text-white/70 text-xs font-mono truncate mb-2">{joinUrl}</p>
            <button
              onClick={copyLink}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                copied
                  ? 'bg-emerald-500 text-white scale-95'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              }`}
            >
              {copied ? '✓ Link copiato!' : '📋 Copia link'}
            </button>
          </div>

          <p className="text-emerald-300/70 text-xs">
            Condividi il link o il codice con gli amici
          </p>
        </div>

        {/* Game settings */}
        <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up delay-100">
          <div className="glass p-4 text-center">
            <p className="text-3xl font-black text-white">{room.total_rounds}</p>
            <p className="text-emerald-300 text-xs mt-1 font-semibold">Round</p>
          </div>
          <div className="glass p-4 text-center">
            <p className="text-3xl font-black text-white">{players.length}<span className="text-lg text-emerald-400">/{room.max_players}</span></p>
            <p className="text-emerald-300 text-xs mt-1 font-semibold">Giocatori</p>
          </div>
        </div>

        {/* Players */}
        <div className="glass p-4 mb-4 animate-slide-up delay-200">
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
            Nella stanza
          </p>
          <div className="space-y-2">
            {players.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all animate-slide-up
                  ${player.id === myPlayer?.id ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5'}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <PlayerAvatar name={player.name} index={i} />
                <span className="text-white font-bold flex-1 text-sm">{player.name}</span>
                <div className="flex gap-1.5">
                  {player.is_host && (
                    <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase">
                      Host
                    </span>
                  )}
                  {player.id === myPlayer?.id && (
                    <span className="text-[10px] bg-emerald-400 text-emerald-900 px-2 py-0.5 rounded-full font-black uppercase">
                      Tu
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.min(3, Math.max(0, room.max_players - players.length)) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-dashed border-white/15">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-white/20 text-lg">+</span>
                </div>
                <span className="text-white/25 text-sm font-medium">In attesa...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jack Black teaser */}
        <div className="glass p-4 mb-5 flex items-center gap-4 animate-slide-up delay-300">
          <div className="jack-avatar w-12 h-12 text-sm shrink-0">JB</div>
          <div>
            <p className="text-white font-black">Jack Black</p>
            <p className="text-emerald-300 text-xs mt-0.5">Il mazziere — farà le domande più assurde</p>
          </div>
          <div className="ml-auto text-2xl">🎤</div>
        </div>

        {/* Start / wait */}
        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 2}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300
              ${players.length >= 2
                ? 'btn-green shadow-2xl hover:scale-105'
                : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {players.length < 2 ? '⏳ Aspetta almeno 2 giocatori' : '▶ Avvia la Partita!'}
          </button>
        ) : (
          <div className="text-center glass p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-white text-sm font-semibold">L&apos;host sta per avviare...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
