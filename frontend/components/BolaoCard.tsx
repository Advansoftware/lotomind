"use client";

import { Box, Paper, Typography, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import PeopleIcon from "@mui/icons-material/People";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Bolao, getTotalGames } from "@/lib/bolao-api";
import { getLotteryTheme } from "@/lib/lottery-config";

interface BolaoCardProps {
  bolao: Bolao;
}

export function BolaoCard({ bolao }: BolaoCardProps) {
  const router = useRouter();
  const megaTheme = getLotteryTheme("megasena");
  const totalGames = getTotalGames(bolao);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Paper
      onClick={() => router.push(`/bolao/${bolao.id}`)}
      sx={{
        p: 3,
        borderRadius: 3,
        cursor: "pointer",
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 30px ${megaTheme.colors.primary}30`,
          borderColor: megaTheme.colors.primary,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          🎉 {bolao.name}
        </Typography>
        <Chip
          label="Mega da Virada"
          size="small"
          sx={{
            bgcolor: `${megaTheme.colors.primary}20`,
            color: megaTheme.colors.primary,
            fontWeight: "bold",
            fontSize: "0.7rem",
          }}
        />
      </Box>

      {/* Stats */}
      <Box display="flex" gap={3}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <PeopleIcon fontSize="small" sx={{ color: megaTheme.colors.primary }} />
          <Typography variant="body2" color="text.secondary">
            {bolao.participants.length} participante
            {bolao.participants.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <SportsEsportsIcon
            fontSize="small"
            sx={{ color: megaTheme.colors.primary }}
          />
          <Typography variant="body2" color="text.secondary">
            {totalGames} jogo{totalGames !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </Box>

      {/* Date */}
      <Box display="flex" alignItems="center" gap={0.5} mt={2}>
        <CalendarTodayIcon
          fontSize="small"
          sx={{ color: "text.secondary", fontSize: 14 }}
        />
        <Typography variant="caption" color="text.secondary">
          Criado em {formatDate(bolao.createdAt)}
        </Typography>
      </Box>
    </Paper>
  );
}
