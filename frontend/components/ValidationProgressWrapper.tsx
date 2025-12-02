"use client";

import { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";

export interface SimpleTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

interface ValidationProgressWrapperProps {
  jobId: number;
  lotteryType: string;
  lotteryTheme: SimpleTheme;
  onComplete?: () => void;
}

interface ProgressData {
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
}

interface SignificantHit {
  concurso: number;
  strategyName: string;
  hits: number;
}

export function ValidationProgressWrapper({
  jobId,
  lotteryType,
  lotteryTheme,
  onComplete,
}: ValidationProgressWrapperProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [significantHits, setSignificantHits] = useState<SignificantHit[]>([]);
  const [showHits, setShowHits] = useState(true);
  const [loading, setLoading] = useState(true);

  const { isConnected, subscribe, on } = useWebSocket();

  // Load initial job status
  useEffect(() => {
    loadJobStatus();
  }, [jobId]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to validation channel
    subscribe("validation");

    const handleProgress = (data: any) => {
      if (data.jobId === jobId) {
        setProgress((prev) => ({
          ...prev,
          ...data,
        }));

        // Track significant hits
        if (data.hits && data.hits.hits >= 4) {
          setSignificantHits((prev) => [data.hits, ...prev].slice(0, 20));
        }

        // Check if completed
        if (
          data.status === "completed" ||
          data.status === "failed" ||
          data.status === "cancelled"
        ) {
          onComplete?.();
        }
      }
    };

    const unsubscribeHandler = on("validation.progress", handleProgress);

    return () => {
      unsubscribeHandler();
    };
  }, [isConnected, jobId, onComplete, subscribe, on]);

  const loadJobStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/predictions/validation/jobs/${jobId}`);
      setProgress({
        jobId: response.data.id,
        status: response.data.status,
        progressCurrent: response.data.progressCurrent || 0,
        progressTotal: response.data.progressTotal || 1,
        progressPercentage: response.data.progressPercentage || 0,
        currentConcurso: response.data.currentConcurso,
        currentStrategy: response.data.currentStrategy,
        statistics: response.data.statistics,
      });
    } catch (error) {
      console.error("Error loading job status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!progress) return null;
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
    if (!progress) return "default";
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
    if (!progress) return "";
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={6}>
        <CircularProgress sx={{ color: lotteryTheme.primary }} />
      </Box>
    );
  }

  if (!progress) {
    return <Alert severity="warning">Job de validação não encontrado.</Alert>;
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
          {!isConnected && (
            <Chip
              label="Reconectando..."
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
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
            {progress.progressPercentage.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress.progressPercentage}
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
                  {progress.currentStrategy.replace(/_/g, " ").toUpperCase()}
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
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={lotteryTheme.primary}
                >
                  {progress.statistics.avgHits.toFixed(2)}
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
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={lotteryTheme.primary}
                >
                  {progress.statistics.bestHitCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Melhor Acerto
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
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={lotteryTheme.primary}
                >
                  {progress.statistics.totalHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total de Hits
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
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <EmojiEventsIcon sx={{ color: "warning.main" }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Acertos Significativos (4+)
              </Typography>
              <Chip label={significantHits.length} size="small" />
            </Box>
            <IconButton size="small" onClick={() => setShowHits(!showHits)}>
              {showHits ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showHits}>
            <List
              dense
              sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2 }}
            >
              {significantHits.map((hit, idx) => (
                <ListItem key={idx}>
                  <ListItemIcon>
                    <StarIcon
                      sx={{
                        color:
                          hit.hits >= 6
                            ? "success.main"
                            : hit.hits >= 5
                            ? "warning.main"
                            : "info.main",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Concurso #${hit.concurso}`}
                    secondary={`${hit.strategyName} - ${hit.hits} acertos`}
                  />
                  <Chip
                    label={
                      hit.hits >= 6
                        ? "🏆 SENA!"
                        : hit.hits >= 5
                        ? "⭐ QUINA!"
                        : "✓ QUADRA"
                    }
                    size="small"
                    color={
                      hit.hits >= 6
                        ? "success"
                        : hit.hits >= 5
                        ? "warning"
                        : "info"
                    }
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
