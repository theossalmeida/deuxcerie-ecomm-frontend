import { create } from "zustand";
import { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, additionals?: Product[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeAdditional: (cartItemId: string, additionalId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product, additionals = []) => {
    const id = `${product.id}-${Date.now()}`;
    set((state) => ({
      items: [...state.items, { id, product, quantity: 1, additionals }],
      isOpen: true,
    }));
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, delta) => {
    set((state) => ({
      items: state.items
        .map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  },

  removeAdditional: (cartItemId, additionalId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              additionals: item.additionals.filter((a) => a.id !== additionalId),
            }
          : item
      ),
    }));
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const additionalsTotal = item.additionals.reduce((s, a) => s + a.price, 0);
      return sum + (item.product.price + additionalsTotal) * item.quantity;
    }, 0);
  },

  itemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
