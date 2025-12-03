"use client";

import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Button,
  TextField,
  MenuItem,
  Skeleton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getLotteryTheme } from "@/lib/lottery-config";
import { LotteryBall } from "./LotteryBall";

// Simplified theme interface
export interface SimpleTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

interface ValidationResult {
  concurso: number;
  strategyId: number;
  strategyName: string;
  predictedNumbers: number[];
  actualNumbers: number[];
  matchedNumbers: number[];
  hits: number;
  confidenceScore: number;
  reasoning?: string;
}

interface PredictionListProps {
  lotteryType: string;
  lotteryTheme: SimpleTheme;
}

function Row({
  result,
  lotteryTheme,
  lotteryType,
}: {
  result: ValidationResult;
  lotteryTheme: SimpleTheme;
  lotteryType: string;
}) {
  const [open, setOpen] = useState(false);
  const fullTheme = getLotteryTheme(lotteryType);

  const getHitColor = (hits: number) => {
    if (hits >= 6) return "success";
    if (hits >= 5) return "warning";
    if (hits >= 4) return "info";
    return "default";
  };

  return (
    <>
      <TableRow
        sx={{
          "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell>
          <IconButton size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight="bold">#{result.concurso}</Typography>
        </TableCell>
        <TableCell>{result.strategyName}</TableCell>
        <TableCell>
          <Chip
            label={`${result.hits} acertos`}
            color={getHitColor(result.hits) as any}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {(Number(result.confidenceScore || 0) * 100).toFixed(1)}%
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 3,
                bgcolor: "rgba(255,255,255,0.02)",
                borderRadius: 2,
                my: 2,
              }}
            >
              <Grid container spacing={3}>
                {/* Números Previstos */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Números Previstos
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {result.predictedNumbers.map((num, idx) => (
                      <LotteryBall
                        key={idx}
                        number={num}
                        isHit={result.matchedNumbers.includes(num)}
                        size={36}
                        lotteryTheme={fullTheme}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Números Sorteados */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Números Sorteados
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {result.actualNumbers.map((num, idx) => (
                      <LotteryBall
                        key={idx}
                        number={num}
                        isHit={result.matchedNumbers.includes(num)}
                        size={36}
                        lotteryTheme={fullTheme}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Análise */}
                {result.reasoning && (
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      mb={1}
                    >
                      Como a estratégia chegou a esse resultado
                    </Typography>
                    <Paper
                      sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2 }}
                    >
                      <Typography variant="body2">
                        {result.reasoning}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Estatísticas */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip
                      label={`Confiança: ${(
                        Number(result.confidenceScore || 0) * 100
                      ).toFixed(1)}%`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${result.hits}/${result.predictedNumbers.length} acertos`}
                      color={getHitColor(result.hits) as any}
                      size="small"
                    />
                    {result.hits >= 4 && (
                      <Chip
                        label={
                          result.hits >= 6
                            ? "🏆 SENA!"
                            : result.hits >= 5
                            ? "⭐ QUINA!"
                            : "✓ QUADRA!"
                        }
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function PredictionList({
  lotteryType,
  lotteryTheme,
}: PredictionListProps) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [minHits, setMinHits] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadResults();
  }, [lotteryType, page, rowsPerPage, minHits]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lotteryType,
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (minHits) {
        params.append("minHits", String(minHits));
      }

      const response = await api.get(`/validation/results?${params}`);
      // Sort by concurso descending, then by hits descending (sena > quina > quadra)
      const sortedResults = (response.data.data || []).sort(
        (a: ValidationResult, b: ValidationResult) => {
          // First sort by concurso (most recent first)
          const concursoDiff =
            (Number(b.concurso) || 0) - (Number(a.concurso) || 0);
          if (concursoDiff !== 0) return concursoDiff;
          // Then by hits (sena first, then quina, then quadra)
          return (Number(b.hits) || 0) - (Number(a.hits) || 0);
        }
      );
      setResults(sortedResults);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box p={3} borderBottom="1px solid rgba(255,255,255,0.05)">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            📋 Histórico de Validações
          </Typography>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filtros
          </Button>
        </Box>

        <Collapse in={showFilters}>
          <Box mt={2} display="flex" gap={2}>
            <TextField
              select
              label="Mínimo de Acertos"
              value={minHits}
              onChange={(e) =>
                setMinHits(e.target.value === "" ? "" : Number(e.target.value))
              }
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={4}>4+ (Quadra)</MenuItem>
              <MenuItem value={5}>5+ (Quina)</MenuItem>
              <MenuItem value={6}>6 (Sena)</MenuItem>
            </TextField>
          </Box>
        </Collapse>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Concurso</TableCell>
              <TableCell>Estratégia</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell>Confiança</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={5}>
                    <Skeleton variant="rectangular" height={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhum resultado encontrado. Execute uma validação para ver
                    os resultados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              results.map((result, idx) => (
                <Row
                  key={`${result.concurso}-${result.strategyId}-${idx}`}
                  result={result}
                  lotteryTheme={lotteryTheme}
                  lotteryType={lotteryType}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
      />
    </Paper>
  );
}
