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
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Depth shading on head */}
        <radialGradient id="ol-head" cx="44%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="rgba(240,170,80,0.12)" />
          <stop offset="55%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </radialGradient>
        {/* Soft light on face area */}
        <radialGradient id="ol-face" cx="50%" cy="38%" r="58%">
          <stop offset="0%"   stopColor="rgba(255,230,170,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
        </radialGradient>
        {/* Water */}
        <radialGradient id="ol-water" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#9BBFCB" />
          <stop offset="100%" stopColor="#7AAABB" />
        </radialGradient>
      </defs>

      {/* ── Water ripples ──────────────────────────────────────────── */}
      <ellipse cx="200" cy="378" rx="188" ry="22" fill="#6FA8BA" opacity="0.32" />
      <ellipse cx="200" cy="367" rx="158" ry="17" fill="#7AB3C4" opacity="0.44" />
      <ellipse cx="200" cy="357" rx="128" ry="13" fill="#85BDCC" opacity="0.56" />

      {/* ── Body ───────────────────────────────────────────────────── */}
      <ellipse cx="200" cy="340" rx="116" ry="62" fill="#7A4820" />

      {/* ── Ears (drawn before head so head overlaps base) ─────────── */}
      <circle cx="78"  cy="92"  r="37" fill="#58300E" />
      <circle cx="78"  cy="92"  r="22" fill="#7A4620" />
      <circle cx="322" cy="92"  r="37" fill="#58300E" />
      <circle cx="322" cy="92"  r="22" fill="#7A4620" />

      {/* ── Main head ──────────────────────────────────────────────── */}
      <circle cx="200" cy="188" r="143" fill="#8C5226" />
      {/* Depth/sheen overlay */}
      <circle cx="200" cy="188" r="143" fill="url(#ol-head)" />

      {/* ── Light face area (3 layered ovals for soft transition) ───── */}
      {/* Outer edge of lighter zone */}
      <ellipse cx="200" cy="228" rx="118" ry="108" fill="#C29860" />
      {/* Mid */}
      <ellipse cx="200" cy="240" rx="100" ry="90"  fill="#CDA86C" />
      {/* Chin / brightest area */}
      <ellipse cx="200" cy="258" rx="78"  ry="70"  fill="#DABC82" />
      {/* Soft light */}
      <ellipse cx="200" cy="228" rx="118" ry="108" fill="url(#ol-face)" />

      {/* ── Eyebrow shadow (dark arcs above each eye) ──────────────── */}
      <ellipse cx="157" cy="155" rx="33" ry="13" fill="#4A2A0A" opacity="0.45" transform="rotate(-8 157 155)" />
      <ellipse cx="243" cy="155" rx="33" ry="13" fill="#4A2A0A" opacity="0.45" transform="rotate(8  243 155)" />

      {/* ── Left eye ───────────────────────────────────────────────── */}
      <circle cx="158" cy="176" r="26"  fill="#24150A" />
      {/* Shine — top-right of pupil */}
      <circle cx="170" cy="163" r="10"  fill="white" />
      <circle cx="168" cy="162" r="5"   fill="white" opacity="0.5" />

      {/* ── Right eye ──────────────────────────────────────────────── */}
      <circle cx="242" cy="176" r="26"  fill="#24150A" />
      <circle cx="254" cy="163" r="10"  fill="white" />
      <circle cx="252" cy="162" r="5"   fill="white" opacity="0.5" />

      {/* ── Nose — large dark chocolate shape ──────────────────────── */}
      {/* Main nose body */}
      <ellipse cx="200" cy="216" rx="30" ry="23" fill="#331A0A" />
      {/* Nostril bump left */}
      <ellipse cx="188" cy="212" rx="10" ry="7"  fill="#28120A" />
      {/* Nostril bump right */}
      <ellipse cx="212" cy="212" rx="10" ry="7"  fill="#28120A" />
      {/* Highlight */}
      <ellipse cx="193" cy="208" rx="7"  ry="5"  fill="rgba(255,255,255,0.18)" />

      {/* ── Mouth — open happy smile ───────────────────────────────── */}
      {/* Outer dark fill (mouth opening shape) */}
      <path d="M 158 244 Q 158 292 200 295 Q 242 292 242 244" fill="#962222" />
      {/* Inner pink / interior */}
      <path d="M 162 246 Q 164 288 200 291 Q 236 288 238 246 Q 216 268 200 272 Q 184 268 162 246 Z" fill="#C84848" />
      {/* Tongue — rounded visible pink shape */}
      <ellipse cx="200" cy="276" rx="28" ry="18" fill="#D06870" />
      {/* Upper lip / gum edge (cream line) */}
      <path d="M 161 245 Q 180 256 200 256 Q 220 256 239 245"
        fill="none" stroke="#EEE4D4" strokeWidth="3" strokeLinecap="round" />

      {/* ── Whiskers left — 4 whiskers ─────────────────────────────── */}
      <line x1="148" y1="214" x2="12"  y2="192" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="148" y1="226" x2="12"  y2="226" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="148" y1="238" x2="12"  y2="260" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="148" y1="204" x2="32"  y2="174" stroke="#E4D498" strokeWidth="2"   strokeLinecap="round" />

      {/* ── Whiskers right — 4 whiskers ────────────────────────────── */}
      <line x1="252" y1="214" x2="388" y2="192" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="252" y1="226" x2="388" y2="226" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="252" y1="238" x2="388" y2="260" stroke="#E4D498" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="252" y1="204" x2="368" y2="174" stroke="#E4D498" strokeWidth="2"   strokeLinecap="round" />

      {/* ── Water splash drops ─────────────────────────────────────── */}
      <ellipse cx="54"  cy="308" rx="10" ry="16" fill="#7AB3C4" transform="rotate(-28 54 308)"  />
      <ellipse cx="34"  cy="290" rx="7"  ry="11" fill="#85BDCC" transform="rotate(-16 34 290)"  />
      <ellipse cx="346" cy="308" rx="10" ry="16" fill="#7AB3C4" transform="rotate(28 346 308)"   />
      <ellipse cx="366" cy="290" rx="7"  ry="11" fill="#85BDCC" transform="rotate(16 366 290)"   />
    </svg>
  )
}
