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
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateOrderNumber } from "@/lib/utils";
import { CartItem, CustomerInfo, DashboardStats, Order, OrderStatus } from "@/types";

const ordersCollection = collection(db, "orders");

function normalizeOrder(id: string, data: Record<string, unknown>): Order {
  const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt);
  const updated = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : String(data.updatedAt);

  return {
    id,
    orderNumber: String(data.orderNumber),
    customer: data.customer as Order["customer"],
    items: data.items as Order["items"],
    subtotal: Number(data.subtotal),
    deliveryFee: Number(data.deliveryFee),
    total: Number(data.total),
    status: data.status as OrderStatus,
    driverId: (data.driverId as string | null | undefined) ?? null,
    driverName: (data.driverName as string | null | undefined) ?? null,
    createdAt: created,
    updatedAt: updated
  };
}

export async function createOrder(payload: {
  customer: CustomerInfo;
  items: CartItem[];
  deliveryFee?: number;
}) {
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = payload.deliveryFee ?? 150;
  const orderNumber = generateOrderNumber();

  const orderData = {
    orderNumber,
    customer: payload.customer,
    items: payload.items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: "pending" as OrderStatus,
    driverId: null,
    driverName: null,
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
    query(ordersCollection, where("status", "in", ["confirmed", "assigned", "picked_up", "out_for_delivery"])),
    (snapshot) => {
      callback(snapshot.docs.map((entry) => normalizeOrder(entry.id, entry.data())));
    }
  );
}

export function subscribeToDriverOrders(driverId: string, callback: (orders: Order[]) => void) {
  return onSnapshot(query(ordersCollection, where("driverId", "==", driverId)), (snapshot) => {
    callback(snapshot.docs.map((entry) => normalizeOrder(entry.id, entry.data())));
  });
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
