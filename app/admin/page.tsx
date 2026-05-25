"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BackButton } from "@/components/shared/back-button";
import { formatCurrency } from "@/lib/utils";
import { sampleMenu } from "@/data/mock-data";
import { loginWithEmail, logout, registerAdminAccount } from "@/services/auth-service";
import { createOrUpdateMenuItem, deleteMenuItem, subscribeToMenu } from "@/services/menu-service";
import { notify, requestBrowserNotificationPermission } from "@/services/notification-service";
import {
  assignOrderToDriver,
  deleteOrder,
  getDashboardStats,
  subscribeToOrders,
  updateOrderStatus,
  createAdminOrder
} from "@/services/order-service";
import {
  subscribeToIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  addIngredientPurchase,
  subscribeToIngredientPurchases,
  deleteIngredientPurchase
} from "@/services/inventory-service";
import { uploadDishImage } from "@/services/storage-service";
import { getUserRoleByUid } from "@/services/user-service";
import { DashboardStats, MenuItem, Order, OrderStatus, Ingredient, IngredientPurchase, CartItem } from "@/types";
import { useRingtone } from "@/hooks/use-ringtone";
import { InstallAppButton } from "@/components/shared/install-app-button";
import {
  Plus,
  Search,
  Trash2,
  X,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Truck,
  Coffee,
  ClipboardList,
  BarChart3,
  PlusCircle,
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ListFilter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";

const emptyMenuForm: MenuItem = {
  id: "",
  name: "",
  description: "",
  category: "",
  price: 0,
  costPrice: 0,
  imageUrl: "",
  available: true,
  prepTime: 15
};

const DEVELOPER_CODE = "anis9987";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
  assigned: "تم التعيين",
  picked_up: "تم الاستلام",
  out_for_delivery: "في الطريق",
  cancelled: "ملغي"
};

type AdminTab = "overview" | "orders" | "inventory" | "menu" | "reports";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Inventory states
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientPurchases, setIngredientPurchases] = useState<IngredientPurchase[]>([]);
  const [ingredientForm, setIngredientForm] = useState({ name: "", unit: "كغم" });
  const [purchaseForm, setPurchaseForm] = useState({ quantity: "", unitPrice: "", note: "" });

  // New Order Creation states
  const [panelType, setPanelType] = useState<"dine-in" | "takeout" | "delivery" | null>(null);
  const [newOrderContext, setNewOrderContext] = useState<{
    orderType: "table" | "takeout" | "delivery";
    tableNumber?: number;
    takeoutNumber?: number;
    driverNumber?: number;
    customerName?: string;
    customerPhone?: string;
  } | null>(null);

  const [driverPhoneStep, setDriverPhoneStep] = useState<{ driverNumber: number } | null>(null);
  const [driverCustomerData, setDriverCustomerData] = useState({ name: "", phone: "", address: "", deliveryFee: "100" });

  // Order selection for detail view modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search and status filters for orders list
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");

  const [testAlarm, setTestAlarm] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  // Listen to Firebase Auth state changes for session persistence!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await getUserRoleByUid(user.uid);
          if (role === "admin") {
            setLoggedIn(true);
          } else {
            await logout();
            setLoggedIn(false);
          }
        } catch (error) {
          console.error("Auth state observer error:", error);
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      notify("تم تفعيل التنبيهات بنجاح! 🎉", "تنبيهات الخلفية للطلبات نشطة الآن وتعمل بكفاءة.");
    } else {
      window.alert("يجب السماح بالإشعارات في المتصفح لضمان سماع صوت التنبيهات في الخلفية.");
    }
  };

  const handlePersistStorage = async () => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        window.alert("تم حماية ملفات التطبيق بنجاح! لن يقوم المتصفح بحذف بياناتك أبداً.");
      } else {
        window.alert("لم يتمكن النظام من تفعيل الحفظ الدائم، قد يتم إيقافه بواسطة المتصفح تلقائياً.");
      }
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    
    // Proactively request browser notifications
    requestBrowserNotificationPermission().catch(console.error);
    
    const unsubscribeOrders = subscribeToOrders(setOrders);
    const unsubscribeMenu = subscribeToMenu(setMenuItems);
    const unsubscribeIngredients = subscribeToIngredients(setIngredients);

    getDashboardStats().then(setStats).catch(console.error);

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
      unsubscribeIngredients();
    };
  }, [loggedIn]);

  // Load purchases when selected ingredient changes
  useEffect(() => {
    if (!loggedIn || !selectedIngredient?.id) {
      setIngredientPurchases([]);
      return;
    }
    const unsub = subscribeToIngredientPurchases(selectedIngredient.id, setIngredientPurchases);
    return () => unsub();
  }, [selectedIngredient, loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    if (lastOrderCount !== 0 && orders.length > lastOrderCount) {
      notify("طلب جديد", "تمت إضافة طلب جديد إلى لوحة الإدارة.");
    }
    setLastOrderCount(orders.length);
  }, [orders, loggedIn, lastOrderCount]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders]
  );

  const hasPendingOrder = useMemo(() => orders.some((o) => o.status === "pending"), [orders]);
  useRingtone(loggedIn && (hasPendingOrder || testAlarm));

  // Authentication Handlers
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
      
      // Request permission on direct user interaction
      await requestBrowserNotificationPermission();
      
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
      
      // Request permission on direct user interaction
      await requestBrowserNotificationPermission();
      
      setLoggedIn(true);
      setIsRegisterMode(false);
      setRegisterForm({ fullName: "", email: "", password: "", developerCode: "" });
    } catch (error) {
      console.error(error);
      window.alert("تعذر إنشاء حساب الإدارة الجديد. قد يكون البريد مستخدمًا بالفعل.");
    }
  }

  // Menu Handlers
  async function handleMenuSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item: MenuItem = { ...menuForm, id: menuForm.id || `meal-${Date.now()}` };
    try {
      await createOrUpdateMenuItem(item);
      setMenuForm(emptyMenuForm);
      window.alert("تم حفظ الطبق وتحديثه بالمنيو.");
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

  // Ingredient Handlers
  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredientForm.name.trim()) return;
    try {
      await addIngredient({
        name: ingredientForm.name.trim(),
        unit: ingredientForm.unit
      });
      setIngredientForm({ name: "", unit: "كغم" });
      window.alert("تمت إضافة المادة الخام بنجاح.");
    } catch (err) {
      console.error(err);
      window.alert("فشل في إضافة المادة الخام.");
    }
  }

  async function handleDeleteIngredient(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه المادة وجميع سجلات المشتريات التابعة لها؟")) return;
    try {
      await deleteIngredient(id);
      setSelectedIngredient(null);
      window.alert("تم حذف المادة بالكامل.");
    } catch (err) {
      console.error(err);
      window.alert("فشل حذف المادة.");
    }
  }

  async function handleAddPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIngredient?.id || !purchaseForm.quantity || !purchaseForm.unitPrice) return;
    try {
      await addIngredientPurchase({
        ingredientId: selectedIngredient.id,
        quantity: Number(purchaseForm.quantity),
        unitPrice: Number(purchaseForm.unitPrice),
        note: purchaseForm.note
      });
      setPurchaseForm({ quantity: "", unitPrice: "", note: "" });
      // Refresh selected ingredient locally to update totals immediately
      const updated = ingredients.find(i => i.id === selectedIngredient.id);
      if (updated) {
        setSelectedIngredient(updated);
      }
      window.alert("تم تسجيل الفاتورة وتحديث المخزون بنجاح.");
    } catch (err) {
      console.error(err);
      window.alert("فشل إضافة الفاتورة.");
    }
  }

  async function handleDeletePurchase(purchaseId: string) {
    if (!selectedIngredient?.id) return;
    if (!window.confirm("هل تريد حذف فاتورة الشراء هذه؟ سيتم خصم الكميات من الإجمالي.")) return;
    try {
      await deleteIngredientPurchase(purchaseId, selectedIngredient.id);
      window.alert("تم حذف الفاتورة وتحديث المخزون.");
    } catch (err) {
      console.error(err);
      window.alert("فشل حذف الفاتورة.");
    }
  }

  // Admin Order creation
  async function handleCreateAdminOrderSubmit(cartItems: CartItem[]) {
    if (!newOrderContext) return;
    try {
      const payload = {
        customer: {
          name: newOrderContext.customerName || "زبون عادي",
          phone: newOrderContext.customerPhone || "---",
          address: driverCustomerData.address || "داخل المطعم"
        },
        items: cartItems,
        orderType: newOrderContext.orderType,
        tableNumber: newOrderContext.tableNumber,
        takeoutNumber: newOrderContext.takeoutNumber,
        driverNumber: newOrderContext.driverNumber,
        deliveryFee: newOrderContext.orderType === "delivery" ? Number(driverCustomerData.deliveryFee || 100) : 0
      };

      await createAdminOrder(payload);
      setNewOrderContext(null);
      setPanelType(null);
      setDriverCustomerData({ name: "", phone: "", address: "", deliveryFee: "100" });
      window.alert("تم إنشاء الطلب بنجاح وإرساله للمطبخ.");
    } catch (err) {
      console.error(err);
      window.alert("تعذر إنشاء الطلب.");
    }
  }

  // Pre-calculated stats and filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (order.customer.name && order.customer.name.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (order.customer.phone && order.customer.phone.includes(orderSearch));

      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Order breakdown statistics
  const reportsData = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === "delivered");
    
    const dineInRevenue = completedOrders.filter(o => o.orderType === 'table').reduce((sum, o) => sum + o.total, 0);
    const takeawayRevenue = completedOrders.filter(o => o.orderType === 'takeout').reduce((sum, o) => sum + o.total, 0);
    const deliveryRevenue = completedOrders.filter(o => o.orderType === 'delivery').reduce((sum, o) => sum + o.total, 0);

    const dineInCount = completedOrders.filter(o => o.orderType === 'table').length;
    const takeawayCount = completedOrders.filter(o => o.orderType === 'takeout').length;
    const deliveryCount = completedOrders.filter(o => o.orderType === 'delivery').length;

    const totalSoldItemsProfit = completedOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
    const totalIngredientsSpent = ingredients.reduce((sum, ing) => sum + (ing.totalSpent || 0), 0);

    return {
      dineInRevenue,
      takeawayRevenue,
      deliveryRevenue,
      dineInCount,
      takeawayCount,
      deliveryCount,
      totalRevenue: dineInRevenue + takeawayRevenue + deliveryRevenue,
      totalSoldItemsProfit,
      totalIngredientsSpent
    };
  }, [orders, ingredients]);

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
      <main className="page-shell section" style={{ direction: "rtl", minHeight: "100vh", padding: "1rem" }}>
        <div className="back-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <BackButton />
          <InstallAppButton />
        </div>

        {!loggedIn ? (
          <section className="auth-card" style={{ maxWidth: "480px", margin: "2rem auto", padding: "2rem", borderRadius: "24px", background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
            <div className="auth-icon" style={{ fontSize: "3rem", textAlign: "center", marginBottom: "1rem" }}>{isRegisterMode ? "✨" : "👑"}</div>
            <h1 style={{ fontSize: "1.8rem", textAlign: "center", margin: "0 0 0.5rem", color: "var(--text)" }}>{isRegisterMode ? "إنشاء حساب إدارة جديد" : "لوحة تحكم DOUDOU"}</h1>
            <p className="auth-sub" style={{ textAlign: "center", color: "var(--muted)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>
              {isRegisterMode
                ? "أدخل بيانات المسؤول الجديد مع رمز المطور لإنشاء حساب إدارة."
                : "برجاء تسجيل الدخول لمتابعة الطلبات، المبيعات وإحصائيات المخزون والمصاريف."}
            </p>
            {isRegisterMode ? (
              <form className="grid" onSubmit={handleRegisterAdmin} style={{ display: "grid", gap: "1rem" }}>
                <input
                  className="input"
                  placeholder="الاسم الكامل للمدير"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, fullName: e.target.value }))}
                  required
                />
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, email: e.target.value }))}
                  required
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value }))}
                  required
                />
                <input
                  className="input"
                  type="password"
                  placeholder="رمز المطور السري"
                  value={registerForm.developerCode}
                  onChange={(e) => setRegisterForm((c) => ({ ...c, developerCode: e.target.value }))}
                  required
                />
                <button className="button button-primary" type="submit" style={{ padding: "0.9rem", fontWeight: "bold" }}>
                  تأكيد وإنشاء المسؤول ✨
                </button>
              </form>
            ) : (
              <form className="grid" onSubmit={handleLogin} style={{ display: "grid", gap: "1rem" }}>
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني للإدارة"
                  value={credentials.email}
                  onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
                  required
                />
                <input
                  className="input"
                  type="password"
                  placeholder="كلمة المرور"
                  value={credentials.password}
                  onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                  required
                />
                <button className="button button-primary" type="submit" style={{ padding: "0.9rem", fontWeight: "bold" }}>
                  تسجيل الدخول للمركز الرئيسي 🔐
                </button>
              </form>
            )}
            <button
              className="button auth-toggle"
              type="button"
              onClick={() => setIsRegisterMode((c) => !c)}
              style={{ display: "block", width: "100%", marginTop: "1rem", background: "none", color: "var(--primary)", border: "none", fontSize: "0.9rem", cursor: "pointer" }}
            >
              {isRegisterMode ? "العودة إلى تسجيل الدخول" : "إنشاء حساب إدارة جديد"}
            </button>
          </section>
        ) : (
          <section className="admin-shell">
            {/* Top Bar Header */}
            <div className="admin-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: "900", margin: "0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
                  <span>لوحة إدارة DOUDOU 👑</span>
                </h1>
                <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>إدارة مبيعات الطلبات، المواد الخام للمخازن، والإنفاق المالي الإجمالي.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <InstallAppButton />
                <button
                  className="button button-secondary"
                  onClick={async () => {
                    await logout();
                    setLoggedIn(false);
                  }}
                  style={{ fontWeight: "bold" }}
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>

            {/* Dynamic Tabs Navigation */}
            <div className="admin-tabs" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <button
                className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: activeTab === "overview" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(36, 23, 15, 0.05)",
                  color: activeTab === "overview" ? "#fff" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                <Layers size={18} />
                <span>المركز العام</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: activeTab === "orders" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(36, 23, 15, 0.05)",
                  color: activeTab === "orders" ? "#fff" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                <ShoppingBag size={18} />
                <span>إدارة الطلبات</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "inventory" ? "active" : ""}`}
                onClick={() => setActiveTab("inventory")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: activeTab === "inventory" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(36, 23, 15, 0.05)",
                  color: activeTab === "inventory" ? "#fff" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                <Package size={18} />
                <span>المخزون والمواد الخام</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "menu" ? "active" : ""}`}
                onClick={() => setActiveTab("menu")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: activeTab === "menu" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(36, 23, 15, 0.05)",
                  color: activeTab === "menu" ? "#fff" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                <Coffee size={18} />
                <span>منيو المأكولات</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => setActiveTab("reports")}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: activeTab === "reports" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(36, 23, 15, 0.05)",
                  color: activeTab === "reports" ? "#fff" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                <BarChart3 size={18} />
                <span>التقارير والمبيعات</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <div className="stat-card card" style={{ padding: "1.5rem", borderRadius: "18px", borderRight: "5px solid #22c55e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: "bold" }}>إجمالي المبيعات المكتملة</span>
                      <DollarSign size={24} style={{ color: "#22c55e" }} />
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "0.5rem", color: "var(--text)" }}>{formatCurrency(reportsData.totalRevenue)}</div>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--success)" }}>مبيعات دليفري، تيك أواي، وصالة</p>
                  </div>
                  <div className="stat-card card" style={{ padding: "1.5rem", borderRadius: "18px", borderRight: "5px solid var(--primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: "bold" }}>عدد الطلبات الكلي</span>
                      <ShoppingCart size={24} style={{ color: "var(--primary)" }} />
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "0.5rem", color: "var(--text)" }}>{stats.totalOrders}</div>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>جميع الطلبات المسجلة بالسيرفر</p>
                  </div>
                  <div className="stat-card card" style={{ padding: "1.5rem", borderRadius: "18px", borderRight: "5px solid #eab308" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: "bold" }}>الطلبات الجارية الآن</span>
                      <Clock size={24} style={{ color: "#eab308" }} />
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "0.5rem", color: "var(--text)" }}>{stats.activeOrders}</div>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>بانتظار التحضير أو التوصيل</p>
                  </div>
                  <div className="stat-card card" style={{ padding: "1.5rem", borderRadius: "18px", borderRight: "5px solid #3b82f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: "bold" }}>السائقين المتاحين</span>
                      <Truck size={24} style={{ color: "#3b82f6" }} />
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "0.5rem", color: "var(--text)" }}>{stats.availableDrivers}</div>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>سائقون مسجلون في التطبيق</p>
                  </div>
                </div>

                {/* PWA Background & Alarm Configuration Panel */}
                <div className="card" style={{ 
                  padding: "1.8rem", 
                  borderRadius: "24px", 
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(253, 246, 238, 0.95))", 
                  border: "1px solid rgba(194, 65, 12, 0.15)",
                  boxShadow: "0 10px 30px -10px rgba(194, 65, 12, 0.1)",
                  animation: "slideDown 0.3s ease"
                }}>
                  <style>{`
                    @keyframes pulseGreen {
                      0% { transform: scale(0.92); opacity: 0.6; }
                      50% { transform: scale(1.1); opacity: 1; }
                      100% { transform: scale(0.92); opacity: 0.6; }
                    }
                  `}</style>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.2rem" }}>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--primary-dark)", margin: "0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>🔔 لوحة التحكم الفائقة لتنبيهات وجرس الخلفية</span>
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span className="badge" style={{ 
                        background: "rgba(34, 197, 94, 0.1)", 
                        color: "#166534", 
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}>
                        <span style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          backgroundColor: "#22c55e",
                          display: "inline-block",
                          animation: "pulseGreen 1.5s infinite"
                        }} />
                        حارس خمول الخلفية: نشط 🟢
                      </span>
                    </div>
                  </div>

                  <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: "0 0 1.5rem 0", lineHeight: "1.6" }}>
                    لضمان استمرار عمل التطبيق في الخلفية <strong>وسماع صوت جرس المطبخ القوي دائماً</strong> حتى ولو لم يكن التطبيق مفتوحاً في الواجهة أو كان الهاتف مقفلاً، يرجى التحقق وتفعيل الصلاحيات التالية:
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {/* Status Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", background: "rgba(36, 23, 15, 0.02)", padding: "1.2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
                      <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1rem", fontWeight: "bold" }}>حالة الأذونات والاتصال:</h4>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                        <span>إذن إشعارات المتصفح والـ PWA:</span>
                        <span style={{ fontWeight: "bold", color: notifPermission === "granted" ? "#166534" : "#b91c1c" }}>
                          {notifPermission === "granted" ? "🟢 مسموح ومفعّل" : "🔴 غير مسموح (اضغط للتفعيل)"}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                        <span>حارس منع التجميد (Audio Lock):</span>
                        <span style={{ fontWeight: "bold", color: "#166534" }}>🟢 نشط ويحمي من الخمول</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                        <span>منع إيقاف الشاشة (Wake Lock):</span>
                        <span style={{ fontWeight: "bold", color: "#166534" }}>🟢 مفعّل ويحمي جهازك 🖥️</span>
                      </div>
                    </div>

                    {/* Actions Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
                      {notifPermission !== "granted" && (
                        <button 
                          onClick={handleRequestPermission}
                          className="button button-primary"
                          style={{ fontWeight: "bold", padding: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                        >
                          <span>تفعيل أذونات إشعارات النظام 🔔</span>
                        </button>
                      )}
                      
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => {
                            if (testAlarm) {
                              setTestAlarm(false);
                            } else {
                              setTestAlarm(true);
                              setTimeout(() => setTestAlarm(false), 4000);
                            }
                          }}
                          className="button"
                          style={{ 
                            flex: 1, 
                            fontWeight: "bold", 
                            padding: "0.85rem", 
                            background: testAlarm ? "#ef4444" : "rgba(194, 65, 12, 0.1)", 
                            color: testAlarm ? "#fff" : "var(--primary)",
                            border: "1px solid var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                          }}
                        >
                          <span>{testAlarm ? "⏹️ إيقاف الجرس" : "🔊 اختبار جرس المطبخ القوي"}</span>
                        </button>

                        <button 
                          onClick={handlePersistStorage}
                          className="button button-secondary"
                          style={{ flex: 1, fontWeight: "bold", padding: "0.85rem" }}
                        >
                          💾 حماية بيانات المتجر
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Device Guides */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: "bold", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Info size={16} />
                      <span>💡 إرشادات هامة لضمان عمل الإنذار دائماً في الخلفية:</span>
                    </h4>
                    <ul style={{ margin: "0", paddingRight: "1.2rem", color: "var(--muted)", fontSize: "0.85rem", lineHeight: "1.6" }}>
                      <li style={{ marginBottom: "0.4rem" }}>
                        <strong>لهواتف وأجهزة أندرويد (Android):</strong> اضغط مطولاً على أيقونة التطبيق المثبت في الشاشة الرئيسية ← اختر <strong>معلومات التطبيق (App Info)</strong> ← <strong>البطارية (Battery)</strong> ← اختر <strong>غير مقيدة (Unrestricted)</strong> لمنع نظام التشغيل من النوم أو كتم صوت التنبيه بالخلفية.
                      </li>
                      <li>
                        <strong>لأجهزة الكمبيوتر والمتصفح (Desktop/Chrome):</strong> تأكد من تفعيل صلاحية <strong>التشغيل التلقائي للصوت (Allow Sound Autoplay)</strong> في إعدادات الموقع بالمتصفح وقفل علامة التبويب Pin Tab لتظل نشطة طوال اليوم.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card" style={{ padding: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>نسب قنوات الطلب المتنوعة (DOUDOU)</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    <div style={{ background: "rgba(36,23,15,0.02)", padding: "1rem", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                        <span style={{ fontWeight: "bold" }}>🍽️ تناول داخل الصالة (Dine-in)</span>
                        <span>{reportsData.dineInCount} طلب / {formatCurrency(reportsData.dineInRevenue)}</span>
                      </div>
                      <div style={{ height: "10px", background: "#e5ded4", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          background: "var(--primary)",
                          width: `${reportsData.totalRevenue ? (reportsData.dineInRevenue / reportsData.totalRevenue) * 100 : 0}%`
                        }} />
                      </div>
                    </div>

                    <div style={{ background: "rgba(36,23,15,0.02)", padding: "1rem", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                        <span style={{ fontWeight: "bold" }}>🥡 طلبات التيك أواي (Takeaway)</span>
                        <span>{reportsData.takeawayCount} طلب / {formatCurrency(reportsData.takeawayRevenue)}</span>
                      </div>
                      <div style={{ height: "10px", background: "#e5ded4", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          background: "#22c55e",
                          width: `${reportsData.totalRevenue ? (reportsData.takeawayRevenue / reportsData.totalRevenue) * 100 : 0}%`
                        }} />
                      </div>
                    </div>

                    <div style={{ background: "rgba(36,23,15,0.02)", padding: "1rem", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                        <span style={{ fontWeight: "bold" }}>🚗 طلبات التوصيل الخارجي (Delivery)</span>
                        <span>{reportsData.deliveryCount} طلب / {formatCurrency(reportsData.deliveryRevenue)}</span>
                      </div>
                      <div style={{ height: "10px", background: "#e5ded4", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          background: "#3b82f6",
                          width: `${reportsData.totalRevenue ? (reportsData.deliveryRevenue / reportsData.totalRevenue) * 100 : 0}%`
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS MANAGEMENT */}
            {activeTab === "orders" && (
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {/* 1. Order Creation Channels Panel */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.2rem", margin: "0 0 1rem", fontWeight: "900", color: "var(--text)" }}>فتح قنوات مبيعات جديدة لزبون (كاشير)</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <button
                      onClick={() => { setPanelType("dine-in"); setNewOrderContext(null); setDriverPhoneStep(null); }}
                      style={{
                        padding: "1rem",
                        borderRadius: "16px",
                        border: "1px solid rgba(194, 65, 12, 0.2)",
                        background: "rgba(194, 65, 12, 0.05)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "var(--primary)"
                      }}
                    >
                      <Coffee size={28} />
                      <span>🍽️ طلب صالة (Dine-in)</span>
                    </button>

                    <button
                      onClick={() => { setPanelType("takeout"); setNewOrderContext(null); setDriverPhoneStep(null); }}
                      style={{
                        padding: "1rem",
                        borderRadius: "16px",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                        background: "rgba(34, 197, 94, 0.05)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#166534"
                      }}
                    >
                      <ShoppingBag size={28} />
                      <span>🥡 طلب سفري (Takeaway)</span>
                    </button>

                    <button
                      onClick={() => { setPanelType("delivery"); setNewOrderContext(null); setDriverPhoneStep(null); }}
                      style={{
                        padding: "1rem",
                        borderRadius: "16px",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        background: "rgba(59, 130, 246, 0.05)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#1e3a8a"
                      }}
                    >
                      <Truck size={28} />
                      <span>🚗 طلب توصيل (Delivery)</span>
                    </button>
                  </div>
                </div>

                {/* Grid Selectors based on panelType */}
                {panelType === "dine-in" && !newOrderContext && (
                  <div className="card" style={{ padding: "1.5rem", animation: "slideDown 0.2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", margin: "0" }}>شبكة الطاولات داخل الصالة (اختر طاولة فارغة):</h3>
                      <button className="button" onClick={() => setPanelType(null)} style={{ padding: "0.4rem 0.8rem", background: "#f3f4f6" }}>إلغاء</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                        const occupied = orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.orderType === 'table' && o.tableNumber === num);
                        return (
                          <button
                            key={num}
                            onClick={() => !occupied && setNewOrderContext({ orderType: "table", tableNumber: num })}
                            disabled={occupied}
                            style={{
                              padding: "1.2rem",
                              borderRadius: "12px",
                              border: occupied ? "1px solid #fca5a5" : "2px solid #e2e8f0",
                              background: occupied ? "#fef2f2" : "#fff",
                              color: occupied ? "#ef4444" : "var(--text)",
                              fontWeight: "bold",
                              cursor: occupied ? "not-allowed" : "pointer",
                              opacity: occupied ? 0.7 : 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>طاولة {num}</span>
                            <span style={{ fontSize: "0.75rem", color: occupied ? "#ef4444" : "#10b981" }}>{occupied ? "مشغولة 🔴" : "فارغة 🟢"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {panelType === "takeout" && !newOrderContext && (
                  <div className="card" style={{ padding: "1.5rem", animation: "slideDown 0.2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", margin: "0" }}>أرقام بطاقات الانتظار للسفري:</h3>
                      <button className="button" onClick={() => setPanelType(null)} style={{ padding: "0.4rem 0.8rem", background: "#f3f4f6" }}>إلغاء</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                        const occupied = orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.orderType === 'takeout' && o.takeoutNumber === num);
                        return (
                          <button
                            key={num}
                            onClick={() => !occupied && setNewOrderContext({ orderType: "takeout", takeoutNumber: num })}
                            disabled={occupied}
                            style={{
                              padding: "1.2rem",
                              borderRadius: "12px",
                              border: occupied ? "1px solid #fca5a5" : "2px solid #e2e8f0",
                              background: occupied ? "#fef2f2" : "#fff",
                              color: occupied ? "#ef4444" : "var(--text)",
                              fontWeight: "bold",
                              cursor: occupied ? "not-allowed" : "pointer",
                              opacity: occupied ? 0.7 : 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>بطاقة {num}</span>
                            <span style={{ fontSize: "0.75rem", color: occupied ? "#ef4444" : "#10b981" }}>{occupied ? "محجوزة" : "متاحة"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {panelType === "delivery" && !newOrderContext && !driverPhoneStep && (
                  <div className="card" style={{ padding: "1.5rem", animation: "slideDown 0.2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", margin: "0" }}>اختر سائق متوفر للطلب الخارجي:</h3>
                      <button className="button" onClick={() => setPanelType(null)} style={{ padding: "0.4rem 0.8rem", background: "#f3f4f6" }}>إلغاء</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                        const occupied = orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.orderType === 'delivery' && o.driverNumber === num);
                        return (
                          <button
                            key={num}
                            onClick={() => !occupied && setDriverPhoneStep({ driverNumber: num })}
                            disabled={occupied}
                            style={{
                              padding: "1.2rem",
                              borderRadius: "12px",
                              border: occupied ? "1px solid #fca5a5" : "2px solid #e2e8f0",
                              background: occupied ? "#fef2f2" : "#fff",
                              color: occupied ? "#ef4444" : "var(--text)",
                              fontWeight: "bold",
                              cursor: occupied ? "not-allowed" : "pointer",
                              opacity: occupied ? 0.7 : 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>سائق {num}</span>
                            <span style={{ fontSize: "0.75rem", color: occupied ? "#ef4444" : "#10b981" }}>{occupied ? "مشغول" : "متاح"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Driver Customer Info Input Form Form Modal */}
                {driverPhoneStep && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", top: "0", bottom: "0", left: "0", right: "0", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                    <div className="card" style={{ background: "#fff", padding: "2rem", width: "100%", maxWidth: "450px", position: "relative", borderRadius: "18px" }}>
                      <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--text)" }}>تسجيل بيانات العميل (للتوصيل عبر سائق {driverPhoneStep.driverNumber})</h3>
                      <div className="grid" style={{ display: "grid", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "bold" }}>اسم العميل (اختياري)</label>
                          <input
                            className="input"
                            value={driverCustomerData.name}
                            onChange={(e) => setDriverCustomerData(c => ({ ...c, name: e.target.value }))}
                            placeholder="الاسم الكامل"
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "bold" }}>رقم الهاتف (مطلوب)</label>
                          <input
                            className="input"
                            value={driverCustomerData.phone}
                            onChange={(e) => setDriverCustomerData(c => ({ ...c, phone: e.target.value }))}
                            placeholder="0550 00 00 00"
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "bold" }}>عنوان التوصيل الكامل (مطلوب)</label>
                          <input
                            className="input"
                            value={driverCustomerData.address}
                            onChange={(e) => setDriverCustomerData(c => ({ ...c, address: e.target.value }))}
                            placeholder="اسم الشارع، رقم العمارة، الطابق"
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "bold" }}>رسوم التوصيل (د.ج)</label>
                          <input
                            className="input"
                            type="number"
                            value={driverCustomerData.deliveryFee}
                            onChange={(e) => setDriverCustomerData(c => ({ ...c, deliveryFee: e.target.value }))}
                            placeholder="100"
                            required
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                        <button
                          className="button button-primary"
                          onClick={() => {
                            if (!driverCustomerData.phone.trim() || !driverCustomerData.address.trim()) {
                              window.alert("يرجى ملء الحقول المطلوبة (الهاتف والعنوان)");
                              return;
                            }
                            setNewOrderContext({
                              orderType: "delivery",
                              driverNumber: driverPhoneStep.driverNumber,
                              customerName: driverCustomerData.name || "عميل دليفري",
                              customerPhone: driverCustomerData.phone
                            });
                            setDriverPhoneStep(null);
                          }}
                          style={{ flex: 1, fontWeight: "bold" }}
                        >
                          متابعة اختيار المنتجات 🍽️
                        </button>
                        <button className="button button-secondary" onClick={() => setDriverPhoneStep(null)}>إلغاء</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders filtering and search */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                    <input
                      className="input"
                      style={{ paddingRight: "2.5rem" }}
                      placeholder="ابحث برقم الطلب، اسم الزبون، أو رقم الهاتف..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                    <Search size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {(["all", "pending", "preparing", "ready", "delivered", "cancelled"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        style={{
                          padding: "0.5rem 0.8rem",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          background: orderStatusFilter === st ? "var(--primary)" : "rgba(36,23,15,0.04)",
                          color: orderStatusFilter === st ? "#fff" : "var(--text)"
                        }}
                      >
                        {st === "all" ? "الكل" : STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of existing orders */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.2rem", margin: "0" }}>أحدث طلبات المطعم الجارية ({filteredOrders.length})</h2>
                  </div>
                  
                  {filteredOrders.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>لا توجد أي طلبات مطابقة للبحث حاليًا.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          style={{
                            padding: "1rem",
                            borderRadius: "14px",
                            border: "1px solid var(--border)",
                            background: "rgba(255,255,255,0.5)",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            alignItems: "center",
                            gap: "1rem"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: "900", color: "var(--primary)", fontSize: "1.1rem" }}>#{order.orderNumber}</span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "99px",
                                  fontWeight: "bold",
                                  background:
                                    order.orderType === "table" ? "rgba(194, 65, 12, 0.1)" :
                                    order.orderType === "takeout" ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                  color:
                                    order.orderType === "table" ? "var(--primary)" :
                                    order.orderType === "takeout" ? "#166534" : "#1e3a8a"
                                }}
                              >
                                {order.orderType === "table" ? `🍽️ صالة - طاولة ${order.tableNumber}` :
                                 order.orderType === "takeout" ? `🥡 سفري - كارت ${order.takeoutNumber}` :
                                 `🚗 دليفري - سائق ${order.driverNumber}`}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.9rem", marginTop: "0.25rem", color: "var(--text)" }}>
                              <strong>{order.customer.name}</strong> ({order.customer.phone})
                            </div>
                          </div>

                          <div>
                            <span style={{ display: "inline-block", fontSize: "0.8rem", color: "var(--muted)" }}>الإجمالي:</span>
                            <div style={{ fontSize: "1.15rem", fontWeight: "bold" }}>{formatCurrency(order.total)}</div>
                            <span style={{ fontSize: "0.75rem", color: "#166534" }}>الأرباح: {formatCurrency(order.profit || 0)}</span>
                          </div>

                          <div>
                            <span style={{ display: "inline-block", fontSize: "0.8rem", color: "var(--muted)" }}>حالة الطلب:</span>
                            <div style={{ fontWeight: "bold", color: "var(--primary-dark)" }}>{STATUS_LABELS[order.status]}</div>
                          </div>

                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                            <button
                              className="button button-secondary"
                              onClick={() => setSelectedOrder(order)}
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", fontWeight: "bold" }}
                            >
                              تفاصيل الطلب 🔍
                            </button>
                            {order.status !== "delivered" && order.status !== "cancelled" && (
                              <button
                                className="button button-primary"
                                onClick={async () => {
                                  if (order.status === "pending") {
                                    await updateOrderStatus(order.id, "preparing");
                                  } else if (order.status === "preparing") {
                                    await updateOrderStatus(order.id, "ready");
                                  } else if (order.status === "ready" || order.status === "assigned" || order.status === "picked_up" || order.status === "out_for_delivery") {
                                    await updateOrderStatus(order.id, "delivered");
                                  }
                                  window.alert("تم تحديث حالة الطلب.");
                                }}
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", fontWeight: "bold" }}
                              >
                                {order.status === "pending" ? "بدء التحضير 🍳" :
                                 order.status === "preparing" ? "جاهز للتسليم ✓" : "إنهاء وتسليم 🏁"}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("هل أنت متأكد من حذف هذا الطلب نهائيًا من قاعدة البيانات؟")) {
                                  deleteOrder(order.id).then(() => window.alert("تم حذف الطلب."));
                                }
                              }}
                              style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "0.5rem" }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: INVENTORY & STOCK MANAGEMENT */}
            {activeTab === "inventory" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {/* Left side: Ingredients List */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.2rem", margin: "0", fontWeight: "900" }}>المواد الخام والمكونات 🥩</h2>
                  </div>

                  <form onSubmit={handleAddIngredient} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <input
                      className="input"
                      placeholder="اسم المادة الخام (مثال: دجاج)"
                      value={ingredientForm.name}
                      onChange={(e) => setIngredientForm(c => ({ ...c, name: e.target.value }))}
                      required
                    />
                    <select
                      className="select"
                      style={{ maxWidth: "100px" }}
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm(c => ({ ...c, unit: e.target.value }))}
                    >
                      <option value="كغم">كغم</option>
                      <option value="غرام">غرام</option>
                      <option value="لتر">لتر</option>
                      <option value="صندوق">صندوق</option>
                      <option value="وحدة">وحدة</option>
                    </select>
                    <button className="button button-primary" type="submit" style={{ padding: "0.75rem", flexShrink: 0 }}>
                      <Plus size={20} />
                    </button>
                  </form>

                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {ingredients.length === 0 ? (
                      <p style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>لا توجد أي مواد خام مضافة.</p>
                    ) : (
                      ingredients.map((ing) => {
                        const isSelected = selectedIngredient?.id === ing.id;
                        const avgPrice = ing.totalStock > 0 ? (ing.totalSpent / ing.totalStock) : 0;
                        return (
                          <div
                            key={ing.id}
                            onClick={() => setSelectedIngredient(ing)}
                            style={{
                              padding: "1rem",
                              borderRadius: "12px",
                              border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                              background: isSelected ? "rgba(194, 65, 12, 0.05)" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h3 style={{ margin: "0", fontSize: "1.05rem", fontWeight: "bold" }}>{ing.name}</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ing.id) handleDeleteIngredient(ing.id);
                                }}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                              <div>المخزون الحالي: <strong style={{ color: "var(--text)" }}>{ing.totalStock} {ing.unit}</strong></div>
                              <div>إجمالي الإنفاق: <strong style={{ color: "var(--text)" }}>{formatCurrency(ing.totalSpent)}</strong></div>
                              <div>متوسط السعر: <strong style={{ color: "var(--text)" }}>{formatCurrency(avgPrice)} / {ing.unit}</strong></div>
                              <div>عدد الفواتير: <strong style={{ color: "var(--text)" }}>{ing.purchaseCount}</strong></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right side: Selected Ingredient Invoice Logs */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  {selectedIngredient ? (
                    <div>
                      <h2 style={{ fontSize: "1.2rem", margin: "0 0 0.25rem", fontWeight: "900" }}>سجل مشتريات: {selectedIngredient.name}</h2>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
                        الوحدة الأساسية: {selectedIngredient.unit} | متوسط التكلفة: {formatCurrency(selectedIngredient.totalStock > 0 ? (selectedIngredient.totalSpent / selectedIngredient.totalStock) : 0)}
                      </p>

                      {/* Log purchase form */}
                      <form onSubmit={handleAddPurchase} style={{ background: "rgba(36,23,15,0.03)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>تسجيل فاتورة شراء جديدة:</h4>
                        <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <input
                            className="input"
                            type="number"
                            step="any"
                            placeholder={`الكمية (${selectedIngredient.unit})`}
                            value={purchaseForm.quantity}
                            onChange={(e) => setPurchaseForm(c => ({ ...c, quantity: e.target.value }))}
                            required
                          />
                          <input
                            className="input"
                            type="number"
                            step="any"
                            placeholder="سعر الوحدة بالدج"
                            value={purchaseForm.unitPrice}
                            onChange={(e) => setPurchaseForm(c => ({ ...c, unitPrice: e.target.value }))}
                            required
                          />
                        </div>
                        <input
                          className="input"
                          placeholder="ملاحظات (مثال: مورد دجاج الصومعة)"
                          value={purchaseForm.note}
                          onChange={(e) => setPurchaseForm(c => ({ ...c, note: e.target.value }))}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                            الإجمالي المحسوب: <strong>{formatCurrency((Number(purchaseForm.quantity) || 0) * (Number(purchaseForm.unitPrice) || 0))}</strong>
                          </span>
                          <button className="button button-primary" type="submit" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                            حفظ الفاتورة +
                          </button>
                        </div>
                      </form>

                      {/* Purchases list */}
                      <h4 style={{ margin: "0 0 0.5rem" }}>الفواتير المسجلة لهذه المادة ({ingredientPurchases.length}):</h4>
                      <div style={{ display: "grid", gap: "0.5rem", maxHeight: "300px", overflowY: "auto" }}>
                        {ingredientPurchases.length === 0 ? (
                          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", padding: "1rem" }}>لا توجد أي فواتير مسجلة للمادة المحددة.</p>
                        ) : (
                          ingredientPurchases.map((purchase) => (
                            <div
                              key={purchase.id}
                              style={{
                                padding: "0.75rem",
                                borderRadius: "8px",
                                background: "#fff",
                                border: "1px solid var(--border)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{purchase.quantity} {selectedIngredient.unit} × {formatCurrency(purchase.unitPrice)}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{purchase.note || "بدون ملاحظات"}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontWeight: "bold", color: "var(--primary)" }}>{formatCurrency(purchase.totalCost)}</span>
                                <button
                                  onClick={() => purchase.id && handleDeletePurchase(purchase.id)}
                                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", padding: "2rem", textAlign: "center" }}>
                      <Package size={48} style={{ marginBottom: "0.5rem" }} />
                      <p>اختر أحد المواد الخام من القائمة الجانبية لتسجيل فواتير الشراء والتكلفة وعرض متوسط الأسعار.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MENU ITEMS MANAGEMENT */}
            {activeTab === "menu" && (
              <div className="section-card card" style={{ padding: "1.5rem" }}>
                <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.2rem", margin: "0" }}>إدارة قائمة الطعام (DOUDOU Menu)</h2>
                  <span className="count-pill" style={{ background: "var(--primary)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "bold" }}>{menuItems.length} طبق</span>
                </div>

                <form className="menu-form-grid" onSubmit={handleMenuSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem", background: "rgba(36,23,15,0.02)", padding: "1.5rem", borderRadius: "16px" }}>
                  <input
                    className="input"
                    placeholder="اسم الطبق"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm((c) => ({ ...c, name: e.target.value }))}
                    required
                  />
                  <input
                    className="input"
                    placeholder="التصنيف (مثال: برغر، بيتزا، مشروبات)"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm((c) => ({ ...c, category: e.target.value }))}
                    required
                  />
                  <textarea
                    className="textarea span-2"
                    placeholder="وصف مكونات الطبق بالتفصيل..."
                    rows={2}
                    value={menuForm.description}
                    onChange={(e) => setMenuForm((c) => ({ ...c, description: e.target.value }))}
                    style={{ gridColumn: "1 / -1" }}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="سعر البيع المعتمد (دج)"
                    value={menuForm.price || ""}
                    onChange={(e) => setMenuForm((c) => ({ ...c, price: Number(e.target.value) }))}
                    required
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="سعر تكلفة المكونات (costPrice)"
                    value={menuForm.costPrice || ""}
                    onChange={(e) => setMenuForm((c) => ({ ...c, costPrice: Number(e.target.value) }))}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="مدة التحضير (دقيقة)"
                    value={menuForm.prepTime || ""}
                    onChange={(e) => setMenuForm((c) => ({ ...c, prepTime: Number(e.target.value) }))}
                  />
                  <input className="input" type="file" accept="image/*" onChange={handleImageUpload} />
                  <input
                    className="input"
                    placeholder="رابط صورة الطبق"
                    value={menuForm.imageUrl}
                    onChange={(e) => setMenuForm((c) => ({ ...c, imageUrl: e.target.value }))}
                    style={{ gridColumn: "1 / -1" }}
                  />
                  <div className="submit-row" style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", gridColumn: "1 / -1" }}>
                    <button className="button button-primary" type="submit" disabled={uploading} style={{ flex: 1, fontWeight: "bold" }}>
                      {uploading ? "جارٍ رفع الصورة..." : menuForm.id ? "تحديث الطبق" : "إضافة طبق جديد للمنيو ✨"}
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
                  <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>لا توجد أي أطباق بالمنيو.</p>
                ) : (
                  <div className="menu-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                    {menuItems.map((item) => (
                      <article key={item.id} className="menu-item-card card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div
                          className="thumb"
                          style={{
                            height: "150px",
                            backgroundImage: `url(${item.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center"
                          }}
                        />
                        <div className="body" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                          <h3 style={{ margin: "0", fontSize: "1.1rem" }}>{item.name}</h3>
                          <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>التصنيف: {item.category || "عام"}</span>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                            <span className="price" style={{ fontWeight: "bold", color: "var(--primary-dark)" }}>بيع: {formatCurrency(item.price)}</span>
                            {item.costPrice ? (
                              <span style={{ fontSize: "0.8rem", color: "#166534" }}>تكلفة: {formatCurrency(item.costPrice)}</span>
                            ) : null}
                          </div>
                          <div className="actions" style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                            <button className="button button-secondary" onClick={() => setMenuForm(item)} style={{ flex: 1, padding: "0.4rem" }}>
                              تعديل
                            </button>
                            <button
                              className="button button-danger"
                              onClick={() => {
                                if (window.confirm("هل تريد حذف هذا الطبق من قائمة الطعام؟")) {
                                  deleteMenuItem(item.id).then(() => window.alert("تم حذف الطبق."));
                                }
                              }}
                              style={{ flex: 1, padding: "0.4rem", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
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

            {/* TAB 5: REPORTS & AGGREGATION */}
            {activeTab === "reports" && (
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {/* 1. Channel Performance */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.25rem", fontWeight: "900" }}>إحصائيات قنوات المبيعات والطلبات (الطلبات المسلمة فقط)</h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                    <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(194, 65, 12, 0.05)", borderRight: "4px solid var(--primary)" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--primary-dark)" }}>الصالة (Dine-in)</h3>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{formatCurrency(reportsData.dineInRevenue)}</div>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>إجمالي {reportsData.dineInCount} طلبات صالة ناجحة</p>
                    </div>

                    <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(34, 197, 94, 0.05)", borderRight: "4px solid #22c55e" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#166534" }}>السفري (Takeaway)</h3>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{formatCurrency(reportsData.takeawayRevenue)}</div>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>إجمالي {reportsData.takeawayCount} طلبات سفري ناجحة</p>
                    </div>

                    <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", borderRight: "4px solid #3b82f6" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#1e3a8a" }}>التوصيل الخارجي (Delivery)</h3>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{formatCurrency(reportsData.deliveryRevenue)}</div>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>إجمالي {reportsData.deliveryCount} طلبات توصيل ناجحة</p>
                    </div>
                  </div>
                </div>

                {/* 2. Financial Summary Margin */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem", fontWeight: "bold" }}>تحليل أرباح مبيعات المنتجات</h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>قيمة الإيرادات الإجمالية:</span>
                        <strong style={{ color: "var(--text)" }}>{formatCurrency(reportsData.totalRevenue)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>قيمة تكلفة السلع المباعة التقريبية:</span>
                        <strong style={{ color: "#ef4444" }}>-{formatCurrency(reportsData.totalRevenue - reportsData.totalSoldItemsProfit)}</strong>
                      </div>
                      <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem" }}>
                        <span>الأرباح الصافية (الهامش):</span>
                        <strong style={{ color: "#22c55e" }}>{formatCurrency(reportsData.totalSoldItemsProfit)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem", fontWeight: "bold" }}>ميزانية الإنفاق على المواد الخام</h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>إجمالي المبالغ المنفقة لشراء المواد الخام:</span>
                        <strong style={{ color: "#ef4444" }}>{formatCurrency(reportsData.totalIngredientsSpent)}</strong>
                      </div>
                      <p style={{ margin: "0", fontSize: "0.85rem", color: "var(--muted)", lineHeight: "1.4" }}>
                        توضح هذه الميزانية التكاليف المالية الكلية التي صرفت لتعبئة المخازن بالمواد الخام التجميعية، ويتم تحديثها تلقائياً عند إضافة أو حذف فواتير الشراء للمواد.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER DETAIL VIEW MODAL */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", top: "0", bottom: "0", left: "0", right: "0", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                <div className="card" style={{ background: "#fff", padding: "2rem", width: "100%", maxWidth: "550px", maxHeight: "90vh", overflowY: "auto", borderRadius: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ margin: "0", fontSize: "1.3rem", fontWeight: "900", color: "var(--text)" }}>تفاصيل طلب رقم #{selectedOrder.orderNumber}</h3>
                    <button onClick={() => setSelectedOrder(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={24} /></button>
                  </div>
                  
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{ background: "rgba(36,23,15,0.02)", padding: "1rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>بيانات الزبون:</h4>
                      <p style={{ margin: "0.2rem 0" }}>الاسم: <strong>{selectedOrder.customer.name}</strong></p>
                      <p style={{ margin: "0.2rem 0" }}>الهاتف: <strong>{selectedOrder.customer.phone}</strong></p>
                      <p style={{ margin: "0.2rem 0" }}>العنوان: <strong>{selectedOrder.customer.address}</strong></p>
                      <p style={{ margin: "0.2rem 0" }}>نوع الطلب: <strong>{STATUS_LABELS[selectedOrder.status]}</strong></p>
                    </div>

                    <div>
                      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>الوجبات والمنتجات المطلوبة:</h4>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
                            <span>{item.name} <strong>x{item.quantity}</strong></span>
                            <span style={{ fontWeight: "bold" }}>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span>قيمة السلع:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.deliveryFee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span>رسوم التوصيل:</span>
                          <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "900", color: "var(--primary-dark)", marginTop: "0.5rem" }}>
                        <span>المبلغ الإجمالي الكلي:</span>
                        <span>{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEW ORDER SELECTION & MENU CART MODAL (Walk-in Cashier Creator) */}
            {newOrderContext && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", top: "0", bottom: "0", left: "0", right: "0", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                <NewOrderBuilderModal
                  menuItems={menuItems}
                  context={newOrderContext}
                  onClose={() => setNewOrderContext(null)}
                  onSubmit={handleCreateAdminOrderSubmit}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

// Subcomponent: NewOrderBuilderModal (Meal / Cart builder for the Cashier)
interface NewOrderBuilderModalProps {
  menuItems: MenuItem[];
  context: {
    orderType: "table" | "takeout" | "delivery";
    tableNumber?: number;
    takeoutNumber?: number;
    driverNumber?: number;
    customerName?: string;
    customerPhone?: string;
  };
  onClose: () => void;
  onSubmit: (items: CartItem[]) => void;
}

function NewOrderBuilderModal({ menuItems, context, onClose, onSubmit }: NewOrderBuilderModalProps) {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ["all", ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.available;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }
      return {
        ...prev,
        [item.id]: { ...item, quantity: 1 }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const cartList = useMemo(() => Object.values(cart), [cart]);
  
  const subtotal = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartList]);

  return (
    <div className="card" style={{ background: "#fff", padding: "1.5rem", width: "95%", maxWidth: "900px", height: "85vh", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", borderRadius: "18px", overflow: "hidden" }}>
      {/* Left panel: Menu selector */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h3 style={{ margin: "0", fontSize: "1.2rem", fontWeight: "900" }}>أضف وجبات للطلب المباع الجديد</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--primary)" }}>
              {context.orderType === "table" ? `🍽️ صالة - طاولة ${context.tableNumber}` :
               context.orderType === "takeout" ? `🥡 سفري - رقم الانتظار ${context.takeoutNumber}` :
               `🚗 دليفري عبر السائق ${context.driverNumber}`}
            </span>
          </div>
          <button className="button" onClick={onClose} style={{ padding: "0.4rem 0.8rem", background: "#f3f4f6" }}>رجوع</button>
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            className="input"
            placeholder="ابحث عن وجبة بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ maxWidth: "130px" }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "كل الأقسام" : c}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", padding: "0.2rem" }}>
          {filteredItems.map((item) => {
            const countInCart = cart[item.id]?.quantity || 0;
            return (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                }}
              >
                <div
                  style={{
                    height: "100px",
                    borderRadius: "8px",
                    backgroundImage: `url(${item.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    marginBottom: "0.5rem"
                  }}
                />
                <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: "bold" }}>{item.name}</h4>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary)", fontSize: "0.95rem" }}>{formatCurrency(item.price)}</span>
                </div>

                {countInCart > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0.25rem",
                      left: "0.25rem",
                      background: "var(--primary)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "bold"
                    }}
                  >
                    <span style={{ margin: "auto" }}>{countInCart}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Cart list and checkout */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", borderRight: "1px solid var(--border)", paddingRight: "1rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: "900", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <ShoppingCart size={20} />
          <span>سلة الوجبات المختارة ({cartList.length})</span>
        </h3>

        <div style={{ flex: 1, overflowY: "auto", display: "grid", gap: "0.5rem", alignContent: "flex-start", marginBottom: "1rem" }}>
          {cartList.length === 0 ? (
            <p style={{ color: "var(--muted)", textAlign: "center", marginTop: "2rem" }}>السلة فارغة. اضغط على أي وجبة لإضافتها.</p>
          ) : (
            cartList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "10px",
                  background: "rgba(36,23,15,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{item.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{formatCurrency(item.price)} × {item.quantity}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button onClick={() => removeFromCart(item.id)} style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--primary)", padding: "0.2rem" }}>-</button>
                  <span style={{ fontWeight: "bold" }}>{item.quantity}</span>
                  <button onClick={() => addToCart(item)} style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--primary)", padding: "0.2rem" }}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "1rem" }}>
            <span>المجموع الإجمالي:</span>
            <strong style={{ fontSize: "1.2rem", color: "var(--primary-dark)" }}>{formatCurrency(subtotal)}</strong>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              if (cartList.length === 0) {
                window.alert("يرجى اختيار وجبة واحدة على الأقل قبل تأكيد الطلب.");
                return;
              }
              onSubmit(cartList);
            }}
            style={{ width: "100%", padding: "0.85rem", fontWeight: "bold" }}
          >
            تأكيد وإرسال الطلب للمطبخ 👨‍🍳✓
          </button>
        </div>
      </div>
    </div>
  );
}
