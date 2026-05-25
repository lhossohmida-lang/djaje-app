self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // minimal fetch listener is required to be recognized as a PWA
});

// PWA Background Push Event Listener (Handles notifications when the app is completely closed)
self.addEventListener("push", (event) => {
  let data = { 
    title: "طلب جديد! 🍗", 
    body: "وصل طلب جديد في لوحة الإدارة لمطعم دودو." 
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { 
        title: "طلب جديد! 🍗", 
        body: event.data.text() 
      };
    }
  }

  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/icon-192x192.png",
    vibrate: [500, 150, 500, 150, 500, 150, 800],
    requireInteraction: true,
    data: {
      url: "/admin"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler (Opens the admin dashboard when they click the notification)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || "/admin";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
