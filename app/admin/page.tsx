"use client";

import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/shared/back-button";
import { formatCurrency } from "@/lib/utils";
import { sampleMenu } from "@/data/mock-data";
import { loginWithEmail, logout, registerAdminAccount } from "@/services/auth-service";
import { createOrUpdateMenuItem, deleteMenuItem, subscribeToMenu } from "@/services/menu-service";
import { notify } from "@/services/notification-service";
import { assignOrderToDriver, getDashboardStats, subscribeToOrders, updateOrderStatus } from "@/services/order-service";
import { uploadDishImage } from "@/services/storage-service";
import { getUserRoleByUid } from "@/services/user-service";
import { DashboardStats, MenuItem, Order, OrderStatus } from "@/types";

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

const DEVELOPER_CODE = "anis9987";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "قيد التحضير",
  assigned: "تم التعيين",
  picked_up: "تم الاستلام",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم"
};

type AdminTab = "overview" | "orders" | "menu";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    developerCode: ""
  });
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
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!loggedIn) return;
    const unsubscribeOrders = subscribeToOrders(setOrders);
    const unsubscribeMenu = subscribeToMenu(setMenuItems);
    getDashboardStats().then(setStats).catch(console.error);
    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    if (lastOrderCount !== 0 && orders.length > lastOrderCount) {
      notify("طلب جديد", "تمت إضافة طلب جديد إلى لوحة الإدارة.");
    }
    setLastOrderCount(orders.length);
  }, [orders, loggedIn, lastOrderCount]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered"),
    [orders]
  );

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

  async function handleRegisterAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registerForm.developerCode !== DEVELOPER_CODE) {
      window.alert("رمز المطور غير صحيح.");
      return;
    }
    try {
      await registerAdminAccount({
        fullName: registerForm.fullName,
        email: registerForm.email,
        password: registerForm.password
      });
      setLoggedIn(true);
      setIsRegisterMode(false);
      setRegisterForm({ fullName: "", email: "", password: "", developerCode: "" });
    } catch (error) {
      console.error(error);
      window.alert("تعذر إنشاء حساب الإدارة الجديد. قد يكون البريد مستخدمًا بالفعل.");
    }
  }

  async function handleMenuSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item: MenuItem = { ...menuForm, id: menuForm.id || `meal-${Date.now()}` };
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
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadDishImage(file);
      setMenuForm((current) => ({ ...current, imageUrl }));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "فشل رفع الصورة.";
      window.alert(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <main className="page-shell section">
        <div className="back-row">
          <BackButton />
        </div>
        {!loggedIn ? (
          <section className="auth-card">
            <div className="auth-icon">{isRegisterMode ? "✨" : "🔐"}</div>
            <h1>{isRegisterMode ? "إنشاء حساب إدارة جديد" : "دخول الإدارة"}</h1>
            <p className="auth-sub">
              {isRegisterMode
                ? "أدخل بيانات المدير الجديد مع رمز المطور لإنشاء حساب إدارة."
                : "يمكنك تسجيل الدخول بأي حساب مسجل بدور admin داخل Firebase."}
            </p>
            {isRegisterMode ? (
              <form className="grid" onSubmit={handleRegisterAdmin}>
                <input
                  className="input"
                  placeholder="الاسم الكامل"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, fullName: e.target.value }))}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, email: e.target.value }))}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value }))}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="رمز المطور"
                  value={registerForm.developerCode}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, developerCode: e.target.value }))}
                />
                <button className="button button-primary" type="submit">
                  إنشاء مدير جديد
                </button>
              </form>
            ) : (
              <form className="grid" onSubmit={handleLogin}>
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={credentials.email}
                  onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={credentials.password}
                  onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                />
                <button className="button button-primary" type="submit">
                  دخول
                </button>
              </form>
            )}
            <button
              className="button auth-toggle"
              type="button"
              onClick={() => setIsRegisterMode((c) => !c)}
            >
              {isRegisterMode ? "العودة إلى تسجيل الدخول" : "إنشاء حساب إدارة جديد"}
            </button>
          </section>
        ) : (
          <section className="admin-shell">
            <div className="admin-topbar">
              <div>
                <h1>لوحة الإدارة</h1>
                <p>إدارة الطلبات والمنيو ورفع الصور وتعيين السائقين.</p>
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

            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                نظرة عامة
              </button>
              <button
                className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                الطلبات
              </button>
              <button
                className={`admin-tab ${activeTab === "menu" ? "active" : ""}`}
                onClick={() => setActiveTab("menu")}
              >
                قائمة الطعام
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="stat-grid">
                <div className="stat-card accent-orange">
                  <div className="stat-icon">📦</div>
                  <div className="stat-value">{stats.totalOrders}</div>
                  <div className="stat-label">إجمالي الطلبات</div>
                </div>
                <div className="stat-card accent-green">
                  <div className="stat-icon">💰</div>
                  <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="stat-label">الإيرادات</div>
                </div>
                <div className="stat-card accent-amber">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-value">{stats.activeOrders}</div>
                  <div className="stat-label">طلبات جارية</div>
                </div>
                <div className="stat-card accent-blue">
                  <div className="stat-icon">🛵</div>
                  <div className="stat-value">{stats.availableDrivers}</div>
                  <div className="stat-label">سائقون نشطون</div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="section-card">
                <div className="section-head">
                  <h2>إدارة الطلبات</h2>
                  <span className="count-pill">{activeOrders.length} نشط</span>
                </div>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">🍽️</div>
                    <p>لا توجد طلبات حالياً.</p>
                  </div>
                ) : (
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {orders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-head">
                          <span className="order-number">#{order.orderNumber}</span>
                          <span className={`status-badge ${order.status}`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </div>
                        <p className="customer-name">{order.customer.name}</p>
                        <p className="customer-address">{order.customer.address}</p>
                        <div className="actions">
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
                            إنهاء
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "menu" && (
              <div className="section-card">
                <div className="section-head">
                  <h2>إدارة قائمة الطعام</h2>
                  <span className="count-pill">{menuItems.length} طبق</span>
                </div>

                <form className="menu-form-grid" onSubmit={handleMenuSubmit}>
                  <input
                    className="input"
                    placeholder="اسم الطبق"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm((c) => ({ ...c, name: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="التصنيف"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm((c) => ({ ...c, category: e.target.value }))}
                  />
                  <textarea
                    className="textarea span-2"
                    placeholder="وصف الطبق"
                    rows={2}
                    value={menuForm.description}
                    onChange={(e) => setMenuForm((c) => ({ ...c, description: e.target.value }))}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="السعر"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm((c) => ({ ...c, price: Number(e.target.value) }))}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="مدة التحضير (دقيقة)"
                    value={menuForm.prepTime}
                    onChange={(e) => setMenuForm((c) => ({ ...c, prepTime: Number(e.target.value) }))}
                  />
                  <input className="input" type="file" accept="image/*" onChange={handleImageUpload} />
                  <input
                    className="input"
                    placeholder="أو ضع رابط الصورة يدويًا"
                    value={menuForm.imageUrl}
                    onChange={(e) => setMenuForm((c) => ({ ...c, imageUrl: e.target.value }))}
                  />
                  <div className="submit-row" style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                    <button className="button button-primary" type="submit" disabled={uploading} style={{ flex: 1 }}>
                      {uploading ? "جارٍ رفع الصورة..." : menuForm.id ? "تحديث الطبق" : "إضافة طبق جديد"}
                    </button>
                    {menuForm.id && (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => setMenuForm(emptyMenuForm)}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>

                {menuItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">🥘</div>
                    <p>لم تتم إضافة أي طبق بعد.</p>
                  </div>
                ) : (
                  <div className="menu-list">
                    {menuItems.map((item) => (
                      <article key={item.id} className="menu-item-card">
                        <div
                          className="thumb"
                          style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
                        />
                        <div className="body">
                          <span className="name">{item.name}</span>
                          {item.category && (
                            <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>{item.category}</span>
                          )}
                          <span className="price">{formatCurrency(item.price)}</span>
                          <div className="actions">
                            <button className="button button-secondary" onClick={() => setMenuForm(item)}>
                              تعديل
                            </button>
                            <button
                              className="button button-danger"
                              onClick={() => deleteMenuItem(item.id)}
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
