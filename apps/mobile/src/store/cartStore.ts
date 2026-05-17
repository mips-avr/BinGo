import { create } from 'zustand';
import type { MarketplaceItemDto } from '@bingo/shared-types';

export interface CartLine {
  item: MarketplaceItemDto;
  qty: number;
}

interface CartState {
  lines: Record<string, CartLine>;
  addItem: (item: MarketplaceItemDto, qty?: number) => void;
  setQty: (itemId: string, qty: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
  totalAmount: () => number;
  itemCount: () => number;
  toCheckoutItems: () => { itemId: string; qty: number }[];
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: {},

  addItem(item, qty = item.minOrderQty) {
    const nextQty = Math.max(qty, item.minOrderQty);
    set((s) => ({
      lines: {
        ...s.lines,
        [item.id]: {
          item,
          qty: s.lines[item.id] ? s.lines[item.id].qty + nextQty : nextQty,
        },
      },
    }));
  },

  setQty(itemId, qty) {
    const line = get().lines[itemId];
    if (!line) return;
    if (qty < line.item.minOrderQty) {
      set((s) => {
        const { [itemId]: _, ...rest } = s.lines;
        return { lines: rest };
      });
      return;
    }
    set((s) => ({
      lines: { ...s.lines, [itemId]: { ...line, qty } },
    }));
  },

  removeItem(itemId) {
    set((s) => {
      const { [itemId]: _, ...rest } = s.lines;
      return { lines: rest };
    });
  },

  clear() {
    set({ lines: {} });
  },

  totalAmount() {
    return Object.values(get().lines).reduce((sum, l) => sum + l.item.price * l.qty, 0);
  },

  itemCount() {
    return Object.values(get().lines).reduce((sum, l) => sum + l.qty, 0);
  },

  toCheckoutItems() {
    return Object.values(get().lines).map((l) => ({ itemId: l.item.id, qty: l.qty }));
  },
}));
