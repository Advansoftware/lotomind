"use client";

import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  Tooltip,
  Chip,
  Skeleton,
  IconButton,
  Collapse,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// Simplified theme interface
export interface SimpleTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

interface StrategyStats {
  strategyName: string;
  strategyDescription: string;
  totalPredictions: number;
  avgHits: number;
  maxHits: number;
  avgConfidence: number;
  hitRate4Plus: number; // % que acertou 4+
  hitRate5Plus: number; // % que acertou 5+
  hitRate6: number; // % que acertou 6
  score: number; // Score geral calculado
}

interface StrategyRankingProps {
  lotteryType: string;
  lotteryTheme: SimpleTheme;
}

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  frequency:
    "Analisa a frequência de aparição de cada número nos últimos sorteios",
  delay:
    'Identifica números que estão "atrasados" e com maior probabilidade de sair',
  hot_cold: 'Combina números "quentes" (frequentes) e "frios" (atrasados)',
  moving_average: "Usa média móvel para identificar tendências de números",
  standard_deviation: "Seleciona números com base no desvio padrão",
  pattern_repetition: "Busca padrões que se repetem entre concursos",
  sum_range: "Otimiza a soma total dos números escolhidos",
  odd_even_balance: "Balanceia entre números pares e ímpares",
  gap_analysis: "Analisa os intervalos entre aparições dos números",
  fibonacci: "Usa sequência de Fibonacci para seleção",
  markov_chain: "Modelo probabilístico baseado em transições de estado",
  monte_carlo: "Simulação probabilística com milhares de cenários",
  bayesian: "Inferência bayesiana para estimativa de probabilidades",
  ensemble_voting: "Combina votos de múltiplas estratégias",
  genetic_algorithm: "Evolução genética para otimizar seleções",
  random_forest: "Machine Learning com floresta de decisões",
  kmeans_clustering: "Agrupa números por características similares",
  neural_network: "Rede neural para detecção de padrões complexos",
  cycle_detection: "Detecta ciclos e periodicidade nos sorteios",
  adaptive_hybrid: "Combina dinamicamente as melhores estratégias",
};

function StrategyCard({
  strategy,
  rank,
  lotteryTheme,
}: {
  strategy: StrategyStats;
  rank: number;
  lotteryTheme: SimpleTheme;
}) {
  const [expanded, setExpanded] = useState(false);

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getTrend = () => {
    // Simular tendência (na prática, comparar com período anterior)
    return Math.random() > 0.5 ? "up" : "down";
  };

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: rank <= 3 ? `${lotteryTheme.primary}10` : "background.paper",
        border:
          rank <= 3
            ? `1px solid ${lotteryTheme.primary}40`
            : "1px solid rgba(255,255,255,0.05)",
        borderRadius: 3,
        transition: "all 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {/* Rank */}
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            bgcolor: rank <= 3 ? lotteryTheme.primary : "rgba(255,255,255,0.1)",
            color: rank <= 3 ? "white" : "text.secondary",
            fontWeight: "bold",
            fontSize: rank <= 3 ? "1.5rem" : "1rem",
          }}
        >
          {getMedalEmoji(rank)}
        </Box>

        {/* Info */}
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontWeight="bold">
              {strategy.strategyName.replace(/_/g, " ").toUpperCase()}
            </Typography>
            <Tooltip
              title={
                STRATEGY_DESCRIPTIONS[strategy.strategyName] ||
                strategy.strategyDescription
              }
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: 16,
                  color: "text.secondary",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
            {getTrend() === "up" ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {strategy.totalPredictions} predições analisadas
          </Typography>
        </Box>

        {/* Score */}
        <Box textAlign="right" mr={1}>
          <Typography
            variant="h5"
            fontWeight="bold"
            color={lotteryTheme.primary}
          >
            {Number(strategy.score || 0).toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Score
          </Typography>
        </Box>

        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box mt={2} pt={2} borderTop="1px solid rgba(255,255,255,0.05)">
          <Grid container spacing={2}>
            {/* Média de Acertos */}
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Média de Acertos
              </Typography>
              <Typography fontWeight="bold">
                {Number(strategy.avgHits || 0).toFixed(2)}
              </Typography>
            </Grid>

            {/* Máximo de Acertos */}
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Máx. Acertos
              </Typography>
              <Typography fontWeight="bold">{strategy.maxHits || 0}</Typography>
            </Grid>

            {/* Confiança Média */}
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Confiança Média
              </Typography>
              <Typography fontWeight="bold">
                {(Number(strategy.avgConfidence || 0) * 100).toFixed(1)}%
              </Typography>
            </Grid>

            {/* Taxa 4+ */}
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Taxa 4+ Acertos
              </Typography>
              <Typography fontWeight="bold">
                {(Number(strategy.hitRate4Plus || 0) * 100).toFixed(2)}%
              </Typography>
            </Grid>
          </Grid>

          {/* Progress bars */}
          <Box mt={2}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip label="Quadra (4)" size="small" />
              <Box flex={1}>
                <LinearProgress
                  variant="determinate"
                  value={Number(strategy.hitRate4Plus || 0) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "info.main",
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" width={50} textAlign="right">
                {(Number(strategy.hitRate4Plus || 0) * 100).toFixed(2)}%
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip label="Quina (5)" size="small" />
              <Box flex={1}>
                <LinearProgress
                  variant="determinate"
                  value={Number(strategy.hitRate5Plus || 0) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "warning.main",
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" width={50} textAlign="right">
                {(Number(strategy.hitRate5Plus || 0) * 100).toFixed(2)}%
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Chip label="Sena (6)" size="small" color="success" />
              <Box flex={1}>
                <LinearProgress
                  variant="determinate"
                  value={Number(strategy.hitRate6 || 0) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "success.main",
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" width={50} textAlign="right">
                {(Number(strategy.hitRate6 || 0) * 100).toFixed(4)}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export function StrategyRanking({
  lotteryType,
  lotteryTheme,
}: StrategyRankingProps) {
  const [strategies, setStrategies] = useState<StrategyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStrategies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/validation/strategy-ranking?lotteryType=${lotteryType}`
      );
      // Sort by: 1) Max hits (closest to jackpot), 2) High hit rates, 3) Average hits
      // Works for all lottery types: Mega-Sena, Quina, Lotofácil, etc.
      const sortedStrategies = (response.data || []).sort(
        (a: StrategyStats, b: StrategyStats) => {
          // Priority 1: Max hits achieved (closest to jackpot for ANY lottery)
          const maxA = Number(a.maxHits) || 0;
          const maxB = Number(b.maxHits) || 0;
          if (maxA !== maxB) return maxB - maxA;

          // Priority 2: Rate of high hits (4+ for most lotteries)
          const rate4A = Number(a.hitRate4Plus) || 0;
          const rate4B = Number(b.hitRate4Plus) || 0;
          if (rate4A !== rate4B) return rate4B - rate4A;

          // Priority 3: Rate of 5+ hits
          const rate5A = Number(a.hitRate5Plus) || 0;
          const rate5B = Number(b.hitRate5Plus) || 0;
          if (rate5A !== rate5B) return rate5B - rate5A;

          // Priority 4: Perfect match rate (jackpot)
          const rate6A = Number(a.hitRate6) || 0;
          const rate6B = Number(b.hitRate6) || 0;
          if (rate6A !== rate6B) return rate6B - rate6A;

          // Priority 5: Average hits (tiebreaker)
          return (Number(b.avgHits) || 0) - (Number(a.avgHits) || 0);
        }
      );
      setStrategies(sortedStrategies);
    } catch (error) {
      console.error("Error loading strategies:", error);
    } finally {
      setLoading(false);
    }
  }, [lotteryType]);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          🏆 Ranking de Estratégias
        </Typography>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Box key={idx} mb={2}>
            <Skeleton variant="rounded" height={80} />
          </Box>
        ))}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h6" fontWeight="bold">
          🏆 Ranking de Estratégias
        </Typography>
        <Chip
          label={`${strategies.length} estratégias`}
          size="small"
          variant="outlined"
        />
      </Box>

      {strategies.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
            Nenhum dado de ranking disponível. Execute validações para gerar o
            ranking.
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {strategies.map((strategy, idx) => (
            <StrategyCard
              key={strategy.strategyName}
              strategy={strategy}
              rank={idx + 1}
              lotteryTheme={lotteryTheme}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
