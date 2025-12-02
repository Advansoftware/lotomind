'use client'

export interface LotteryTheme {
  id: string
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    light: string
    dark: string
    gradient: string
    gradientHover: string
    accent: string
    ball: string
    ballText: string
  }
  icon: string
  description: string
}

export const LOTTERY_THEMES: Record<string, LotteryTheme> = {
  megasena: {
    id: 'megasena',
    name: 'megasena',
    displayName: 'Mega-Sena',
    colors: {
      primary: '#209869',
      secondary: '#10b981',
      light: '#34d399',
      dark: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      gradientHover: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
      accent: '#10b981',
      ball: '#209869',
      ballText: '#ffffff',
    },
    icon: '🍀',
    description: 'A maior loteria do Brasil - 6 números de 60',
  },
  quina: {
    id: 'quina',
    name: 'quina',
    displayName: 'Quina',
    colors: {
      primary: '#260085',
      secondary: '#4f46e5',
      light: '#818cf8',
      dark: '#1e1b4b',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
      gradientHover: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
      accent: '#6366f1',
      ball: '#260085',
      ballText: '#ffffff',
    },
    icon: '⭐',
    description: 'Sorteios diários - 5 números de 80',
  },
  lotofacil: {
    id: 'lotofacil',
    name: 'lotofacil',
    displayName: 'Lotofácil',
    colors: {
      primary: '#930089',
      secondary: '#a855f7',
      light: '#c084fc',
      dark: '#7e22ce',
      gradient: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
      gradientHover: 'linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)',
      accent: '#a855f7',
      ball: '#930089',
      ballText: '#ffffff',
    },
    icon: '🎯',
    description: 'Mais chances de ganhar - 15 números de 25',
  },
  lotomania: {
    id: 'lotomania',
    name: 'lotomania',
    displayName: 'Lotomania',
    colors: {
      primary: '#f78100',
      secondary: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      gradientHover: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
      accent: '#fbbf24',
      ball: '#f78100',
      ballText: '#ffffff',
    },
    icon: '🔥',
    description: 'Para os ousados - 20 números de 100',
  },
}

export const getLotteryTheme = (lotteryType: string): LotteryTheme => {
  return LOTTERY_THEMES[lotteryType] || LOTTERY_THEMES.megasena
}

export const getLotteryConfig = (lotteryType: string) => {
  const configs: Record<string, {
    numbersToDraw: number
    minNumber: number
    maxNumber: number
    drawDays: string[]
  }> = {
    megasena: {
      numbersToDraw: 6,
      minNumber: 1,
      maxNumber: 60,
      drawDays: ['Quarta', 'Sábado'],
    },
    quina: {
      numbersToDraw: 5,
      minNumber: 1,
      maxNumber: 80,
      drawDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    },
    lotofacil: {
      numbersToDraw: 15,
      minNumber: 1,
      maxNumber: 25,
      drawDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    },
    lotomania: {
      numbersToDraw: 20,
      minNumber: 1,
      maxNumber: 100,
      drawDays: ['Terça', 'Quinta', 'Sábado'],
    },
  }
  return configs[lotteryType] || configs.megasena
}

export const ALL_LOTTERIES = Object.values(LOTTERY_THEMES)
