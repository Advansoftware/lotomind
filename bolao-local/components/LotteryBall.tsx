"use client";

import { Box } from "@mui/material";

interface LotteryBallProps {
  number: number;
  size?: number;
  color?: string;
}

export function LotteryBall({ number, size = 40, color = "#22c55e" }: LotteryBallProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: size * 0.4,
        color: "#fff",
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        boxShadow: `0 4px 12px ${color}66`,
        transition: "all 0.2s ease",
      }}
    >
      {String(number).padStart(2, "0")}
    </Box>
  );
}
