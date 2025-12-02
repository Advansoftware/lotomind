import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/theme/theme'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { Box } from '@mui/material'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LotoMind Analytics',
  description: 'Inteligência para Loterias com Backtesting em Tempo Real',
  manifest: '/manifest.json',
  themeColor: '#1976d2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box display="flex">
              <Suspense fallback={<Box width={280} bgcolor="background.paper" />}>
                <Sidebar />
              </Suspense>
              <Box component="main" sx={{ flexGrow: 1, ml: '280px', minHeight: '100vh', bgcolor: 'background.default' }}>
                {children}
              </Box>
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
