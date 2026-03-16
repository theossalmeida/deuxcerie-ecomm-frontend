"use client";

import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart";

export function CartButton() {
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-30 bg-chocolate text-cream
        w-14 h-14 rounded-full shadow-2xl shadow-chocolate/40
        flex items-center justify-center
        hover:bg-chocolate-light transition-all duration-200
        hover:scale-110 active:scale-95"
      aria-label={`Carrinho com ${count} itens`}
    >
      <ShoppingBag size={22} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 400 }}
            className="absolute -top-1.5 -right-1.5 bg-gold text-chocolate-dark
              text-xs font-bold min-w-[20px] h-5 rounded-full
              flex items-center justify-center px-1.5 tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
