'use client'

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme, Divider } from '@mui/material'
import CasinoIcon from '@mui/icons-material/Casino'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

const lotteries = [
  { id: 'megasena', name: 'Mega-Sena', color: '#209869' },
  { id: 'quina', name: 'Quina', color: '#260085' },
  { id: 'lotofacil', name: 'Lotofácil', color: '#930089' },
  { id: 'lotomania', name: 'Lotomania', color: '#f78100' },
]

export function Sidebar() {
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentLottery = searchParams.get('lotteryType') || 'megasena'

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lotteryType', id)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        boxShadow: '4px 0 20px rgba(0,0,0,0.05)'
      }}
    >
      <Box p={3} display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <CasinoIcon />
        </Box>
        <Typography variant="h6" fontWeight="800" color="text.primary">
          LotoMind
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box px={2}>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block' }}>
          MODALIDADES
        </Typography>
        <List>
          {lotteries.map((lottery) => {
            const isSelected = currentLottery === lottery.id
            return (
              <ListItem key={lottery.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleSelect(lottery.id)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: isSelected ? `${lottery.color}15` : 'transparent',
                    color: isSelected ? lottery.color : 'text.secondary',
                    '&:hover': {
                      bgcolor: `${lottery.color}10`,
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isSelected ? lottery.color : 'text.secondary' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: lottery.color,
                        opacity: isSelected ? 1 : 0.5
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={lottery.name} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected ? '800' : '500',
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>
    </Box>
  )
}
