"use client";

import { useState, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { importBolao } from "@/lib/bolao-api";
import { BolaoExportData } from "./BolaoJsonExport";
import { getLotteryTheme } from "@/lib/lottery-config";

interface BolaoJsonImportProps {
  onSuccess?: () => void;
}

export function BolaoJsonImport({ onSuccess }: BolaoJsonImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BolaoExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const megaTheme = getLotteryTheme("megasena");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as BolaoExportData;

        // Validate structure
        if (!data.exportVersion || !data.bolao) {
          throw new Error("Arquivo JSON inválido. Formato não reconhecido.");
        }

        if (!data.bolao.name || !data.bolao.participants) {
          throw new Error("Arquivo JSON inválido. Dados do bolão incompletos.");
        }

        setPreview(data);
        setDialogOpen(true);
      } catch (err: any) {
        setError(err.message || "Erro ao ler arquivo JSON");
      }
    };

    reader.onerror = () => {
      setError("Erro ao ler o arquivo");
    };

    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      await importBolao(preview);
      setDialogOpen(false);
      setPreview(null);
      onSuccess?.();
    } catch (err: any) {
      console.error("Error importing bolao:", err);
      setError(err.message || "Erro ao importar bolão");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setPreview(null);
    setError(null);
  };

  const totalGames = preview?.bolao.participants.reduce(
    (sum, p) => sum + p.games.length,
    0
  ) || 0;

  return (
    <>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <Button
        variant="outlined"
        startIcon={<FileUploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          borderColor: "rgba(255,255,255,0.5)",
          color: "white",
          fontWeight: "bold",
          "&:hover": {
            borderColor: "white",
            bgcolor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        Importar JSON
      </Button>

      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <FileUploadIcon sx={{ color: megaTheme.colors.primary }} />
            Importar Bolão
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {preview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {preview.bolao.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {preview.bolao.participants.length} participante
                {preview.bolao.participants.length !== 1 ? "s" : ""} •{" "}
                {totalGames} jogo{totalGames !== 1 ? "s" : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ano: {preview.bolao.year} • R${" "}
                {Number(preview.bolao.pricePerGame).toFixed(2)}/jogo
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exportado em:{" "}
                {new Date(preview.exportedAt).toLocaleString("pt-BR")}
              </Typography>

              <Alert severity="info" sx={{ mt: 2 }}>
                Um novo bolão será criado com os dados importados.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!preview || loading}
            sx={{
              bgcolor: megaTheme.colors.primary,
              "&:hover": { bgcolor: megaTheme.colors.dark },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                Importando...
              </>
            ) : (
              "Importar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
