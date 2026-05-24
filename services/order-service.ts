import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateOrderNumber } from "@/lib/utils";
import { CartItem, CustomerInfo, DashboardStats, Order, OrderStatus } from "@/types";

const ordersCollection = collection(db, "orders");

export const DELIVERY_FEE = 100;

function normalizeOrder(id: string, data: Record<string, unknown>): Order {
  const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt || "");
  const updated = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "");

  return {
    id,
    orderNumber: String(data.orderNumber || ""),
    customer: data.customer as Order["customer"],
    items: data.items as Order["items"],
    subtotal: Number(data.subtotal || 0),
    deliveryFee: Number(data.deliveryFee || 0),
    total: Number(data.total || 0),
    status: data.status as OrderStatus,
    driverId: (data.driverId as string | null | undefined) ?? null,
    driverName: (data.driverName as string | null | undefined) ?? null,
    orderType: data.orderType as Order["orderType"],
    tableNumber: data.tableNumber ? Number(data.tableNumber) : undefined,
    takeoutNumber: data.takeoutNumber ? Number(data.takeoutNumber) : undefined,
    driverNumber: data.driverNumber ? Number(data.driverNumber) : undefined,
    isDelivery: data.isDelivery !== undefined ? Boolean(data.isDelivery) : undefined,
    totalCost: data.totalCost ? Number(data.totalCost) : undefined,
    profit: data.profit ? Number(data.profit) : undefined,
    createdAt: created,
    updatedAt: updated
  };
}

export async function createOrder(payload: {
  customer: CustomerInfo;
  items: CartItem[];
  deliveryFee?: number;
  orderType?: 'table' | 'takeout' | 'delivery';
  tableNumber?: number;
  takeoutNumber?: number;
  driverNumber?: number;
}) {
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderType = payload.orderType || 'delivery';
  const isDelivery = orderType === 'delivery';
  const deliveryFee = isDelivery ? (payload.deliveryFee ?? DELIVERY_FEE) : 0;
  const total = subtotal + deliveryFee;

  const totalCost = payload.items.reduce((sum, item) => {
    const cost = item.costPrice !== undefined ? item.costPrice : (item.price * 0.6);
    return sum + cost * item.quantity;
  }, 0);

  const profit = total - totalCost;
  const orderNumber = generateOrderNumber();

  const orderData = {
    orderNumber,
    customer: payload.customer,
    items: payload.items,
    subtotal,
    deliveryFee,
    total,
    status: "pending" as OrderStatus,
    driverId: null,
    driverName: null,
    orderType,
    tableNumber: payload.tableNumber || null,
    takeoutNumber: payload.takeoutNumber || null,
    driverNumber: payload.driverNumber || null,
    isDelivery,
    totalCost,
    profit,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(ordersCollection, orderData);
  return {
    id: ref.id,
    orderNumber
  };
}

export async function createAdminOrder(payload: {
  customer: CustomerInfo;
  items: CartItem[];
  deliveryFee?: number;
  orderType: 'table' | 'takeout' | 'delivery';
  tableNumber?: number;
  takeoutNumber?: number;
  driverNumber?: number;
}) {
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderType = payload.orderType;
  const isDelivery = orderType === 'delivery';
  const deliveryFee = isDelivery ? (payload.deliveryFee ?? DELIVERY_FEE) : 0;
  const total = subtotal + deliveryFee;

  const totalCost = payload.items.reduce((sum, item) => {
    const cost = item.costPrice !== undefined ? item.costPrice : (item.price * 0.6);
    return sum + cost * item.quantity;
  }, 0);

  const profit = total - totalCost;
  const orderNumber = generateOrderNumber();

  const orderData = {
    orderNumber,
    customer: payload.customer,
    items: payload.items,
    subtotal,
    deliveryFee,
    total,
    status: "preparing" as OrderStatus, // starts in preparing for the kitchen
    driverId: null,
    driverName: null,
    orderType,
    tableNumber: payload.tableNumber || null,
    takeoutNumber: payload.takeoutNumber || null,
    driverNumber: payload.driverNumber || null,
    isDelivery,
    totalCost,
    profit,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(ordersCollection, orderData);
  return {
    id: ref.id,
    orderNumber
  };
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(query(ordersCollection, orderBy("createdAt", "desc")), (snapshot) => {
    callback(snapshot.docs.map((entry) => normalizeOrder(entry.id, entry.data())));
  });
}

export function subscribeToAvailableOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(
    query(ordersCollection, where("status", "in", ["pending", "confirmed"])),
    (snapshot) => {
      const orders = snapshot.docs
        .map((entry) => normalizeOrder(entry.id, entry.data()))
        .filter((order) => !order.driverId);
      callback(orders);
    }
  );
}

export function subscribeToDriverOrders(driverId: string, callback: (orders: Order[]) => void) {
  return onSnapshot(query(ordersCollection, where("driverId", "==", driverId)), (snapshot) => {
    const orders = snapshot.docs
      .map((entry) => normalizeOrder(entry.id, entry.data()))
      .filter((order) => order.status !== "delivered");
    callback(orders);
  });
}

export function subscribeToDriverDelivered(driverId: string, callback: (orders: Order[]) => void) {
  return onSnapshot(
    query(ordersCollection, where("driverId", "==", driverId), where("status", "==", "delivered")),
    (snapshot) => {
      callback(snapshot.docs.map((entry) => normalizeOrder(entry.id, entry.data())));
    }
  );
}

export async function assignOrderToDriver(orderId: string, driverId: string, driverName: string) {
  await updateDoc(doc(db, "orders", orderId), {
    driverId,
    driverName,
    status: "assigned",
    updatedAt: serverTimestamp()
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function getOrderByNumber(orderNumber: string) {
  const snapshot = await getDocs(query(ordersCollection, where("orderNumber", "==", orderNumber)));
  if (snapshot.empty) {
    return null;
  }

  const first = snapshot.docs[0];
  return normalizeOrder(first.id, first.data());
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const snapshot = await getDocs(ordersCollection);
  const orders = snapshot.docs.map((entry) => normalizeOrder(entry.id, entry.data()));

  return {
    totalOrders: orders.length,
    totalRevenue: orders.filter((order) => order.status === "delivered").reduce((sum, order) => sum + order.total, 0),
    activeOrders: orders.filter((order) => order.status !== "delivered").length,
    availableDrivers: new Set(orders.filter((order) => order.driverId).map((order) => order.driverId)).size
  };
}

export async function deleteOrder(orderId: string) {
  await deleteDoc(doc(db, "orders", orderId));
}
