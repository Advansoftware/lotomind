import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { Bolao, BolaoParticipant, BolaoGame } from "@/lib/storage"; // interfaces only
import { LOTTERY_TYPES } from "@/lib/lottery-types";

// Helper to get lottery config without importing full storage lib logic which might depend on localStorage
const getLotteryConfig = (typeId: string) => {
  return LOTTERY_TYPES.find(t => t.id === typeId) || LOTTERY_TYPES[0];
};

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [34, 197, 94];
}

export async function POST(req: NextRequest) {
  try {
    const bolao = await req.json() as Bolao;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 0;

    const lotteryConfig = getLotteryConfig(bolao.lotteryType);
    const themeColor = hexToRgb(lotteryConfig.color);

    const centerText = (text: string, fontSize: number, yPos: number) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, yPos);
    };

    // Calculate totals helper
    const getTotalGames = (b: Bolao) => b.participants.reduce((sum, p) => sum + p.games.length, 0);
    const getParticipantValue = (b: Bolao, p: BolaoParticipant) => p.games.length * b.pricePerGame;
    const getTotalValue = (b: Bolao) => b.participants.reduce((sum, p) => sum + getParticipantValue(b, p), 0);
    const getTotalPaid = (b: Bolao) => b.participants.reduce((sum, p) => p.paid ? sum + getParticipantValue(b, p) : sum, 0);

    const totalGames = getTotalGames(bolao);
    const totalValue = getTotalValue(bolao);
    const totalPaid = getTotalPaid(bolao);
    const pricePerGame = Number(bolao.pricePerGame) || 5;
    const year = bolao.year || new Date().getFullYear();

    // Header with lottery theme color
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setTextColor(255, 255, 255);
    centerText(bolao.name.toUpperCase(), 18, 15);

    doc.setFontSize(14);
    centerText(`${lotteryConfig.name.toUpperCase()} ${year}`, 14, 28);

    doc.setFontSize(10);
    centerText(
      `${bolao.participants.length} participantes • ${totalGames} jogos • R$ ${pricePerGame.toFixed(2)}/jogo`,
      10,
      38
    );

    doc.setFontSize(9);
    const paymentSummary = `Total: R$ ${totalValue.toFixed(2)} | Pago: R$ ${totalPaid.toFixed(2)} | Falta: R$ ${(totalValue - totalPaid).toFixed(2)}`;
    centerText(paymentSummary, 9, 47);

    // Preview banner
    y = 56;
    doc.setFillColor(255, 193, 7);
    doc.rect(margin, y, pageWidth - 2 * margin, 14, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    centerText("PRE-VISUALIZACAO - CONFERIR DADOS ANTES DE CONFIRMAR O BOLAO", 10, y + 9);
    doc.setFont("helvetica", "normal");

    y = 78;
    doc.setTextColor(0, 0, 0);

    // Participants
    bolao.participants.forEach((participant) => {
      const estimatedHeight = 25 + participant.games.length * 12;
      if (y + estimatedHeight > 280) {
        doc.addPage();
        y = 20;
      }

      const participantValue = getParticipantValue(bolao, participant);
      const paidStatus = participant.paid ? "PAGO" : "PENDENTE";
      const paidColor = participant.paid ? [34, 197, 94] : [239, 68, 68];

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 14, 2, 2, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(participant.name.toUpperCase(), margin + 5, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${participant.games.length} jogo${participant.games.length !== 1 ? "s" : ""} - R$ ${participantValue.toFixed(2)}`,
        margin + 80,
        y + 4
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(paidColor[0], paidColor[1], paidColor[2]);
      doc.text(paidStatus, pageWidth - margin - 25, y + 4);

      y += 18;
      doc.setFont("helvetica", "normal");

      participant.games.forEach((game, gIndex) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        const numbersStr = game.numbers.map((n) => String(n).padStart(2, "0")).join("   ");

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Jogo ${gIndex + 1}:`, margin + 8, y);

        doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(numbersStr, margin + 35, y);
        doc.setFont("helvetica", "normal");

        y += 10;
      });

      y += 8;
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
      doc.text(`Gerado em ${dateStr} • Bolao Facil • Pagina ${i} de ${totalPages}`, margin, 290);
    }

    // Footer (Viral Link)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bolaofacil.com.br";
    const footerText = `Gerado via Bolão Fácil - Crie o seu grátis em ${siteUrl.replace(/^https?:\/\//, '')}`;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerWidth = doc.getStringUnitWidth(footerText) * 8 / doc.internal.scaleFactor;
    const footerX = (pageWidth - footerWidth) / 2; // Approximate centering for link logic

    // Add text centered
    centerText(footerText, 8, doc.internal.pageSize.getHeight() - 10);

    // Make it clickable (LINK)
    // jsPDF link requires coordinates. We'll add a link over the text area.
    // Approximate width calculation is tricky without getTextWidth (avail in newer jsPDF)
    // We will put a full width link at bottom for simplicity
    doc.link(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, { url: siteUrl });

    const pdfOutput = doc.output("arraybuffer");

    // Create headers for PDF download
    const safeName = (bolao.name || "bolao")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `bolao_${safeName}_${dateStr}.pdf`;

    // Return as Buffer to ensures compatibility
    const buffer = Buffer.from(pdfOutput);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Length", buffer.length.toString());
    // RFC 5987 standard for filename encoding
    headers.set("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
