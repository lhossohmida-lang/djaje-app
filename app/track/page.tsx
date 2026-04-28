"use client";

import { useState } from "react";
import { BackButton } from "@/components/shared/back-button";
import { Header } from "@/components/shared/header";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderByNumber } from "@/services/order-service";
import { Order } from "@/types";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await getOrderByNumber(orderNumber);
      setOrder(result);
    } catch (error) {
      console.error(error);
      window.alert("تعذر جلب حالة الطلب الآن.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-shell section">
        <div className="back-row">
          <BackButton />
        </div>
        <section className="card" style={{ padding: "2rem", maxWidth: 820, margin: "0 auto" }}>
          <h1>تتبع الطلب</h1>
          <p style={{ color: "var(--muted)" }}>أدخل رقم الطلب لمتابعة حالته لحظيًا.</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="مثال: DJ-20260428-1234"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              style={{ flex: 1 }}
            />
            <button className="button button-primary" type="submit" disabled={isLoading}>
              {isLoading ? "جارٍ البحث..." : "بحث"}
            </button>
          </form>

          {order ? (
            <div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
                <div>
                  <h2 style={{ margin: 0 }}>{order.orderNumber}</h2>
                  <p style={{ color: "var(--muted)" }}>{formatDate(order.createdAt)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="grid" style={{ marginTop: "1rem" }}>
                <div>
                  <strong>الزبون:</strong> {order.customer.name}
                </div>
                <div>
                  <strong>الهاتف:</strong> {order.customer.phone}
                </div>
                <div>
                  <strong>العنوان:</strong> {order.customer.address}
                </div>
                <div>
                  <strong>الإجمالي:</strong> {formatCurrency(order.total)}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
