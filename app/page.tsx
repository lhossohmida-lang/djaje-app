"use client";

import Link from "next/link";

const roles = [
  {
    href: "/customer",
    emoji: "🛍️",
    label: "زبون",
    sublabel: "تصفح المنيو وأضف طلبك",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    shadow: "0 8px 32px rgba(249,115,22,0.45)",
    hoverShadow: "0 16px 48px rgba(249,115,22,0.65)",
  },
  {
    href: "/driver",
    emoji: "🚗",
    label: "سائق",
    sublabel: "عرض وتوصيل الطلبات",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    shadow: "0 8px 32px rgba(59,130,246,0.45)",
    hoverShadow: "0 16px 48px rgba(59,130,246,0.65)",
  },
  {
    href: "/admin",
    emoji: "⚙️",
    label: "إدارة",
    sublabel: "لوحة تحكم المطعم",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    shadow: "0 8px 32px rgba(139,92,246,0.45)",
    hoverShadow: "0 16px 48px rgba(139,92,246,0.65)",
  },
];

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        padding: "2rem",
        gap: "3rem",
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>🍽️</div>
        <h1
          style={{
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-.02em",
          }}
        >
          جاجي
        </h1>
        <p style={{ color: "#94a3b8", marginTop: ".5rem", fontSize: "1.05rem" }}>
          اختر واجهتك للدخول
        </p>
      </div>

      {/* Role circles */}
      <style>{`
        .roles-row { display: flex; flex-wrap: nowrap; gap: 1.2rem; justify-content: center; align-items: center; width: 100%; }
        .role-circle { width: 190px; height: 190px; font-size: 2.8rem; }
        .role-circle .role-label { font-size: 1.35rem; }
        .role-circle .role-sub { font-size: .8rem; }
        @media (max-width: 600px) {
          .role-circle { width: 100px; height: 100px; font-size: 1.6rem; gap: .3rem !important; }
          .role-circle .role-label { font-size: .85rem; }
          .role-circle .role-sub { display: none; }
          .roles-row { gap: .75rem; }
        }
      `}</style>
      <div className="roles-row">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <div
              className="role-circle"
              style={{
                borderRadius: "50%",
                background: role.gradient,
                boxShadow: role.shadow,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: ".6rem",
                cursor: "pointer",
                transition: "transform .25s ease, box-shadow .25s ease",
                border: "3px solid rgba(255,255,255,.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(1.1) translateY(-6px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = role.hoverShadow;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(1) translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = role.shadow;
              }}
            >
              <span style={{ lineHeight: 1 }}>{role.emoji}</span>
              <span className="role-label" style={{ color: "#fff", fontWeight: 800, letterSpacing: "-.01em" }}>
                {role.label}
              </span>
              <span
                className="role-sub"
                style={{ color: "rgba(255,255,255,.75)", textAlign: "center", padding: "0 .5rem", lineHeight: 1.5 }}
              >
                {role.sublabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
