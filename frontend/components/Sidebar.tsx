"use client";

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ALL_LOTTERIES, getLotteryTheme } from "@/lib/lottery-config";

export function Sidebar() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLottery = searchParams.get("lotteryType") || "megasena";
  const currentTheme = getLotteryTheme(currentLottery);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lotteryType", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bgcolor: "background.paper",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1200,
        boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
      }}
    >
      <Box p={3} display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <CasinoIcon />
        </Box>
        <Typography variant="h6" fontWeight="800" color="text.primary">
          LotoMind
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box px={2}>
        <Typography
          variant="caption"
          fontWeight="bold"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: "block" }}
        >
          MODALIDADES
        </Typography>
        <List>
          {ALL_LOTTERIES.map((lottery) => {
            const isSelected = currentLottery === lottery.id;
            return (
              <ListItem key={lottery.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleSelect(lottery.id)}
                  sx={{
                    borderRadius: 3,
                    mb: 1,
                    bgcolor: isSelected
                      ? lottery.colors.primary
                      : "transparent",
                    color: isSelected ? "#ffffff" : "text.primary",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: isSelected
                        ? lottery.colors.dark
                        : "rgba(255,255,255,0.05)",
                      transform: "translateX(5px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? "#ffffff" : "text.primary",
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: isSelected ? "white" : lottery.colors.primary,
                        boxShadow: isSelected
                          ? "0 0 10px rgba(255,255,255,0.5)"
                          : "none",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={lottery.displayName}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? "800" : "500",
                      fontSize: "0.95rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
