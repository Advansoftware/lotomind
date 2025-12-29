"use client";

import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getLotteryTheme } from "@/lib/lottery-config";

interface NumberGridProps {
  onAddGame: (numbers: number[]) => void;
  maxNumbers?: number;
  minNumber?: number;
  maxNumber?: number;
  initialNumbers?: number[];
}

export function NumberGrid({
  onAddGame,
  maxNumbers = 6,
  minNumber = 1,
  maxNumber = 60,
  initialNumbers,
}: NumberGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers || []);
  const megaTheme = getLotteryTheme("megasena");

  // Reset state when initialNumbers changes (for edit mode)
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

  const handleConfirm = () => {
    if (selectedNumbers.length === maxNumbers) {
      onAddGame([...selectedNumbers].sort((a, b) => a - b));
      setSelectedNumbers([]);
    }
  };

  const handleClear = () => {
    setSelectedNumbers([]);
  };

  const numbers = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, i) => i + minNumber
  );

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "rgba(32, 152, 105, 0.05)",
        border: "1px solid rgba(32, 152, 105, 0.2)",
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
          Selecione {maxNumbers} números:
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              color:
                selectedNumbers.length === maxNumbers
                  ? megaTheme.colors.primary
                  : "text.secondary",
            }}
          >
            {selectedNumbers.length}/{maxNumbers}
          </Typography>
          {selectedNumbers.length > 0 && (
            <Button
              size="small"
              onClick={handleClear}
              startIcon={<RefreshIcon />}
              sx={{ minWidth: 0, color: "text.secondary" }}
            >
              Limpar
            </Button>
          )}
        </Box>
      </Box>

      {/* Number Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 0.75,
          mb: 2,
        }}
      >
        {numbers.map((num) => {
          const isSelected = selectedNumbers.includes(num);
          const isDisabled =
            !isSelected && selectedNumbers.length >= maxNumbers;

          return (
            <Box
              key={num}
              onClick={() => !isDisabled && toggleNumber(num)}
              sx={{
                width: { xs: 32, sm: 38 },
                height: { xs: 32, sm: 38 },
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                fontWeight: "bold",
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                userSelect: "none",
                bgcolor: isSelected
                  ? megaTheme.colors.primary
                  : "rgba(255,255,255,0.05)",
                color: isSelected ? "white" : isDisabled ? "grey.600" : "text.primary",
                border: isSelected
                  ? "2px solid transparent"
                  : "2px solid rgba(255,255,255,0.1)",
                opacity: isDisabled ? 0.4 : 1,
                transform: isSelected ? "scale(1.1)" : "scale(1)",
                boxShadow: isSelected
                  ? `0 4px 12px ${megaTheme.colors.primary}50`
                  : "none",
                "&:hover": !isDisabled
                  ? {
                      bgcolor: isSelected
                        ? megaTheme.colors.dark
                        : "rgba(32, 152, 105, 0.2)",
                      borderColor: megaTheme.colors.primary,
                      transform: "scale(1.1)",
                    }
                  : {},
              }}
            >
              {String(num).padStart(2, "0")}
            </Box>
          );
        })}
      </Box>

      {/* Selected Numbers Preview */}
      {selectedNumbers.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(0,0,0,0.2)",
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Selecionados:
          </Typography>
          {[...selectedNumbers].sort((a, b) => a - b).map((num) => (
            <Box
              key={num}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: "bold",
                bgcolor: megaTheme.colors.primary,
                color: "white",
              }}
            >
              {String(num).padStart(2, "0")}
            </Box>
          ))}
        </Box>
      )}

      {/* Confirm Button */}
      <Button
        fullWidth
        variant="contained"
        onClick={handleConfirm}
        disabled={selectedNumbers.length !== maxNumbers}
        startIcon={<CheckIcon />}
        sx={{
          bgcolor: megaTheme.colors.primary,
          fontWeight: "bold",
          py: 1.5,
          "&:hover": { bgcolor: megaTheme.colors.dark },
          "&:disabled": {
            bgcolor: "rgba(255,255,255,0.1)",
            color: "grey.500",
          },
        }}
      >
        Adicionar Jogo
      </Button>
    </Paper>
  );
}
