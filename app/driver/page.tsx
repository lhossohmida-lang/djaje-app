"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { auth } from "@/lib/firebase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { loginWithEmail, logout, registerDriverAccount } from "@/services/auth-service";
import {
  assignOrderToDriver,
  subscribeToAvailableOrders,
  subscribeToDriverDelivered,
  subscribeToDriverOrders,
  updateOrderStatus
} from "@/services/order-service";
import { resetFactoryData } from "@/services/reset-service";
import { notifyOrderArrival, primeAudio } from "@/services/notification-service";
import { getUserRoleByUid } from "@/services/user-service";
import { Order } from "@/types";

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
  const [driverUid, setDriverUid] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("سائق التوصيل");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResettingFactory, setIsResettingFactory] = useState(false);
  const [lastAvailableCount, setLastAvailableCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDriverUid(null);
        setLoggedIn(false);
        return;
      }
      try {
        const role = await getUserRoleByUid(user.uid);
        if (role !== "driver") {
          setDriverUid(null);
          setLoggedIn(false);
          return;
        }
        setDriverUid(user.uid);
        setDriverName(user.displayName || user.email?.split("@")[0] || "سائق التوصيل");
        setLoggedIn(true);
      } catch (error) {
        console.error(error);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loggedIn || !driverUid) {
      return;
    }

    const unsubscribeAvailable = subscribeToAvailableOrders(setAvailableOrders);
    const unsubscribeMine = subscribeToDriverOrders(driverUid, setMyOrders);
    const unsubscribeDelivered = subscribeToDriverDelivered(driverUid, setDeliveredOrders);

    return () => {
      unsubscribeAvailable();
      unsubscribeMine();
      unsubscribeDelivered();
    };
  }, [loggedIn, driverUid]);

  useEffect(() => {
    if (!loggedIn) return;
    if (lastAvailableCount !== null && availableOrders.length > lastAvailableCount) {
      notifyOrderArrival("طلب جديد متاح", "تمت إضافة طلب جديد للتوصيل.", 3);
    }
    setLastAvailableCount(availableOrders.length);
  }, [availableOrders, loggedIn, lastAvailableCount]);

  const dailyEarnings = useMemo(() => {
    return deliveredOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
  }, [deliveredOrders]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const credential = await loginWithEmail(credentials.email, credentials.password);
      const role = await getUserRoleByUid(credential.user.uid);
      if (role !== "driver") {
        await logout();
        window.alert("هذا الحساب غير مصرح له بالدخول إلى لوحة السائق.");
        return;
      }
      primeAudio();
    } catch (error) {
      console.error(error);
      window.alert("تعذر تسجيل الدخول. تأكد من البيانات وأن الحساب مسجّل كسائق.");
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await registerDriverAccount(registerForm);
      primeAudio();
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
    if (!driverUid) {
      return;
    }

    try {
      await assignOrderToDriver(orderId, driverUid, driverName);
    } catch (error) {
      console.error(error);
      window.alert("تعذر قبول الطلب.");
    }
  }

  async function handleFactoryReset() {
    const confirmed = window.confirm("سيتم حذف الطلبات الحالية وإعادة المنيو الافتراضي. هل تريد المتابعة؟");
    if (!confirmed) {
      return;
    }

    setIsResettingFactory(true);
    try {
      await resetFactoryData();
      window.alert("تمت إعادة بيانات المصنع بنجاح.");
    } catch (error) {
      console.error(error);
      window.alert("تعذر إعادة بيانات المصنع الآن.");
    } finally {
      setIsResettingFactory(false);
    }
  }

  return (
    <>
      <main className="page-shell section">
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
            <div className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ marginTop: 0 }}>لوحة السائق</h1>
                <p style={{ color: "var(--muted)" }}>إدارة الحالات والتوصيل وعرض الأرباح اليومية.</p>
              </div>
              <div style={{ display: "flex", gap: ".75rem", alignItems: "start", flexWrap: "wrap" }}>
                <span className="badge">أرباح اليوم: {formatCurrency(dailyEarnings)}</span>
                <button className="button button-danger" onClick={handleFactoryReset} disabled={isResettingFactory}>
                  {isResettingFactory ? "جارٍ إعادة البيانات..." : "إعادة بيانات المصنع"}
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    void logout();
                  }}
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <div className="card" style={{ padding: "1rem" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
                  الطلبات الخاصة بي
                  <span className="badge" style={{ background: "rgba(20,83,45,.12)", color: "var(--success)" }}>
                    {myOrders.length}
                  </span>
                </h2>
                {myOrders.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: ".9rem", margin: ".5rem 0 0" }}>
                    لم تقبل أي طلب بعد. اختر طلباً من القسم المجاور.
                  </p>
                ) : null}
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
                          تم التوصيل
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: "1rem" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
                  طلبات متاحة
                  <span className="badge" style={{ background: "rgba(194,65,12,.14)", color: "var(--primary-dark)" }}>
                    {availableOrders.length}
                  </span>
                </h2>
                {availableOrders.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: ".9rem", margin: ".5rem 0 0" }}>
                    لا توجد طلبات متاحة الآن. سيظهر الطلب فور وصوله مع تنبيه صوتي 🔔
                  </p>
                ) : null}
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
