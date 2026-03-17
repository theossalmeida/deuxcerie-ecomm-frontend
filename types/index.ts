export type Category = 'torta' | 'bolo' | 'adicional';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
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
}
