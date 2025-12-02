export const LOTTERY_CONFIGS = {
  megasena: {
    name: 'megasena',
    displayName: 'Mega-Sena',
    numbersToDraw: 6,
    minNumber: 1,
    maxNumber: 60,
    drawDays: ['Wednesday', 'Saturday'],
  },
  quina: {
    name: 'quina',
    displayName: 'Quina',
    numbersToDraw: 5,
    minNumber: 1,
    maxNumber: 80,
    drawDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  lotofacil: {
    name: 'lotofacil',
    displayName: 'Lotofácil',
    numbersToDraw: 15,
    minNumber: 1,
    maxNumber: 25,
    drawDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  lotomania: {
    name: 'lotomania',
    displayName: 'Lotomania',
    numbersToDraw: 20,
    minNumber: 1,
    maxNumber: 100,
    drawDays: ['Tuesday', 'Thursday', 'Saturday'],
  },
};

export const LOTTERY_API_ENDPOINTS = {
  megasena: 'https://loteriascaixa-api.herokuapp.com/api/megasena',
  quina: 'https://loteriascaixa-api.herokuapp.com/api/quina',
  lotofacil: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil',
  lotomania: 'https://loteriascaixa-api.herokuapp.com/api/lotomania',
};
