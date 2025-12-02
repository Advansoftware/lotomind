import { Card, CardContent, Typography, Box, Chip, Paper } from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import { LotteryBall } from './LotteryBall'

interface LotteryCardProps {
  draw: any
}

export function LotteryCard({ draw }: LotteryCardProps) {
  const numbers = draw.numbers || []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 4, 
        overflow: 'hidden',
        bgcolor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight="800" color="primary.main">
              Concurso {draw.concurso}
            </Typography>
          </Box>
          <Chip 
            icon={<CalendarTodayIcon sx={{ fontSize: '16px !important' }} />}
            label={new Date(draw.drawDate).toLocaleDateString('pt-BR')}
            size="small"
            sx={{ bgcolor: 'rgba(0,0,0,0.05)', fontWeight: '500' }}
          />
        </Box>

        <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center" mb={3}>
          {numbers.map((number: number, index: number) => (
            <LotteryBall key={index} number={number} />
          ))}
        </Box>

        {draw.accumulated ? (
          <Box 
            sx={{ 
              bgcolor: '#fff3e0', 
              p: 2, 
              borderRadius: 3,
              border: '1px solid #ffe0b2'
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <MonetizationOnIcon color="warning" />
              <Typography variant="body2" fontWeight="bold" color="warning.dark">
                ACUMULOU!
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="800" color="warning.dark">
              {formatCurrency(draw.accumulatedValue || draw.estimatedPrize)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Estimativa para o próximo concurso
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1 }} />
        )}
      </Box>
    </Paper>
  )
}
