import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cocca Ridi',
  description: "Il gioco di carte più divertente d'Italia",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
