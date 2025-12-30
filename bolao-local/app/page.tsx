"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { LOTTERY_TYPES } from "@/lib/lottery-types";

const features = [
  {
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    title: "Gerenciamento de Participantes",
    description:
      "Adicione quantos participantes quiser, controle quem já pagou e quem ainda deve.",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: "100% Privado",
    description:
      "Seus dados ficam apenas no seu navegador. Nenhuma informação é enviada para servidores externos.",
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: "Rápido e Simples",
    description:
      "Interface intuitiva para criar bolões em segundos. Sem cadastro, sem complicação.",
  },
  {
    icon: <PictureAsPdfIcon sx={{ fontSize: 40 }} />,
    title: "Exportação em PDF",
    description:
      "Gere um documento PDF com todos os jogos para conferência e assinatura dos participantes.",
  },
  {
    icon: <PhoneIphoneIcon sx={{ fontSize: 40 }} />,
    title: "Funciona em Qualquer Dispositivo",
    description:
      "Desktop, tablet ou celular. O Bolão Fácil se adapta a qualquer tela.",
  },
  {
    icon: <CloudOffIcon sx={{ fontSize: 40 }} />,
    title: "Funciona Offline",
    description:
      "Depois de carregar, funciona mesmo sem internet. Perfeito para usar em qualquer lugar.",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Crie seu Bolão",
    description:
      "Escolha o nome, tipo de loteria (Mega-Sena, Lotofácil, Quina...) e valor por jogo.",
  },
  {
    step: 2,
    title: "Adicione Participantes",
    description:
      "Inclua as pessoas que vão participar e adicione os jogos de cada uma.",
  },
  {
    step: 3,
    title: "Exporte e Compartilhe",
    description:
      "Gere um PDF com todos os jogos para conferência e guarde como comprovante.",
  },
];

const faqs = [
  {
    question: "O Bolão Fácil é gratuito?",
    answer:
      "Sim! O Bolão Fácil é 100% gratuito. Você pode criar quantos bolões quiser, adicionar quantos participantes e jogos precisar, tudo sem pagar nada.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim! Todos os dados são armazenados localmente no seu navegador (localStorage). Nenhuma informação pessoal ou dos jogos é enviada para servidores externos. Seus dados são completamente privados.",
  },
  {
    question: "Quais loterias são suportadas?",
    answer:
      "O Bolão Fácil suporta todas as principais loterias da Caixa: Mega-Sena, Mega da Virada, Lotofácil, Quina, Lotomania, Dupla Sena, Dia de Sorte, Super Sete e +Milionária. Você também pode criar bolões personalizados.",
  },
  {
    question: "Posso usar em mais de um dispositivo?",
    answer:
      "Os dados ficam salvos no navegador do dispositivo onde você criou o bolão. Para transferir, você pode exportar o PDF e usar como referência.",
  },
  {
    question: "O Bolão Fácil faz os jogos para mim?",
    answer:
      "O Bolão Fácil é um gerenciador. Você registra os jogos que já escolheu (manualmente ou em lotéricas) para ter o controle de quem está participando e quanto cada um deve pagar.",
  },
  {
    question: "Posso imprimir os jogos?",
    answer:
      "Sim! O Bolão Fácil gera um PDF profissional com todos os jogos, participantes e valores. Você pode imprimir ou compartilhar digitalmente.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleFaqChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ bgcolor: "#0a0a0f", minHeight: "100vh" }}>
      {/* Header Ad */}
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <AdPlaceholder height={90} label="Anúncio - Leaderboard 728x90" />
      </Container>

      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 8, md: 12 },
        }}
      >
        {/* Background gradient */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at top, rgba(34, 197, 94, 0.15) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg">
          <Box textAlign="center" position="relative" zIndex={1}>
            {/* Logo - App Icon Style */}
            <Box mb={4} display="flex" justifyContent="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px", // App icon shape
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Image 
                  src="/icon.svg" 
                  alt="Logo Bolão Fácil" 
                  width={48} 
                  height={48}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                />
              </Box>
            </Box>

            {/* Badge */}
            <Chip
              label="✨ O Melhor Gerenciador de Bolão Grátis"
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
                fontWeight: 600,
                mb: 3,
                px: 1,
              }}
            />

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.5rem", md: "4rem" },
                fontWeight: 800,
                background: "linear-gradient(135deg, #ffffff 0%, #22c55e 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
                lineHeight: 1.1,
              }}
            >
              Monte seu Bolão
              <br />
              entre Amigos Fácil
            </Typography>

            {/* Subheadline */}
            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.7)",
                mb: 4,
                maxWidth: 600,
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              Abandone a planilha! O melhor gerenciador de bolão para Mega-Sena, 
              Lotofácil e Quina. Controle cotas, jogos e pagamentos em um só lugar.
            </Typography>

            {/* CTA Button */}
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push("/gerenciador")}
              sx={{
                bgcolor: "#22c55e",
                color: "#000",
                fontWeight: 700,
                fontSize: "1.1rem",
                px: 5,
                py: 2,
                borderRadius: 3,
                textTransform: "none",
                boxShadow: "0 0 40px rgba(34, 197, 94, 0.4)",
                "&:hover": {
                  bgcolor: "#16a34a",
                  transform: "translateY(-2px)",
                  boxShadow: "0 0 60px rgba(34, 197, 94, 0.5)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Começar Agora - É Grátis!
            </Button>

            {/* Supported lotteries */}
            <Box sx={{ mt: 6 }}>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.5)", mb: 2 }}
              >
                Suporte para todas as loterias da Caixa
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                {LOTTERY_TYPES.slice(0, -1).map((lottery) => (
                  <Chip
                    key={lottery.id}
                    label={`${lottery.icon} ${lottery.name}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.7)",
                      borderColor: "rgba(255,255,255,0.1)",
                      border: "1px solid",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mid Ad */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdPlaceholder height={250} label="Anúncio - Rectangle 300x250" />
      </Container>

      {/* How It Works */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "rgba(255,255,255,0.02)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Como Funciona
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Em apenas 3 passos simples você organiza seu bolão
          </Typography>

          <Grid container spacing={4}>
            {howItWorks.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.step}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "#000",
                      boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
                    }}
                  >
                    {item.step}
                  </Box>
                  <Typography variant="h5" fontWeight={600} mb={1}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Por que usar o Bolão Fácil?
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Tudo que você precisa para organizar bolões de forma profissional
          </Typography>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: "100%",
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Box sx={{ color: "#22c55e", mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight={600} mb={1}>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Ad before FAQ */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdPlaceholder height={90} label="Anúncio - Leaderboard 728x90" />
      </Container>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "rgba(255,255,255,0.02)" }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Perguntas Frequentes
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 6 }}
          >
            Tire suas dúvidas sobre o Bolão Fácil
          </Typography>

          <Box>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index}`}
                onChange={handleFaqChange(`panel${index}`)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px !important",
                  mb: 2,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "#22c55e" }} />}
                  sx={{ px: 3, py: 1 }}
                >
                  <Typography fontWeight={600}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.05) 100%)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                fontWeight: 700,
                mb: 2,
              }}
            >
              Pronto para organizar seu bolão?
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.7)", mb: 4, maxWidth: 500, mx: "auto" }}
            >
              Comece agora mesmo. É grátis, não precisa de cadastro e seus dados
              ficam salvos apenas no seu dispositivo.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push("/gerenciador")}
              sx={{
                bgcolor: "#22c55e",
                color: "#000",
                fontWeight: 700,
                fontSize: "1.1rem",
                px: 5,
                py: 2,
                borderRadius: 3,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#16a34a",
                },
              }}
            >
              Criar Meu Bolão
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              © {new Date().getFullYear()} Bolão Fácil. Todos os direitos
              reservados.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              Este site não tem vínculo com a Caixa Econômica Federal.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer Ad */}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <AdPlaceholder height={90} label="Anúncio - Leaderboard 728x90" />
      </Container>
    </Box>
  );
}
