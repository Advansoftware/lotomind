// Types
export interface BolaoGame {
  id: string;
  numbers: number[];
}

export interface BolaoParticipant {
  id: string;
  name: string;
  paid: boolean;
  games: BolaoGame[];
}

export interface Bolao {
  id: string;
  name: string;
  lotteryType: string; // ID do tipo de loteria
  year: number;
  pricePerGame: number;
  minGamesPerParticipant: number;
  maxGamesPerParticipant: number | null;
  participants: BolaoParticipant[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "bolao-facil-data";

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all bolões
export function getBolaos(): Bolao[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save all bolões
function saveBolaos(bolaos: Bolao[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bolaos));
}

// Get single bolão
export function getBolao(id: string): Bolao | null {
  const bolaos = getBolaos();
  return bolaos.find((b) => b.id === id) || null;
}

// Create bolão
export function createBolao(
  name: string,
  lotteryType: string,
  year: number,
  pricePerGame: number,
  minGamesPerParticipant: number = 1,
  maxGamesPerParticipant: number | null = null
): Bolao {
  const bolaos = getBolaos();
  const newBolao: Bolao = {
    id: generateId(),
    name,
    lotteryType,
    year,
    pricePerGame,
    minGamesPerParticipant,
    maxGamesPerParticipant,
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bolaos.push(newBolao);
  saveBolaos(bolaos);
  return newBolao;
}

// Update bolão
export function updateBolao(
  id: string,
  data: Partial<Omit<Bolao, "id" | "createdAt" | "updatedAt">>
): Bolao | null {
  const bolaos = getBolaos();
  const index = bolaos.findIndex((b) => b.id === id);
  if (index === -1) return null;

  bolaos[index] = {
    ...bolaos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveBolaos(bolaos);
  return bolaos[index];
}

// Delete bolão
export function deleteBolao(id: string): boolean {
  const bolaos = getBolaos();
  const filtered = bolaos.filter((b) => b.id !== id);
  if (filtered.length === bolaos.length) return false;
  saveBolaos(filtered);
  return true;
}

// Add participant
export function addParticipant(bolaoId: string, name: string): BolaoParticipant | null {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return null;

  const participant: BolaoParticipant = {
    id: generateId(),
    name,
    paid: false,
    games: [],
  };
  bolao.participants.push(participant);
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return participant;
}

// Update participant
export function updateParticipant(
  bolaoId: string,
  participantId: string,
  data: { name?: string; paid?: boolean }
): BolaoParticipant | null {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return null;

  const participant = bolao.participants.find((p) => p.id === participantId);
  if (!participant) return null;

  if (data.name !== undefined) participant.name = data.name;
  if (data.paid !== undefined) participant.paid = data.paid;
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return participant;
}

// Toggle participant paid status
export function toggleParticipantPaid(bolaoId: string, participantId: string): boolean {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return false;

  const participant = bolao.participants.find((p) => p.id === participantId);
  if (!participant) return false;

  participant.paid = !participant.paid;
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return true;
}

// Delete participant
export function deleteParticipant(bolaoId: string, participantId: string): boolean {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return false;

  bolao.participants = bolao.participants.filter((p) => p.id !== participantId);
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return true;
}

// Add game to participant
export function addGame(bolaoId: string, participantId: string, numbers: number[]): BolaoGame | null {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return null;

  const participant = bolao.participants.find((p) => p.id === participantId);
  if (!participant) return null;

  const game: BolaoGame = {
    id: generateId(),
    numbers: [...numbers].sort((a, b) => a - b),
  };
  participant.games.push(game);
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return game;
}

// Update game
export function updateGame(bolaoId: string, participantId: string, gameId: string, numbers: number[]): boolean {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return false;

  const participant = bolao.participants.find((p) => p.id === participantId);
  if (!participant) return false;

  const game = participant.games.find((g) => g.id === gameId);
  if (!game) return false;

  game.numbers = [...numbers].sort((a, b) => a - b);
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return true;
}

// Delete game
export function deleteGame(bolaoId: string, participantId: string, gameId: string): boolean {
  const bolaos = getBolaos();
  const bolao = bolaos.find((b) => b.id === bolaoId);
  if (!bolao) return false;

  const participant = bolao.participants.find((p) => p.id === participantId);
  if (!participant) return false;

  participant.games = participant.games.filter((g) => g.id !== gameId);
  bolao.updatedAt = new Date().toISOString();
  saveBolaos(bolaos);
  return true;
}

// Helper functions
export function getTotalGames(bolao: Bolao): number {
  return bolao.participants.reduce((sum, p) => sum + p.games.length, 0);
}

export function getTotalValue(bolao: Bolao): number {
  return getTotalGames(bolao) * Number(bolao.pricePerGame);
}

export function getTotalPaid(bolao: Bolao): number {
  return bolao.participants
    .filter((p) => p.paid)
    .reduce((sum, p) => sum + p.games.length * Number(bolao.pricePerGame), 0);
}

export function getParticipantValue(bolao: Bolao, participant: BolaoParticipant): number {
  return participant.games.length * Number(bolao.pricePerGame);
}
