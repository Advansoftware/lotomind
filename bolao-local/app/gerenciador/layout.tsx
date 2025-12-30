import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar e Gerenciar Bolão Online | Bolão Fácil",
  description: "Cadastre participantes, adicione jogos da Mega-Sena e Lotofácil, controle pagamentos e gere PDF. O gerenciador de bolão completo e gratuito.",
};

export default function GerenciadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
