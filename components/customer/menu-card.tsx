"use client";

import { Clock3, Plus } from "lucide-react";
import { MenuItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function MenuCard({
  item,
  onAdd
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <article className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          height: 210,
          backgroundImage: `linear-gradient(rgba(36,23,15,.12), rgba(36,23,15,.12)), url(${item.imageUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      />
      <div style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>{item.name}</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{item.description}</p>
          </div>
          <span className="badge">{item.category}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem" }}>
          <div>
            <strong>{formatCurrency(item.price)}</strong>
            <div className="badge" style={{ marginTop: ".5rem" }}>
              <Clock3 size={14} />
              {item.prepTime} دقيقة
            </div>
          </div>
          <button className="button button-primary" onClick={() => onAdd(item)}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
