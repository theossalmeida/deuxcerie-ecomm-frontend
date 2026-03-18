"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { submitOrder } from "@/lib/api";
import { CartItemRow } from "./CartItem";
import { PixPaymentModal } from "./PixPaymentModal";
import { CardWaitingOverlay } from "./CardWaitingOverlay";
import type { OrderResult, PaymentMethod } from "@/types";

type PixModalData = Required<
  Pick<OrderResult, "sessionId" | "brCode" | "brCodeBase64" | "expiresAt">
>;

export function CartSidebar() {
  const { isOpen, closeCart, items, itemCount, clearCart } = useCartStore();
  const count = itemCount();

  const [clientName, setClientName] = useState("");
  const [clientMobile, setClientMobile] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pixModalData, setPixModalData] = useState<PixModalData | null>(null);
  const [cardSessionId, setCardSessionId] = useState<string | null>(null);

  // Use Brazil local date (BRT = UTC-3) to avoid showing the wrong minimum
  // when the user is near midnight UTC
  const minDateStr = (() => {
    const now = new Date();
    const brtOffset = -3 * 60;
    const brt = new Date(now.getTime() - (now.getTimezoneOffset() - brtOffset) * 60000);
    brt.setDate(brt.getDate() + 2);
    return brt.toISOString().split("T")[0];
  })();

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const pixTotal = items.reduce((acc, item) => {
    const additionalsTotal = item.additionals.reduce((s, a) => s + a.pixPrice, 0);
    return acc + (item.product.pixPrice + additionalsTotal) * item.quantity;
  }, 0);

  const cardTotal = items.reduce((acc, item) => {
    const additionalsTotal = item.additionals.reduce((s, a) => s + a.cardPrice, 0);
    return acc + (item.product.cardPrice + additionalsTotal) * item.quantity;
  }, 0);

  const displayTotal = paymentMethod === "CARD" ? cardTotal : pixTotal;

  const boloFieldsComplete = items
    .filter((item) => item.product.category === "bolo")
    .every((item) => item.massa.trim() && item.sabor.trim());

  const canSubmit =
    clientName.trim() &&
    clientMobile.trim() &&
    email.trim() &&
    taxId.trim() &&
    deliveryDate &&
    paymentMethod !== null &&
    boloFieldsComplete &&
    items.length > 0;

  async function handleSubmit() {
    if (!canSubmit || isSubmitting || !paymentMethod) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitOrder({
        clientName,
        clientMobile,
        email,
        taxId,
        deliveryDate,
        items,
        paymentMethod,
      });

      if (result.paymentMethod === "PIX") {
        closeCart();
        setIsSubmitting(false);
        setPixModalData({
          sessionId: result.sessionId,
          brCode: result.brCode!,
          brCodeBase64: result.brCodeBase64!,
          expiresAt: result.expiresAt!,
        });
      } else {
        window.open(result.checkoutUrl!, "_blank", "noopener,noreferrer");
        closeCart();
        setIsSubmitting(false);
        setCardSessionId(result.sessionId);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar pedido");
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
                  onClick={closeCart}
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
                    <CartItemRow key={item.id} item={item} paymentMethod={paymentMethod} />
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
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
                      placeholder="Celular (ex: 11999999999)"
                      className="w-full text-xs text-burgundy bg-white border border-burgundy/15 rounded-xl
                        px-3 py-2.5 placeholder:text-burgundy/25
                        focus:outline-none focus:border-burgundy/40 transition-colors"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu e-mail"
                      className="w-full text-xs text-burgundy bg-white border border-burgundy/15 rounded-xl
                        px-3 py-2.5 placeholder:text-burgundy/25
                        focus:outline-none focus:border-burgundy/40 transition-colors"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={taxId}
                      onChange={(e) =>
                        setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))
                      }
                      placeholder="CPF (somente números)"
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

                  {/* Payment method selector */}
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-burgundy/70">
                      Forma de pagamento
                    </p>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PIX")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border
                        transition-colors text-xs
                        ${
                          paymentMethod === "PIX"
                            ? "border-burgundy bg-burgundy/5"
                            : "border-burgundy/15 bg-white hover:border-burgundy/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-burgundy">PIX</span>
                        <span className="bg-gold/40 text-burgundy px-2 py-0.5 rounded-full font-medium text-[10px]">
                          com desconto
                        </span>
                      </div>
                      {paymentMethod === "PIX" && (
                        <Check size={14} className="text-burgundy flex-shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border
                        transition-colors text-xs
                        ${
                          paymentMethod === "CARD"
                            ? "border-burgundy bg-burgundy/5"
                            : "border-burgundy/15 bg-white hover:border-burgundy/30"
                        }`}
                    >
                      <span className="font-semibold text-burgundy">
                        Cartão de Crédito
                      </span>
                      {paymentMethod === "CARD" && (
                        <Check size={14} className="text-burgundy flex-shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-burgundy/60 font-medium">
                      {paymentMethod === "PIX" ? "Total com PIX" : "Subtotal"}
                    </span>
                    <div className="flex items-baseline gap-2">
                      {paymentMethod === "PIX" && (
                        <span className="font-display text-burgundy/30 text-sm tabular-nums line-through">
                          R$ {fmt(cardTotal)}
                        </span>
                      )}
                      <span className="font-display font-bold text-2xl text-burgundy tabular-nums">
                        R$ {fmt(displayTotal)}
                      </span>
                    </div>
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
                    {isSubmitting
                      ? "Processando..."
                      : paymentMethod === "PIX"
                      ? "Finalizar com PIX"
                      : "Ir para Pagamento"}
                  </button>

                  <p className="text-center text-burgundy/30 text-xs mt-3">
                    {paymentMethod === "PIX"
                      ? "Você receberá um QR Code para pagamento imediato"
                      : "Você será redirecionado para o ambiente seguro de pagamento"}
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {pixModalData && (
        <PixPaymentModal
          sessionId={pixModalData.sessionId}
          brCode={pixModalData.brCode}
          brCodeBase64={pixModalData.brCodeBase64}
          expiresAt={pixModalData.expiresAt}
          onClose={() => setPixModalData(null)}
        />
      )}

      {cardSessionId && (
        <CardWaitingOverlay
          sessionId={cardSessionId}
          onCancel={() => setCardSessionId(null)}
        />
      )}
    </>
  );
}
