"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CelebrationIcon from "@mui/icons-material/Celebration";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { ParticipantSection } from "@/components/ParticipantSection";
import { BolaoExport } from "@/components/BolaoExport";
import {
  getBolao,
  addParticipant,
  addGame,
  deleteGame,
  updateGame,
  deleteParticipant,
  updateParticipant,
  updateBolao,
  toggleParticipantPaid,
  getParticipantValue,
  getTotalValue,
  getTotalPaid,
  Bolao,
  getTotalGames,
} from "@/lib/bolao-api";
import { getLotteryTheme } from "@/lib/lottery-config";

export default function BolaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bolaoId = parseInt(params.id as string);
  
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  
  const megaTheme = getLotteryTheme("megasena");

  const loadBolao = useCallback(async () => {
    try {
      setError(null);
      const data = await getBolao(bolaoId);
      setBolao(data);
      setEditName(data.name);
    } catch (err: any) {
      console.error("Error loading bolao:", err);
      setError("Erro ao carregar bolão");
    } finally {
      setLoading(false);
    }
  }, [bolaoId]);

  useEffect(() => {
    loadBolao();
  }, [loadBolao]);

  const handleSaveName = async () => {
    if (editName.trim() && bolao) {
      try {
        await updateBolao(bolao.id, { name: editName.trim() });
        setEditingName(false);
        await loadBolao();
      } catch (err) {
        console.error("Error updating name:", err);
      }
    }
  };

  const handleAddParticipant = async () => {
    if (newParticipantName.trim() && bolao) {
      try {
        await addParticipant(bolao.id, newParticipantName.trim());
        setNewParticipantName("");
        setDialogOpen(false);
        await loadBolao();
      } catch (err) {
        console.error("Error adding participant:", err);
      }
    }
  };

  const handleAddGame = async (participantId: number, numbers: number[]) => {
    try {
      await addGame(participantId, numbers);
      await loadBolao();
    } catch (err) {
      console.error("Error adding game:", err);
    }
  };

  const handleRemoveGame = async (participantId: number, gameId: number) => {
    try {
      await deleteGame(gameId);
      await loadBolao();
    } catch (err) {
      console.error("Error removing game:", err);
    }
  };

  const handleUpdateGame = async (gameId: number, numbers: number[]) => {
    try {
      await updateGame(gameId, numbers);
      await loadBolao();
    } catch (err) {
      console.error("Error updating game:", err);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (confirm("Remover este participante e todos os seus jogos?")) {
      try {
        await deleteParticipant(participantId);
        await loadBolao();
      } catch (err) {
        console.error("Error removing participant:", err);
      }
    }
  };

  const handleUpdateParticipantName = async (participantId: number, name: string) => {
    try {
      await updateParticipant(participantId, { name });
      await loadBolao();
    } catch (err) {
      console.error("Error updating participant:", err);
    }
  };

  const handleTogglePaid = async (participantId: number) => {
    try {
      await toggleParticipantPaid(participantId);
      await loadBolao();
    } catch (err) {
      console.error("Error toggling paid:", err);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress sx={{ color: megaTheme.colors.primary }} />
      </Box>
    );
  }

  if (!bolao) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Bolão não encontrado"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/bolao")}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </Container>
    );
  }

  const totalGames = getTotalGames(bolao);
  const totalValue = getTotalValue(bolao);
  const totalPaid = getTotalPaid(bolao);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: megaTheme.colors.gradient,
          color: "white",
          pt: { xs: 3, md: 5 },
          pb: { xs: 5, md: 7 },
          borderRadius: { xs: "0 0 24px 24px", md: "0 0 40px 40px" },
          boxShadow: `0 10px 30px ${megaTheme.colors.dark}40`,
        }}
      >
        <Container maxWidth="xl">
          {/* Breadcrumb */}
          <Breadcrumbs
            sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { color: "rgba(255,255,255,0.5)" } }}
          >
            <Link
              href="/bolao"
              underline="hover"
              sx={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <CelebrationIcon fontSize="small" />
              Bolões
            </Link>
            <Typography color="white">{bolao.name}</Typography>
          </Breadcrumbs>

          {/* Title */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {editingName ? (
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                <TextField
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditName(bolao.name);
                      setEditingName(false);
                    }
                  }}
                  sx={{
                    flex: 1,
                    maxWidth: 400,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255,255,255,0.1)",
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    },
                    "& input": { color: "white", fontWeight: "bold", fontSize: "1.5rem" },
                  }}
                />
                <IconButton onClick={handleSaveName} sx={{ color: "white" }}>
                  <CheckIcon />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setEditName(bolao.name);
                    setEditingName(false);
                  }}
                  sx={{ color: "white" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <>
                <Typography variant="h4" fontWeight="800">
                  🎉 {bolao.name}
                </Typography>
                <IconButton onClick={() => setEditingName(true)} sx={{ color: "white" }}>
                  <EditIcon />
                </IconButton>
              </>
            )}
          </Box>

          {/* Stats */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {bolao.participants.length} participante
              {bolao.participants.length !== 1 ? "s" : ""} • {totalGames} jogo
              {totalGames !== 1 ? "s" : ""} • R$ {Number(bolao.pricePerGame).toFixed(2)}/jogo
            </Typography>
            <Box display="flex" gap={3} mt={1} flexWrap="wrap">
              <Typography variant="h6" fontWeight="bold">
                💰 Total: R$ {totalValue.toFixed(2)}
              </Typography>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{ color: totalPaid >= totalValue ? "#22c55e" : "#fbbf24" }}
              >
                ✅ Pago: R$ {totalPaid.toFixed(2)}
              </Typography>
              {totalPaid < totalValue && (
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{ color: "#fca5a5" }}
                >
                  ❌ Falta: R$ {(totalValue - totalPaid).toFixed(2)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: "white",
                color: megaTheme.colors.dark,
                fontWeight: "bold",
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
              }}
            >
              Adicionar Participante
            </Button>
            <BolaoExport bolao={bolao} />
          </Box>
        </Container>
      </Box>

      {/* Participants */}
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {bolao.participants.length === 0 ? (
          <Box
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 4,
              bgcolor: "background.paper",
              border: "1px dashed rgba(255,255,255,0.2)",
            }}
          >
            <PersonAddIcon
              sx={{
                fontSize: 60,
                color: megaTheme.colors.primary,
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum participante
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Adicione participantes ao seu bolão para começar a registrar os jogos.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderColor: megaTheme.colors.primary,
                color: megaTheme.colors.primary,
              }}
            >
              Adicionar Participante
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {(() => {
              // Build allGames list for duplicate detection
              const allGames = bolao.participants.flatMap((p) =>
                p.games.map((g) => ({
                  gameId: g.id,
                  participantId: p.id,
                  participantName: p.name,
                  numbers: g.numbers,
                }))
              );
              
              return bolao.participants.map((participant) => (
                <ParticipantSection
                  key={participant.id}
                  participant={participant}
                  participantValue={getParticipantValue(bolao, participant)}
                  allGames={allGames}
                  minGamesPerParticipant={bolao.minGamesPerParticipant}
                  maxGamesPerParticipant={bolao.maxGamesPerParticipant}
                  onAddGame={handleAddGame}
                  onRemoveGame={handleRemoveGame}
                  onRemoveParticipant={handleRemoveParticipant}
                  onUpdateName={handleUpdateParticipantName}
                  onTogglePaid={handleTogglePaid}
                  onUpdateGame={handleUpdateGame}
                />
              ));
            })()}
          </Box>
        )}
      </Container>

      {/* Add Participant Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAddIcon sx={{ color: megaTheme.colors.primary }} />
            Adicionar Participante
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome do Participante"
            placeholder="Ex: João Silva"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAddParticipant}
            disabled={!newParticipantName.trim()}
            sx={{
              bgcolor: megaTheme.colors.primary,
              "&:hover": { bgcolor: megaTheme.colors.dark },
            }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
