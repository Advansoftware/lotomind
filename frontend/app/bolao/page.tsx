"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CelebrationIcon from "@mui/icons-material/Celebration";
import DeleteIcon from "@mui/icons-material/Delete";
import { BolaoCard } from "@/components/BolaoCard";
import { getBolaos, createBolao, deleteBolao, Bolao } from "@/lib/bolao-api";
import { getLotteryTheme } from "@/lib/lottery-config";

export default function BolaoPage() {
  const [bolaos, setBolaos] = useState<Bolao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newPrice, setNewPrice] = useState(6);
  const [newMinGames, setNewMinGames] = useState(1);
  const [newMaxGames, setNewMaxGames] = useState<number | "">(10);
  const [creating, setCreating] = useState(false);
  const megaTheme = getLotteryTheme("megasena");

  const loadBolaos = async () => {
    try {
      setError(null);
      const data = await getBolaos();
      setBolaos(data);
    } catch (err: any) {
      console.error("Error loading bolaos:", err);
      setError("Erro ao carregar bolões. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBolaos();
  }, []);

  const handleCreate = async () => {
    if (newName.trim() && newYear && newPrice > 0) {
      try {
        setCreating(true);
        await createBolao(
          newName.trim(), 
          newYear, 
          newPrice,
          newMinGames,
          newMaxGames || undefined
        );
        setNewName("");
        setNewYear(new Date().getFullYear());
        setNewPrice(6);
        setNewMinGames(1);
        setNewMaxGames(10);
        setDialogOpen(false);
        await loadBolaos();
      } catch (err: any) {
        console.error("Error creating bolao:", err);
        setError("Erro ao criar bolão");
      } finally {
        setCreating(false);
      }
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este bolão?")) {
      try {
        await deleteBolao(id);
        await loadBolaos();
      } catch (err: any) {
        console.error("Error deleting bolao:", err);
        setError("Erro ao excluir bolão");
      }
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: megaTheme.colors.gradient,
          color: "white",
          pt: { xs: 4, md: 6 },
          pb: { xs: 6, md: 8 },
          borderRadius: { xs: "0 0 24px 24px", md: "0 0 40px 40px" },
          boxShadow: `0 10px 30px ${megaTheme.colors.dark}40`,
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CelebrationIcon sx={{ fontSize: 40 }} />
            <Typography variant="h3" fontWeight="800">
              Mega da Virada
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mb: 3 }}>
            Gerencie seus bolões da Mega da Virada. Adicione participantes, 
            registre os jogos e exporte um PDF formatado para compartilhar.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: "white",
              color: megaTheme.colors.dark,
              fontWeight: "bold",
              px: 4,
              py: 1.5,
              borderRadius: 3,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.9)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Novo Bolão
          </Button>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {bolaos.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 4,
              bgcolor: "background.paper",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <CelebrationIcon
              sx={{
                fontSize: 80,
                color: megaTheme.colors.primary,
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Nenhum bolão criado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Crie seu primeiro bolão clicando no botão acima!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {bolaos.map((bolao) => (
              <Grid item xs={12} sm={6} md={4} key={bolao.id}>
                <Box position="relative">
                  <BolaoCard bolao={bolao} />
                  <IconButton
                    onClick={(e) => handleDelete(bolao.id, e)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "error.main",
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                      },
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CelebrationIcon sx={{ color: megaTheme.colors.primary }} />
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
              helperText="Identificação do seu bolão"
            />
            <TextField
              fullWidth
              type="number"
              label="Ano *"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value) || new Date().getFullYear())}
              helperText="Ano da Mega da Virada"
              inputProps={{ min: 2020, max: 2100 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Valor por Jogo *"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
              helperText="Preço de cada jogo (6 números)"
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
                helperText="Mínimo de jogos"
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Máx. jogos/pessoa"
                value={newMaxGames}
                onChange={(e) => setNewMaxGames(e.target.value ? parseInt(e.target.value) : "")}
                helperText="Máximo (vazio = sem limite)"
                inputProps={{ min: 1, max: 100 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || !newYear || newPrice <= 0 || creating}
            sx={{
              bgcolor: megaTheme.colors.primary,
              "&:hover": { bgcolor: megaTheme.colors.dark },
            }}
          >
            {creating ? "Criando..." : "Criar Bolão"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
