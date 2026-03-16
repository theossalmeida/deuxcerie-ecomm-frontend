export type Category = 'Torta' | 'Bolo' | 'Adicional';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  emoji?: string;
}

export interface CartItem {
  id: string; // unique cart entry id
  product: Product;
  quantity: number;
  additionals: Product[];
}
