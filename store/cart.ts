import { create } from "zustand";
import { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  observation: string;
  addItem: (product: Product, additionals?: Product[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeAdditional: (cartItemId: string, additionalId: string) => void;
  addPhoto: (cartItemId: string, file: File) => void;
  removePhoto: (cartItemId: string, index: number) => void;
  setItemObservation: (cartItemId: string, text: string) => void;
  setItemMassa: (cartItemId: string, text: string) => void;
  setItemSabor: (cartItemId: string, text: string) => void;
  setObservation: (text: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  observation: "",

  addItem: (product, additionals = []) => {
    const id = `${product.id}-${Date.now()}`;
    set((state) => ({
      items: [...state.items, { id, product, quantity: 1, additionals, photos: [], observation: "", massa: "", sabor: "" }],
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
          ? { ...item, additionals: item.additionals.filter((a) => a.id !== additionalId) }
          : item
      ),
    }));
  },

  addPhoto: (cartItemId, file) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId && item.photos.length < 3
          ? { ...item, photos: [...item.photos, file] }
          : item
      ),
    }));
  },

  removePhoto: (cartItemId, index) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId
          ? { ...item, photos: item.photos.filter((_, i) => i !== index) }
          : item
      ),
    }));
  },

  setItemObservation: (cartItemId, text) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId ? { ...item, observation: text.slice(0, 500) } : item
      ),
    }));
  },

  setItemMassa: (cartItemId, text) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId ? { ...item, massa: text } : item
      ),
    }));
  },

  setItemSabor: (cartItemId, text) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId ? { ...item, sabor: text } : item
      ),
    }));
  },

  setObservation: (text) => set({ observation: text.slice(0, 500) }),

  clearCart: () => set({ items: [], observation: "" }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  // Returns centavos using pixPrice as reference (for display when no method is selected)
  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const additionalsTotal = item.additionals.reduce((s, a) => s + a.pixPrice, 0);
      return sum + (item.product.pixPrice + additionalsTotal) * item.quantity;
    }, 0);
  },

  itemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
