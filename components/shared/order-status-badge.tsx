import { getOrderStatusClass, getOrderStatusLabel } from "@/lib/utils";
import { OrderStatus } from "@/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${getOrderStatusClass(status)}`}>{getOrderStatusLabel(status)}</span>;
}
