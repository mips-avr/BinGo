export const TransactionStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export interface MarketplaceItemDto {
  id: string;
  supplierName: string;
  itemName: string;
  description: string;
  /** Harga dalam Rupiah (IDR), tanpa desimal. */
  price: number;
  minOrderQty: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface CartItem {
  itemId: string;
  qty: number;
}

export interface CheckoutRequest {
  items: CartItem[];
}

export interface TransactionDto {
  id: string;
  buyerId: string;
  itemId: string;
  qty: number;
  totalPrice: number;
  status: TransactionStatus;
  createdAt: string;
  /**
   * Produk yang dibeli, disertakan agar layar pesanan tidak perlu memanggil
   * `GET /marketplace/items/:id` satu per satu untuk setiap baris riwayat.
   *
   * Selalu terisi pada `GET /marketplace/transactions/mine`. Tidak terisi pada
   * respons `POST /marketplace/checkout`, karena di sana pemanggil sudah
   * memegang data produk dari keranjangnya sendiri.
   */
  item?: MarketplaceItemDto;
}

export interface CheckoutResult {
  transactions: TransactionDto[];
  totalAmount: number;
}
