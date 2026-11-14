import { create } from 'zustand';
import { CartItem, Product, SelectedTopping } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    size: 'S' | 'M' | 'L',
    toppings: SelectedTopping[],
    qty: number,
  ) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => {
  // Đọc từ LocalStorage
  let initialItems: CartItem[] = [];
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('brewlite_cart');
    if (saved) {
      try {
        initialItems = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
  }

  const persist = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_cart', JSON.stringify(items));
    }
  };

  return {
    items: initialItems,

    addItem: (product, size, toppings, qty) => {
      // Phụ thu size theo cấu hình của từng món (backend tính giá giống hệt)
      const sizeExtra = product.sizeOptions.find((s) => s.size === size)?.extraPrice ?? 0;

      const toppingsExtra = toppings.reduce((acc, t) => acc + t.price, 0);
      const unitPrice = product.price + sizeExtra + toppingsExtra;

      // Sinh ID định danh duy nhất dựa theo món + size + toppings đã chọn
      const toppingKey = toppings
        .map((t) => t.id)
        .sort()
        .join('-');
      const compoundId = `${product.id}_${size}_${toppingKey}`;

      set((state) => {
        const existingIndex = state.items.findIndex((item) => item.id === compoundId);
        let newItems: CartItem[];

        if (existingIndex > -1) {
          newItems = [...state.items];
          newItems[existingIndex].qty += qty;
        } else {
          newItems = [
            ...state.items,
            {
              id: compoundId,
              productId: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              basePrice: product.price,
              size,
              toppings,
              unitPrice,
              qty,
            },
          ];
        }

        persist(newItems);
        return { items: newItems };
      });
    },

    updateQty: (id: string, qty: number) => {
      set((state) => {
        let newItems: CartItem[];
        if (qty <= 0) {
          newItems = state.items.filter((item) => item.id !== id);
        } else {
          newItems = state.items.map((item) =>
            item.id === id ? { ...item, qty } : item,
          );
        }
        persist(newItems);
        return { items: newItems };
      });
    },

    removeItem: (id: string) => {
      set((state) => {
        const newItems = state.items.filter((item) => item.id !== id);
        persist(newItems);
        return { items: newItems };
      });
    },

    clearCart: () => {
      persist([]);
      set({ items: [] });
    },

    getTotalItems: () => {
      return get().items.reduce((sum, item) => sum + item.qty, 0);
    },

    getSubtotal: () => {
      return get().items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    },
  };
});
