"use client";

import { useRef, useState } from "react";
import { Clock3, Plus } from "lucide-react";
import { MenuItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Bubble {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

export function MenuCard({
  item,
  onAdd
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  const [bursts, setBursts] = useState<{ id: number; bubbles: Bubble[] }[]>([]);
  const counter = useRef(0);

  function handleAdd() {
    const burstId = ++counter.current;
    const bubbles: Bubble[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: idx,
      angle: (360 / 10) * idx + (Math.random() * 24 - 12),
      distance: 38 + Math.random() * 28,
      size: 6 + Math.random() * 8,
      delay: Math.random() * 60
    }));
    setBursts((prev) => [...prev, { id: burstId, bubbles }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 900);
    onAdd(item);
  }

  return (
    <article className="menu-card">
      <div
        className="menu-card-image"
        style={{
          backgroundImage: `linear-gradient(rgba(36,23,15,.12), rgba(36,23,15,.55)), url(${item.imageUrl})`
        }}
      >
        {item.category && <span className="menu-card-category">{item.category}</span>}
        <div className="menu-card-image-shine" aria-hidden="true" />
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
            onClick={handleAdd}
            aria-label="إضافة إلى السلة"
          >
            <Plus size={20} strokeWidth={2.6} />
            {bursts.map((burst) => (
              <span key={burst.id} className="bubble-burst" aria-hidden="true">
                <span className="bubble-ring" />
                {burst.bubbles.map((bubble) => (
                  <span
                    key={bubble.id}
                    className="bubble-drop"
                    style={
                      {
                        "--angle": `${bubble.angle}deg`,
                        "--distance": `${bubble.distance}px`,
                        "--size": `${bubble.size}px`,
                        "--delay": `${bubble.delay}ms`
                      } as React.CSSProperties
                    }
                  />
                ))}
              </span>
            ))}
          </button>
        </div>
      </div>
    </article>
  );
}
