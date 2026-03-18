"use client";

import { Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Bolao } from "@/lib/bolao-api";

interface BolaoJsonExportProps {
  bolao: Bolao;
}

export interface BolaoExportData {
  exportVersion: string;
  exportedAt: string;
  bolao: {
    name: string;
    year: number;
    pricePerGame: number;
    minGamesPerParticipant: number;
    maxGamesPerParticipant: number | null;
    participants: {
      name: string;
      paid: boolean;
      games: {
        numbers: number[];
      }[];
    }[];
  };
}

export function BolaoJsonExport({ bolao }: BolaoJsonExportProps) {
  const exportToJson = () => {
    // Build export data structure (excluding DB ids)
    const exportData: BolaoExportData = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      bolao: {
        name: bolao.name,
        year: bolao.year,
        pricePerGame: Number(bolao.pricePerGame),
        minGamesPerParticipant: bolao.minGamesPerParticipant,
        maxGamesPerParticipant: bolao.maxGamesPerParticipant,
        participants: bolao.participants.map((p) => ({
          name: p.name,
          paid: p.paid,
          games: p.games.map((g) => ({
            numbers: g.numbers,
          })),
        })),
      },
    };

    // Create and download JSON file
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Generate safe filename
    const safeName = (bolao.name || "bolao")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "_") // Replace special chars with underscore
      .replace(/^_+|_+$/g, ""); // Trim underscores

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `bolao_${safeName}_${dateStr}.json`;

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="contained"
      startIcon={<FileDownloadIcon />}
      onClick={exportToJson}
      disabled={bolao.participants.length === 0}
      sx={{
        bgcolor: "#2196f3",
        "&:hover": { bgcolor: "#1976d2" },
        fontWeight: "bold",
        px: 3,
      }}
    >
      Exportar JSON
    </Button>
  );
}
