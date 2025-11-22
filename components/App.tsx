import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, ViewMode, CATEGORIES } from './types';
import { getProducts, saveProducts } from './utils/storage';
import { generateReceipt } from './utils/pdfGenerator';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, PrinterIcon, UserIcon, PencilIcon } from './components/icons';

// -- Components defined internally for simplicity --

// 1. Product Card (Customer View)
const ProductCard: React.FC<{ product: Product; onAdd: (p: Product) => void }> = ({ product, onAdd }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
    <div className="h-40 w-full bg-gray-200 relative">
       <img 
         src={product.image} 
         alt={product.name} 
         className="w-full h-full object-cover"
         onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'; }}
       />
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-bold text-madura-red uppercase tracking-wide">{product.category}</span>
          <h3 className="font-bold text-gray-800 line-clamp-1">{product.name}</h3>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="text-lg font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</span>
        <button 
          onClick={() => onAdd(product)}
          className="bg-madura-red hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-transform active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

// 2. Pin Modal (Replaces Browser Prompt)
const PinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 animate-scale-in">
          <h3 className="text-xl font-bold text-center mb-6 text-gray-800">Login Admin</h3>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              className={`w-full text-center text-3xl tracking-[0.5em] p-3 border rounded-lg mb-4 outline-none transition-all font-bold text-gray-700 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-madura-red focus:ring-2 focus:ring-red-100'}`}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
            />
            {error && <p className="text-red-500 text-sm text-center mb-4 font-medium">PIN Salah (Default: 1234)</p>}
            
            <button type="submit" className="w-full py-3 bg-madura-red text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200 transition-transform active:scale-95">
              Masuk
            </button>
            <button type="button" onClick={onClose} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-800">
              Batal
            </button>
          </form>
       </div>
    </div>
  );
};

// 3. Payment Modal
const PaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (cash: number) => void;
}> = ({ isOpen, onClose, total, onConfirm }) => {
  const [cash, setCash] = useState<number>(0);
  
  useEffect(() => {
    if (isOpen) setCash(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const change = cash - total;
  const isValid = cash >= total;

  // Generate quick cash suggestions
  const rawSuggestions = [total, 10000, 20000, 50000, 100000];
  // Add Next multiple of 10k/50k if not in list
  if (total % 50000 !== 0) rawSuggestions.push(Math.ceil(total / 50000) * 50000);
  if (total % 10000 !== 0) rawSuggestions.push(Math.ceil(total / 10000) * 10000);
  
  const uniqueSuggestions = Array.from(new Set(rawSuggestions))
    .filter(amt => amt >= total)
    .sort((a, b) => a - b)
    .slice(0, 4); // Take top 4 relevant suggestions

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Pembayaran</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-center border border-gray-200">
             <span className="text-gray-500 text-sm block mb-1">Total Tagihan</span>
             <span className="text-3xl font-bold text-madura-red">Rp {total.toLocaleString('id-ID')}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Uang Tunai (Cash)</label>
            <input 
               type="number" 
               className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-madura-red outline-none font-bold text-gray-800"
               placeholder="0"
               value={cash || ''}
               onChange={(e) => setCash(Number(e.target.value))}
               autoFocus
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
             {uniqueSuggestions.map(amt => (
               <button 
                 key={amt}
                 onClick={() => setCash(amt)}
                 className="flex-1 min-w-[80px] px-2 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded text-sm font-medium border border-gray-200 transition-colors"
               >
                 {amt === total ? 'Uang Pas' : (amt >= 1000 ? (amt/1000) + 'k' : amt)}
               </button>
             ))}
          </div>

          <div className="flex justify-between items-center mb-6 p-3 bg-blue-50 rounded border border-blue-100">
             <span className="text-blue-800 font-medium">Kembalian</span>
             <span className={`text-xl font-bold ${isValid ? 'text-blue-800' : 'text-gray-400'}`}>
               Rp {Math.max(0, change).toLocaleString('id-ID')}
             </span>
          </div>

          <div className="flex gap-3">
             <button onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Batal</button>
             <button 
               disabled={!isValid}
               onClick={() => onConfirm(cash)}
               className="flex-1 py-3 bg-madura-red text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-colors flex justify-center items-center gap-2"
             >
               <PrinterIcon className="w-5 h-5" /> Bayar
             </button>
          </div>
       </div>
    </div>
  )
}

// 4. Cart Drawer/Modal
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}> = ({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckout }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-5 bg-madura-red text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCartIcon className="w-6 h-6" /> Keranjang Belanja
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <p>Keranjang masih kosong.</p>
              <button onClick={onClose} className="mt-4 text-madura-red font-medium">Mulai Belanja</button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                <img src={item.image} className="w-16 h-16 object-cover rounded-md bg-gray-100" alt="" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                  <p className="text-gray-500 text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"><MinusIcon className="w-4 h-4" /></button>
                    <span className="font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"><PlusIcon className="w-4 h-4" /></button>
                    <button onClick={() => onRemove(item.id)} className="ml-auto text-red-500 hover:text-red-700 text-sm"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total Tagihan</span>
              <span className="text-2xl font-bold text-madura-red">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-madura-red text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
            >
               Lanjut Pembayaran
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Admin Panel
const AdminPanel: React.FC<{
  products: Product[];
  onUpdateProducts: (p: Product[]) => void;
}> = ({ products, onUpdateProducts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', price: 0, category: CATEGORIES[0], image: ''
  });

  const handleDelete = (id: string) => {
    if(window.confirm("Hapus produk ini?")) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ ...product });
    setIsAdding(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name || !formData.price) return;

    if (editingId) {
        // Update existing
        const updated = products.map(p => p.id === editingId ? {
            ...p,
            name: formData.name!,
            price: Number(formData.price),
            category: formData.category || 'Lainnya',
            image: formData.image || 'https://via.placeholder.com/150'
        } : p);
        onUpdateProducts(updated);
    } else {
        // Create new
        const newProduct: Product = {
            id: Date.now().toString(),
            name: formData.name!,
            price: Number(formData.price),
            category: formData.category || 'Lainnya',
            image: formData.image || 'https://via.placeholder.com/150'
        };
        onUpdateProducts([...products, newProduct]);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, category: CATEGORIES[0], image: '' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, category: CATEGORIES[0], image: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
        <button 
          onClick={() => {
            if(isAdding) handleCancel();
            else setIsAdding(true);
          }}
          className={`${isAdding ? 'bg-gray-200 text-gray-800' : 'bg-gray-800 text-white'} px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors`}
        >
          {isAdding ? 'Batal' : <><PlusIcon className="w-5 h-5" /> Tambah Produk</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200 animate-scale-in">
          <h3 className="font-bold mb-4 text-lg">{editingId ? 'Edit Produk' : 'Tambah Menu Baru'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-madura-red outline-none"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-madura-red outline-none"
                value={formData.price || ''} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                className="w-full border border-gray-300 rounded p-2"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
              <div className="flex gap-3 items-center">
                <label className="cursor-pointer bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                    Upload Foto
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                </label>
                {formData.image && (
                    <div className="relative group">
                        <img src={formData.image} alt="Preview" className="h-12 w-12 object-cover rounded border border-gray-200" />
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, image: ''})}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            &times;
                        </button>
                    </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 mt-2">
               <button type="button" onClick={handleCancel} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 font-medium">Batal</button>
              <button type="submit" className="flex-1 bg-madura-red text-white py-2 rounded hover:bg-red-700 font-bold">
                  {editingId ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img src={product.image} alt="" className="h-10 w-10 rounded-full object-cover border" />
                  <span className="font-medium text-gray-900">{product.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {product.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -- MAIN APP --
const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('CUSTOMER');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckoutInit = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentConfirm = (cash: number) => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const change = cash - total;
    
    generateReceipt(cart, total, cash, change);
    
    setIsPaymentOpen(false);
    setIsCartOpen(false);
    setCart([]);
  };

  const handleLoginClick = () => {
    if (view === 'CUSTOMER') {
      setIsPinModalOpen(true);
    } else {
      setView('CUSTOMER');
    }
  };

  const handlePinSuccess = () => {
    setView('ADMIN');
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-madura-red shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full">
               <img src="https://cdn-icons-png.flaticon.com/512/3081/3081840.png" alt="Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight tracking-wide">WARUNG MADURA</h1>
              <p className="text-xs text-red-100 font-medium">Online 24 Jam</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={handleLoginClick}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              title={view === 'CUSTOMER' ? "Login Admin" : "Logout Admin"}
            >
              <UserIcon className={`w-6 h-6 ${view === 'ADMIN' ? 'text-yellow-300' : ''}`} />
            </button>

            {view === 'CUSTOMER' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative bg-white text-madura-red p-2 rounded-full shadow-md hover:scale-105 transition-transform"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-600">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {view === 'ADMIN' ? (
        <AdminPanel products={products} onUpdateProducts={handleUpdateProducts} />
      ) : (
        <main className="container mx-auto px-4 py-6">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
             <button 
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-madura-red text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                Semua
              </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-madura-red text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
             <div className="text-center py-20 text-gray-500">
                <p className="text-xl">Tidak ada produk di kategori ini.</p>
             </div>
          )}
        </main>
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckout={handleCheckoutInit}
      />

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={cartTotal}
        onConfirm={handlePaymentConfirm}
      />

      {/* Pin Modal */}
      <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
