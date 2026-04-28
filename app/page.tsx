"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

const roles = [
  {
    href: "/customer",
    label: "زبون",
    sublabel: "تصفح المنيو وأضف طلبك",
    icon: ShoppingBag,
    ringStart: "#f59e0b",
    ringEnd: "#c2410c",
    glow: "rgba(194, 65, 12, 0.38)",
    panelGlow: "rgba(245, 158, 11, 0.14)"
  },
  {
    href: "/driver",
    label: "سائق",
    sublabel: "عرض وتوصيل الطلبات",
    icon: Truck,
    ringStart: "#166534",
    ringEnd: "#14532d",
    glow: "rgba(20, 83, 45, 0.28)",
    panelGlow: "rgba(22, 101, 52, 0.12)"
  },
  {
    href: "/admin",
    label: "إدارة",
    sublabel: "لوحة تحكم المطعم",
    icon: ShieldCheck,
    ringStart: "#fb923c",
    ringEnd: "#9a3412",
    glow: "rgba(154, 52, 18, 0.3)",
    panelGlow: "rgba(251, 146, 60, 0.12)"
  }
];

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background:
          "radial-gradient(circle at top right, rgba(194, 65, 12, 0.14), transparent 28%), radial-gradient(circle at bottom left, rgba(20, 83, 45, 0.12), transparent 24%), linear-gradient(180deg, #fbf5ec 0%, #f5efe6 100%)",
        padding: ".9rem 1rem 1.5rem",
        direction: "rtl",
        overflow: "hidden"
      }}
    >
      <style>{`
        .landing-shell {
          width: min(1120px, 100%);
          display: grid;
          gap: 1.8rem;
          padding: 1rem 1.25rem 1.7rem;
          border-radius: 36px;
          background: rgba(255, 250, 243, 0.72);
          border: 1px solid rgba(36, 23, 15, 0.08);
          box-shadow: 0 28px 60px rgba(36, 23, 15, 0.1);
          backdrop-filter: blur(18px);
          position: relative;
          isolation: isolate;
        }
        .landing-shell::before {
          content: "";
          position: absolute;
          inset: auto auto -90px -70px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(20, 83, 45, 0.08);
          filter: blur(10px);
          z-index: -1;
        }
        .landing-shell::after {
          content: "";
          position: absolute;
          inset: -90px -60px auto auto;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: rgba(194, 65, 12, 0.08);
          filter: blur(10px);
          z-index: -1;
        }
        .landing-topbar {
          display: flex;
          justify-content: flex-start;
        }
        .landing-back {
          border: none;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .7rem 1rem;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(36, 23, 15, 0.08);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .landing-back:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(36, 23, 15, 0.1);
        }
        .landing-copy {
          text-align: center;
          display: grid;
          gap: .35rem;
        }
        .roles-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 1.1rem;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          transform: translateY(34px);
        }
        .role-link {
          text-decoration: none;
          flex-shrink: 0;
          display: block;
          transition: transform .25s ease;
        }
        .story-ring {
          width: 208px;
          height: 208px;
          padding: 6px;
          border-radius: 50%;
          background:
            conic-gradient(from 210deg,
              rgba(255,255,255,.92) 0deg,
              var(--ring-start) 65deg,
              var(--ring-end) 185deg,
              var(--ring-start) 300deg,
              rgba(255,255,255,.92) 360deg);
          box-shadow:
            0 18px 42px var(--glow),
            0 0 0 1px rgba(255,255,255,.55);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .story-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .55rem;
          text-align: center;
          color: var(--text);
          background:
            radial-gradient(circle at top, rgba(255,255,255,.88), rgba(255,250,243,.95) 45%, rgba(245,239,230,.98) 100%);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.82),
            inset 0 -16px 30px var(--panel-glow);
        }
        .story-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--ring-end);
          background: rgba(255,255,255,.88);
          box-shadow: 0 10px 20px rgba(36, 23, 15, 0.08);
        }
        .role-label {
          font-size: 1.3rem;
          font-weight: 800;
        }
        .role-sub {
          font-size: .82rem;
          line-height: 1.6;
          color: var(--muted);
          padding: 0 .45rem;
        }
        .role-link:hover {
          transform: translateY(-10px);
        }
        .role-link:hover .story-ring {
          transform: scale(1.04);
          box-shadow:
            0 26px 54px var(--glow),
            0 0 28px color-mix(in srgb, var(--ring-start) 38%, white);
        }
        @media (max-width: 600px) {
          .landing-shell {
            gap: 1.2rem;
            padding: .85rem .85rem 1.25rem;
            border-radius: 28px;
          }
          .landing-back {
            padding: .6rem .9rem;
            font-size: .92rem;
          }
          .roles-row {
            gap: .7rem;
            transform: translateY(14px);
          }
          .story-ring {
            width: 112px;
            height: 112px;
            padding: 4px;
          }
          .story-core {
            padding: .55rem;
            gap: .22rem;
          }
          .story-icon {
            width: 34px;
            height: 34px;
          }
          .role-label {
            font-size: .82rem;
          }
          .role-sub {
            display: none;
          }
        }
      `}</style>

      <section className="landing-shell">
        <div className="landing-topbar">
          <button className="landing-back" type="button" onClick={() => window.history.back()}>
            <ArrowRight size={18} />
            رجوع
          </button>
        </div>

        <div className="landing-copy">
          <h1
            style={{
              fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
              fontWeight: 900,
              color: "var(--text)",
              margin: 0,
              letterSpacing: "-.04em"
            }}
          >
            مرحبا
          </h1>
        </div>

        <div className="roles-row">
          {roles.map((role) => {
            const Icon = role.icon;
            const roleStyle = {
              "--ring-start": role.ringStart,
              "--ring-end": role.ringEnd,
              "--glow": role.glow,
              "--panel-glow": role.panelGlow
            } as CSSProperties;

            return (
              <Link key={role.href} href={role.href} className="role-link" style={roleStyle}>
                <div className="story-ring">
                  <div className="story-core">
                    <div className="story-icon">
                      <Icon size={28} strokeWidth={2.1} />
                    </div>
                    <span className="role-label">{role.label}</span>
                    <span className="role-sub">{role.sublabel}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
