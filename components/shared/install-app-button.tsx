"use client";

import { Download, X, Share, MoreVertical, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

function detectBrowser(): "ios" | "android-chrome" | "desktop-chrome" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  if (isIOS) return "ios";
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edge|OPR/.test(ua);
  if (isAndroid && isChrome) return "android-chrome";
  if (!isAndroid && isChrome) return "desktop-chrome";
  return "other";
}

function InstallGuideModal({ onClose }: { onClose: () => void }) {
  const browser = detectBrowser();

  const steps: { icon: React.ReactNode; text: string }[] =
    browser === "ios"
      ? [
          { icon: <Share size={20} />, text: "اضغط زر المشاركة ↑ في الشريط السفلي للمتصفح" },
          { icon: <Plus size={20} />, text: 'مرر للأسفل واضغط "إضافة إلى الشاشة الرئيسية"' },
          { icon: <Download size={20} />, text: 'اضغط "إضافة" في الزاوية العلوية' },
        ]
      : browser === "android-chrome"
      ? [
          { icon: <MoreVertical size={20} />, text: "اضغط النقاط الثلاث ⋮ في الزاوية العلوية" },
          { icon: <Download size={20} />, text: '"اضغط "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية' },
          { icon: <Plus size={20} />, text: "اضغط تثبيت للتأكيد" },
        ]
      : [
          { icon: <MoreVertical size={20} />, text: "انظر لشريط العنوان يمين الرابط" },
          { icon: <Download size={20} />, text: 'اضغط أيقونة الكمبيوتر أو "تثبيت التطبيق" ⊕' },
          { icon: <Plus size={20} />, text: "اضغط تثبيت للتأكيد" },
        ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(36,23,15,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px,100%)",
          background: "#fff7ee",
          borderRadius: "24px 24px 0 0",
          padding: "1.5rem 1.25rem 2.5rem",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: "rgba(36,23,15,0.15)",
            borderRadius: 99,
            margin: "0 auto 1.2rem",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>تثبيت التطبيق</h2>
            <p style={{ margin: "0.2rem 0 0", color: "#6f5d53", fontSize: "0.88rem" }}>
              اتبع الخطوات التالية
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(36,23,15,0.1)",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#24170f",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "#fff",
                borderRadius: 16,
                padding: "0.85rem 1rem",
                border: "1px solid rgba(36,23,15,0.07)",
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#c2410c,#7c2d12)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>
              {/* Icon */}
              <div style={{ color: "#c2410c", flexShrink: 0 }}>{step.icon}</div>
              {/* Text */}
              <span style={{ fontSize: "0.9rem", lineHeight: 1.4, color: "#24170f" }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p
          style={{
            marginTop: "1rem",
            color: "#6f5d53",
            fontSize: "0.8rem",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          بعد التثبيت، سيفتح التطبيق مباشرة على واجهته الخاصة بك.
        </p>
      </div>
    </div>
  );
}

export function InstallAppButton() {
  const { isInstalled, promptInstall, installEvent } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  async function handleClick() {
    if (installEvent) {
      await promptInstall();
    } else {
      setShowGuide(true);
    }
  }

  return (
    <>
      <button
        className="button button-secondary"
        onClick={handleClick}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <Download size={16} />
        <span>تحميل التطبيق</span>
      </button>

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} />}
    </>
  );
}
