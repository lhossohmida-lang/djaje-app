"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/header";
import { formatCurrency } from "@/lib/utils";
import { sampleMenu } from "@/data/mock-data";
import { loginWithEmail, logout } from "@/services/auth-service";
import { createOrUpdateMenuItem, deleteMenuItem, subscribeToMenu } from "@/services/menu-service";
import { notify } from "@/services/notification-service";
import { assignOrderToDriver, getDashboardStats, subscribeToOrders, updateOrderStatus } from "@/services/order-service";
import { uploadDishImage } from "@/services/storage-service";
import { getUserRoleByUid } from "@/services/user-service";
import { DashboardStats, MenuItem, Order } from "@/types";

const emptyMenuForm: MenuItem = {
  id: "",
  name: "",
  description: "",
  category: "",
  price: 0,
  imageUrl: "",
  available: true,
  prepTime: 15
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    availableDrivers: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(sampleMenu);
  const [menuForm, setMenuForm] = useState<MenuItem>(emptyMenuForm);
  const [uploading, setUploading] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const unsubscribeOrders = subscribeToOrders(setOrders);
    const unsubscribeMenu = subscribeToMenu(setMenuItems);
    getDashboardStats().then(setStats).catch(console.error);

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    if (lastOrderCount !== 0 && orders.length > lastOrderCount) {
      notify("طلب جديد", "تمت إضافة طلب جديد إلى لوحة الإدارة.");
    }

    setLastOrderCount(orders.length);
  }, [orders, loggedIn, lastOrderCount]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const credential = await loginWithEmail(credentials.email, credentials.password);
      const role = await getUserRoleByUid(credential.user.uid);

      if (role !== "admin") {
        await logout();
        window.alert("هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.");
        return;
      }

      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      window.alert("تعذر تسجيل الدخول. تأكد من صحة البيانات وأن الحساب مسجل كمسؤول في قاعدة البيانات.");
    }
  }

  async function handleMenuSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item: MenuItem = {
      ...menuForm,
      id: menuForm.id || `meal-${Date.now()}`
    };

    try {
      await createOrUpdateMenuItem(item);
      setMenuForm(emptyMenuForm);
      window.alert("تم حفظ الطبق.");
    } catch (error) {
      console.error(error);
      window.alert("تعذر حفظ الطبق.");
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadDishImage(file);
      setMenuForm((current) => ({ ...current, imageUrl }));
    } catch (error) {
      console.error(error);
      window.alert("فشل رفع الصورة.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-shell section">
        {!loggedIn ? (
          <section className="card" style={{ padding: "2rem", maxWidth: 540, margin: "0 auto" }}>
            <h1>دخول الإدارة</h1>
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
          </section>
        ) : (
          <section className="grid" style={{ gap: "1rem" }}>
            <div className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ marginTop: 0 }}>لوحة الإدارة</h1>
                <p style={{ color: "var(--muted)" }}>إدارة الطلبات والمنيو ورفع الصور وتعيين السائقين.</p>
              </div>
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

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div className="card" style={{ padding: "1rem" }}>
                <strong style={{ fontSize: "2rem" }}>{stats.totalOrders}</strong>
                <div>إجمالي الطلبات</div>
              </div>
              <div className="card" style={{ padding: "1rem" }}>
                <strong style={{ fontSize: "2rem" }}>{formatCurrency(stats.totalRevenue)}</strong>
                <div>الإيرادات</div>
              </div>
              <div className="card" style={{ padding: "1rem" }}>
                <strong style={{ fontSize: "2rem" }}>{stats.activeOrders}</strong>
                <div>طلبات جارية</div>
              </div>
              <div className="card" style={{ padding: "1rem" }}>
                <strong style={{ fontSize: "2rem" }}>{stats.availableDrivers}</strong>
                <div>سائقون نشطون</div>
              </div>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}
            >
              <div className="card" style={{ padding: "1rem" }}>
                <h2>إدارة الطلبات</h2>
                <div className="grid">
                  {orders.map((order) => (
                    <article key={order.id} className="card" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", flexWrap: "wrap" }}>
                        <strong>{order.orderNumber}</strong>
                        <span className="badge">{order.status}</span>
                      </div>
                      <p>{order.customer.name}</p>
                      <p style={{ color: "var(--muted)" }}>{order.customer.address}</p>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                        <button
                          className="button button-secondary"
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                        >
                          قيد التحضير
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => assignOrderToDriver(order.id, "demo-driver", "سائق تجريبي")}
                        >
                          تعيين للسائق
                        </button>
                        <button
                          className="button button-primary"
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                        >
                          إنهاء الطلب
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: "1rem" }}>
                <h2>إدارة قائمة الطعام</h2>
                <form className="grid" onSubmit={handleMenuSubmit}>
                  <input
                    className="input"
                    placeholder="اسم الطبق"
                    value={menuForm.name}
                    onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="التصنيف"
                    value={menuForm.category}
                    onChange={(event) => setMenuForm((current) => ({ ...current, category: event.target.value }))}
                  />
                  <textarea
                    className="textarea"
                    placeholder="وصف الطبق"
                    rows={3}
                    value={menuForm.description}
                    onChange={(event) =>
                      setMenuForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="السعر"
                    value={menuForm.price}
                    onChange={(event) =>
                      setMenuForm((current) => ({ ...current, price: Number(event.target.value) }))
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="مدة التحضير"
                    value={menuForm.prepTime}
                    onChange={(event) =>
                      setMenuForm((current) => ({ ...current, prepTime: Number(event.target.value) }))
                    }
                  />
                  <input className="input" type="file" accept="image/*" onChange={handleImageUpload} />
                  <input
                    className="input"
                    placeholder="أو ضع رابط الصورة يدويًا"
                    value={menuForm.imageUrl}
                    onChange={(event) => setMenuForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  />
                  <button className="button button-primary" type="submit" disabled={uploading}>
                    {uploading ? "جارٍ رفع الصورة..." : "حفظ الطبق"}
                  </button>
                </form>

                <div className="grid" style={{ marginTop: "1rem" }}>
                  {menuItems.map((item) => (
                    <article key={item.id} className="card" style={{ padding: "1rem" }}>
                      <strong>{item.name}</strong>
                      <p style={{ color: "var(--muted)" }}>{formatCurrency(item.price)}</p>
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <button className="button button-secondary" onClick={() => setMenuForm(item)}>
                          تعديل
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => deleteMenuItem(item.id)}
                        >
                          حذف
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
