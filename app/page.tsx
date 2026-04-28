"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, Download, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !/(crios|fxios)/.test(ua);
    setIsIOS(iOS);

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
      return;
    }
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    window.alert("التطبيق إما مثبّت بالفعل، أو متصفّحك لا يدعم التثبيت من هذه الصفحة. جرّب من قائمة المتصفح: \"تثبيت التطبيق\".");
  }

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
        .install-bar {
          margin-top: auto;
          width: 100%;
          display: flex;
          justify-content: center;
          padding-top: 1.4rem;
        }
        .install-cta {
          width: min(420px, 100%);
          border: none;
          border-radius: 18px;
          padding: 1.05rem 1.4rem;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: .01em;
          background: linear-gradient(135deg, #f97316 0%, #c2410c 55%, #7c2d12 100%);
          box-shadow:
            0 18px 36px rgba(194, 65, 12, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.32),
            inset 0 -3px 8px rgba(124, 45, 18, 0.45);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .65rem;
          position: relative;
          overflow: hidden;
          transition: transform .25s cubic-bezier(.22,.9,.32,1.4), box-shadow .25s ease;
        }
        .install-cta::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.28) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 1.1s cubic-bezier(.22,.9,.32,1);
          pointer-events: none;
        }
        .install-cta:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow:
            0 24px 44px rgba(194, 65, 12, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -3px 8px rgba(124, 45, 18, 0.5);
        }
        .install-cta:hover::before {
          transform: translateX(120%);
        }
        .install-cta:active {
          transform: translateY(0) scale(.98);
        }
        .install-cta-installed {
          background: linear-gradient(135deg, rgba(22, 101, 52, 0.92), rgba(20, 83, 45, 0.92));
          cursor: default;
          box-shadow: 0 12px 24px rgba(20, 83, 45, 0.28);
        }
        .install-ios-hint {
          margin: .8rem auto 0;
          width: min(420px, 100%);
          padding: .85rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(36, 23, 15, 0.1);
          color: var(--text);
          font-size: .9rem;
          line-height: 1.7;
          text-align: center;
        }
        .role-link:hover .story-ring {
          transform: scale(1.04);
          box-shadow:
            0 26px 54px var(--glow),
            0 0 28px color-mix(in srgb, var(--ring-start) 38%, white);
        }
        @media (max-width: 600px) {
          .install-cta {
            font-size: 1rem;
            padding: 1rem 1.2rem;
            border-radius: 16px;
          }
          .landing-shell {
            gap: 1rem;
            padding: .75rem .75rem 1.1rem;
            border-radius: 24px;
          }
          .landing-back {
            padding: .55rem .85rem;
            font-size: .88rem;
            gap: .3rem;
          }
          .landing-back svg {
            transform: scaleX(-1);
          }
          .roles-row {
            gap: .8rem;
            transform: translateY(10px);
            justify-content: center;
          }
          .story-ring {
            width: 130px;
            height: 130px;
            padding: 5px;
          }
          .story-core {
            padding: .7rem .5rem;
            gap: .28rem;
          }
          .story-icon {
            width: 40px;
            height: 40px;
          }
          .story-icon svg {
            width: 22px;
            height: 22px;
          }
          .role-label {
            font-size: .9rem;
            font-weight: 800;
          }
          .role-sub {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .story-ring {
            width: 108px;
            height: 108px;
            padding: 4px;
          }
          .story-icon {
            width: 34px;
            height: 34px;
          }
          .story-icon svg {
            width: 18px;
            height: 18px;
          }
          .role-label {
            font-size: .8rem;
          }
          .roles-row {
            gap: .55rem;
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
              fontSize: "clamp(2.2rem, 8vw, 4.4rem)",
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

        <div className="install-bar">
          <button
            type="button"
            className={`install-cta ${isInstalled ? "install-cta-installed" : ""}`}
            onClick={isInstalled ? undefined : handleInstallClick}
            disabled={isInstalled}
          >
            <Download size={20} strokeWidth={2.4} />
            {isInstalled ? "التطبيق مثبّت ✓" : "حمل الآن"}
          </button>
        </div>
        {showIOSHint && isIOS && !isInstalled ? (
          <div className="install-ios-hint">
            للتثبيت على iPhone: اضغط زر <strong>المشاركة</strong> ⬆️ ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
          </div>
        ) : null}
      </section>
    </main>
  );
}
