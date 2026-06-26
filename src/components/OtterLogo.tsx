'use client'

interface OtterLogoProps {
  size?: number
  className?: string
}

export default function OtterLogo({ size = 80, className = '' }: OtterLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="otter-head-light" cx="52%" cy="32%" r="68%">
          <stop offset="0%" stopColor="rgba(255,200,120,0.14)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
        <radialGradient id="otter-face-light" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,220,160,0.2)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </radialGradient>
      </defs>

      {/* ── Water ripples ─────────────────────────────────────── */}
      <ellipse cx="110" cy="196" rx="98" ry="20" fill="#6BAFC2" opacity="0.30" />
      <ellipse cx="110" cy="190" rx="78" ry="15" fill="#7DC0CE" opacity="0.42" />
      <ellipse cx="110" cy="184" rx="59" ry="11" fill="#8DCBD8" opacity="0.55" />

      {/* ── Body emerging from water ───────────────────────── */}
      <ellipse cx="110" cy="178" rx="57" ry="38" fill="#7A4926" />

      {/* ── Ears (behind head) ────────────────────────────── */}
      <circle cx="49"  cy="56" r="21" fill="#5A3315" />
      <circle cx="49"  cy="56" r="13" fill="#8A5430" />
      <circle cx="171" cy="56" r="21" fill="#5A3315" />
      <circle cx="171" cy="56" r="13" fill="#8A5430" />

      {/* ── Main head ─────────────────────────────────────── */}
      <circle cx="110" cy="108" r="77" fill="#8C5B30" />
      <circle cx="110" cy="108" r="77" fill="url(#otter-head-light)" />

      {/* ── Face / snout lighter area ──────────────────────── */}
      <ellipse cx="110" cy="130" rx="50" ry="46" fill="#C28848" />
      <ellipse cx="110" cy="152" rx="37" ry="32" fill="#CEA260" />
      <ellipse cx="110" cy="152" rx="37" ry="32" fill="url(#otter-face-light)" />

      {/* ── Left eye ──────────────────────────────────────── */}
      <circle cx="81" cy="94" r="18" fill="#160C05" />
      {/* shine */}
      <circle cx="88" cy="85" r="6.5" fill="white" />
      <circle cx="87" cy="84" r="3"   fill="white" opacity="0.55" />

      {/* ── Right eye ─────────────────────────────────────── */}
      <circle cx="139" cy="94" r="18" fill="#160C05" />
      {/* shine */}
      <circle cx="146" cy="85" r="6.5" fill="white" />
      <circle cx="145" cy="84" r="3"   fill="white" opacity="0.55" />

      {/* ── Nose ──────────────────────────────────────────── */}
      <ellipse cx="110" cy="117" rx="12" ry="10" fill="#1E0B05" />
      <ellipse cx="107" cy="114" rx="4"  ry="3"  fill="rgba(255,255,255,0.22)" />

      {/* ── Mouth (wide open smile) ───────────────────────── */}
      {/* Outer shape – big open curve */}
      <path d="M 75 126 Q 110 182 145 126" fill="#A82828" />
      {/* Interior pink */}
      <path d="M 79 129 Q 110 172 141 129 Q 125 150 110 154 Q 95 150 79 129 Z" fill="#CE4848" />
      {/* Tongue hint */}
      <ellipse cx="110" cy="158" rx="18" ry="10" fill="#D86060" />
      {/* Upper teeth line */}
      <path d="M 79 129 Q 95 138 110 138 Q 125 138 141 129"
        fill="none" stroke="#EDE5D5" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Whiskers left ─────────────────────────────────── */}
      <line x1="73" y1="119" x2="8"   y2="107" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="73" y1="127" x2="8"   y2="127" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="73" y1="135" x2="8"   y2="147" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── Whiskers right ────────────────────────────────── */}
      <line x1="147" y1="119" x2="212" y2="107" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="147" y1="127" x2="212" y2="127" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="147" y1="135" x2="212" y2="147" stroke="#E2CE8C" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── Water splash drops ────────────────────────────── */}
      <ellipse cx="28"  cy="155" rx="5"   ry="8.5" fill="#7DC0CE" transform="rotate(-28 28 155)"  />
      <ellipse cx="192" cy="155" rx="5"   ry="8.5" fill="#7DC0CE" transform="rotate(28 192 155)"  />
      <ellipse cx="16"  cy="142" rx="3.5" ry="6"   fill="#8DCBD8" transform="rotate(-15 16 142)"  />
      <ellipse cx="204" cy="142" rx="3.5" ry="6"   fill="#8DCBD8" transform="rotate(15 204 142)"  />
    </svg>
  )
}
