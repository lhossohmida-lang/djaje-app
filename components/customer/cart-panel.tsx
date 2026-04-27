"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";

export function CartPanel() {
  const { items, subtotal, addToCart, decreaseQuantity, removeFromCart } = useCart();

  return (
    <aside className="card" style={{ padding: "1rem", position: "sticky", top: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>السلة</h2>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>لم تتم إضافة أي وجبة بعد.</p>
      ) : (
        <>
          <div className="grid">
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: ".75rem",
                  paddingBottom: ".75rem",
                  borderBottom: "1px solid var(--border)"
                }}
              >
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ color: "var(--muted)" }}>
                    {item.quantity} x {formatCurrency(item.price)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <button className="button button-secondary" onClick={() => addToCart(item)} aria-label="زيادة">
                    <Plus size={16} />
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => decreaseQuantity(item.id)}
                    aria-label="تقليل"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
            <strong>المجموع</strong>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </>
      )}
    </aside>
  );
}
