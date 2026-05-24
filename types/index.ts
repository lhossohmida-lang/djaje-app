export type UserRole = "admin" | "driver";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "cancelled";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice?: number;
  imageUrl: string;
  available: boolean;
  prepTime: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  driverId?: string | null;
  driverName?: string | null;
  orderType?: 'table' | 'takeout' | 'delivery';
  tableNumber?: number;
  takeoutNumber?: number;
  driverNumber?: number;
  isDelivery?: boolean;
  totalCost?: number;
  profit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfile {
  uid: string;
  fullName: string;
  phone: string;
  role: "driver";
}

export interface AdminProfile {
  uid: string;
  fullName: string;
  email: string;
  role: "admin";
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  availableDrivers: number;
}

export interface Ingredient {
  id?: string;
  name: string;
  unit: string;
  totalStock: number;
  totalSpent: number;
  purchaseCount: number;
  lastPurchaseAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface IngredientPurchase {
  id?: string;
  ingredientId: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  note?: string;
  createdAt: any;
}

