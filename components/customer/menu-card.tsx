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
    <article className="menu-card">
      <div
        className="menu-card-image"
        style={{
          backgroundImage: `linear-gradient(rgba(36,23,15,.12), rgba(36,23,15,.12)), url(${item.imageUrl})`
        }}
      >
        {item.category && <span className="menu-card-category">{item.category}</span>}
      </div>
      <div className="menu-card-body">
        <h3 className="menu-card-title">{item.name}</h3>
        <p className="menu-card-desc">{item.description}</p>
        <div className="menu-card-footer">
          <div className="menu-card-meta">
            <strong className="menu-card-price">{formatCurrency(item.price)}</strong>
            <span className="menu-card-time">
              <Clock3 size={12} />
              {item.prepTime} د
            </span>
          </div>
          <button
            className="button button-primary menu-card-add"
            onClick={() => onAdd(item)}
            aria-label="إضافة إلى السلة"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
