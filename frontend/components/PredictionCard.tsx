import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VerifiedIcon from "@mui/icons-material/Verified";
import { LotteryBall } from "./LotteryBall";
import { LotteryTheme } from "@/lib/lottery-config";

interface PredictionCardProps {
  prediction: any;
  lotteryTheme?: LotteryTheme;
}

export function PredictionCard({
  prediction,
  lotteryTheme,
}: PredictionCardProps) {
  const numbers = prediction.predictedNumbers || [];
  const matchedNumbers = prediction.matchedNumbers || [];
  const hits = prediction.hits || 0;
  const isChecked = prediction.status === "checked";
  const primaryColor = lotteryTheme?.colors.primary || "#10b981";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: `1px solid ${primaryColor}30`,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            <Typography variant="h6" fontWeight="800" color="text.primary">
              Concurso {prediction.targetConcurso}
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUpIcon sx={{ fontSize: "16px !important" }} />}
            label={prediction.strategyName || "Estratégia"}
            size="small"
            sx={{
              bgcolor: primaryColor,
              color: "#ffffff",
              fontWeight: "bold",
              borderRadius: 2,
            }}
          />
        </Box>

        <Box
          display="flex"
          gap={1.5}
          flexWrap="wrap"
          justifyContent="center"
          mb={4}
        >
          {numbers.map((number: number, index: number) => (
            <LotteryBall
              key={index}
              number={number}
              isHit={matchedNumbers.includes(number)}
              lotteryTheme={lotteryTheme}
            />
          ))}
        </Box>

        {isChecked ? (
          <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                color="text.secondary"
              >
                Resultado
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <VerifiedIcon
                  color={hits >= 4 ? "success" : "action"}
                  fontSize="small"
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={hits >= 4 ? "success.main" : "text.primary"}
                >
                  {hits} Acertos
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(hits / 6) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(0,0,0,0.05)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: hits >= 4 ? "#00e676" : primaryColor,
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Aguardando sorteio...
            </Typography>
          </Box>
        )}

        {prediction.confidenceScore && (
          <Box mt={2} display="flex" justifyContent="center">
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ opacity: 0.7 }}
            >
              Confiança da IA: {(prediction.confidenceScore * 100).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
