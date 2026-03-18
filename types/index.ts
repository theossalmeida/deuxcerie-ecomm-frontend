export type Category = 'torta' | 'bolo' | 'adicional';

export type PaymentMethod = 'PIX' | 'CARD';

export interface OrderResult {
  sessionId: string;
  paymentMethod: PaymentMethod;
  // Card flow
  checkoutUrl?: string;
  // PIX flow
  brCode?: string;
  brCodeBase64?: string;
  expiresAt?: string; // ISO 8601
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  pixPrice: number;  // centavos — 5% discount (backend-calculated)
  cardPrice: number; // centavos — 5% surcharge (backend-calculated)
  status: 'active' | 'inactive';
  imageUrl?: string;
  emoji?: string;
  size?: string;
}

export interface GroupedProduct {
  name: string;
  description: string;
  category: Category;
  emoji?: string;
  variants: Product[];
}

export interface CartItem {
  id: string; // unique cart entry id
  product: Product;
  quantity: number;
  additionals: Product[];
  photos: File[]; // max 3, only for torta/bolo
  observation: string;
  massa: string;  // only for bolo, mandatory
  sabor: string;  // only for bolo, mandatory
}
