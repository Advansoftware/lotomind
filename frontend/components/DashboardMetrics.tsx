'use client'

import { Grid, Paper, Typography, Box } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalPredictions: 0,
    avgAccuracy: 0,
    bestStrategy: 'Carregando...',
    totalHits: 0,
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setMetrics(response.data)
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const MetricCard = ({ icon, title, value, color }: any) => (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<ShowChartIcon fontSize="large" />}
          title="Total de Predições"
          value={metrics.totalPredictions}
          color="#2979ff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<TrendingUpIcon fontSize="large" />}
          title="Precisão Média"
          value={`${(metrics.avgAccuracy * 100).toFixed(1)}%`}
          color="#00e676"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<EmojiEventsIcon fontSize="large" />}
          title="Melhor Estratégia"
          value={metrics.bestStrategy}
          color="#ffd600"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<EmojiEventsIcon fontSize="large" />}
          title="Total de Acertos"
          value={metrics.totalHits}
          color="#ff1744"
        />
      </Grid>
    </Grid>
  )
}
