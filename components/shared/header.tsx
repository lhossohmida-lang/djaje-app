import Link from "next/link";
import { ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";

export function Header() {
  return (
    <header className="section">
      <div
        className="page-shell card"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap"
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: ".75rem", fontWeight: 700 }}>
          <UtensilsCrossed />
          Djaje
        </Link>
        <nav style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          <Link href="/" className="badge">
            <ShoppingBag size={16} />
            الطلبات
          </Link>
          <Link href="/track" className="badge">
            تتبع الطلب
          </Link>
          <Link href="/driver" className="badge">
            <Truck size={16} />
            السائق
          </Link>
          <Link href="/admin" className="badge">
            الإدارة
          </Link>
        </nav>
      </div>
    </header>
  );
}
