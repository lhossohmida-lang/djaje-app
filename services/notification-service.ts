export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }

  return Notification.permission;
}

export async function notify(title: string, body: string) {
  try {
    const permission = await requestBrowserNotificationPermission();
    if (permission !== "granted") {
      return;
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, { body });
        return;
      }
    }

    new Notification(title, { body });
  } catch (err) {
    console.warn("Failed to show notification:", err);
  }
}
