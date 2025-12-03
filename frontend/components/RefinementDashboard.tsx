"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Stack,
  Fab,
} from "@mui/material";
import {
  TrendingUp,
  Science,
  Timeline,
  ExpandMore,
  Refresh,
  PlayArrow,
  Speed,
  EmojiEvents,
  Psychology,
  AutoGraph,
  History,
} from "@mui/icons-material";
import { api } from "../lib/api";

interface StrategyWeight {
  id: number;
  strategy_id: number;
  strategy_name: string;
  lottery_type_id: number;
  weight: number;
  confidence: number;
  hit_rate: number;
  avg_hits: number;
  total_predictions: number;
  successful_predictions: number;
  last_calculated: string;
  is_active: boolean;
}

interface RefinementHistory {
  id: number;
  strategy_name: string;
  lottery_name: string;
  previous_weight: number;
  new_weight: number;
  change_reason: string;
  performance_data: any;
  created_at: string;
}

interface LotteryType {
  id: number;
  name: string;
  slug: string;
}

interface RefinementStats {
  totalWeightsCalculated: number;
  totalHistoryRecords: number;
  totalEvolutions: number;
  totalCombinations: number;
  lastRefinementJob: any;
  weightsByLottery: Array<{
    name: string;
    slug: string;
    strategies_count: number;
    avg_weight: number;
  }>;
}

export default function RefinementDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<number | "">("");
  const [weights, setWeights] = useState<StrategyWeight[]>([]);
  const [history, setHistory] = useState<RefinementHistory[]>([]);
  const [stats, setStats] = useState<RefinementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [runningRefinement, setRunningRefinement] = useState(false);

  const loadLotteryTypes = useCallback(async () => {
    try {
      const response = await api.get("/lottery/types");
      setLotteryTypes(response.data);
      if (response.data.length > 0) {
        setSelectedLottery(response.data[0].id);
      }
    } catch (err: any) {
      setError("Erro ao carregar tipos de loteria");
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get("/refinement/stats");
      setStats(response.data.stats);
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }, []);

  const loadWeights = useCallback(async () => {
    if (!selectedLottery) return;

    setLoading(true);
    try {
      const response = await api.get(`/refinement/weights/${selectedLottery}`);
      setWeights(response.data.weights || []);
    } catch (err: any) {
      setError("Erro ao carregar pesos das estratégias");
    } finally {
      setLoading(false);
    }
  }, [selectedLottery]);

  const loadHistory = useCallback(async () => {
    try {
      const url = selectedLottery
        ? `/refinement/history?lotteryTypeId=${selectedLottery}&limit=20`
        : "/refinement/history?limit=20";
      const response = await api.get(url);
      setHistory(response.data.history || []);
    } catch (err: any) {
      console.error("Erro ao carregar histórico:", err);
    }
  }, [selectedLottery]);

  useEffect(() => {
    loadLotteryTypes();
    loadStats();
  }, [loadLotteryTypes, loadStats]);

  useEffect(() => {
    if (selectedLottery) {
      loadWeights();
      loadHistory();
    }
  }, [selectedLottery, loadWeights, loadHistory]);

  const handleRunRefinement = async () => {
    setRunningRefinement(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post("/refinement/run");
      if (response.data.success) {
        setSuccess("Ciclo de refinamento concluído com sucesso!");
        // Recarregar dados
        loadStats();
        loadWeights();
        loadHistory();
      } else {
        setError(
          "Erro no refinamento: " + JSON.stringify(response.data.details)
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao executar refinamento");
    } finally {
      setRunningRefinement(false);
    }
  };

  const handleCalculateWeights = async () => {
    if (!selectedLottery) return;

    setLoading(true);
    setError(null);

    try {
      await api.post(`/refinement/calculate/${selectedLottery}`);
      setSuccess("Pesos recalculados com sucesso!");
      loadWeights();
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao calcular pesos");
    } finally {
      setLoading(false);
    }
  };

  const handleEvolve = async () => {
    if (!selectedLottery) return;

    setLoading(true);
    setError(null);

    try {
      await api.post(`/refinement/evolve/${selectedLottery}`);
      setSuccess("Evolução genética executada!");
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro na evolução");
    } finally {
      setLoading(false);
    }
  };

  const getWeightColor = (weight: number): string => {
    if (weight >= 0.7) return "#10b981";
    if (weight >= 0.5) return "#f59e0b";
    if (weight >= 0.3) return "#f97316";
    return "#ef4444";
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography
        variant={isMobile ? "h5" : "h4"}
        sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
      >
        <Psychology fontSize={isMobile ? "medium" : "large"} />
        {isMobile ? "Auto-Refinamento" : "Sistema de Auto-Refinamento"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Stats Overview - Mobile Optimized */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{
                p: { xs: 1.5, md: 2 },
                "&:last-child": { pb: { xs: 1.5, md: 2 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Speed color="primary" sx={{ fontSize: { xs: 18, md: 24 } }} />
                <Typography variant={isMobile ? "caption" : "subtitle2"} noWrap>
                  Pesos
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                color="primary"
                fontWeight="bold"
              >
                {stats?.totalWeightsCalculated || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{
                p: { xs: 1.5, md: 2 },
                "&:last-child": { pb: { xs: 1.5, md: 2 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <History
                  color="secondary"
                  sx={{ fontSize: { xs: 18, md: 24 } }}
                />
                <Typography variant={isMobile ? "caption" : "subtitle2"} noWrap>
                  Histórico
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                color="secondary"
                fontWeight="bold"
              >
                {stats?.totalHistoryRecords || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{
                p: { xs: 1.5, md: 2 },
                "&:last-child": { pb: { xs: 1.5, md: 2 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Science
                  sx={{ fontSize: { xs: 18, md: 24 }, color: "#10b981" }}
                />
                <Typography variant={isMobile ? "caption" : "subtitle2"} noWrap>
                  Evoluções
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{ color: "#10b981" }}
                fontWeight="bold"
              >
                {stats?.totalEvolutions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{
                p: { xs: 1.5, md: 2 },
                "&:last-child": { pb: { xs: 1.5, md: 2 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <AutoGraph
                  sx={{ fontSize: { xs: 18, md: 24 }, color: "#f59e0b" }}
                />
                <Typography variant={isMobile ? "caption" : "subtitle2"} noWrap>
                  Combos
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{ color: "#f59e0b" }}
                fontWeight="bold"
              >
                {stats?.totalCombinations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions - Mobile Optimized */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel>Loteria</InputLabel>
            <Select
              value={selectedLottery}
              label="Loteria"
              onChange={(e) => setSelectedLottery(e.target.value as number)}
            >
              {lotteryTypes.map((lt) => (
                <MenuItem key={lt.id} value={lt.id}>
                  {lt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isMobile ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={
                  runningRefinement ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                onClick={handleRunRefinement}
                disabled={runningRefinement}
                sx={{ flex: 1, minWidth: 120 }}
              >
                {runningRefinement ? "..." : "Refinar"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TrendingUp />}
                onClick={handleCalculateWeights}
                disabled={!selectedLottery || loading}
                sx={{ flex: 1, minWidth: 100 }}
              >
                Pesos
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<Science />}
                onClick={handleEvolve}
                disabled={!selectedLottery || loading}
                sx={{ flex: 1, minWidth: 100 }}
              >
                Evoluir
              </Button>
              <IconButton
                onClick={() => {
                  loadWeights();
                  loadHistory();
                  loadStats();
                }}
                size="small"
              >
                <Refresh />
              </IconButton>
            </Stack>
          ) : (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  runningRefinement ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                onClick={handleRunRefinement}
                disabled={runningRefinement}
              >
                {runningRefinement
                  ? "Executando..."
                  : "Executar Refinamento Completo"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={handleCalculateWeights}
                disabled={!selectedLottery || loading}
              >
                Recalcular Pesos
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Science />}
                onClick={handleEvolve}
                disabled={!selectedLottery || loading}
              >
                Evoluir Estratégias
              </Button>
              <IconButton
                onClick={() => {
                  loadWeights();
                  loadHistory();
                  loadStats();
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Weights Table - Mobile Cards */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEvents />
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Ranking de Estratégias
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 1, md: 2 } }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : weights.length === 0 ? (
            <Alert
              severity="info"
              sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }}
            >
              Nenhum peso calculado. Execute o refinamento primeiro.
            </Alert>
          ) : isMobile ? (
            // Mobile: Card List
            <Stack spacing={1.5}>
              {weights.map((w, index) => (
                <Card key={w.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h6">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `${index + 1}º`}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {w.strategy_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${(w.weight * 100).toFixed(0)}%`}
                      size="small"
                      sx={{
                        bgcolor: getWeightColor(w.weight),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={w.weight * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mb: 1,
                      bgcolor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getWeightColor(w.weight),
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Confiança: {(w.confidence * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Média: {parseFloat(String(w.avg_hits)).toFixed(1)} hits
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {w.total_predictions} testes
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
          ) : (
            // Desktop: Table
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Estratégia</TableCell>
                    <TableCell align="center">Peso</TableCell>
                    <TableCell align="center">Confiança</TableCell>
                    <TableCell align="center">Taxa</TableCell>
                    <TableCell align="center">Média</TableCell>
                    <TableCell align="center">Testes</TableCell>
                    <TableCell>Atualização</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weights.map((w, index) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {w.strategy_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={`Peso: ${(w.weight * 100).toFixed(2)}%`}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={w.weight * 100}
                              sx={{
                                width: 80,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "rgba(255,255,255,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: getWeightColor(w.weight),
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {(w.weight * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${(w.confidence * 100).toFixed(0)}%`}
                          size="small"
                          color={
                            w.confidence >= 0.7
                              ? "success"
                              : w.confidence >= 0.4
                              ? "warning"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        {(w.hit_rate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {parseFloat(String(w.avg_hits)).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {w.total_predictions}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(w.last_calculated)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      {/* History - Mobile Optimized */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Timeline />
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Histórico
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 1, md: 2 } }}>
          {history.length === 0 ? (
            <Alert
              severity="info"
              sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }}
            >
              Nenhum histórico ainda.
            </Alert>
          ) : isMobile ? (
            // Mobile: Simplified List
            <Stack spacing={1}>
              {history.slice(0, 10).map((h) => {
                const variation = (h.new_weight - h.previous_weight) * 100;
                return (
                  <Card key={h.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {h.strategy_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {h.lottery_name} • {formatDate(h.created_at)}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${variation >= 0 ? "+" : ""}${variation.toFixed(
                          1
                        )}%`}
                        size="small"
                        color={variation > 0 ? "success" : "error"}
                      />
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            // Desktop: Table
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Loteria</TableCell>
                    <TableCell>Estratégia</TableCell>
                    <TableCell align="center">Anterior</TableCell>
                    <TableCell align="center">Novo</TableCell>
                    <TableCell align="center">Variação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => {
                    const variation = (h.new_weight - h.previous_weight) * 100;
                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(h.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>{h.lottery_name}</TableCell>
                        <TableCell>{h.strategy_name}</TableCell>
                        <TableCell align="center">
                          {(h.previous_weight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          {(h.new_weight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${
                              variation >= 0 ? "+" : ""
                            }${variation.toFixed(1)}%`}
                            size="small"
                            color={variation > 0 ? "success" : "error"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Last Refinement Job - Mobile Optimized */}
      {stats?.lastRefinementJob && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1.5 }}>
            Último Refinamento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box>
                <Chip
                  label={stats.lastRefinementJob.status}
                  size="small"
                  color={
                    stats.lastRefinementJob.status === "completed"
                      ? "success"
                      : "warning"
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Iniciado
              </Typography>
              <Typography variant="body2">
                {formatDate(stats.lastRefinementJob.started_at)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Finalizado
              </Typography>
              <Typography variant="body2">
                {formatDate(stats.lastRefinementJob.finished_at)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Resultados
              </Typography>
              <Typography variant="body2">
                {stats.lastRefinementJob.results
                  ? `${
                      JSON.parse(stats.lastRefinementJob.results)?.lotteries
                        ?.length || 0
                    } loterias`
                  : "-"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* FAB for mobile quick refresh */}
      {isMobile && (
        <Fab
          color="primary"
          size="medium"
          onClick={() => {
            loadWeights();
            loadHistory();
            loadStats();
          }}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
          }}
        >
          <Refresh />
        </Fab>
      )}
    </Box>
  );
}
