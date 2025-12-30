"use client";

import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";

interface NumberGridProps {
  onConfirm: (numbers: number[]) => void;
  onCancel: () => void;
  maxNumbers?: number;
  maxNumber?: number; // Maximum number value (e.g., 60 for Mega-Sena, 25 for Lotofácil)
  themeColor?: string;
  initialNumbers?: number[];
}

export function NumberGrid({
  onConfirm,
  onCancel,
  maxNumbers = 6,
  maxNumber = 60,
  themeColor = "#22c55e",
  initialNumbers,
}: NumberGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers || []);

  useEffect(() => {
    setSelectedNumbers(initialNumbers || []);
  }, [initialNumbers]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else if (selectedNumbers.length < maxNumbers) {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  const handleConfirm = () => {
    if (selectedNumbers.length === maxNumbers) {
      onConfirm([...selectedNumbers].sort((a, b) => a - b));
    }
  };

  // Calculate grid columns based on max number
  const gridCols = maxNumber <= 25 ? 5 : maxNumber <= 50 ? 10 : 10;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: "transparent",
      }}
    >
      {/* Selected numbers preview */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Números selecionados: {selectedNumbers.length}/{maxNumbers}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" minHeight={48}>
          {[...selectedNumbers].sort((a, b) => a - b).map((num) => (
            <Box
              key={num}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                boxShadow: `0 4px 12px ${themeColor}66`,
              }}
            >
              {String(num).padStart(2, "0")}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Number grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 1,
          mb: 3,
        }}
      >
        {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => {
          const isSelected = selectedNumbers.includes(num);
          return (
            <Box
              key={num}
              onClick={() => toggleNumber(num)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
                color: isSelected ? "#fff" : "text.primary",
                bgcolor: isSelected ? themeColor : "rgba(255,255,255,0.05)",
                border: isSelected ? `2px solid ${themeColor}` : "2px solid transparent",
                "&:hover": {
                  bgcolor: isSelected ? themeColor : `${themeColor}33`,
                  transform: "scale(1.1)",
                },
              }}
            >
              {String(num).padStart(2, "0")}
            </Box>
          );
        })}
      </Box>

      {/* Actions */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={clearSelection}
          disabled={selectedNumbers.length === 0}
        >
          Limpar
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          onClick={handleConfirm}
          disabled={selectedNumbers.length !== maxNumbers}
          sx={{
            bgcolor: themeColor,
            "&:hover": { bgcolor: `${themeColor}dd` },
          }}
        >
          Confirmar
        </Button>
      </Box>
    </Paper>
  );
}
