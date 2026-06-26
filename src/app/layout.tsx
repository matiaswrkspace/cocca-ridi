import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cocca Ridi',
  description: "Ma se ridi escile...",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.ico', sizes: '16x16' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180' },
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
