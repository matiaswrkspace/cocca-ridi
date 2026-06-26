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

const SIZE = {
  sm: { wrap: 'w-40 min-h-[90px] p-3', text: 'text-xs' },
  md: { wrap: 'w-52 min-h-[120px] p-4', text: 'text-sm' },
  lg: { wrap: 'w-60 min-h-[140px] p-5', text: 'text-sm' },
}

export function QuestionCard({ text, className = '', size = 'md' }: QuestionCardProps) {
  const s = SIZE[size]
  return (
    <div className={`card-question ${s.wrap} flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-white font-black" style={{ fontSize: 10 }}>?</span>
        </div>
        <span className="text-purple-300 font-bold uppercase tracking-widest" style={{ fontSize: 9 }}>Domanda</span>
      </div>
      <p className={`text-white font-bold leading-snug flex-1 ${s.text}`}>{text}</p>
      <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1">
        <div className="jack-avatar w-5 h-5 shrink-0 text-[8px]">JB</div>
        <span className="text-purple-300 font-semibold" style={{ fontSize: 9 }}>Jack Black</span>
      </div>
    </div>
  )
}

export function AnswerCard({ text, selected, voted, disabled, onClick, className = '', size = 'md' }: AnswerCardProps) {
  const s = SIZE[size]
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`card-answer ${s.wrap} flex flex-col relative overflow-hidden
        ${selected ? 'selected' : ''}
        ${voted ? 'voted' : ''}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
        ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-[18px] transition-colors
        ${selected ? 'bg-indigo-500' : voted ? 'bg-amber-500' : 'bg-gray-100'}`}
      />
      <div className="flex items-center gap-2 mt-1 mb-2">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
          ${selected ? 'border-indigo-500 bg-indigo-500' : voted ? 'border-amber-500 bg-amber-500' : 'border-gray-200 bg-white'}`}>
          {selected && <span className="text-white font-black" style={{ fontSize: 9 }}>✓</span>}
          {voted && <span className="text-white font-black" style={{ fontSize: 9 }}>★</span>}
        </div>
        <span className={`font-bold uppercase tracking-wider transition-colors`} style={{ fontSize: 9, color: selected ? '#6366f1' : voted ? '#f59e0b' : '#9ca3af' }}>
          {selected ? 'Selezionata' : voted ? 'Votata' : 'Risposta'}
        </span>
      </div>
      <p className={`text-gray-800 font-bold leading-snug flex-1 ${s.text}`}>{text}</p>
    </div>
  )
}

export function CardBack({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = SIZE[size]
  return (
    <div className={`card-question ${s.wrap} flex flex-col items-center justify-center select-none ${className}`}>
      <div className="text-4xl mb-2">🃏</div>
      <p className="text-purple-300 text-xs font-bold uppercase tracking-widest">Risposta</p>
    </div>
  )
}
