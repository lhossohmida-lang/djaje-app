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
  const permission = await requestBrowserNotificationPermission();
  if (permission !== "granted") {
    return;
  }

  new Notification(title, { body });
}
