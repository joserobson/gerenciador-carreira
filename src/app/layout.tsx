import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gerenciador de Carreira | Portfolio & CV Automático",
  description: "Plataforma inteligente para gerenciar currículo, portfólio e plataformas de recrutamento.",
};

import Navbar from "@/app/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${firaCode.variable} h-full antialiased dark scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
