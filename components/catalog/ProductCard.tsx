"use client";

import { useState } from "react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { GroupedProduct, Product } from "@/types";

function ProductImage({ src, emoji }: { src?: string; emoji?: string }) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setErrored(true)}
        className="absolute inset-0 w-full h-full object-contain"
      />
    );
  }

  return (
    <span className="text-7xl transform group-hover:scale-110 transition-transform duration-300">
      {emoji || "🎂"}
    </span>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface ProductCardProps {
  group: GroupedProduct;
  onAdd: (product: Product) => void;
}

export function ProductCard({ group, onAdd }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Product>(group.variants[0]);
  const hasMultipleSizes = group.variants.length > 1;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-burgundy/5">
      {/* Image / Emoji Area */}
      <div className="relative h-48 bg-gradient-to-br from-cream to-rose/10 flex items-center justify-center overflow-hidden">
        <ProductImage src={group.variants[0].imageUrl} emoji={group.emoji} />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-burgundy text-lg leading-tight">
            {group.name}
          </h3>
          <span className="text-xs font-medium text-rose bg-rose/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            {capitalize(group.category)}
          </span>
        </div>

        <p className="text-burgundy/60 text-sm leading-relaxed mb-3 line-clamp-2">
          {group.description}
        </p>

        {/* Size selector */}
        {hasMultipleSizes ? (
          <div className="relative mb-4">
            <select
              value={selectedVariant.id}
              onChange={(e) => {
                const v = group.variants.find((v) => v.id === e.target.value);
                if (v) setSelectedVariant(v);
              }}
              className="w-full appearance-none bg-cream border border-burgundy/20 text-burgundy text-sm rounded-xl px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:border-burgundy/50"
            >
              {group.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-burgundy/50 pointer-events-none"
            />
          </div>
        ) : (
          <div className="mb-4">
            <span className="inline-block text-xs font-medium text-burgundy/50 bg-burgundy/5 px-3 py-1.5 rounded-xl border border-burgundy/10">
              {selectedVariant.size ?? "Único"}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xl text-burgundy tabular-nums">
            R${" "}
            {selectedVariant.price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>

          <button
            onClick={() => onAdd(selectedVariant)}
            className="flex items-center gap-1.5 bg-burgundy text-cream px-4 py-2 rounded-xl text-sm font-medium
              hover:bg-burgundy-light transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/20
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
