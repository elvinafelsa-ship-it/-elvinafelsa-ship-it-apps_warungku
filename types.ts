export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewMode = 'CUSTOMER' | 'ADMIN';

export const CATEGORIES = [
  'Makanan',
  'Minuman',
  'Rokok',
  'Sembako',
  'Lainnya'
];