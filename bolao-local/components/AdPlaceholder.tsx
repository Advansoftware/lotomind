"use client";

import { Box, Typography } from "@mui/material";

interface AdPlaceholderProps {
  width?: string | number;
  height?: number;
  label?: string;
  variant?: "horizontal" | "vertical" | "square";
}

// Common ad sizes:
// Leaderboard: 728x90
// Medium Rectangle: 300x250
// Large Rectangle: 336x280
// Skyscraper: 120x600
// Wide Skyscraper: 160x600

export function AdPlaceholder({
  width = "100%",
  height = 90,
  label = "Anúncio",
  variant = "horizontal",
}: AdPlaceholderProps) {
  return (
    <Box
      sx={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px dashed rgba(255,255,255,0.15)",
        borderRadius: 2,
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: 1,
        // For production, this would be replaced with actual AdSense code:
        // data-ad-client="ca-pub-XXXXXXXX"
        // data-ad-slot="XXXXXXXX"
      }}
      className="ad-placeholder"
      data-ad-format={variant === "horizontal" ? "horizontal" : variant === "vertical" ? "vertical" : "auto"}
    >
      <Typography variant="caption" sx={{ opacity: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}
