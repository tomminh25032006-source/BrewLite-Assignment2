export interface Product {
  id: string;
  name: string;
  category: 'COFFEE' | 'TEA' | 'ICE_BLENDED' | 'SNACK';
  price: number;
  imageUrl: string;
  description: string;
  stock: number;
  version: number;
  isActive: boolean;
  sizeOptions: { size: 'S' | 'M' | 'L'; extraPrice: number }[];
  toppingOptions: { id: string; name: string; price: number }[];
}

export interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item id: productId + size + toppings key
  productId: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  size: 'S' | 'M' | 'L';
  toppings: SelectedTopping[];
  unitPrice: number;
  qty: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  size: 'S' | 'M' | 'L';
  selectedToppings: { id: string; name: string; price: number }[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  total: number;
  discountAmount: number;
  finalAmount: number;
  promotionCode?: string;
  items: OrderItemDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: 'CUSTOMER' | 'STAFF';
  loyaltyPoints: number;
}
