"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { products } from "@/data/mock";
import { useCartStore } from "@/store/cart";
import { CategoryTabs } from "@/components/catalog/CategoryTabs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { AdditionalsOverlay } from "@/components/catalog/AdditionalsOverlay";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartButton } from "@/components/cart/CartButton";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [overlayProduct, setOverlayProduct] = useState<Product | null>(null);
  const { addItem } = useCartStore();

  const visibleProducts = useMemo(() => {
    const active = products.filter(
      (p) => p.status === "active" && p.category !== "Adicional"
    );
    if (activeCategory === "Todos") return active;
    return active.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const handleAddProduct = (product: Product) => {
    const isCake =
      product.category === "Torta" || product.category === "Bolo";
    if (isCake) {
      setOverlayProduct(product);
    } else {
      addItem(product);
    }
  };

  const handleConfirmAdditionals = (
    product: Product,
    additionals: Product[]
  ) => {
    addItem(product, additionals);
    setOverlayProduct(null);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-chocolate sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-cream text-2xl font-bold tracking-wide">
              Deuxcerie
            </h1>
            <p className="text-gold text-xs tracking-widest uppercase">
              Pâtisserie Artesanal
            </p>
          </div>
          <div className="text-cream/40 text-sm hidden sm:block">
            Feito com amor ✦
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-chocolate to-chocolate-light py-14 px-4 text-center">
        <p className="text-gold text-sm tracking-widest uppercase mb-3 font-medium">
          Bem-vindo à
        </p>
        <h2 className="font-display text-cream text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          Pâtisserie Deuxcerie
        </h2>
        <p className="text-cream/60 text-lg max-w-md mx-auto leading-relaxed">
          Tortas e bolos artesanais com ingredientes premium, feitos com amor
          para momentos especiais.
        </p>
      </section>

      {/* Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="font-display text-chocolate text-2xl font-semibold mb-4">
            Nosso Catálogo
          </h2>
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Product Grid */}
        <ProductGrid products={visibleProducts} onAdd={handleAddProduct} />
      </main>

      {/* Footer */}
      <footer className="bg-chocolate-dark text-cream/40 text-sm text-center py-8 mt-16">
        <p>© 2024 Deuxcerie — Pâtisserie Artesanal. Feito com amor.</p>
      </footer>

      {/* Cart Components */}
      <CartButton />
      <CartSidebar />

      {/* Additionals Overlay */}
      <AdditionalsOverlay
        product={overlayProduct}
        onConfirm={handleConfirmAdditionals}
        onClose={() => setOverlayProduct(null)}
      />
    </>
  );
}
