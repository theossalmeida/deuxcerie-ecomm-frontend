"use client";

import { ShoppingBag } from "lucide-react";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-chocolate/5">
      {/* Image / Emoji Area */}
      <div className="relative h-48 bg-gradient-to-br from-cream to-rose-brand/10 flex items-center justify-center overflow-hidden">
        <span className="text-7xl transform group-hover:scale-110 transition-transform duration-300">
          {product.emoji || "🎂"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-chocolate text-lg leading-tight">
            {product.name}
          </h3>
          <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            {product.category}
          </span>
        </div>

        <p className="text-chocolate/60 text-sm leading-relaxed mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xl text-chocolate tabular-nums">
            R${" "}
            {product.price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>

          <button
            onClick={() => onAdd(product)}
            className="flex items-center gap-1.5 bg-chocolate text-cream px-4 py-2 rounded-xl text-sm font-medium
              hover:bg-chocolate-light transition-all duration-200 hover:shadow-lg hover:shadow-chocolate/20
              active:scale-95"
          >
            <ShoppingBag size={15} />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
