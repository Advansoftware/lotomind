"use client";

import { Grid, Paper, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LotteryTheme } from "@/lib/lottery-config";

interface DashboardMetricsProps {
  lotteryType: string;
  lotteryTheme: LotteryTheme;
}

export function DashboardMetrics({
  lotteryType,
  lotteryTheme,
}: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState({
    totalPredictions: 0,
    avgAccuracy: 0,
    bestStrategy: "Carregando...",
    totalHits: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, [lotteryType]);

  const loadMetrics = async () => {
    try {
      const response = await api.get(
        `/analytics/dashboard?lotteryType=${lotteryType}`
      );
      setMetrics(response.data);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  const MetricCard = ({ icon, title, value, color }: any) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: `1px solid ${lotteryTheme.colors.primary}30`,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            boxShadow: `0 8px 16px ${color}20`,
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight="500"
            mb={0.5}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="800" color="text.primary">
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<ShowChartIcon sx={{ fontSize: 32 }} />}
          title="Total de Predições"
          value={metrics.totalPredictions}
          color={lotteryTheme.colors.secondary}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
          title="Precisão Média"
          value={`${(Number(metrics.avgAccuracy || 0) * 100).toFixed(1)}%`}
          color="#00e676"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<EmojiEventsIcon sx={{ fontSize: 32 }} />}
          title="Melhor Estratégia"
          value={metrics.bestStrategy}
          color="#ffd600"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<EmojiEventsIcon sx={{ fontSize: 32 }} />}
          title="Total de Acertos"
          value={metrics.totalHits}
          color={lotteryTheme.colors.primary}
        />
      </Grid>
    </Grid>
  );
}
