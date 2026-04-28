"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

const roles = [
  {
    href: "/admin",
    label: "إدارة",
    Icon: ShieldCheck,
    className: "role-admin",
  },
  {
    href: "/driver",
    label: "سائق",
    Icon: Truck,
    className: "role-driver",
  },
  {
    href: "/customer",
    label: "زبون",
    Icon: ShoppingBag,
    className: "role-customer",
  },
];

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const ANIMATION_MS = 1000;

export default function LandingPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function capture(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  useEffect(() => {
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
      standaloneQuery.removeEventListener("change", handleStandaloneChange);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    roles.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  function handleRoleClick(href: string) {
    if (activeRole) return;
    setActiveRole(href);
    window.setTimeout(() => router.push(href), ANIMATION_MS);
  }

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
    <main className="welcome-page">
      <section className="welcome-card">
        <h1 className="welcome-title">مرحبا</h1>

        <div className="role-row">
          {roles.map(({ href, label, Icon, className }) => {
            const isEntering = activeRole === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => handleRoleClick(href)}
                disabled={activeRole !== null}
                aria-label={label}
                className={`role-bubble ${className} ${isEntering ? "role-bubble-entering" : ""}`}
              >
                <span className="role-icon">
                  <Icon size={22} strokeWidth={2.4} />
                </span>
                <span className="role-text">{label}</span>
              </button>
            );
          })}
        </div>

        {!isInstalled && (
          <button type="button" onClick={handleInstall} className="download-button">
            <Download size={20} strokeWidth={2.6} />
            <span>حمل الآن</span>
          </button>
        )}
      </section>
    </main>
  );
}
