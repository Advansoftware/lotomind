'use client'

export interface Game {
  id: string;
  numbers: number[]; // 6 números
}

export interface Participant {
  id: string;
  name: string;
  games: Game[];
  paid: boolean;
}

export interface Bolao {
  id: string;
  name: string;
  pricePerGame: number;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'lotomind_bolaos';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getBolaos(): Bolao[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getBolao(id: string): Bolao | null {
  const bolaos = getBolaos();
  return bolaos.find(b => b.id === id) || null;
}

export function saveBolao(bolao: Bolao): void {
  const bolaos = getBolaos();
  const index = bolaos.findIndex(b => b.id === bolao.id);
  bolao.updatedAt = new Date().toISOString();

  if (index >= 0) {
    bolaos[index] = bolao;
  } else {
    bolaos.push(bolao);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bolaos));
}

export function createBolao(name: string, pricePerGame: number = 5): Bolao {
  const now = new Date().toISOString();
  const bolao: Bolao = {
    id: generateId(),
    name,
    pricePerGame,
    participants: [],
    createdAt: now,
    updatedAt: now,
  };
  saveBolao(bolao);
  return bolao;
}

export function deleteBolao(id: string): void {
  const bolaos = getBolaos().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bolaos));
}

export function addParticipant(bolaoId: string, name: string): Participant | null {
  const bolao = getBolao(bolaoId);
  if (!bolao) return null;

  const participant: Participant = {
    id: generateId(),
    name,
    games: [],
    paid: false,
  };

  bolao.participants.push(participant);
  saveBolao(bolao);
  return participant;
}

export function removeParticipant(bolaoId: string, participantId: string): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  bolao.participants = bolao.participants.filter(p => p.id !== participantId);
  saveBolao(bolao);
}

export function addGame(bolaoId: string, participantId: string, numbers: number[]): Game | null {
  const bolao = getBolao(bolaoId);
  if (!bolao) return null;

  const participant = bolao.participants.find(p => p.id === participantId);
  if (!participant) return null;

  const game: Game = {
    id: generateId(),
    numbers: numbers.sort((a, b) => a - b),
  };

  participant.games.push(game);
  saveBolao(bolao);
  return game;
}

export function removeGame(bolaoId: string, participantId: string, gameId: string): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  const participant = bolao.participants.find(p => p.id === participantId);
  if (!participant) return;

  participant.games = participant.games.filter(g => g.id !== gameId);
  saveBolao(bolao);
}

export function updateParticipantName(bolaoId: string, participantId: string, name: string): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  const participant = bolao.participants.find(p => p.id === participantId);
  if (!participant) return;

  participant.name = name;
  saveBolao(bolao);
}

export function updateBolaoName(bolaoId: string, name: string): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  bolao.name = name;
  saveBolao(bolao);
}

export function getTotalGames(bolao: Bolao): number {
  return bolao.participants.reduce((sum, p) => sum + p.games.length, 0);
}

export function getTotalValue(bolao: Bolao): number {
  return getTotalGames(bolao) * (bolao.pricePerGame || 5);
}

export function getTotalPaid(bolao: Bolao): number {
  return bolao.participants
    .filter(p => p.paid)
    .reduce((sum, p) => sum + p.games.length * (bolao.pricePerGame || 5), 0);
}

export function getParticipantValue(bolao: Bolao, participant: Participant): number {
  return participant.games.length * (bolao.pricePerGame || 5);
}

export function toggleParticipantPaid(bolaoId: string, participantId: string): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  const participant = bolao.participants.find(p => p.id === participantId);
  if (!participant) return;

  participant.paid = !participant.paid;
  saveBolao(bolao);
}

export function updateBolaoPrice(bolaoId: string, pricePerGame: number): void {
  const bolao = getBolao(bolaoId);
  if (!bolao) return;

  bolao.pricePerGame = pricePerGame;
  saveBolao(bolao);
}
