"use client";

import { Button } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { Bolao, getTotalValue, getTotalPaid, getParticipantValue } from "@/lib/bolao-api";
import jsPDF from "jspdf";

interface BolaoExportProps {
  bolao: Bolao;
}

export function BolaoExport({ bolao }: BolaoExportProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Helper for centered text
    const centerText = (text: string, fontSize: number, yPos: number) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, yPos);
    };

    // Calculate totals
    const totalGames = bolao.participants.reduce((sum, p) => sum + p.games.length, 0);
    const totalValue = getTotalValue(bolao);
    const totalPaid = getTotalPaid(bolao);
    const pricePerGame = Number(bolao.pricePerGame) || 6;
    const year = bolao.year || new Date().getFullYear();

    // Header
    doc.setFillColor(32, 152, 105); // Mega-Sena green
    doc.rect(0, 0, pageWidth, 50, "F");
    
    doc.setTextColor(255, 255, 255);
    // Use the bolão's own name as the main title
    centerText(bolao.name.toUpperCase(), 18, 15);
    
    doc.setFontSize(14);
    centerText(`MEGA DA VIRADA ${year}`, 14, 28);

    doc.setFontSize(10);
    centerText(`${bolao.participants.length} participantes • ${totalGames} jogos • R$ ${pricePerGame.toFixed(2)}/jogo`, 10, 38);
    
    // Payment summary
    doc.setFontSize(9);
    const paymentSummary = `Total: R$ ${totalValue.toFixed(2)} | Pago: R$ ${totalPaid.toFixed(2)} | Falta: R$ ${(totalValue - totalPaid).toFixed(2)}`;
    centerText(paymentSummary, 9, 47);

    // PREVIEW BANNER - Important notice that this is for confirmation
    y = 56;
    doc.setFillColor(255, 193, 7); // Amber/Yellow warning color
    doc.rect(margin, y, pageWidth - 2 * margin, 14, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    centerText("⚠ PRÉ-VISUALIZAÇÃO - CONFERIR DADOS ANTES DE CONFIRMAR O BOLÃO ⚠", 10, y + 9);
    doc.setFont("helvetica", "normal");

    y = 78;
    doc.setTextColor(0, 0, 0);

    // Participants
    bolao.participants.forEach((participant) => {
      // Check if we need a new page
      const estimatedHeight = 25 + participant.games.length * 12;
      if (y + estimatedHeight > 280) {
        doc.addPage();
        y = 20;
      }

      const participantValue = getParticipantValue(bolao, participant);
      const paidStatus = participant.paid ? "✓ PAGO" : "✗ PENDENTE";
      const paidColor = participant.paid ? [34, 197, 94] : [239, 68, 68]; // green or red

      // Participant header with background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 14, 2, 2, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(participant.name.toUpperCase(), margin + 5, y + 4);
      
      // Games count
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${participant.games.length} jogo${participant.games.length !== 1 ? "s" : ""} - R$ ${participantValue.toFixed(2)}`, margin + 80, y + 4);
      
      // Payment status
      doc.setFont("helvetica", "bold");
      doc.setTextColor(paidColor[0], paidColor[1], paidColor[2]);
      doc.text(paidStatus, pageWidth - margin - 30, y + 4);
      
      y += 18;
      doc.setFont("helvetica", "normal");

      // Games
      participant.games.forEach((game, gIndex) => {
        if (y > 245) {
          doc.addPage();
          y = 20;
        }

        // Format numbers as circles representation
        const numbersStr = game.numbers.map(n => String(n).padStart(2, "0")).join("   ");
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Jogo ${gIndex + 1}:`, margin + 8, y);
        
        doc.setTextColor(32, 152, 105); // Green for numbers
        doc.setFont("helvetica", "bold");
        doc.text(numbersStr, margin + 35, y);
        doc.setFont("helvetica", "normal");
        
        y += 10;
      });

      y += 8; // Space between participants
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const dateStr = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Gerado em ${dateStr} • LotoMind Analytics • Página ${i} de ${totalPages}`, margin, 290);
    }

    // Generate safe filename
    const safeName = (bolao.name || "bolao")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "_") // Replace special chars with underscore
      .replace(/^_+|_+$/g, ""); // Trim underscores
    
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `bolao_${safeName}_${dateStr}.pdf`;
    
    // Save PDF with explicit filename
    doc.save(fileName);
  };

  return (
    <Button
      variant="contained"
      startIcon={<PictureAsPdfIcon />}
      onClick={generatePDF}
      disabled={bolao.participants.length === 0}
      sx={{
        bgcolor: "#e53935",
        "&:hover": { bgcolor: "#c62828" },
        fontWeight: "bold",
        px: 3,
      }}
    >
      Exportar PDF
    </Button>
  );
}
