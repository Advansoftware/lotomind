'use client'

import { Container, Box, Typography, Grid, Paper, CircularProgress, Button, Chip, Divider, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { LotteryCard } from '@/components/LotteryCard'
import { PredictionCard } from '@/components/PredictionCard'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { api } from '@/lib/api'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import RefreshIcon from '@mui/icons-material/Refresh'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { useSearchParams } from 'next/navigation'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [latestDraws, setLatestDraws] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const theme = useTheme()
  const searchParams = useSearchParams()
  const lotteryType = searchParams.get('lotteryType') || 'megasena'

  useEffect(() => {
    loadData()
  }, [lotteryType])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load latest draws
      const drawsResponse = await api.get(`/lottery/draws?lotteryType=${lotteryType}&limit=3`)
      setLatestDraws(drawsResponse.data)

      // Load predictions
      const predictionsResponse = await api.get(`/predictions?lotteryType=${lotteryType}&limit=6`)
      setPredictions(predictionsResponse.data)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setLoading(true)
      await api.post('/lottery/sync-full', { lotteryType })
      await loadData()
    } catch (error) {
      console.error('Error syncing:', error)
      setLoading(false)
    }
  }

  const getLotteryName = (type: string) => {
    const names: any = {
      megasena: 'Mega-Sena',
      quina: 'Quina',
      lotofacil: 'Lotofácil',
      lotomania: 'Lotomania'
    }
    return names[type] || type
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
        <CircularProgress size={60} thickness={4} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          pt: 8,
          pb: 12,
          mb: -6,
          borderRadius: '0 0 40px 40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <Container maxWidth="xl">
          <Grid container alignItems="center" spacing={4}>
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip 
                  icon={<AutoAwesomeIcon sx={{ color: 'white !important' }} />} 
                  label="IA & Machine Learning" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Chip 
                  label={getLotteryName(lotteryType)}
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold' }} 
                />
              </Box>
              <Typography variant="h2" component="h1" fontWeight="800" gutterBottom sx={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                {getLotteryName(lotteryType)} Analytics
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600, mb: 4, fontWeight: 300 }}>
                Inteligência Artificial avançada para análise e predição de loterias com 20 estratégias exclusivas.
              </Typography>
              <Box display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<RocketLaunchIcon />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Gerar Nova Predição
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  startIcon={<RefreshIcon />}
                  onClick={handleSync}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    fontWeight: 'bold',
                    px: 3,
                    borderRadius: 3,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  Sincronizar Tudo
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Dashboard Metrics - Floating Cards */}
        <Box sx={{ mt: -6, mb: 6, position: 'relative', zIndex: 2 }}>
          <DashboardMetrics />
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Latest Draws Column */}
          <Grid item xs={12} lg={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                📊 Últimos Sorteios
              </Typography>
              <Button startIcon={<RefreshIcon />} size="small" onClick={loadData}>
                Atualizar
              </Button>
            </Box>
            <Box display="flex" flexDirection="column" gap={3}>
              {latestDraws.map((draw) => (
                <LotteryCard key={draw.id} draw={draw} />
              ))}
            </Box>
          </Grid>

          {/* Predictions Column */}
          <Grid item xs={12} lg={8}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                🔮 Predições Ativas
              </Typography>
              <Button variant="outlined" size="small">
                Ver Todas
              </Button>
            </Box>
            <Grid container spacing={3}>
              {predictions.map((prediction) => (
                <Grid item xs={12} md={6} key={prediction.id}>
                  <PredictionCard prediction={prediction} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
