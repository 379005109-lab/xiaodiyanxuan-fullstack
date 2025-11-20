import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

interface MockState {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string) => void;
}

const createSafeStorage = (): Storage => {
  const fallback = new Map<string, string>();
  const base = typeof window !== 'undefined' ? window.localStorage : undefined;

  return {
    get length() {
      return base?.length ?? fallback.size;
    },
    clear() {
      base?.clear();
      fallback.clear();
    },
    getItem(key: string) {
      return base?.getItem(key) ?? fallback.get(key) ?? null;
    },
    key(index: number) {
      if (base) return base.key(index);
      const keys = Array.from(fallback.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      base?.removeItem(key);
      fallback.delete(key);
    },
    setItem(key: string, value: string) {
      try {
        base?.setItem(key, value);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('[mockStore] localStorage quota exceeded, falling back to memory storage');
          fallback.set(key, value);
        } else {
          throw error;
        }
      }
      if (!base) {
        fallback.set(key, value);
      }
    },
  } as Storage;
};

export const useMockStore = create(
  persist<MockState>(
    (set) => ({
      products: [],
      addProduct: (product) =>
        set((state) => ({ products: [product, ...state.products] })),
      updateProduct: (id, productData) =>
        set((state) => ({
          products: state.products.map((p) =>
            p._id === id ? { ...p, ...productData } : p
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p._id !== id) })),
      toggleProductStatus: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p._id === id
              ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
              : p
          ),
        })),
    }),
    {
      name: 'mock-products',
      storage: createJSONStorage(createSafeStorage),
    }
  )
);
