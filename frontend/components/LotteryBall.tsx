"use client";

import { Box } from "@mui/material";
import { LotteryTheme } from "@/lib/lottery-config";

interface LotteryBallProps {
  number: number;
  isHit?: boolean;
  size?: number;
  lotteryTheme?: LotteryTheme;
}

export function LotteryBall({
  number,
  isHit = false,
  size = 40,
  lotteryTheme,
}: LotteryBallProps) {
  const defaultColor = "#209869";
  const ballColor = lotteryTheme?.colors.ball || defaultColor;
  const ballGradient =
    lotteryTheme?.colors.gradient ||
    `linear-gradient(135deg, ${ballColor} 0%, ${ballColor}dd 100%)`;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: isHit
          ? "linear-gradient(135deg, #00e676 0%, #00b248 100%)" // Green for hit
          : "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)", // Gray for normal
        color: isHit ? "white" : "#424242",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: size * 0.45,
        boxShadow: isHit
          ? "0 4px 10px rgba(0,230,118,0.4)"
          : "0 2px 5px rgba(0,0,0,0.1)",
        border: isHit ? "2px solid #ffffff" : "1px solid rgba(0,0,0,0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "scale(1.1) translateY(-2px)",
          boxShadow: isHit
            ? "0 8px 20px rgba(0,230,118,0.5)"
            : "0 4px 10px rgba(0,0,0,0.15)",
        },
      }}
    >
      {String(number).padStart(2, "0")}
    </Box>
  );
}
