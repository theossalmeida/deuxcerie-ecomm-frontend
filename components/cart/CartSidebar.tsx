"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { CartItemRow } from "./CartItem";

export function CartSidebar() {
  const { isOpen, closeCart, items, total, itemCount } = useCartStore();
  const count = itemCount();
  const totalValue = total();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-chocolate/40 backdrop-blur-sm z-40"
            onClick={closeCart}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-cream z-50
              flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-chocolate px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-gold" size={22} />
                <div>
                  <h2 className="text-cream font-display font-semibold text-lg">
                    Seu Pedido
                  </h2>
                  <p className="text-cream/50 text-xs">
                    {count} {count === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="text-cream/60 hover:text-cream transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-chocolate/30 py-16">
                  <span className="text-5xl mb-4">🛒</span>
                  <p className="text-base">Carrinho vazio</p>
                  <p className="text-sm mt-1">
                    Adicione produtos para começar
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-chocolate/10 bg-white/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-chocolate/60 font-medium">
                    Subtotal
                  </span>
                  <span className="font-display font-bold text-2xl text-chocolate tabular-nums">
                    R${" "}
                    {totalValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <button
                  disabled
                  className="w-full bg-gold text-chocolate-dark py-4 rounded-xl font-bold text-base
                    opacity-75 cursor-not-allowed"
                >
                  Finalizar Pedido — Em breve
                </button>

                <p className="text-center text-xs text-chocolate/30 mt-2">
                  Checkout disponível em breve
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
