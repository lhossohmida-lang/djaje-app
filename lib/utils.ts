import { OrderStatus } from "@/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "بانتظار المراجعة";
    case "confirmed":
      return "قيد التحضير";
    case "assigned":
      return "تم تعيين سائق";
    case "picked_up":
      return "تم الاستلام";
    case "out_for_delivery":
      return "في الطريق";
    case "delivered":
      return "تم التوصيل";
    default:
      return status;
  }
}

export function getOrderStatusClass(status: OrderStatus) {
  switch (status) {
    case "delivered":
      return "status-delivered";
    case "picked_up":
    case "out_for_delivery":
      return "status-out-for-delivery";
    default:
      return "status-pending";
  }
}

export function generateOrderNumber() {
  const now = new Date();
  return `DJ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
}
