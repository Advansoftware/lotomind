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
  Divider,
  Tooltip,
  IconButton,
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
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
      >
        <Psychology fontSize="large" />
        Sistema de Auto-Refinamento
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

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Speed color="primary" />
                <Typography variant="h6">Pesos Calculados</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats?.totalWeightsCalculated || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <History color="secondary" />
                <Typography variant="h6">Histórico</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {stats?.totalHistoryRecords || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Science color="success" />
                <Typography variant="h6">Evoluções</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: "#10b981" }}>
                {stats?.totalEvolutions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <AutoGraph color="warning" />
                <Typography variant="h6">Combinações</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: "#f59e0b" }}>
                {stats?.totalCombinations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          </Grid>
          <Grid item xs={12} md={8}>
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
          </Grid>
        </Grid>
      </Paper>

      {/* Weights Table */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEvents />
            <Typography variant="h6">
              Ranking de Estratégias (Pesos Atuais)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : weights.length === 0 ? (
            <Alert severity="info">
              Nenhum peso calculado ainda. Execute o refinamento ou valide
              algumas predições primeiro.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Estratégia</TableCell>
                    <TableCell align="center">Peso</TableCell>
                    <TableCell align="center">Confiança</TableCell>
                    <TableCell align="center">Taxa de Acerto</TableCell>
                    <TableCell align="center">Média de Hits</TableCell>
                    <TableCell align="center">Predições</TableCell>
                    <TableCell>Última Atualização</TableCell>
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
                        <Typography variant="subtitle2">
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
                                width: 100,
                                height: 10,
                                borderRadius: 5,
                                bgcolor: "rgba(255,255,255,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: getWeightColor(w.weight),
                                },
                              }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 50 }}>
                              {(w.weight * 100).toFixed(1)}%
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
                        {w.total_predictions} ({w.successful_predictions} ✓)
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

      {/* History */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Timeline />
            <Typography variant="h6">Histórico de Refinamento</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {history.length === 0 ? (
            <Alert severity="info">
              Nenhum histórico de refinamento ainda.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Loteria</TableCell>
                    <TableCell>Estratégia</TableCell>
                    <TableCell align="center">Peso Anterior</TableCell>
                    <TableCell align="center">→</TableCell>
                    <TableCell align="center">Novo Peso</TableCell>
                    <TableCell align="center">Variação</TableCell>
                    <TableCell>Motivo</TableCell>
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
                        <TableCell align="center">→</TableCell>
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
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {h.change_reason}
                          </Typography>
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

      {/* Last Refinement Job */}
      {stats?.lastRefinementJob && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
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
                Iniciado em
              </Typography>
              <Typography>
                {formatDate(stats.lastRefinementJob.started_at)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Finalizado em
              </Typography>
              <Typography>
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
                    } loterias processadas`
                  : "-"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
