"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/shared/back-button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { loginWithEmail, logout, registerDriverAccount } from "@/services/auth-service";
import {
  assignOrderToDriver,
  subscribeToAvailableOrders,
  subscribeToDriverDelivered,
  subscribeToDriverOrders,
  updateOrderStatus
} from "@/services/order-service";
import { Order } from "@/types";
import { useRingtone } from "@/hooks/use-ringtone";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { requestBrowserNotificationPermission } from "@/services/notification-service";

export default function DriverPage() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("سائق التوصيل");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Listen to Firebase Auth changes for persistent driver session!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDriverName(user.displayName || user.email?.split("@")[0] || "سائق التوصيل");
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!loggedIn || !uid) {
      return;
    }

    // Proactively request browser notifications for driver
    requestBrowserNotificationPermission().catch(console.error);

    const unsubscribeAvailable = subscribeToAvailableOrders(setAvailableOrders);
    const unsubscribeMine = subscribeToDriverOrders(uid, setMyOrders);
    const unsubscribeDelivered = subscribeToDriverDelivered(uid, setDeliveredOrders);

    return () => {
      unsubscribeAvailable();
      unsubscribeMine();
      unsubscribeDelivered();
    };
  }, [loggedIn]);

  const dailyEarnings = useMemo(() => {
    return deliveredOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
  }, [deliveredOrders]);

  const hasAvailableOrder = useMemo(() => availableOrders.length > 0, [availableOrders]);
  useRingtone(loggedIn && hasAvailableOrder);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await loginWithEmail(credentials.email, credentials.password);
      setDriverName(credentials.email.split("@")[0] || "سائق التوصيل");
      
      // Request permission on direct user interaction
      await requestBrowserNotificationPermission();
      
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      window.alert("فعّل Firebase Authentication وأضف حساب السائق ثم أعد المحاولة.");
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await registerDriverAccount(registerForm);
      setDriverName(registerForm.fullName || registerForm.email.split("@")[0] || "سائق التوصيل");
      
      // Request permission on direct user interaction
      await requestBrowserNotificationPermission();
      
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      window.alert("تعذر إنشاء حساب السائق. تأكد من تفعيل Email/Password في Firebase.");
    }
  }

  async function handleStatusChange(orderId: string, nextStatus: "picked_up" | "out_for_delivery" | "delivered") {
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (error) {
      console.error(error);
      window.alert("تعذر تحديث الحالة.");
    }
  }

  async function handleAcceptOrder(orderId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      await assignOrderToDriver(orderId, uid, driverName);
    } catch (error) {
      console.error(error);
      window.alert("تعذر قبول الطلب.");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--background)", direction: "rtl" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            width: "50px", 
            height: "50px", 
            borderRadius: "50%", 
            border: "5px solid rgba(194, 65, 12, 0.1)", 
            borderTopColor: "var(--primary)", 
            animation: "spin 1s linear infinite" 
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <strong style={{ color: "var(--text)" }}>جاري التحقق من الجلسة... 🔐</strong>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="page-shell section">
        <div className="back-row">
          <BackButton />
        </div>
        {!loggedIn ? (
          <section className="card" style={{ padding: "2rem", maxWidth: 540, margin: "0 auto" }}>
            <h1>{isRegisterMode ? "إنشاء حساب سائق" : "تسجيل دخول السائق"}</h1>
            <p style={{ color: "var(--muted)" }}>
              {isRegisterMode ? "يمكن للسائق إنشاء حسابه الخاص من هنا." : "إذا كان لديك حساب مسبق يمكنك الدخول مباشرة."}
            </p>
            {isRegisterMode ? (
              <form className="grid" onSubmit={handleRegister}>
                <input
                  className="input"
                  placeholder="الاسم الكامل"
                  value={registerForm.fullName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, fullName: event.target.value }))}
                />
                <input
                  className="input"
                  placeholder="رقم الهاتف"
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                />
                <button className="button button-primary" type="submit">
                  إنشاء الحساب
                </button>
              </form>
            ) : (
              <form className="grid" onSubmit={handleLogin}>
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
                <button className="button button-primary" type="submit">
                  دخول
                </button>
              </form>
            )}
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setIsRegisterMode((current) => !current)}
              style={{ marginTop: "1rem" }}
            >
              {isRegisterMode ? "لدي حساب بالفعل" : "إنشاء حساب جديد"}
            </button>
          </section>
        ) : (
          <section className="grid" style={{ gap: "1rem" }}>
            <div className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ marginTop: 0 }}>لوحة السائق</h1>
                <p style={{ color: "var(--muted)" }}>إدارة الحالات والتوصيل وعرض الأرباح اليومية.</p>
              </div>
              <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span className="badge">أرباح اليوم: {formatCurrency(dailyEarnings)}</span>
                <InstallAppButton />
                <button
                  className="button button-secondary"
                  onClick={async () => {
                    await logout();
                    setLoggedIn(false);
                  }}
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <div className="card" style={{ padding: "1rem" }}>
                <h2>الطلبات الخاصة بي</h2>
                <div className="grid">
                  {myOrders.map((order) => (
                    <article key={order.id} className="card" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
                        <strong>{order.orderNumber}</strong>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p>{order.customer.name}</p>
                      <p style={{ color: "var(--muted)" }}>{order.customer.address}</p>
                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.address)}`}
                        target="_blank"
                        className="badge"
                      >
                        فتح العنوان في Google Maps
                      </Link>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".75rem" }}>
                        <button
                          className="button button-secondary"
                          onClick={() => handleStatusChange(order.id, "picked_up")}
                        >
                          تم الاستلام
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => handleStatusChange(order.id, "out_for_delivery")}
                        >
                          في الطريق
                        </button>
                        <button
                          className="button button-primary"
                          onClick={() => handleStatusChange(order.id, "delivered")}
                        >
                          تم
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: "1rem" }}>
                <h2>طلبات متاحة</h2>
                <div className="grid">
                  {availableOrders.map((order) => (
                    <article key={order.id} className="card" style={{ padding: "1rem" }}>
                      <strong>{order.orderNumber}</strong>
                      <p style={{ color: "var(--muted)" }}>{formatDate(order.createdAt)}</p>
                      <p>{order.customer.address}</p>
                      <OrderStatusBadge status={order.status} />
                      <div style={{ marginTop: ".75rem" }}>
                        <button className="button button-primary" onClick={() => handleAcceptOrder(order.id)}>
                          قبول الطلب
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
