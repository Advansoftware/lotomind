'use client'

import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

interface PredictionCardProps {
  prediction: any
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const numbers = prediction.predictedNumbers || []
  const matchedNumbers = prediction.matchedNumbers || []
  const hits = prediction.hits || 0

  const getNumberColor = (number: number) => {
    if (matchedNumbers.includes(number)) {
      return 'linear-gradient(135deg, #00e676 0%, #00b248 100%)' // Green - Hit
    }
    return 'linear-gradient(135deg, #757575 0%, #424242 100%)' // Gray - Miss
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Concurso {prediction.targetConcurso}
          </Typography>
          <Chip 
            icon={<TrendingUpIcon />}
            label={prediction.strategyName || 'Estratégia'}
            size="small"
            color="secondary"
          />
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center" mb={2}>
          {numbers.map((number: number, index: number) => (
            <Box
              key={index}
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: getNumberColor(number),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              {String(number).padStart(2, '0')}
            </Box>
          ))}
        </Box>

        {prediction.status === 'checked' && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Resultado: {hits} Acertos
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(hits / 6) * 100} 
              color={hits >= 4 ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {prediction.confidenceScore && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Confiança: {(prediction.confidenceScore * 100).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
