import { useCartStore } from '../cartStore';

const sampleItem = {
  id: 'item-1',
  supplierName: 'EcoSupply',
  itemName: 'Sedotan bambu',
  description: 'Ramah lingkungan',
  price: 500,
  minOrderQty: 100,
  stock: 500,
  imageUrl: null,
  createdAt: '2026-05-17T00:00:00.000Z',
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('menambah item dengan kuantitas minimal', () => {
    useCartStore.getState().addItem(sampleItem);
    const lines = Object.values(useCartStore.getState().lines);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.qty).toBe(100);
  });

  it('menghitung total dan payload checkout', () => {
    useCartStore.getState().addItem(sampleItem, 200);
    expect(useCartStore.getState().totalAmount()).toBe(100_000);
    expect(useCartStore.getState().toCheckoutItems()).toEqual([
      { itemId: 'item-1', qty: 200 },
    ]);
  });

  it('menghapus baris saat qty di bawah minimal', () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().setQty('item-1', 50);
    expect(Object.keys(useCartStore.getState().lines)).toHaveLength(0);
  });
});
