'use client'

interface QuestionCardProps {
  text: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface AnswerCardProps {
  text: string
  selected?: boolean
  voted?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-36 h-52 p-4 text-sm',
  md: 'w-48 h-68 p-5 text-base',
  lg: 'w-56 h-80 p-6 text-base',
}

export function QuestionCard({ text, className = '', size = 'lg' }: QuestionCardProps) {
  return (
    <div className={`card-question flex flex-col justify-between ${sizeClasses[size]} ${className}`} style={{ minHeight: size === 'lg' ? 320 : size === 'md' ? 272 : 208 }}>
      <div>
        <p className="font-bold text-sm mb-3 opacity-80 tracking-wide">Cocca Ridi</p>
        <p className="font-semibold leading-snug" style={{ fontSize: size === 'sm' ? 13 : 15 }}>{text}</p>
      </div>
      <div className="flex items-center justify-between opacity-60">
        <span className="text-2xl">🌴</span>
        <span className="text-xl">🃏</span>
      </div>
    </div>
  )
}

export function AnswerCard({ text, selected, voted, disabled, onClick, className = '', size = 'lg' }: AnswerCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card-answer flex flex-col justify-between text-left transition-all duration-200 ${sizeClasses[size]} ${selected ? 'selected' : ''} ${voted ? 'voted' : ''} ${disabled ? 'cursor-default' : ''} ${className}`}
      style={{ minHeight: size === 'lg' ? 320 : size === 'md' ? 272 : 208 }}
    >
      <div>
        <p className="font-bold text-xs mb-3 text-gray-400 tracking-wide">Cocca Ridi</p>
        <p className="font-semibold leading-snug text-gray-800" style={{ fontSize: size === 'sm' ? 13 : 15 }}>{text}</p>
      </div>
      <div className="flex items-center justify-between opacity-40">
        <span className="text-xl">🌴</span>
        {selected && <span className="text-green-600 font-bold text-sm">✓ Selezionata</span>}
        {voted && <span className="text-amber-500 font-bold text-sm">★ Votata</span>}
      </div>
    </button>
  )
}

export function CardBack({ className = '', size = 'lg' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={`card-question flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{ minHeight: size === 'lg' ? 320 : size === 'md' ? 272 : 208 }}
    >
      <div className="text-center opacity-60">
        <div className="text-4xl mb-2">🌴</div>
        <div className="font-bold text-sm tracking-widest opacity-80">COCCA RIDI</div>
      </div>
    </div>
  )
}
