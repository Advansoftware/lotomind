"use client";

import { useState } from "react";
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
import { LotteryBall } from "./LotteryBall";
import { NumberGrid } from "./NumberGrid";
import { BolaoParticipant, BolaoGame, Bolao } from "@/lib/storage";
import { getLotteryType } from "@/lib/lottery-types";

interface ParticipantSectionProps {
  bolao: Bolao;
  participant: BolaoParticipant;
  allGames: { gameId: string; participantName: string; numbers: number[] }[];
  onAddGame: (participantId: string, numbers: number[]) => void;
  onRemoveGame: (participantId: string, gameId: string) => void;
  onUpdateGame: (participantId: string, gameId: string, numbers: number[]) => void;
  onRemoveParticipant: (participantId: string) => void;
  onUpdateName: (participantId: string, name: string) => void;
  onTogglePaid: (participantId: string) => void;
  pricePerGame: number;
}

export function ParticipantSection({
  bolao,
  participant,
  allGames,
  onAddGame,
  onRemoveGame,
  onUpdateGame,
  onRemoveParticipant,
  onUpdateName,
  onTogglePaid,
  pricePerGame,
}: ParticipantSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(participant.name);
  const [addGameModal, setAddGameModal] = useState(false);
  const [editGameModal, setEditGameModal] = useState<BolaoGame | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const lotteryConfig = getLotteryType(bolao.lotteryType);
  const participantValue = participant.games.length * pricePerGame;

  const findDuplicateOf = (gameId: string, numbers: number[]): { participantName: string } | null => {
    const sortedNumbers = [...numbers].sort((a, b) => a - b).join(",");
    for (const g of allGames) {
      if (g.gameId !== gameId) {
        const gSorted = [...g.numbers].sort((a, b) => a - b).join(",");
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

  const handleAddGame = (numbers: number[]) => {
    onAddGame(participant.id, numbers);
    setAddGameModal(false);
  };

  const handleEditGame = (numbers: number[]) => {
    if (editGameModal) {
      onUpdateGame(participant.id, editGameModal.id, numbers);
      setEditGameModal(null);
    }
  };

  const hasReachedMax =
    bolao.maxGamesPerParticipant !== null &&
    participant.games.length >= bolao.maxGamesPerParticipant;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.02)",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            bgcolor: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <PersonIcon sx={{ color: lotteryConfig.color }} />

          {editing ? (
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              <TextField
                size="small"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                sx={{ flex: 1 }}
              />
              <IconButton size="small" onClick={handleSaveName} color="success">
                <CheckIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setEditing(false)} color="error">
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Typography variant="h6" fontWeight={600} flex={1}>
                {participant.name}
              </Typography>

              <Tooltip title={participant.paid ? "Clique para defirnir como PENDENTE" : "Clique para confirmar PAGAMENTO"}>
                <Chip
                  icon={<PaidIcon />}
                  label={participant.paid ? "Pago" : "Não Pago"}
                  size="small"
                  onClick={() => onTogglePaid(participant.id)}
                  sx={{
                    bgcolor: participant.paid ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.1)",
                    color: participant.paid ? "#22c55e" : "#ef4444",
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: participant.paid ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: participant.paid ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.2)",
                      transform: "scale(1.05)",
                    },
                  }}
                />
              </Tooltip>

              <Typography variant="body2" color="text.secondary">
                R$ {participantValue.toFixed(2)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
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
                  onClick={() => setConfirmDeleteModal(true)}
                  sx={{ color: "#ef4444" }}
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

        {/* Games list */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            {participant.games.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                Nenhum jogo adicionado. Clique no botão abaixo para adicionar.
              </Typography>
            ) : (
              <Box mb={2}>
                {participant.games.map((game, index) => {
                  const duplicate = findDuplicateOf(game.id, game.numbers);
                  return (
                    <Box
                      key={game.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        py: 1.5,
                        px: 1,
                        borderRadius: 2,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                        borderBottom:
                          index < participant.games.length - 1
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "none",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ width: 70, fontWeight: 500 }}>
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
                      <Box display="flex" gap={0.75} flex={1} flexWrap="wrap">
                        {game.numbers.map((num) => (
                          <LotteryBall key={num} number={num} size={32} color={lotteryConfig.color} />
                        ))}
                      </Box>
                      <Tooltip title="Editar jogo">
                        <IconButton size="small" onClick={() => setEditGameModal(game)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover jogo">
                        <IconButton
                          size="small"
                          onClick={() => onRemoveGame(participant.id, game.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Add game button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddGameModal(true)}
              disabled={hasReachedMax}
              sx={{
                borderColor: hasReachedMax ? "grey.500" : lotteryConfig.color,
                color: hasReachedMax ? "grey.500" : lotteryConfig.color,
                py: 1.5,
                borderRadius: 2,
                "&:hover": {
                  borderColor: lotteryConfig.color,
                  bgcolor: `${lotteryConfig.color}15`,
                },
              }}
            >
              {hasReachedMax
                ? `Limite atingido (${bolao.maxGamesPerParticipant} jogos)`
                : "Adicionar Jogo"}
            </Button>

            {bolao.minGamesPerParticipant > 1 &&
              participant.games.length < bolao.minGamesPerParticipant && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, textAlign: "center", display: "block" }}>
                  ⚠ Mínimo de {bolao.minGamesPerParticipant} jogos por participante
                </Typography>
              )}
          </Box>
        </Collapse>
      </Paper>

      {/* Add Game Modal */}
      <Dialog open={addGameModal} onClose={() => setAddGameModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={24}>{lotteryConfig.icon}</Typography>
            Novo Jogo para {participant.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <NumberGrid
            onConfirm={handleAddGame}
            onCancel={() => setAddGameModal(false)}
            maxNumbers={lotteryConfig.numbersCount}
            maxNumber={lotteryConfig.maxNumber}
            themeColor={lotteryConfig.color}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Game Modal */}
      <Dialog open={!!editGameModal} onClose={() => setEditGameModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon sx={{ color: lotteryConfig.color }} />
            Editar Jogo
          </Box>
        </DialogTitle>
        <DialogContent>
          <NumberGrid
            onConfirm={handleEditGame}
            onCancel={() => setEditGameModal(null)}
            initialNumbers={editGameModal?.numbers}
            maxNumbers={lotteryConfig.numbersCount}
            maxNumber={lotteryConfig.maxNumber}
            themeColor={lotteryConfig.color}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Participant Modal */}
      <Dialog open={confirmDeleteModal} onClose={() => setConfirmDeleteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon sx={{ color: "#ef4444" }} />
            Remover Participante
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover <strong>{participant.name}</strong> do bolão?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação irá excluir todos os {participant.games.length} jogo(s) deste participante.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDeleteModal(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onRemoveParticipant(participant.id);
              setConfirmDeleteModal(false);
            }}
            variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
