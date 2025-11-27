import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/source-code-pro/SourceCodePro-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DocuStructure Explorer | Intelligent Document Visualization',
  description: 'Explore hierarchical document structures with synchronized PDF viewing and interactive JSON navigation powered by Intel Blue design.',
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: '#0068B5',
  width: 'device-width',
  initialScale: 1,
}
