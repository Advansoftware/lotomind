// Lottery types configuration
export interface LotteryType {
  id: string;
  name: string;
  numbersCount: number; // How many numbers to pick
  maxNumber: number; // Maximum number (1-60 for Mega-Sena, etc.)
  color: string; // Theme color
  icon: string; // Emoji icon
}

export const LOTTERY_TYPES: LotteryType[] = [
  {
    id: "mega-sena",
    name: "Mega-Sena",
    numbersCount: 6,
    maxNumber: 60,
    color: "#209869",
    icon: "🍀",
  },
  {
    id: "mega-virada",
    name: "Mega da Virada",
    numbersCount: 6,
    maxNumber: 60,
    color: "#16a34a",
    icon: "🎆",
  },
  {
    id: "lotofacil",
    name: "Lotofácil",
    numbersCount: 15,
    maxNumber: 25,
    color: "#8b5cf6",
    icon: "🎯",
  },
  {
    id: "quina",
    name: "Quina",
    numbersCount: 5,
    maxNumber: 80,
    color: "#3b82f6",
    icon: "⭐",
  },
  {
    id: "lotomania",
    name: "Lotomania",
    numbersCount: 50,
    maxNumber: 100,
    color: "#f97316",
    icon: "🎪",
  },
  {
    id: "dupla-sena",
    name: "Dupla Sena",
    numbersCount: 6,
    maxNumber: 50,
    color: "#ef4444",
    icon: "🎲",
  },
  {
    id: "dia-de-sorte",
    name: "Dia de Sorte",
    numbersCount: 7,
    maxNumber: 31,
    color: "#eab308",
    icon: "☀️",
  },
  {
    id: "super-sete",
    name: "Super Sete",
    numbersCount: 7,
    maxNumber: 9,
    color: "#06b6d4",
    icon: "7️⃣",
  },
  {
    id: "mais-milionaria",
    name: "+Milionária",
    numbersCount: 6,
    maxNumber: 50,
    color: "#ec4899",
    icon: "💎",
  },
  {
    id: "personalizado",
    name: "Personalizado",
    numbersCount: 6,
    maxNumber: 60,
    color: "#6b7280",
    icon: "⚙️",
  },
];

export function getLotteryType(id: string): LotteryType {
  return LOTTERY_TYPES.find((l) => l.id === id) || LOTTERY_TYPES[0];
}
