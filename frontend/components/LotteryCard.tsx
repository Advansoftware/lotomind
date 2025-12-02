'use client'

import { Card, CardContent, Typography, Box, Chip } from '@mui/material'

interface LotteryCardProps {
  draw: any
}

export function LotteryCard({ draw }: LotteryCardProps) {
  const numbers = draw.numbers || []

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Concurso {draw.concurso}
          </Typography>
          <Chip 
            label={new Date(draw.drawDate).toLocaleDateString('pt-BR')}
            size="small"
            color="primary"
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              {String(number).padStart(2, '0')}
            </Box>
          ))}
        </Box>

        {draw.accumulated && (
          <Chip 
            label="ACUMULOU!"
            color="error"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </CardContent>
    </Card>
  )
}
