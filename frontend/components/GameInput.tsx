"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { LotteryBall } from "./LotteryBall";
import { getLotteryTheme } from "@/lib/lottery-config";

interface GameInputProps {
  onAddGame: (numbers: number[]) => void;
}

export function GameInput({ onAddGame }: GameInputProps) {
  const [numbers, setNumbers] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const megaTheme = getLotteryTheme("megasena");

  const handleChange = (index: number, value: string) => {
    const newNumbers = [...numbers];
    // Allow only numbers
    const numValue = value.replace(/\D/g, "");
    newNumbers[index] = numValue;
    setNumbers(newNumbers);
    setError("");
  };

  const handleSubmit = () => {
    // Convert to numbers and validate
    const parsedNumbers = numbers.map((n) => parseInt(n, 10));

    // Check if all fields are filled
    if (numbers.some((n) => n === "")) {
      setError("Preencha todos os 6 números");
      return;
    }

    // Check range (1-60)
    if (parsedNumbers.some((n) => n < 1 || n > 60)) {
      setError("Números devem ser entre 1 e 60");
      return;
    }

    // Check for duplicates
    const unique = new Set(parsedNumbers);
    if (unique.size !== 6) {
      setError("Números não podem se repetir");
      return;
    }

    onAddGame(parsedNumbers);
    setNumbers(["", "", "", "", "", ""]);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      if (index < 5) {
        // Focus next input
        const nextInput = document.getElementById(`game-input-${index + 1}`);
        nextInput?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: "rgba(255,255,255,0.03)",
        borderRadius: 2,
        border: "1px dashed rgba(255,255,255,0.1)",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Adicionar jogo (6 números de 1 a 60):
      </Typography>
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {numbers.map((num, index) => (
          <TextField
            key={index}
            id={`game-input-${index}`}
            value={num}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            size="small"
            inputProps={{
              maxLength: 2,
              style: { textAlign: "center", fontWeight: "bold" },
            }}
            sx={{
              width: 50,
              "& .MuiOutlinedInput-root": {
                borderRadius: "50%",
                height: 50,
                width: 50,
                "& fieldset": {
                  borderColor: megaTheme.colors.primary,
                },
                "&:hover fieldset": {
                  borderColor: megaTheme.colors.light,
                },
                "&.Mui-focused fieldset": {
                  borderColor: megaTheme.colors.accent,
                },
              },
            }}
          />
        ))}
        <IconButton
          onClick={handleSubmit}
          sx={{
            bgcolor: megaTheme.colors.primary,
            color: "white",
            width: 50,
            height: 50,
            "&:hover": {
              bgcolor: megaTheme.colors.dark,
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
