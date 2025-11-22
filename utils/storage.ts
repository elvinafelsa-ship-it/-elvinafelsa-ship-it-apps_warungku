import { Product } from '../types';

const STORAGE_KEY = 'warung_madura_products';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Indomie Goreng',
    price: 3500,
    category: 'Makanan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Indomie_Goreng.jpg/640px-Indomie_Goreng.jpg'
  },
  {
    id: '2',
    name: 'Kopi Good Day',
    price: 5000,
    category: 'Minuman',
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/10/27/9cc70901-3b7a-4543-8858-3e869979372d.jpg'
  },
  {
    id: '3',
    name: 'Telur Ayam (1kg)',
    price: 28000,
    category: 'Sembako',
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2022/6/22/b0234215-35d7-4053-85c4-f8f74c4a5c4e.jpg'
  },
  {
    id: '4',
    name: 'Aqua Botol 600ml',
    price: 4000,
    category: 'Minuman',
    image: 'https://images.tokopedia.net/img/cache/700/hDjmkQ/2023/2/8/81e23516-8526-4f44-8980-353915853189.jpg'
  },
  {
    id: '5',
    name: 'Marlboro Merah',
    price: 42000,
    category: 'Rokok',
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/3/10/e2770d35-65d7-4441-92a5-929110339740.jpg'
  }
];

export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};