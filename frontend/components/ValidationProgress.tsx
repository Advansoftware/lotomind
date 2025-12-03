"use client";

import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Collapse,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";

// Simplified theme interface for validation components
export interface SimpleTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

interface ValidationProgressProps {
  progress: {
    jobId: number;
    status: "queued" | "running" | "completed" | "failed" | "cancelled";
    progressCurrent: number;
    progressTotal: number;
    progressPercentage: number;
    currentConcurso?: number;
    currentStrategy?: string;
    message?: string;
    error?: string;
    statistics?: {
      totalPredictions: number;
      totalHits: number;
      avgHits: number;
      bestStrategyId: number;
      bestHitCount: number;
    };
  } | null;
  significantHits: Array<{
    concurso: number;
    strategyName: string;
    hits: number;
    predictedNumbers?: number[];
    matchedNumbers?: number[];
  }>;
  lotteryTheme: SimpleTheme;
}

export function ValidationProgress({
  progress,
  significantHits,
  lotteryTheme,
}: ValidationProgressProps) {
  const [showHits, setShowHits] = useState(true);

  if (!progress) return null;

  const getStatusIcon = () => {
    switch (progress.status) {
      case "queued":
        return <HourglassEmptyIcon color="warning" />;
      case "running":
        return <PlayArrowIcon color="primary" />;
      case "completed":
        return <CheckCircleIcon color="success" />;
      case "failed":
      case "cancelled":
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case "queued":
        return "warning";
      case "running":
        return "primary";
      case "completed":
        return "success";
      case "failed":
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = () => {
    switch (progress.status) {
      case "queued":
        return "Na fila";
      case "running":
        return "Executando";
      case "completed":
        return "Concluído";
      case "failed":
        return "Falhou";
      case "cancelled":
        return "Cancelado";
    }
  };

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
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {getStatusIcon()}
          <Typography variant="h6" fontWeight="bold">
            Validação #{progress.jobId}
          </Typography>
          <Chip
            label={getStatusLabel()}
            color={getStatusColor() as any}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {progress.progressCurrent} / {progress.progressTotal}
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Progresso
          </Typography>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={lotteryTheme.primary}
          >
            {Number(progress.progressPercentage || 0).toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Number(progress.progressPercentage) || 0}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "rgba(255,255,255,0.1)",
            "& .MuiLinearProgress-bar": {
              bgcolor: lotteryTheme.primary,
              borderRadius: 5,
            },
          }}
        />
      </Box>

      {/* Current Status */}
      {progress.status === "running" && (
        <Box mb={3} p={2} bgcolor="rgba(255,255,255,0.03)" borderRadius={2}>
          <Grid container spacing={2}>
            {progress.currentConcurso && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Concurso Atual
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  #{progress.currentConcurso}
                </Typography>
              </Grid>
            )}
            {progress.currentStrategy && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Estratégia
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {progress.currentStrategy}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Error Message */}
      {progress.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {progress.error}
        </Alert>
      )}

      {/* Statistics (when completed) */}
      {progress.status === "completed" && progress.statistics && (
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            📊 Estatísticas Finais
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box
                textAlign="center"
                p={2}
                bgcolor="rgba(255,255,255,0.03)"
                borderRadius={2}
              >
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={lotteryTheme.primary}
                >
                  {progress.statistics.totalPredictions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Predições
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box
                textAlign="center"
                p={2}
                bgcolor="rgba(255,255,255,0.03)"
                borderRadius={2}
              >
                <Typography variant="h5" fontWeight="bold" color="#00e676">
                  {Number(progress.statistics.avgHits || 0).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Média de Acertos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box
                textAlign="center"
                p={2}
                bgcolor="rgba(255,255,255,0.03)"
                borderRadius={2}
              >
                <Typography variant="h5" fontWeight="bold" color="#ffd600">
                  {progress.statistics.bestHitCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Melhor Resultado
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box
                textAlign="center"
                p={2}
                bgcolor="rgba(255,255,255,0.03)"
                borderRadius={2}
              >
                <Typography variant="h5" fontWeight="bold">
                  {progress.statistics.totalHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total de Acertos
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Significant Hits */}
      {significantHits.length > 0 && (
        <Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: "pointer" }}
            onClick={() => setShowHits(!showHits)}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <EmojiEventsIcon color="warning" />
              <Typography variant="subtitle1" fontWeight="bold">
                Acertos Significativos ({significantHits.length})
              </Typography>
            </Box>
            <IconButton size="small">
              {showHits ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showHits}>
            <List dense sx={{ mt: 1 }}>
              {significantHits.slice(0, 10).map((hit, index) => (
                <ListItem
                  key={`${hit.concurso}-${hit.strategyName}-${index}`}
                  sx={{
                    bgcolor:
                      hit.hits >= 5
                        ? "rgba(0,230,118,0.1)"
                        : "rgba(255,255,255,0.03)",
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {hit.hits >= 5 ? (
                      <StarIcon sx={{ color: "#ffd600" }} />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight="bold">
                          Concurso #{hit.concurso}
                        </Typography>
                        <Chip
                          label={`${hit.hits} acertos`}
                          size="small"
                          color={hit.hits >= 5 ? "success" : "primary"}
                        />
                      </Box>
                    }
                    secondary={hit.strategyName}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
}
