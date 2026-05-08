"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck, Truck, MoreVertical } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function FloatingActions() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function capture(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", capture);

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const iosStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standaloneQuery.matches || iosStandalone);

    function handleStandaloneChange(event: MediaQueryListEvent) {
      setIsInstalled(event.matches);
    }
    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallEvent(null);
    }
    standaloneQuery.addEventListener("change", handleStandaloneChange);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      standaloneQuery.removeEventListener("change", handleStandaloneChange);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (installEvent) {
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome === "accepted") {
          setInstallEvent(null);
        }
      } catch (error) {
        console.error(error);
      }
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const message = isIOS
      ? "لتثبيت التطبيق على iPhone: اضغط زر المشاركة ثم اختر \"إضافة إلى الشاشة الرئيسية\"."
      : "لتثبيت التطبيق: افتح قائمة المتصفح ثم اختر \"تثبيت التطبيق\" أو \"إضافة إلى الشاشة الرئيسية\".";
    window.alert(message);
  }

  const buttonStyle = {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    color: "white",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s",
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        top: "1rem",
        zIndex: 999,
      }}
    >
      {/* Floating menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="القائمة"
        style={{
          ...buttonStyle,
          backgroundColor: "var(--primary)",
          boxShadow: "0 4px 12px rgba(194, 65, 12, 0.3)",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <MoreVertical size={20} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: 0,
            display: "flex",
            flexDirection: "column" as const,
            gap: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {!isInstalled && (
            <button
              onClick={() => {
                handleInstall();
                setIsOpen(false);
              }}
              title="تحميل التطبيق"
              style={{
                ...buttonStyle,
                backgroundColor: "var(--primary)",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.2)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Download size={20} />
            </button>
          )}

          <Link
            href="/driver"
            title="صفحة السائق"
            style={{
              ...buttonStyle,
              backgroundColor: "var(--secondary)",
              boxShadow: "0 2px 8px rgba(20, 83, 45, 0.2)",
              textDecoration: "none",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onClick={() => setIsOpen(false)}
          >
            <Truck size={20} />
          </Link>

          <Link
            href="/admin"
            title="الإدارة"
            style={{
              ...buttonStyle,
              backgroundColor: "#475569",
              boxShadow: "0 2px 8px rgba(71, 85, 105, 0.2)",
              textDecoration: "none",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onClick={() => setIsOpen(false)}
          >
            <ShieldCheck size={20} />
          </Link>
        </div>
      )}
    </div>
  );
}
