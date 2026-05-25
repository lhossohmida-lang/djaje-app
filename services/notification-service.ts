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

    const options: NotificationOptions = {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [500, 150, 500, 150, 500, 150, 800],
      tag: "restaurant-order-notification",
      renotify: true,
      requireInteraction: true,
      silent: false
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, options);
        return;
      }
    }

    new Notification(title, options);
  } catch (err) {
    console.warn("Failed to show notification:", err);
  }
}

