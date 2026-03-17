import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deuxcerie — Doces que Marcam Memorias",
  description: "Tortas e bolos artesanais feitos com amor e ingredientes premium.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-cream antialiased">
        {children}
      </body>
    </html>
  );
}
