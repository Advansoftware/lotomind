"use client";

import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  Chip,
  Divider,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import { useEffect, useState, Suspense } from "react";
import { LotteryCard } from "@/components/LotteryCard";
import { PredictionCard } from "@/components/PredictionCard";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ValidationDashboard } from "@/components/ValidationDashboard";
import { api } from "@/lib/api";
import { getLotteryTheme, getLotteryConfig } from "@/lib/lottery-config";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [latestDraws, setLatestDraws] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const searchParams = useSearchParams();
  const lotteryType = searchParams.get("lotteryType") || "megasena";

  // Get the lottery-specific theme
  const lotteryTheme = getLotteryTheme(lotteryType);
  const lotteryConfig = getLotteryConfig(lotteryType);

  useEffect(() => {
    loadData();
  }, [lotteryType]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load latest draws
      const drawsResponse = await api.get(
        `/lottery/draws?lotteryType=${lotteryType}&limit=3`
      );
      setLatestDraws(drawsResponse.data);

      // Load predictions
      const predictionsResponse = await api.get(
        `/predictions?lotteryType=${lotteryType}&limit=6`
      );
      setPredictions(predictionsResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await api.post("/lottery/sync-full", { lotteryType });
      await loadData();
    } catch (error) {
      console.error("Error syncing:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: lotteryTheme.colors.primary }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      {/* Hero Section with Dynamic Gradient */}
      <Box
        sx={{
          background: lotteryTheme.colors.gradient,
          color: "white",
          pt: 8,
          pb: 12,
          mb: -6,
          borderRadius: "0 0 40px 40px",
          boxShadow: `0 10px 30px ${lotteryTheme.colors.dark}40`,
          transition: "all 0.4s ease-in-out",
        }}
      >
        <Container maxWidth="xl">
          <Grid container alignItems="center" spacing={4}>
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ color: "white !important" }} />}
                  label="IA & Machine Learning"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Chip
                  label={lotteryTheme.displayName}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: "bold",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
              </Box>
              <Typography
                variant="h2"
                component="h1"
                fontWeight="800"
                gutterBottom
                sx={{ textShadow: "0 4px 10px rgba(0,0,0,0.3)" }}
              >
                {lotteryTheme.displayName} Analytics
              </Typography>
              <Typography
                variant="h5"
                sx={{ opacity: 0.9, maxWidth: 600, mb: 2, fontWeight: 300 }}
              >
                {lotteryTheme.description}
              </Typography>
              <Typography
                variant="body1"
                sx={{ opacity: 0.8, maxWidth: 600, mb: 4 }}
              >
                Inteligência Artificial avançada para análise e predição com 20
                estratégias exclusivas.
                <br />
                <strong>Configuração:</strong> {lotteryConfig.numbersToDraw}{" "}
                números de {lotteryConfig.maxNumber} | Sorteios:{" "}
                {lotteryConfig.drawDays.join(", ")}
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketLaunchIcon />}
                  sx={{
                    bgcolor: "white",
                    color: lotteryTheme.colors.dark,
                    fontWeight: "bold",
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.9)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Gerar Nova Predição
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={handleSync}
                  sx={{
                    borderColor: "rgba(255,255,255,0.5)",
                    color: "white",
                    fontWeight: "bold",
                    px: 3,
                    borderRadius: 3,
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Sincronizar Tudo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "120px",
                  opacity: 0.3,
                  filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
                }}
              >
                {lotteryTheme.icon}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Dashboard Metrics - Floating Cards */}
        <Box sx={{ mt: -6, mb: 4, position: "relative", zIndex: 2 }}>
          <DashboardMetrics
            lotteryType={lotteryType}
            lotteryTheme={lotteryTheme}
          />
        </Box>

        {/* Tab Navigation */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 56,
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                minHeight: 56,
                color: "#94a3b8",
                fontSize: "0.95rem",
                "&:hover": {
                  color: "#e2e8f0",
                  bgcolor: "rgba(255,255,255,0.03)",
                },
              },
              "& .Mui-selected": {
                color: "#ffffff !important",
              },
              "& .MuiTabs-indicator": {
                bgcolor: lotteryTheme.colors.primary,
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              icon={<DashboardIcon />}
              iconPosition="start"
              label="Dashboard"
            />
            <Tab
              icon={<ScienceIcon />}
              iconPosition="start"
              label="Validação & Análise"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 ? (
          // Dashboard Tab
          <Grid container spacing={4}>
            {/* Latest Draws Column */}
            <Grid item xs={12} lg={4}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  📊 Últimos Sorteios
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  size="small"
                  onClick={loadData}
                  sx={{ color: lotteryTheme.colors.primary }}
                >
                  Atualizar
                </Button>
              </Box>
              <Box display="flex" flexDirection="column" gap={3}>
                {latestDraws.length > 0 ? (
                  latestDraws.map((draw) => (
                    <LotteryCard
                      key={draw.id}
                      draw={draw}
                      lotteryTheme={lotteryTheme}
                    />
                  ))
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      borderRadius: 4,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography color="text.secondary">
                      Nenhum sorteio encontrado. Clique em "Sincronizar Tudo"
                      para carregar os dados.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>

            {/* Predictions Column */}
            <Grid item xs={12} lg={8}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  🔮 Predições Ativas
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: lotteryTheme.colors.primary,
                    color: lotteryTheme.colors.primary,
                    "&:hover": {
                      borderColor: lotteryTheme.colors.dark,
                      bgcolor: `${lotteryTheme.colors.primary}10`,
                    },
                  }}
                >
                  Ver Todas
                </Button>
              </Box>
              <Grid container spacing={3}>
                {predictions.length > 0 ? (
                  predictions.map((prediction) => (
                    <Grid item xs={12} md={6} key={prediction.id}>
                      <PredictionCard
                        prediction={prediction}
                        lotteryTheme={lotteryTheme}
                      />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: "center",
                        borderRadius: 4,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography color="text.secondary">
                        Nenhuma predição ativa. Clique em "Gerar Nova Predição"
                        para começar.
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        ) : (
          // Validation Tab
          <ValidationDashboard
            lotteryType={lotteryType}
            lotteryTheme={{
              primary: lotteryTheme.colors.primary,
              secondary: lotteryTheme.colors.dark,
              gradient: lotteryTheme.colors.gradient,
            }}
          />
        )}
      </Container>
    </Box>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
