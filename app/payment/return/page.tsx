"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getCheckoutSessionStatus } from "@/lib/api";
import { LoadingVideo } from "@/components/LoadingVideo";

function PaymentReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");

  const [status, setStatus] = useState<"polling" | "timeout" | "error">("polling");
  const [showCancel, setShowCancel] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    async function check() {
      try {
        const data = await getCheckoutSessionStatus(sessionId!);
        if (data.status === "paid" && data.orderId) {
          clearInterval(intervalRef.current!);
          clearTimeout(timeoutRef.current!);
          clearTimeout(cancelRef.current!);
          router.replace(`/payment/success?orderId=${data.orderId}`);
        }
      } catch {
        // Rede instável — continua tentando até o timeout
      }
    }

    check();
    intervalRef.current = setInterval(check, 2000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      clearTimeout(cancelRef.current!);
      setStatus("timeout");
    }, 3 * 60 * 1000);

    cancelRef.current = setTimeout(() => setShowCancel(true), 10_000);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
      clearTimeout(cancelRef.current!);
    };
  }, [sessionId, router]);

  if (status === "timeout") {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <AlertCircle className="text-burgundy/40" size={48} />
        <h1 className="font-display text-burgundy text-2xl font-semibold">
          Aguardando confirmação
        </h1>
        <p className="text-burgundy/60 text-sm max-w-xs">
          Seu pagamento ainda não foi confirmado. Se você pagou, o pedido será
          processado em breve. Entre em contato pelo WhatsApp se precisar de ajuda.
        </p>
        <a href="/" className="mt-4 text-sm text-burgundy/50 underline underline-offset-2">
          Voltar para o início
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <AlertCircle className="text-red-400" size={48} />
        <h1 className="font-display text-burgundy text-2xl font-semibold">
          Link inválido
        </h1>
        <p className="text-burgundy/60 text-sm">
          Não foi possível identificar sua sessão de pagamento.
        </p>
        <a href="/" className="mt-4 text-sm text-burgundy/50 underline underline-offset-2">
          Voltar para o início
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
      <LoadingVideo size={220} />
      <div className="text-center">
        <h1 className="font-display text-burgundy text-2xl font-semibold">
          Confirmando pagamento...
        </h1>
        <p className="text-burgundy/50 text-sm mt-2">Aguarde alguns instantes</p>
      </div>
      {showCancel && (
        <a href="/" className="mt-2 text-sm text-burgundy/40 underline underline-offset-2">
          Não finalizou o pagamento? Voltar ao início
        </a>
      )}
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense>
      <PaymentReturnContent />
    </Suspense>
  );
}
