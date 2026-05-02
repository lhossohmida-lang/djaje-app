"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register after page load
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("SW registration failed: ", err);
        });
      });
      // Fallback if load already happened
      if (document.readyState === "complete") {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("SW registration failed: ", err);
        });
      }
    }
  }, []);

  return null;
}
