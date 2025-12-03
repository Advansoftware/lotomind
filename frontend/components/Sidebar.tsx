"use client";

import { useState } from "react";
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
  Drawer,
  IconButton,
  useMediaQuery,
  AppBar,
  Toolbar,
  SwipeableDrawer,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ALL_LOTTERIES, getLotteryTheme } from "@/lib/lottery-config";

const DRAWER_WIDTH = 280;

export function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLottery = searchParams.get("lotteryType") || "megasena";
  const currentTheme = getLotteryTheme(currentLottery);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lotteryType", id);
    router.push(`${pathname}?${params.toString()}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.dark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: `0 4px 14px ${currentTheme.colors.primary}40`,
            }}
          >
            <CasinoIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              color="text.primary"
              sx={{ lineHeight: 1.2 }}
            >
              LotoMind
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              Analytics
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: "text.primary" }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, mb: 2 }} />

      {/* Lotteries List */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pb: 2 }}>
        <Typography
          variant="overline"
          fontWeight="bold"
          color="text.secondary"
          sx={{
            px: 1.5,
            mb: 1,
            display: "block",
            fontSize: "0.65rem",
            letterSpacing: 1.5,
          }}
        >
          MODALIDADES
        </Typography>
        <List sx={{ p: 0 }}>
          {ALL_LOTTERIES.map((lottery) => {
            const isSelected = currentLottery === lottery.id;
            return (
              <ListItem key={lottery.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleSelect(lottery.id)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    px: 2,
                    bgcolor: isSelected
                      ? lottery.colors.primary
                      : "transparent",
                    color: isSelected ? "#ffffff" : "text.primary",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: isSelected
                        ? lottery.colors.dark
                        : `${lottery.colors.primary}15`,
                      transform: isMobile ? "none" : "translateX(4px)",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isSelected ? "#ffffff" : lottery.colors.primary,
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: isSelected ? "white" : lottery.colors.primary,
                        boxShadow: isSelected
                          ? "0 0 12px rgba(255,255,255,0.6)"
                          : `0 0 8px ${lottery.colors.primary}50`,
                        transition: "all 0.2s",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={lottery.displayName}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Divider sx={{ mx: 2 }} />
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.7rem" }}
        >
          v1.0.0 • Powered by AI
        </Typography>
      </Box>
    </Box>
  );

  // Mobile: AppBar + SwipeableDrawer
  if (isMobile) {
    return (
      <>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ minHeight: 56 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.dark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <CasinoIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color="text.primary"
              >
                LotoMind
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <SwipeableDrawer
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          onOpen={handleDrawerToggle}
          disableSwipeToOpen={false}
          swipeAreaWidth={20}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
        {/* Spacer for fixed AppBar */}
        <Box sx={{ height: 56 }} />
      </>
    );
  }

  // Desktop: Fixed Sidebar
  return (
    <Box
      component="nav"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            border: "none",
            boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
