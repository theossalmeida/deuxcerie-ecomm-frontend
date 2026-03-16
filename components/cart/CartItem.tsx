"use client";

import { Minus, Plus, X } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/store/cart";

interface CartItemProps {
  item: CartItemType;
}

export function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem, removeAdditional } = useCartStore();

  const additionalsTotal = item.additionals.reduce((s, a) => s + a.price, 0);
  const lineTotal = (item.product.price + additionalsTotal) * item.quantity;

  return (
    <div className="py-4 border-b border-chocolate/10 last:border-0">
      {/* Main item */}
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{item.product.emoji || "🎂"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-chocolate text-sm leading-tight">
              {item.product.name}
            </h4>
            <button
              onClick={() => removeItem(item.id)}
              className="text-chocolate/30 hover:text-rose-brand transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          <p className="font-display text-chocolate/70 text-sm tabular-nums mt-0.5">
            R${" "}
            {item.product.price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>

          {/* Qty controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => updateQuantity(item.id, -1)}
              className="w-7 h-7 rounded-lg bg-chocolate/10 hover:bg-chocolate/20 flex items-center justify-center transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-semibold text-chocolate text-sm tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, 1)}
              className="w-7 h-7 rounded-lg bg-chocolate/10 hover:bg-chocolate/20 flex items-center justify-center transition-colors"
            >
              <Plus size={12} />
            </button>
            <span className="ml-auto font-display font-bold text-chocolate tabular-nums text-sm">
              R${" "}
              {lineTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Additionals */}
      {item.additionals.length > 0 && (
        <div className="ml-10 mt-2 space-y-1">
          {item.additionals.map((additional) => (
            <div
              key={additional.id}
              className="flex items-center gap-2 text-xs text-chocolate/60 bg-gold/5 rounded-lg px-2.5 py-1.5"
            >
              <span>{additional.emoji}</span>
              <span className="flex-1">{additional.name}</span>
              <span className="font-display tabular-nums">
                +R${" "}
                {additional.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <button
                onClick={() => removeAdditional(item.id, additional.id)}
                className="text-chocolate/30 hover:text-rose-brand transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
