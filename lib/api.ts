import { CartItem, OrderResult, Product } from "@/types";

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  size: string | null;
  price?: number;      // legacy — centavos, used as fallback
  pixPrice?: number;   // centavos
  cardPrice?: number;  // centavos
  productStatus: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5056";

const R2_BASE_URL = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? "").replace(/\/$/, "");

// Maps known backend error patterns to user-friendly messages (F8)
const ERROR_MAP: Array<[string, string]> = [
  ["paidPrice", "Um produto teve uma atualização de preço. Recarregue a página e tente novamente."],
  ["não encontrado ou inativo", "Um produto não está mais disponível. Recarregue e tente novamente."],
  ["Data de entrega", "A data de entrega selecionada não está disponível."],
  ["Arquivo", "Um arquivo de referência é muito grande ou inválido."],
  ["paymentMethod", "Método de pagamento inválido."],
  ["massa", "Informe a massa do bolo antes de continuar."],
  ["sabor", "Informe o sabor do recheio antes de continuar."],
];

function getFriendlyError(raw: string): string {
  for (const [key, msg] of ERROR_MAP) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return msg;
  }
  return "Ocorreu um erro ao processar seu pedido. Tente novamente.";
}

function mapProduct(p: ApiProduct): Product {
  const base = p.price ?? 0;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    category: ((p.category ?? "bolo").toLowerCase()) as Product["category"],
    pixPrice: p.pixPrice ?? Math.round(base * 0.95),
    cardPrice: p.cardPrice ?? Math.round(base * 1.05),
    status: p.productStatus ? "active" : "inactive",
    imageUrl: p.image && R2_BASE_URL ? `${R2_BASE_URL}/${p.image}` : undefined,
    size: p.size ?? undefined,
  };
}

export interface OrderPayload {
  clientName: string;
  clientMobile: string;
  email: string;
  taxId: string;
  deliveryDate: string; // ISO date string
  deliveryType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: string; // required when deliveryType === 'DELIVERY'
  items: CartItem[];
  paymentMethod: 'PIX' | 'CARD';
}

export type { OrderResult };

export async function submitOrder(payload: OrderPayload): Promise<OrderResult> {
  const formData = new FormData();
  formData.append("clientName", payload.clientName);
  formData.append("clientMobile", payload.clientMobile);
  formData.append("email", payload.email);
  formData.append("taxId", payload.taxId);
  formData.append("deliveryDate", payload.deliveryDate);

  type FlatItem = { productId: string; quantity: number; paidPrice: number; observation: string | null; massa: string | null; sabor: string | null };
  const flatItems: FlatItem[] = [];
  const photosMap: { index: number; files: File[] }[] = [];

  for (const cartItem of payload.items) {
    const mainIndex = flatItems.length;
    const isBolo = cartItem.product.category === "bolo";
    const unitPrice = payload.paymentMethod === "CARD"
      ? cartItem.product.cardPrice
      : cartItem.product.pixPrice;
    flatItems.push({
      productId: cartItem.product.id,
      quantity: cartItem.quantity,
      paidPrice: unitPrice,
      observation: cartItem.observation || null,
      massa: isBolo ? cartItem.massa || null : null,
      sabor: isBolo ? cartItem.sabor || null : null,
    });
    if (cartItem.photos.length > 0) {
      photosMap.push({ index: mainIndex, files: cartItem.photos });
    }
    for (const additional of cartItem.additionals) {
      const additionalPrice = payload.paymentMethod === "CARD"
        ? additional.cardPrice
        : additional.pixPrice;
      flatItems.push({
        productId: additional.id,
        quantity: cartItem.quantity,
        paidPrice: additionalPrice,
        observation: null,
        massa: null,
        sabor: null,
      });
    }
  }

  formData.append(
    "deliveryAddress",
    payload.deliveryType === "PICKUP" ? "Retirada" : (payload.deliveryAddress ?? "")
  );
  formData.append("paymentMethod", payload.paymentMethod);
  formData.append("items", JSON.stringify(flatItems));
  for (const { index, files } of photosMap) {
    files.forEach((file, j) => formData.append(`ref_${index}_${j}`, file));
  }

  const res = await fetch(`${API_URL}/api/v1/ecommerce/orders`, {
    method: "POST",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = (body as { error?: string }).error ?? `Erro ${res.status}`;
    throw new Error(getFriendlyError(raw));
  }

  return res.json() as Promise<OrderResult>;
}

export interface CheckoutSessionStatus {
  status: "pending" | "paid";
  orderId: string | null;
}

export async function getCheckoutSessionStatus(
  sessionId: string
): Promise<CheckoutSessionStatus> {
  const res = await fetch(
    `${API_URL}/api/v1/ecommerce/checkout-sessions/${sessionId}/status`,
    { headers: { "X-Requested-With": "XMLHttpRequest" } }
  );
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

// F14 — Retry with exponential backoff + 429 awareness
export async function fetchProducts(): Promise<Product[]> {
  const MAX_RETRIES = 3;
  let lastError: Error = new Error("Falha ao carregar produtos.");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_URL}/api/v1/ecommerce/products`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
        throw new Error(`Muitas tentativas. Tente novamente em ${retryAfter} segundos.`);
      }

      if (!res.ok) throw new Error(`Erro ${res.status}`);

      const data: ApiProduct[] = await res.json();
      return data.map(mapProduct);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry rate-limit errors — the wait time is server-determined
      if (lastError.message.startsWith("Muitas tentativas")) throw lastError;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
