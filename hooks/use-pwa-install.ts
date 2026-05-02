"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
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

  async function promptInstall() {
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

  return { isInstalled, promptInstall, installEvent };
}
