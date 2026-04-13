import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SotAI — Sales Call Intelligence',
  description: 'AI-powered sales call quality analysis and coaching platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-bg-primary text-text-primary">
        <Providers>
          {children}
          <Toaster
            theme="light"
            toastOptions={{
              style: {
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                color: '#0f172a',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
