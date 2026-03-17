import { CartItem, Product } from "@/types";

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  size: string | null;
  price: number;
  productStatus: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5056";

const R2_BASE_URL = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? "").replace(/\/$/, "");

function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    category: ((p.category ?? "bolo").toLowerCase()) as Product["category"],
    price: p.price / 100,
    status: p.productStatus ? "active" : "inactive",
    imageUrl: p.image && R2_BASE_URL ? `${R2_BASE_URL}/${p.image}` : undefined,
    size: p.size ?? undefined,
  };
}

export interface OrderPayload {
  clientName: string;
  clientMobile: string;
  deliveryDate: string; // ISO date string
  items: CartItem[];
}

export interface OrderResult {
  orderId: string;
  clientId: string;
  totalPaid: number;
}

export async function submitOrder(payload: OrderPayload): Promise<OrderResult> {
  const formData = new FormData();
  formData.append("clientName", payload.clientName);
  formData.append("clientMobile", payload.clientMobile);
  formData.append("deliveryDate", payload.deliveryDate);

  // Flatten cart items: main product first, then each additional as a separate line item
  type FlatItem = { productId: string; quantity: number; paidPrice: number; observation: string | null };
  const flatItems: FlatItem[] = [];
  const photosMap: { index: number; files: File[] }[] = [];

  for (const cartItem of payload.items) {
    const mainIndex = flatItems.length;
    flatItems.push({
      productId: cartItem.product.id,
      quantity: cartItem.quantity,
      paidPrice: Math.round(cartItem.product.price * 100),
      observation: cartItem.observation || null,
    });
    if (cartItem.photos.length > 0) {
      photosMap.push({ index: mainIndex, files: cartItem.photos });
    }
    for (const additional of cartItem.additionals) {
      flatItems.push({
        productId: additional.id,
        quantity: cartItem.quantity,
        paidPrice: Math.round(additional.price * 100),
        observation: null,
      });
    }
  }

  formData.append("items", JSON.stringify(flatItems));

  for (const { index, files } of photosMap) {
    files.forEach((file, j) => formData.append(`ref_${index}_${j}`, file));
  }

  const res = await fetch(`${API_URL}/api/v1/ecommerce/orders`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }

  return res.json() as Promise<OrderResult>;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/v1/ecommerce/products`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const data: ApiProduct[] = await res.json();
  return data.map(mapProduct);
}
