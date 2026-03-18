"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getCheckoutSessionStatus } from "@/lib/api";
import { LoadingVideo } from "@/components/LoadingVideo";
import { useCartStore } from "@/store/cart";

interface CardWaitingOverlayProps {
  sessionId: string;
  onCancel: () => void;
}

export function CardWaitingOverlay({ sessionId, onCancel }: CardWaitingOverlayProps) {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [timedOut, setTimedOut] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const data = await getCheckoutSessionStatus(sessionId);
        if (data.status === "paid" && data.orderId) {
          clearInterval(intervalRef.current!);
          clearTimeout(timeoutRef.current!);
          clearTimeout(cancelRef.current!);
          clearCart();
          router.replace(`/payment/success?orderId=${data.orderId}`);
        }
      } catch {
        // rede instável — continua tentando
      }
    }

    check();
    intervalRef.current = setInterval(check, 2000);
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      clearTimeout(cancelRef.current!);
      setTimedOut(true);
    }, 3 * 60 * 1000);
    cancelRef.current = setTimeout(() => setShowCancel(true), 10_000);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
      clearTimeout(cancelRef.current!);
    };
  }, [sessionId, router, clearCart]);

  return (
    <div className="fixed inset-0 bg-cream z-[60] flex flex-col items-center justify-center gap-4 px-6 text-center">
      {timedOut ? (
        <>
          <AlertCircle className="text-burgundy/40" size={48} />
          <h1 className="font-display text-burgundy text-2xl font-semibold">
            Aguardando confirmação
          </h1>
          <p className="text-burgundy/60 text-sm max-w-xs">
            Seu pagamento ainda não foi confirmado. Se você pagou, o pedido será
            processado em breve. Entre em contato pelo WhatsApp se precisar de ajuda.
          </p>
          <button
            onClick={onCancel}
            className="mt-4 text-sm text-burgundy/50 underline underline-offset-2"
          >
            Voltar ao início
          </button>
        </>
      ) : (
        <>
          <LoadingVideo size={220} />
          <div>
            <h1 className="font-display text-burgundy text-2xl font-semibold">
              Esperando pagamento...
            </h1>
            <p className="text-burgundy/50 text-sm mt-2">
              Conclua o pagamento na aba que foi aberta
            </p>
          </div>
          {showCancel && (
            <button
              onClick={onCancel}
              className="mt-2 text-sm text-burgundy/40 underline underline-offset-2"
            >
              Não finalizou o pagamento? Cancelar
            </button>
          )}
        </>
      )}
    </div>
  );
}
