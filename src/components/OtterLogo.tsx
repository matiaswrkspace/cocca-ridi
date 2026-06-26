'use client'

import Image from 'next/image'

interface OtterLogoProps {
  size?: number
  className?: string
}

export default function OtterLogo({ size = 80, className = '' }: OtterLogoProps) {
  return (
    <Image
      src="/otter.png"
      alt="Cocca Ridi logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}
