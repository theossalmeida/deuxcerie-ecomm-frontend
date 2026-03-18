"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, X, QrCode } from "lucide-react";
import { getCheckoutSessionStatus } from "@/lib/api";
import { useCartStore } from "@/store/cart";

interface PixPaymentModalProps {
  sessionId: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
  onClose: () => void;
}

export function PixPaymentModal({
  sessionId,
  brCode,
  brCodeBase64,
  expiresAt,
  onClose,
}: PixPaymentModalProps) {
  const { clearCart } = useCartStore();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  const isExpired = timeLeft <= 0;

  // Countdown timer
  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  // Polling for payment confirmation
  const handlePaid = useCallback(
    (orderId: string) => {
      clearCart();
      window.location.href = `/payment/success?orderId=${orderId}`;
    },
    [clearCart]
  );

  useEffect(() => {
    if (isExpired) return;
    const interval = setInterval(async () => {
      try {
        const status = await getCheckoutSessionStatus(sessionId);
        if (status.status === "paid" && status.orderId) {
          clearInterval(interval);
          handlePaid(status.orderId);
        }
      } catch {
        // silent — keep polling
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, isExpired, handlePaid]);

  async function handleCopy() {
    await navigator.clipboard.writeText(brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const countdownColor =
    timeLeft > 120
      ? "text-burgundy"
      : timeLeft > 30
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pix-modal-title"
    >
      <div className="bg-cream rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-burgundy px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="text-rose" size={20} />
            <div>
              <h2
                id="pix-modal-title"
                className="text-cream font-display font-semibold text-lg"
              >
                Pague com PIX
              </h2>
              <p className="text-cream/50 text-xs mt-0.5">
                Escaneie o QR Code ou copie o código
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isExpired ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-burgundy font-semibold text-base">
                PIX expirado
              </p>
              <p className="text-burgundy/50 text-sm">
                Feche este modal e tente novamente.
              </p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl border border-burgundy/10 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brCodeBase64}
                    alt="QR Code PIX"
                    className="w-44 h-44 object-contain"
                  />
                </div>
              </div>

              {/* Countdown */}
              <p className="text-center text-sm text-burgundy/50">
                Expira em{" "}
                <span
                  className={`font-mono font-bold tabular-nums ${countdownColor}`}
                >
                  {minutes}:{seconds}
                </span>
              </p>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 border-2 border-burgundy
                  text-burgundy rounded-xl py-3 text-sm font-semibold
                  hover:bg-burgundy/5 active:scale-[0.99] transition-all"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-burgundy" />
                    <span>Código copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar código PIX
                  </>
                )}
              </button>

              {/* Waiting indicator */}
              <p
                className="text-center text-xs text-burgundy/40 animate-pulse"
                role="status"
                aria-live="polite"
              >
                Aguardando confirmação do pagamento...
              </p>
            </>
          )}

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full text-xs text-burgundy/30 hover:text-burgundy/60 transition-colors underline"
          >
            Cancelar e voltar
          </button>
        </div>
      </div>
    </div>
  );
}
