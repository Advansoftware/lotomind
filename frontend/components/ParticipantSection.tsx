"use client";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  TextField,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";
import PaidIcon from "@mui/icons-material/Paid";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";
import { useState } from "react";
import { LotteryBall } from "./LotteryBall";
import { NumberGrid } from "./NumberGrid";
import { BolaoParticipant, BolaoGame } from "@/lib/bolao-api";
import { getLotteryTheme } from "@/lib/lottery-config";

interface ParticipantSectionProps {
  participant: BolaoParticipant;
  participantValue: number;
  allGames: { gameId: number; participantId: number; participantName: string; numbers: number[] }[];
  minGamesPerParticipant?: number;
  maxGamesPerParticipant?: number | null;
  onAddGame: (participantId: number, numbers: number[]) => void;
  onRemoveGame: (participantId: number, gameId: number) => void;
  onRemoveParticipant: (participantId: number) => void;
  onUpdateName: (participantId: number, name: string) => void;
  onTogglePaid: (participantId: number) => void;
  onUpdateGame?: (gameId: number, numbers: number[]) => void;
}

export function ParticipantSection({
  participant,
  participantValue,
  allGames,
  minGamesPerParticipant = 1,
  maxGamesPerParticipant,
  onAddGame,
  onRemoveGame,
  onRemoveParticipant,
  onUpdateName,
  onTogglePaid,
  onUpdateGame,
}: ParticipantSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(participant.name);
  const [addGameModal, setAddGameModal] = useState(false);
  const [editGameModal, setEditGameModal] = useState<BolaoGame | null>(null);
  const megaTheme = getLotteryTheme("megasena");

  // Find duplicate games (same numbers as another game in the bolão)
  const findDuplicateOf = (gameId: number, numbers: number[]): { participantName: string } | null => {
    const sortedNumbers = [...numbers].sort((a, b) => a - b).join(',');
    for (const g of allGames) {
      if (g.gameId !== gameId) {
        const gSorted = [...g.numbers].sort((a, b) => a - b).join(',');
        if (sortedNumbers === gSorted) {
          return { participantName: g.participantName };
        }
      }
    }
    return null;
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(participant.id, editName.trim());
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(participant.name);
    setEditing(false);
  };

  const handleAddGame = (numbers: number[]) => {
    onAddGame(participant.id, numbers);
    setAddGameModal(false);
  };

  const handleEditGame = (numbers: number[]) => {
    if (editGameModal && onUpdateGame) {
      onUpdateGame(editGameModal.id, numbers);
      setEditGameModal(null);
    }
  };

  return (
    <>
      <Paper
        sx={{
          overflow: "hidden",
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            bgcolor: `${megaTheme.colors.primary}15`,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <PersonIcon sx={{ color: megaTheme.colors.primary, mr: 1.5 }} />
          
          {editing ? (
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              <TextField
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                size="small"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                sx={{ flex: 1 }}
              />
              <IconButton size="small" onClick={handleSaveName} color="success">
                <CheckIcon />
              </IconButton>
              <IconButton size="small" onClick={handleCancelEdit} color="error">
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                {participant.name}
              </Typography>
              <Chip
                icon={<PaidIcon />}
                label={participant.paid ? "Pago" : "Não Pago"}
                size="small"
                onClick={() => onTogglePaid(participant.id)}
                sx={{
                  mr: 1,
                  cursor: "pointer",
                  bgcolor: participant.paid ? "#22c55e" : "#ef4444",
                  color: "white",
                  fontWeight: "bold",
                  "& .MuiChip-icon": { color: "white" },
                  "&:hover": {
                    bgcolor: participant.paid ? "#16a34a" : "#dc2626",
                  },
                }}
              />
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ 
                  mr: 1,
                  color: participant.paid ? "#22c55e" : "#ef4444",
                }}
              >
                R$ {participantValue.toFixed(2)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mr: 2 }}
              >
                {participant.games.length} jogo{participant.games.length !== 1 ? "s" : ""}
              </Typography>
              <Tooltip title="Editar nome">
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remover participante">
                <IconButton
                  size="small"
                  onClick={() => onRemoveParticipant(participant.id)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </>
          )}
        </Box>

        {/* Games List */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            {participant.games.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, textAlign: "center", py: 2 }}
              >
                Nenhum jogo adicionado. Clique no botão abaixo para adicionar.
              </Typography>
            ) : (
              <Box sx={{ mb: 2 }}>
                {participant.games.map((game, index) => (
                  <Box
                    key={game.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.02)",
                      },
                      borderBottom:
                        index < participant.games.length - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                    }}
                  >
                    {(() => {
                      const duplicate = findDuplicateOf(game.id, game.numbers);
                      return (
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 70, fontWeight: 500 }}
                          >
                            Jogo {index + 1}:
                          </Typography>
                          {duplicate && (
                            <Tooltip title={`Jogo idêntico ao de ${duplicate.participantName}`}>
                              <WarningIcon
                                sx={{
                                  color: "#f59e0b",
                                  fontSize: 20,
                                  mr: 1,
                                  animation: "pulse 2s infinite",
                                  "@keyframes pulse": {
                                    "0%, 100%": { opacity: 1 },
                                    "50%": { opacity: 0.5 },
                                  },
                                }}
                              />
                            </Tooltip>
                          )}
                          <Box display="flex" gap={1} flex={1} flexWrap="wrap">
                            {game.numbers.map((num) => (
                              <LotteryBall
                                key={num}
                                number={num}
                                isHit={true}
                                size={36}
                                lotteryTheme={megaTheme}
                              />
                            ))}
                          </Box>
                          {/* Edit and Delete buttons */}
                          {onUpdateGame && (
                            <Tooltip title="Editar jogo">
                              <IconButton
                                size="small"
                                onClick={() => setEditGameModal(game)}
                                sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Remover jogo">
                            <IconButton
                              size="small"
                              onClick={() => onRemoveGame(participant.id, game.id)}
                              sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      );
                    })()}
                  </Box>
                ))}
              </Box>
            )}

            {/* Add Game Button */}
            {(() => {
              const hasReachedMax = maxGamesPerParticipant !== null && 
                maxGamesPerParticipant !== undefined && 
                participant.games.length >= maxGamesPerParticipant;
              
              return (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAddGameModal(true)}
                    disabled={hasReachedMax}
                    sx={{
                      borderColor: hasReachedMax ? "grey.500" : megaTheme.colors.primary,
                      color: hasReachedMax ? "grey.500" : megaTheme.colors.primary,
                      py: 1.5,
                      borderRadius: 2,
                      "&:hover": !hasReachedMax ? {
                        borderColor: megaTheme.colors.dark,
                        bgcolor: `${megaTheme.colors.primary}10`,
                      } : {},
                    }}
                  >
                    {hasReachedMax 
                      ? `Limite atingido (${maxGamesPerParticipant} jogos)` 
                      : "Adicionar Jogo"}
                  </Button>
                  {minGamesPerParticipant > 1 && participant.games.length < minGamesPerParticipant && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 1, textAlign: "center" }}>
                      ⚠ Mínimo de {minGamesPerParticipant} jogos por participante
                    </Typography>
                  )}
                </>
              );
            })()}
          </Box>
        </Collapse>
      </Paper>

      {/* Add Game Modal */}
      <Dialog
        open={addGameModal}
        onClose={() => setAddGameModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon sx={{ color: megaTheme.colors.primary }} />
            Novo Jogo para {participant.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <NumberGrid onAddGame={handleAddGame} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddGameModal(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Game Modal */}
      <Dialog
        open={!!editGameModal}
        onClose={() => setEditGameModal(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon sx={{ color: megaTheme.colors.primary }} />
            Editar Jogo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Números atuais: {editGameModal?.numbers.map(n => String(n).padStart(2, "0")).join(", ")}
            </Typography>
            <NumberGrid 
              onAddGame={handleEditGame} 
              initialNumbers={editGameModal?.numbers}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditGameModal(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
