"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, CheckCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { submitOrder } from "@/lib/api";
import { CartItemRow } from "./CartItem";

export function CartSidebar() {
  const { isOpen, closeCart, items, total, itemCount, clearCart } = useCartStore();
  const count = itemCount();
  const totalValue = total();

  const [clientName, setClientName] = useState("");
  const [clientMobile, setClientMobile] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  const canSubmit = clientName.trim() && clientMobile.trim() && deliveryDate && items.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitOrder({ clientName, clientMobile, deliveryDate, items });
      setOrderId(result.orderId);
      clearCart();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar pedido");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    closeCart();
    if (orderId) {
      setOrderId(null);
      setClientName("");
      setClientMobile("");
      setDeliveryDate("");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-burgundy/40 backdrop-blur-sm z-40"
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
            <div className="bg-burgundy px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-rose" size={22} />
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
                onClick={handleClose}
                className="text-cream/60 hover:text-cream transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-burgundy/30 py-16">
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

            {/* Success state */}
            {orderId && (
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center gap-3">
                <CheckCircle className="text-rose" size={48} />
                <h3 className="font-display text-burgundy font-semibold text-xl">Pedido recebido!</h3>
                <p className="text-burgundy/60 text-sm">Seu pedido foi enviado com sucesso.</p>
                <p className="text-burgundy/40 text-xs font-mono break-all">{orderId}</p>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm text-burgundy/50 underline underline-offset-2"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Footer */}
            {!orderId && items.length > 0 && (
              <div className="px-6 py-5 border-t border-burgundy/10 bg-white/50">
                {/* Customer info */}
                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full text-xs text-burgundy bg-white border border-burgundy/15 rounded-xl
                      px-3 py-2.5 placeholder:text-burgundy/25
                      focus:outline-none focus:border-burgundy/40 transition-colors"
                  />
                  <input
                    type="tel"
                    value={clientMobile}
                    onChange={(e) => setClientMobile(e.target.value)}
                    placeholder="WhatsApp (ex: 11999999999)"
                    className="w-full text-xs text-burgundy bg-white border border-burgundy/15 rounded-xl
                      px-3 py-2.5 placeholder:text-burgundy/25
                      focus:outline-none focus:border-burgundy/40 transition-colors"
                  />
                  <div>
                    <label className="text-xs font-medium text-burgundy/50 mb-1 block">
                      Data de entrega
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={minDateStr}
                      className="w-full text-xs text-burgundy bg-white border border-burgundy/15 rounded-xl
                        px-3 py-2.5 focus:outline-none focus:border-burgundy/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-burgundy/60 font-medium">Subtotal</span>
                  <span className="font-display font-bold text-2xl text-burgundy tabular-nums">
                    R${" "}
                    {totalValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {submitError && (
                  <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">
                    {submitError}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full bg-rose text-cream py-4 rounded-xl font-bold text-base
                    transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Enviando..." : "Finalizar Pedido"}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
