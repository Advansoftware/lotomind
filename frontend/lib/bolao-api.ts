'use client'

import { api } from './api';

// Types matching the backend entities
export interface BolaoGame {
  id: number;
  participantId: number;
  numbers: number[];
  createdAt: string;
}

export interface BolaoParticipant {
  id: number;
  bolaoId: number;
  name: string;
  paid: boolean;
  games: BolaoGame[];
  createdAt: string;
  updatedAt: string;
}

export interface Bolao {
  id: number;
  name: string;
  year: number;
  pricePerGame: number;
  minGamesPerParticipant: number;
  maxGamesPerParticipant: number | null;
  participants: BolaoParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface BolaoStats {
  totalGames: number;
  totalValue: number;
  totalPaid: number;
}

// ============ BOLAO API ============

export async function getBolaos(): Promise<Bolao[]> {
  const response = await api.get('/bolao');
  return response.data;
}

export async function getBolao(id: number): Promise<Bolao> {
  const response = await api.get(`/bolao/${id}`);
  return response.data;
}

export async function createBolao(
  name: string,
  year: number,
  pricePerGame: number,
  minGamesPerParticipant: number = 1,
  maxGamesPerParticipant?: number
): Promise<Bolao> {
  const response = await api.post('/bolao', {
    name,
    year,
    pricePerGame,
    minGamesPerParticipant,
    maxGamesPerParticipant
  });
  return response.data;
}

export async function updateBolao(
  id: number,
  data: {
    name?: string;
    year?: number;
    pricePerGame?: number;
    minGamesPerParticipant?: number;
    maxGamesPerParticipant?: number;
  }
): Promise<Bolao> {
  const response = await api.put(`/bolao/${id}`, data);
  return response.data;
}

export async function deleteBolao(id: number): Promise<void> {
  await api.delete(`/bolao/${id}`);
}

export async function getBolaoStats(id: number): Promise<BolaoStats> {
  const response = await api.get(`/bolao/${id}/stats`);
  return response.data;
}

// ============ PARTICIPANT API ============

export async function addParticipant(bolaoId: number, name: string): Promise<BolaoParticipant> {
  const response = await api.post(`/bolao/${bolaoId}/participants`, { name });
  return response.data;
}

export async function updateParticipant(participantId: number, data: { name?: string }): Promise<BolaoParticipant> {
  const response = await api.put(`/bolao/participants/${participantId}`, data);
  return response.data;
}

export async function toggleParticipantPaid(participantId: number): Promise<BolaoParticipant> {
  const response = await api.patch(`/bolao/participants/${participantId}/toggle-paid`);
  return response.data;
}

export async function deleteParticipant(participantId: number): Promise<void> {
  await api.delete(`/bolao/participants/${participantId}`);
}

// ============ GAME API ============

export async function addGame(participantId: number, numbers: number[]): Promise<BolaoGame> {
  const response = await api.post(`/bolao/participants/${participantId}/games`, { numbers });
  return response.data;
}

export async function deleteGame(gameId: number): Promise<void> {
  await api.delete(`/bolao/games/${gameId}`);
}

export async function updateGame(gameId: number, numbers: number[]): Promise<BolaoGame> {
  const response = await api.put(`/bolao/games/${gameId}`, { numbers });
  return response.data;
}

// ============ HELPER FUNCTIONS ============

export function getTotalGames(bolao: Bolao): number {
  return bolao.participants.reduce((sum, p) => sum + p.games.length, 0);
}

export function getTotalValue(bolao: Bolao): number {
  return getTotalGames(bolao) * (Number(bolao.pricePerGame) || 5);
}

export function getTotalPaid(bolao: Bolao): number {
  const pricePerGame = Number(bolao.pricePerGame) || 5;
  return bolao.participants
    .filter(p => p.paid)
    .reduce((sum, p) => sum + p.games.length * pricePerGame, 0);
}

export function getParticipantValue(bolao: Bolao, participant: BolaoParticipant): number {
  return participant.games.length * (Number(bolao.pricePerGame) || 5);
}
