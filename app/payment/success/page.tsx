"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center gap-5">
      <CheckCircle className="text-rose" size={56} />

      <div className="space-y-2">
        <h1 className="font-display text-burgundy text-3xl font-semibold">
          Pedido confirmado!
        </h1>
        <p className="text-burgundy/60 text-sm max-w-xs">
          Seu pagamento foi aprovado e o pedido está sendo preparado.
          Entraremos em contato pelo WhatsApp em breve.
        </p>
      </div>

      {orderId && (
        <p className="text-burgundy/30 text-xs font-mono bg-white/60 rounded-xl px-4 py-2">
          #{orderId}
        </p>
      )}

      <Link
        href="/"
        className="mt-4 bg-rose text-cream px-8 py-3 rounded-xl font-bold text-sm
          hover:opacity-90 transition-opacity"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
