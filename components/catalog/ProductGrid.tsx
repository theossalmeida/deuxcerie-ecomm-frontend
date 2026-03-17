"use client";

import { GroupedProduct, Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  groups: GroupedProduct[];
  onAdd: (product: Product) => void;
}

export function ProductGrid({ groups, onAdd }: ProductGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-burgundy/40">
        <span className="text-5xl mb-4">🎂</span>
        <p className="text-lg">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {groups.map((group) => (
        <ProductCard key={group.name} group={group} onAdd={onAdd} />
      ))}
    </div>
  );
}
