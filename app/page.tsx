"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Product, GroupedProduct } from "@/types";
import { fetchProducts } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { CategoryTabs } from "@/components/catalog/CategoryTabs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { AdditionalsOverlay } from "@/components/catalog/AdditionalsOverlay";
import { CartButton } from "@/components/cart/CartButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LoadingVideo } from "@/components/LoadingVideo";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [overlayProduct, setOverlayProduct] = useState<Product | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const HIDDEN_CATEGORIES = ["outros adicionais"];

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of products) {
      if (
        p.status === "active" &&
        p.category !== "adicional" &&
        !HIDDEN_CATEGORIES.includes(p.category)
      ) seen.add(p.category);
    }
    return Array.from(seen);
  }, [products]);

  const additionals = useMemo(
    () => products.filter(
      (p) => p.status === "active" && p.category === "adicional" && !HIDDEN_CATEGORIES.includes(p.category)
    ),
    [products]
  );

  const filteredAdditionals = useMemo(() => {
    if (!overlayProduct) return additionals;
    return additionals.filter((a) => {
      if (!a.size) return true;
      if (a.size.toLowerCase() === "u") return true;
      return !!overlayProduct.size && a.size.includes(overlayProduct.size);
    });
  }, [additionals, overlayProduct]);

  const visibleGroups = useMemo(() => {
    const map = new Map<string, GroupedProduct>();
    for (const p of products) {
      if (p.status !== "active" || p.category === "adicional" || HIDDEN_CATEGORIES.includes(p.category)) continue;
      if (activeCategory !== "Todos" && p.category !== activeCategory) continue;
      if (!map.has(p.name)) {
        map.set(p.name, {
          name: p.name,
          description: p.description,
          category: p.category,
          emoji: p.emoji,
          variants: [],
        });
      }
      map.get(p.name)!.variants.push(p);
    }
    return Array.from(map.values());
  }, [products, activeCategory]);

  const handleAddProduct = (product: Product) => {
    const isCake = product.category === "torta" || product.category === "bolo";
    if (isCake) {
      setOverlayProduct(product);
    } else {
      addItem(product);
    }
  };

  const handleConfirmAdditionals = (product: Product, selected: Product[]) => {
    addItem(product, selected);
    setOverlayProduct(null);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-burgundy sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Image
            src="/images/logo-horizontal.png"
            alt="Deuxcerie"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <div className="text-cream/40 text-sm hidden sm:block">
            Feito com amor
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-light py-6 px-4 text-center">
        <p className="text-rose text-xs tracking-widest uppercase font-medium">
          Bem-vindo à
        </p>
        <h2 className="font-display text-cream text-2xl sm:text-3xl font-bold leading-tight">
          Deuxcerie
        </h2>
        <p className="text-cream/50 text-sm max-w-sm mx-auto mt-1">
          Doces que Marcam Memórias.
        </p>
      </section>

      {/* Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h2 className="font-display text-burgundy text-2xl font-semibold mb-4">
            Nosso Catálogo
          </h2>
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
            categories={categories}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingVideo size={200} />
          </div>
        ) : (
          <ProductGrid groups={visibleGroups} onAdd={handleAddProduct} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-burgundy-dark text-cream/40 text-sm text-center py-8 mt-16">
        <p>© 2026 Deuxcerie — Doces que Marcam Memórias.</p>
      </footer>

      {/* Cart Components */}
      <WhatsAppButton />
      <CartButton />

      {/* Additionals Overlay */}
      <AdditionalsOverlay
        product={overlayProduct}
        additionals={filteredAdditionals}
        onConfirm={handleConfirmAdditionals}
        onClose={() => setOverlayProduct(null)}
      />
    </>
  );
}
