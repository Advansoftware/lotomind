"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import { ParticipantSection } from "@/components/ParticipantSection";
import { BolaoExport } from "@/components/BolaoExport";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import {
  getBolaos,
  getBolao,
  createBolao,
  updateBolao,
  deleteBolao,
  addParticipant,
  updateParticipant,
  toggleParticipantPaid,
  deleteParticipant,
  addGame,
  updateGame,
  deleteGame,
  getTotalGames,
  getTotalValue,
  getTotalPaid,
  Bolao,
} from "@/lib/storage";
import { LOTTERY_TYPES, getLotteryType } from "@/lib/lottery-types";
import Link from "next/link";

export default function GerenciadorPage() {
  const [bolaos, setBolaos] = useState<Bolao[]>([]);
  const [selectedBolao, setSelectedBolao] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLotteryType, setNewLotteryType] = useState("mega-sena");
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newPrice, setNewPrice] = useState(5);
  const [newMinGames, setNewMinGames] = useState(1);
  const [newMaxGames, setNewMaxGames] = useState<number | "">(10);

  // Add participant dialog
  const [participantOpen, setParticipantOpen] = useState(false);
  const [participantName, setParticipantName] = useState("");

  // Edit bolão name
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  // Delete bolão modal
  const [deleteBolaoModal, setDeleteBolaoModal] = useState<string | null>(null);
  const [bolaoToDelete, setBolaoToDelete] = useState<Bolao | null>(null);

  const loadBolaos = useCallback(() => {
    setBolaos(getBolaos());
    setLoading(false);
  }, []);

  const loadSelectedBolao = useCallback(() => {
    if (selectedBolao) {
      const updated = getBolao(selectedBolao.id);
      setSelectedBolao(updated);
    }
  }, [selectedBolao]);

  // Go back to list and refresh data
  const goBackToList = useCallback(() => {
    setSelectedBolao(null);
    setBolaos(getBolaos());
  }, []);

  useEffect(() => {
    loadBolaos();
  }, [loadBolaos]);

  // Handlers
  const handleCreate = () => {
    if (newName.trim() && newYear && newPrice > 0) {
      const bolao = createBolao(
        newName.trim(),
        newLotteryType,
        newYear,
        newPrice,
        newMinGames,
        newMaxGames || null
      );
      setBolaos(getBolaos());
      setNewName("");
      setNewLotteryType("mega-sena");
      setNewYear(new Date().getFullYear());
      setNewPrice(5);
      setNewMinGames(1);
      setNewMaxGames(10);
      setCreateOpen(false);
      setSelectedBolao(bolao);
    }
  };

  const handleDelete = (bolao: Bolao, e: React.MouseEvent) => {
    e.stopPropagation();
    setBolaoToDelete(bolao);
    setDeleteBolaoModal(bolao.id);
  };

  const confirmDeleteBolao = () => {
    if (deleteBolaoModal) {
      deleteBolao(deleteBolaoModal);
      loadBolaos();
      if (selectedBolao?.id === deleteBolaoModal) {
        setSelectedBolao(null);
      }
      setDeleteBolaoModal(null);
      setBolaoToDelete(null);
    }
  };

  const handleSaveName = () => {
    if (selectedBolao && editName.trim()) {
      updateBolao(selectedBolao.id, { name: editName.trim() });
      // Refresh both selected bolão and list
      const updated = getBolao(selectedBolao.id);
      setSelectedBolao(updated);
      setBolaos(getBolaos());
      setEditingName(false);
    }
  };

  const handleAddParticipant = () => {
    if (selectedBolao && participantName.trim()) {
      addParticipant(selectedBolao.id, participantName.trim());
      loadSelectedBolao();
      setParticipantName("");
      setParticipantOpen(false);
    }
  };

  const handleAddGame = (participantId: string, numbers: number[]) => {
    if (selectedBolao) {
      addGame(selectedBolao.id, participantId, numbers);
      loadSelectedBolao();
    }
  };

  const handleUpdateGame = (participantId: string, gameId: string, numbers: number[]) => {
    if (selectedBolao) {
      updateGame(selectedBolao.id, participantId, gameId, numbers);
      loadSelectedBolao();
    }
  };

  const handleRemoveGame = (participantId: string, gameId: string) => {
    if (selectedBolao) {
      deleteGame(selectedBolao.id, participantId, gameId);
      loadSelectedBolao();
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (selectedBolao) {
      deleteParticipant(selectedBolao.id, participantId);
      // Force refresh the selected bolão from localStorage
      const updated = getBolao(selectedBolao.id);
      setSelectedBolao(updated);
    }
  };

  const handleUpdateParticipantName = (participantId: string, name: string) => {
    if (selectedBolao) {
      updateParticipant(selectedBolao.id, participantId, { name });
      loadSelectedBolao();
    }
  };

  const handleTogglePaid = (participantId: string) => {
    if (selectedBolao) {
      toggleParticipantPaid(selectedBolao.id, participantId);
      loadSelectedBolao();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0a0a0f">
        <CircularProgress sx={{ color: "#22c55e" }} />
      </Box>
    );
  }

  // Detail view
  if (selectedBolao) {
    const lotteryConfig = getLotteryType(selectedBolao.lotteryType);
    const totalGames = getTotalGames(selectedBolao);
    const totalValue = getTotalValue(selectedBolao);
    const totalPaid = getTotalPaid(selectedBolao);

    const allGames = selectedBolao.participants.flatMap((p) =>
      p.games.map((g) => ({
        gameId: g.id,
        participantName: p.name,
        numbers: g.numbers,
      }))
    );

    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0f", py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${lotteryConfig.color} 0%, ${lotteryConfig.color}99 100%)`,
              borderRadius: 4,
              p: 4,
              mb: 4,
              color: "white",
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={goBackToList}
                sx={{ color: "white" }}
              >
                Voltar
              </Button>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Button startIcon={<HomeIcon />} sx={{ color: "white" }}>
                  Início
                </Button>
              </Link>
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography fontSize={40}>{lotteryConfig.icon}</Typography>
              {editingName ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    size="small"
                    sx={{
                      "& .MuiInputBase-input": { color: "white", fontSize: 28 },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
                    }}
                  />
                  <IconButton onClick={handleSaveName} sx={{ color: "white" }}>
                    <CheckIcon />
                  </IconButton>
                  <IconButton onClick={() => setEditingName(false)} sx={{ color: "white" }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {selectedBolao.name}
                    </Typography>
                    <Chip
                      label={lotteryConfig.name}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                        mt: 0.5,
                      }}
                    />
                  </Box>
                  <IconButton
                    onClick={() => {
                      setEditName(selectedBolao.name);
                      setEditingName(true);
                    }}
                    sx={{ color: "white" }}
                  >
                    <EditIcon />
                  </IconButton>
                </>
              )}
            </Box>

            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
              {selectedBolao.participants.length} participantes • {totalGames} jogos • R${" "}
              {Number(selectedBolao.pricePerGame).toFixed(2)}/jogo
            </Typography>

            <Box display="flex" gap={3} flexWrap="wrap">
              <Typography variant="h6" fontWeight="bold">
                💰 Total: R$ {totalValue.toFixed(2)}
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: totalPaid >= totalValue ? "#a7f3d0" : "#fef08a" }}
              >
                ✅ Pago: R$ {totalPaid.toFixed(2)}
              </Typography>
              {totalPaid < totalValue && (
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#fecaca" }}>
                  ❌ Falta: R$ {(totalValue - totalPaid).toFixed(2)}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setParticipantOpen(true)}
                sx={{ bgcolor: "white", color: lotteryConfig.color, "&:hover": { bgcolor: "#f0f0f0" } }}
              >
                Adicionar Participante
              </Button>
              <BolaoExport bolao={selectedBolao} />
            </Box>
          </Box>

          {/* Ad */}
          <Box mb={3}>
            <AdPlaceholder height={90} label="Anúncio" />
          </Box>

          {/* Participants */}
          {selectedBolao.participants.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography color="text.secondary">
                Nenhum participante ainda. Clique em Adicionar Participante para começar.
              </Typography>
            </Paper>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {selectedBolao.participants.map((participant) => (
                <ParticipantSection
                  key={participant.id}
                  bolao={selectedBolao}
                  participant={participant}
                  allGames={allGames}
                  pricePerGame={Number(selectedBolao.pricePerGame)}
                  onAddGame={handleAddGame}
                  onUpdateGame={handleUpdateGame}
                  onRemoveGame={handleRemoveGame}
                  onRemoveParticipant={handleRemoveParticipant}
                  onUpdateName={handleUpdateParticipantName}
                  onTogglePaid={handleTogglePaid}
                />
              ))}
            </Box>
          )}
        </Container>

        {/* Add Participant Dialog */}
        <Dialog open={participantOpen} onClose={() => setParticipantOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonAddIcon sx={{ color: "#22c55e" }} />
              Novo Participante
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Nome do Participante"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setParticipantOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleAddParticipant}
              disabled={!participantName.trim()}
              sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
            >
              Adicionar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // List view
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0f", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: 4,
            p: 4,
            mb: 4,
            color: "white",
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button startIcon={<HomeIcon />} sx={{ color: "white" }}>
                Início
              </Button>
            </Link>
          </Box>
          <Typography variant="h4" fontWeight="bold" mb={1}>
            🎰 Meus Bolões
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>
            Gerencie todos os seus bolões em um só lugar
          </Typography>
        </Box>

        {/* Create button */}
        <Box display="flex" justifyContent="center" mb={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: "#22c55e",
              "&:hover": { bgcolor: "#16a34a" },
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              borderRadius: 3,
            }}
          >
            Criar Novo Bolão
          </Button>
        </Box>

        {/* Ad */}
        <Box mb={4}>
          <AdPlaceholder height={90} label="Anúncio" />
        </Box>

        {/* Bolão list */}
        {bolaos.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography color="text.secondary">
              Nenhum bolão criado ainda. Clique no botão acima para criar o primeiro!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {bolaos.map((bolao) => {
              const lotteryConfig = getLotteryType(bolao.lotteryType);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bolao.id}>
                  <Paper
                    onClick={() => setSelectedBolao(bolao)}
                    sx={{
                      p: 3,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.06)",
                        borderColor: `${lotteryConfig.color}50`,
                        transform: "translateY(-4px)",
                      },
                      position: "relative",
                      borderRadius: 3,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Typography fontSize={28}>{lotteryConfig.icon}</Typography>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {bolao.name}
                        </Typography>
                        <Chip
                          label={lotteryConfig.name}
                          size="small"
                          sx={{
                            bgcolor: `${lotteryConfig.color}20`,
                            color: lotteryConfig.color,
                            fontSize: 11,
                          }}
                        />
                      </Box>
                      <Tooltip title="Excluir bolão">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(bolao, e)}
                          sx={{
                            color: "#ef4444",
                            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {bolao.participants.length} participantes • {getTotalGames(bolao)} jogos
                    </Typography>
                    <Typography variant="body2" sx={{ color: lotteryConfig.color }} fontWeight="bold">
                      R$ {getTotalValue(bolao).toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon sx={{ color: "#22c55e" }} />
            Novo Bolão
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nome do Bolão *"
              placeholder="Ex: Bolão do Escritório"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Loteria *</InputLabel>
              <Select
                value={newLotteryType}
                label="Tipo de Loteria *"
                onChange={(e) => setNewLotteryType(e.target.value)}
              >
                {LOTTERY_TYPES.map((lottery) => (
                  <MenuItem key={lottery.id} value={lottery.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{lottery.icon}</span>
                      <span>{lottery.name}</span>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({lottery.numbersCount} números, 1-{lottery.maxNumber})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Ano"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value) || new Date().getFullYear())}
              inputProps={{ min: 2020, max: 2100 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Valor por Jogo *"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.5 }}
            />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                type="number"
                label="Mín. jogos/pessoa"
                value={newMinGames}
                onChange={(e) => setNewMinGames(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Máx. jogos/pessoa"
                value={newMaxGames}
                onChange={(e) => setNewMaxGames(e.target.value ? parseInt(e.target.value) : "")}
                helperText="Vazio = sem limite"
                inputProps={{ min: 1, max: 100 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || newPrice <= 0}
            sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
          >
            Criar Bolão
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Bolão Confirmation Modal */}
      <Dialog open={!!deleteBolaoModal} onClose={() => { setDeleteBolaoModal(null); setBolaoToDelete(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon sx={{ color: "#ef4444" }} />
            Excluir Bolão
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o bolão <strong>{bolaoToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação irá excluir permanentemente todos os {bolaoToDelete?.participants.length || 0} participantes e seus jogos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setDeleteBolaoModal(null); setBolaoToDelete(null); }} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteBolao}
            variant="contained"
            sx={{ bgcolor: "#ef4444", color: "#ffffff", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
