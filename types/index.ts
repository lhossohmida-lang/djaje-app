export type UserRole = "admin" | "driver";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
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
