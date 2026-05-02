"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck, Truck } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function FloatingActions() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem 1rem",
        marginTop: "2rem",
        borderTop: "1px solid var(--border)",
      }}
    >
      {!isInstalled && (
        <button
          onClick={handleInstall}
          title="تحميل التطبيق"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(194, 65, 12, 0.3)",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Download size={20} />
        </button>
      )}

      <Link
        href="/driver"
        title="صفحة السائق"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--secondary)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(20, 83, 45, 0.3)",
          transition: "transform 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Truck size={20} />
      </Link>

      <Link
        href="/admin"
        title="الإدارة"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#475569",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(71, 85, 105, 0.3)",
          transition: "transform 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <ShieldCheck size={20} />
      </Link>
    </div>
  );
}
