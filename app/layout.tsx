import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartSidebar } from "@/components/cart/CartSidebar";

const BOLO_OPTIONS = {
  massas: ["Chocolate", "Baunilha", "Limão", "Caramelo", "Red velvet"],
  sabores: ["Doce de leite", "Brigadeiro preto", "Brigadeiro branco", "Brulee", "Limão", "Cream cheese frosting"],
  adicionais: ["Caramelo salgado", "Geleia de morango", "Geleia de frutas vermelhas", "Geleia de maracujá"],
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

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
    <html lang="pt-BR" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-cream antialiased">
        {children}
        <CartSidebar boloOptions={BOLO_OPTIONS} />
      </body>
    </html>
  );
}
