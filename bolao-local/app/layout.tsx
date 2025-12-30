import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bolaofacil.com.br"),
  title: {
    default: "Bolão Fácil - Gerenciador de Bolão Grátis e Privado | O Melhor do Brasil",
    template: "%s | Bolão Fácil",
  },
  description:
    "A melhor ferramenta para montar bolão entre amigos grátis. Organize Mega-Sena, Lotofácil e Quina. Calcule cotas, confira jogos e gere PDF. Sem cadastro.",
  keywords: [
    "bolão",
    "gerenciador de bolão",
    "montar bolão entre amigos",
    "como organizar bolão",
    "planilha de bolão",
    "bolão mega sena",
    "bolão lotofácil",
    "bolão online grátis",
    "sistema de bolão",
    "app de bolão",
    "calcular cotas loteria",
    "divisão de prêmios",
    "bolão caixa",
    "conferidor de bolão",
  ],
  authors: [{ name: "Bolão Fácil" }],
  creator: "Bolão Fácil",
  publisher: "Bolão Fácil",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://bolaofacil.com.br",
    siteName: "Bolão Fácil",
    title: "Bolão Fácil - O Gerenciador de Bolão #1 para Amigos",
    description:
      "Crie e organize seu bolão de loteria em segundos. Ferramenta gratuita para montar bolão entre amigos, gerar PDF e controlar pagamentos.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bolão Fácil - Gerenciador de Bolões",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolão Fácil - Gerenciador de Bolão Grátis",
    description:
      "A forma mais fácil de montar bolão entre amigos. Mega-Sena, Lotofácil, Quina e mais.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code", // Replace with actual code
  },
  alternates: {
    canonical: "https://bolaofacil.com.br",
  },
  category: "finance",
};

// JSON-LD Schema
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://bolaofacil.com.br/#website",
      url: "https://bolaofacil.com.br",
      name: "Bolão Fácil",
      description: "O melhor gerenciador de bolão para montar jogos entre amigos",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://bolaofacil.com.br/gerenciador?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://bolaofacil.com.br/#webapp",
      name: "Bolão Fácil",
      url: "https://bolaofacil.com.br",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      genre: "Lottery Pool Manager",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
      featureList: [
        "Montar bolão entre amigos",
        "Gerador de PDF para bolão",
        "Controle de pagamentos e cotas",
        "Suporte a Mega-Sena, Lotofácil, Quina",
        "Funciona offline 100% privado",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Como montar um bolão entre amigos grátis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Com o Bolão Fácil, você cria um bolão, adiciona os nomes dos amigos e os jogos. O sistema calcula o valor de cada cota e gera um PDF para organizar tudo, 100% gratuito.",
          },
        },
        {
          "@type": "Question",
          name: "Existe aplicativo para gerenciar bolão?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Bolão Fácil é um Web App que funciona como aplicativo no seu celular (PWA). Basta acessar no navegador e instalar na tela inicial para gerenciar seus bolões a qualquer momento.",
          },
        },
        {
          "@type": "Question",
          name: "Quais loterias são suportadas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Bolão Fácil suporta todas as principais loterias da Caixa: Mega-Sena, Mega da Virada, Lotofácil, Quina, Lotomania, Dupla Sena, Dia de Sorte, Super Sete e +Milionária.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      name: "Como organizar um bolão de loteria",
      step: [
        {
          "@type": "HowToStep",
          name: "Acesse o Gerenciador",
          text: "Entre no Bolão Fácil e clique em 'Começar Agora'. Escolha a loteria desejada.",
        },
        {
          "@type": "HowToStep",
          name: "Defina as Cotas",
          text: "Adicione os participantes (amigos) que farão parte do bolão.",
        },
        {
          "@type": "HowToStep",
          name: "Registre os Jogos",
          text: "Insira os números de cada aposta ou deixe o sistema completar para você.",
        },
        {
          "@type": "HowToStep",
          name: "Gere o PDF",
          text: "Exporte um PDF profissional para compartilhar com o grupo no WhatsApp.",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense - Replace with your actual code */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossOrigin="anonymous"></script> */}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
