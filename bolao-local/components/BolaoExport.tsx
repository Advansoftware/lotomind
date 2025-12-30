"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, Snackbar, Alert, Tooltip } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Bolao,
  getTotalGames,
  getTotalValue,
  getTotalPaid,
  getParticipantValue,
} from "@/lib/storage";
import { getLotteryType } from "@/lib/lottery-types";

interface BolaoExportProps {
  bolao: Bolao;
}

export function BolaoExport({ bolao }: BolaoExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateWhatsAppMessage = (): string => {
    const lotteryConfig = getLotteryType(bolao.lotteryType);
    const totalGames = getTotalGames(bolao);
    const totalValue = getTotalValue(bolao);
    const totalPaid = getTotalPaid(bolao);
    const pricePerGame = Number(bolao.pricePerGame) || 5;

    let message = `*${bolao.name.toUpperCase()}*\n`;
    message += `${lotteryConfig.name} ${bolao.year}\n`;
    message += `----------------------------\n\n`;
    
    message += `Participantes: *${bolao.participants.length}*\n`;
    message += `Jogos: *${totalGames}*\n`;
    message += `Valor/jogo: R$ ${pricePerGame.toFixed(2)}\n\n`;

    message += `TOTAL: *R$ ${totalValue.toFixed(2)}*\n`;
    message += `PAGO: *R$ ${totalPaid.toFixed(2)}*\n`;
    if (totalPaid < totalValue) {
      message += `FALTA: *R$ ${(totalValue - totalPaid).toFixed(2)}*\n`;
    }
    message += `\n----------------------------\n\n`;

    bolao.participants.forEach((participant, pIndex) => {
      const participantValue = getParticipantValue(bolao, participant);
      const paidStatus = participant.paid ? "[PAGO]" : "[PENDENTE]";
      
      message += `*${participant.name}* ${paidStatus}\n`;
      message += `   R$ ${participantValue.toFixed(2)} | ${participant.games.length} jogo(s)\n`;
      
      participant.games.forEach((game, gIndex) => {
        const numbers = game.numbers.map(n => String(n).padStart(2, "0")).join(" - ");
        message += `   Jogo ${gIndex + 1}: ${numbers}\n`;
      });
      
      if (pIndex < bolao.participants.length - 1) {
        message += `\n`;
      }
    });

    message += `\n----------------------------\n`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bolaofacil.com.br";
    message += `_Gerado por Bolão Fácil_ 🍀\n`;
    message += `Crie o seu grátis em: ${siteUrl}`;

    return message;
  };

  const handleWhatsAppExport = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bolao),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o PDF");
      }

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "application/pdf" });
      
      // Dynamic import to avoid SSR issues
      const { saveAs } = (await import("file-saver"));
      
      const safeName = (bolao.name || "bolao")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `bolao_${safeName}_${dateStr}.pdf`;

      // Use file-saver (it's the industry standard for downloads)
      saveAs(blob, filename);

    } catch (err) {
      console.error(err);
      setError("Erro ao gerar o arquivo PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" gap={2}>
      <Tooltip title="Gera um arquivo PDF com todos os jogos para impressão ou envio">
        <span>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={generatePDF}
            disabled={bolao.participants.length === 0 || loading}
            sx={{
              bgcolor: "#e53935",
              color: "#ffffff",
              "&:hover": { bgcolor: "#c62828" },
              fontWeight: "bold",
              px: 3,
            }}
          >
            {loading ? "Gerando..." : "Exportar PDF"}
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Envia um resumo organizado dos jogos e participantes para o WhatsApp">
        <span>
          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsAppExport}
            disabled={bolao.participants.length === 0}
            sx={{
              bgcolor: "#25D366",
              color: "#ffffff",
              "&:hover": { bgcolor: "#128C7E" },
              fontWeight: "bold",
              px: 3,
            }}
          >
            WhatsApp
          </Button>
        </span>
      </Tooltip>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
