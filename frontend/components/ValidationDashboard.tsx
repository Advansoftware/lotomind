"use client";

import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HistoryIcon from "@mui/icons-material/History";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useState, useEffect } from "react";
import { ValidationProgressWrapper } from "./ValidationProgressWrapper";
import { PredictionList } from "./PredictionList";
import { StrategyRanking } from "./StrategyRanking";
import {
  LotteryTheme,
  getLotteryConfig,
  getLotteryTheme,
} from "@/lib/lottery-config";
import { api } from "@/lib/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box pt={3}>{children}</Box>}
    </div>
  );
}

interface SimpleTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

interface ValidationDashboardProps {
  lotteryType: string;
  lotteryTheme: SimpleTheme;
}

interface ValidationStats {
  totalValidated: number;
  avgHits: number;
  bestStrategy: string;
  lastValidation: string;
}

export function ValidationDashboard({
  lotteryType,
  lotteryTheme,
}: ValidationDashboardProps) {
  const [tab, setTab] = useState(0);
  const [validationJobId, setValidationJobId] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lotteryConfig = getLotteryConfig(lotteryType);
  const fullTheme = getLotteryTheme(lotteryType);

  useEffect(() => {
    loadStats();
  }, [lotteryType]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get quick stats from rankings
      const rankings = await api.get(
        `/predictions/validation/strategy-ranking?lotteryType=${lotteryType}`
      );

      if (rankings.data?.length > 0) {
        const totalValidated = rankings.data.reduce(
          (sum: number, s: any) => sum + s.totalPredictions,
          0
        );
        const avgHits =
          rankings.data.reduce((sum: number, s: any) => sum + s.avgHits, 0) /
          rankings.data.length;

        setStats({
          totalValidated,
          avgHits,
          bestStrategy:
            rankings.data[0]?.strategyName?.replace(/_/g, " ").toUpperCase() ||
            "N/A",
          lastValidation: new Date().toLocaleDateString("pt-BR"),
        });
      }
    } catch (err: any) {
      // Stats not available yet
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const startValidation = async () => {
    try {
      setIsValidating(true);
      setError(null);

      const response = await api.post("/predictions/validation/start", {
        lotteryType,
      });

      setValidationJobId(response.data.id);
      setTab(0); // Switch to progress tab
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao iniciar validação");
      setIsValidating(false);
    }
  };

  const handleValidationComplete = () => {
    setIsValidating(false);
    setValidationJobId(null);
    loadStats();
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 4,
          background: lotteryTheme.gradient,
          color: "white",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              🔬 Sistema de Validação
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Valide predições históricas e descubra quais estratégias funcionam
              melhor para {fullTheme.displayName}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={
              isValidating ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={startValidation}
            disabled={isValidating}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
          >
            {isValidating ? "Validando..." : "Iniciar Validação"}
          </Button>
        </Box>

        {/* Quick Stats */}
        {stats && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Total Validado
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {stats.totalValidated.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Média de Acertos
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {stats.avgHits.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Melhor Estratégia
                </Typography>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {stats.bestStrategy}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Última Validação
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {stats.lastValidation}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            px: 2,
          }}
        >
          <Tab
            icon={<PlayArrowIcon />}
            iconPosition="start"
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Progresso
                {isValidating && (
                  <Chip
                    label="Em andamento"
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                )}
              </Box>
            }
          />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Histórico" />
          <Tab
            icon={<LeaderboardIcon />}
            iconPosition="start"
            label="Ranking"
          />
        </Tabs>

        <Box p={3}>
          <TabPanel value={tab} index={0}>
            {validationJobId ? (
              <ValidationProgressWrapper
                jobId={validationJobId}
                lotteryType={lotteryType}
                lotteryTheme={lotteryTheme}
                onComplete={handleValidationComplete}
              />
            ) : (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma validação em andamento
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Clique em "Iniciar Validação" para começar a validar as
                  predições históricas
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={startValidation}
                  sx={{
                    borderColor: lotteryTheme.primary,
                    color: lotteryTheme.primary,
                  }}
                >
                  Iniciar Validação
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <PredictionList
              lotteryType={lotteryType}
              lotteryTheme={lotteryTheme}
            />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <StrategyRanking
              lotteryType={lotteryType}
              lotteryTheme={lotteryTheme}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
