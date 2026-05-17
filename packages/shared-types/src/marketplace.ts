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
}

export interface CheckoutResult {
  transactions: TransactionDto[];
  totalAmount: number;
}
