'use client'

import { Container, Box, Typography, Grid, Paper, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { LotteryCard } from '@/components/LotteryCard'
import { PredictionCard } from '@/components/PredictionCard'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { api } from '@/lib/api'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [latestDraws, setLatestDraws] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load latest draws
      const drawsResponse = await api.get('/lottery/draws?lotteryType=megasena&limit=5')
      setLatestDraws(drawsResponse.data)

      // Load predictions
      const predictionsResponse = await api.get('/predictions?lotteryType=megasena&limit=3')
      setPredictions(predictionsResponse.data)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          🎰 LotoMind Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Inteligência para Loterias com Backtesting em Tempo Real
        </Typography>
      </Box>

      {/* Dashboard Metrics */}
      <Box mb={4}>
        <DashboardMetrics />
      </Box>

      {/* Latest Draws */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          📊 Últimos Sorteios
        </Typography>
        <Grid container spacing={3}>
          {latestDraws.map((draw) => (
            <Grid item xs={12} md={6} lg={4} key={draw.id}>
              <LotteryCard draw={draw} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Predictions */}
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          🔮 Predições Ativas
        </Typography>
        <Grid container spacing={3}>
          {predictions.map((prediction) => (
            <Grid item xs={12} md={6} lg={4} key={prediction.id}>
              <PredictionCard prediction={prediction} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}
