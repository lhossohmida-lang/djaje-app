"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, ShoppingBag, Heart, Plus, Minus, Trash2, X, ChevronLeft } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { sampleMenu } from "@/data/mock-data";
import { notify } from "@/services/notification-service";
import { createOrder } from "@/services/order-service";
import { subscribeToMenu } from "@/services/menu-service";
import { CustomerInfo, MenuItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { FloatingActions } from "@/components/shared/floating-actions";
import { SplashScreen } from "@/components/shared/splash-screen";
import { DELIVERY_FEE } from "@/services/order-service";

const initialCustomer: CustomerInfo = {
  name: "",
  phone: "",
  address: "",
  notes: ""
};

export default function CustomerPage() {
  const { items, addToCart, subtotal, clearCart, decreaseQuantity, removeFromCart } = useCart();
  const [menu, setMenu] = useState<MenuItem[]>(sampleMenu);
  const [keyword, setKeyword] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [customer, setCustomer] = useState<CustomerInfo>(initialCustomer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMenu(setMenu);
    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(menu.map((item) => item.category));
    return ["الكل", ...Array.from(cats)];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    let filtered = menu;
    if (activeCategory !== "الكل") {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }
    if (keyword.trim()) {
      const normalized = keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized)
      );
    }
    return filtered;
  }, [menu, keyword, activeCategory]);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  async function handleOrderSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) {
      window.alert("أضف وجبة واحدة على الأقل قبل تأكيد الطلب.");
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await createOrder({ customer, items });
      setCreatedOrder(order);
      await notify("تم تسجيل الطلب", `رقم الطلب الخاص بك هو ${order.orderNumber}`);
      clearCart();
      setCustomer(initialCustomer);
      setShowCart(false);
      setShowOrderForm(false);
    } catch (error) {
      console.error(error);
      window.alert("تعذر حفظ الطلب الآن. تأكد من ربط Firebase ثم أعد المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="market-app">
      {/* ===== SPLASH SCREEN ===== */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* ===== HEADER ===== */}
      <header className="market-header">
        <button
          className="market-header-icon"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="بحث"
        >
          <Search size={22} />
        </button>

        <div className="market-logo">
          <Image src="/icon-192x192.png" alt="Doudou" width={44} height={44} style={{ borderRadius: "12px" }} />
          <span className="market-logo-text">DOUDOU</span>
        </div>

        <button
          className="market-header-icon market-cart-icon"
          onClick={() => setShowCart(true)}
          aria-label="السلة"
        >
          <ShoppingBag size={22} />
          {items.length > 0 && (
            <span className="market-cart-count">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          )}
        </button>
      </header>

      {/* ===== SEARCH BAR (expandable) ===== */}
      {showSearch && (
        <div className="market-search-bar">
          <Search size={18} className="market-search-icon" />
          <input
            className="market-search-input"
            placeholder="ابحث عن طبق أو تصنيف..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          <button className="market-search-close" onClick={() => { setShowSearch(false); setKeyword(""); }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* ===== HERO BANNER ===== */}
      <section className="market-hero">
        <div className="market-hero-overlay" />
        <div className="market-hero-content">
          <h1 className="market-hero-title">
            وجبات
            <br />
            طازجة يومياً
          </h1>
        </div>
      </section>

      {/* ===== ORDER SUCCESS ===== */}
      {createdOrder && (
        <div className="market-success-banner">
          <h3>✓ تم إنشاء الطلب بنجاح</h3>
          <p>رقم الطلب: <strong>{createdOrder.orderNumber}</strong></p>
          <p className="market-success-hint">احتفظ برقم الطلب لاستخدامه في صفحة التتبع</p>
        </div>
      )}

      {/* ===== CATEGORY TABS ===== */}
      <nav className="market-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`market-cat-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* ===== PRODUCT GRID ===== */}
      <section className="market-products">
        {filteredMenu.map((item) => (
          <article key={item.id} className="market-product-card">
            <div
              className="market-product-img"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
            >
              <button
                className={`market-fav-btn ${favorites.has(item.id) ? "active" : ""}`}
                onClick={() => toggleFavorite(item.id)}
                aria-label="مفضلة"
              >
                <Heart size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="market-product-info">
              <span className="market-product-price">{formatCurrency(item.price)}</span>
              <h3 className="market-product-name">{item.name}</h3>
              <button
                className="market-add-btn"
                onClick={() => addToCart(item)}
                aria-label="إضافة إلى السلة"
              >
                <Plus size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* ===== FLOATING ACTIONS ===== */}
      <FloatingActions />

      {/* ===== CART DRAWER ===== */}
      {showCart && (
        <div className="market-drawer-overlay" onClick={() => setShowCart(false)}>
          <aside className="market-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="market-drawer-header">
              <h2>السلة</h2>
              <button className="market-drawer-close" onClick={() => setShowCart(false)}>
                <X size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="market-empty-cart">
                <ShoppingBag size={48} strokeWidth={1} />
                <p>لم تتم إضافة أي وجبة بعد</p>
              </div>
            ) : (
              <>
                <div className="market-cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="market-cart-item">
                      <div
                        className="market-cart-item-img"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                      <div className="market-cart-item-info">
                        <strong>{item.name}</strong>
                        <span className="market-cart-item-price">
                          {formatCurrency(item.price)}
                        </span>
                        <div className="market-cart-item-qty">
                          <button onClick={() => decreaseQuantity(item.id)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addToCart(item)}>
                            <Plus size={14} />
                          </button>
                          <button className="market-cart-item-del" onClick={() => removeFromCart(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="market-cart-summary">
                  <div className="market-cart-row">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="market-cart-row">
                    <span>رسوم التوصيل</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="market-cart-row market-cart-total">
                    <strong>الإجمالي</strong>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>

                <button
                  className="market-checkout-btn"
                  onClick={() => { setShowOrderForm(true); setShowCart(false); }}
                >
                  إتمام الطلب
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ===== ORDER FORM DRAWER ===== */}
      {showOrderForm && (
        <div className="market-drawer-overlay" onClick={() => setShowOrderForm(false)}>
          <aside className="market-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="market-drawer-header">
              <button className="market-drawer-back" onClick={() => { setShowOrderForm(false); setShowCart(true); }}>
                <ChevronLeft size={22} />
              </button>
              <h2>بيانات الطلب</h2>
              <button className="market-drawer-close" onClick={() => setShowOrderForm(false)}>
                <X size={22} />
              </button>
            </div>

            <form className="market-order-form" onSubmit={handleOrderSubmit}>
              <input
                className="market-form-input"
                placeholder="الاسم الكامل"
                required
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className="market-form-input"
                placeholder="رقم الهاتف"
                required
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <textarea
                className="market-form-textarea"
                placeholder="العنوان الكامل (الحي، الشارع، رقم البناية، الطابق...)"
                required
                rows={3}
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
              />
              <textarea
                className="market-form-textarea"
                placeholder="ملاحظات إضافية للسائق أو المطبخ"
                rows={2}
                value={customer.notes}
                onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
              />

              <div className="market-cart-summary">
                <div className="market-cart-row market-cart-total">
                  <strong>الإجمالي</strong>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>

              <button className="market-checkout-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جارٍ الحفظ..." : "تأكيد الطلب — الدفع عند الاستلام"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
