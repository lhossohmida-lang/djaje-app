"use client";

import { useEffect, useMemo, useState } from "react";
import { CartPanel } from "@/components/customer/cart-panel";
import { MenuCard } from "@/components/customer/menu-card";
import { useCart } from "@/contexts/cart-context";
import { sampleMenu } from "@/data/mock-data";
import { notify } from "@/services/notification-service";
import { createOrder } from "@/services/order-service";
import { subscribeToMenu } from "@/services/menu-service";
import { CustomerInfo, MenuItem } from "@/types";

const initialCustomer: CustomerInfo = {
  name: "",
  phone: "",
  address: "",
  notes: ""
};

export default function CustomerPage() {
  const { items, addToCart, clearCart } = useCart();
  const [menu, setMenu] = useState<MenuItem[]>(sampleMenu);
  const [keyword, setKeyword] = useState("");
  const [customer, setCustomer] = useState<CustomerInfo>(initialCustomer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMenu(setMenu);
    return () => unsubscribe();
  }, []);

  const filteredMenu = useMemo(() => {
    if (!keyword.trim()) {
      return menu;
    }
    const normalized = keyword.trim().toLowerCase();
    return menu.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized)
    );
  }, [menu, keyword]);

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
    } catch (error) {
      console.error(error);
      window.alert("تعذر حفظ الطلب الآن. تأكد من ربط Firebase ثم أعد المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="page-shell section">
        <section
          className="card"
          style={{
            padding: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            alignItems: "center"
          }}
        >
          <div>
            <span className="badge">منيو مباشر + طلب بدون تسجيل</span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: ".75rem" }}>
              نظام طلبات وتوصيل جاهز لمطعمك
            </h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.9 }}>
              الواجهة مهيأة للزبون بدون تسجيل دخول، مع تحديثات لحظية للطلبات وتتبع مباشر برقم الطلب، لتكون
              التجربة سريعة وواضحة من المنيو حتى تأكيد الطلب.
            </p>
          </div>
        </section>

        {createdOrder ? (
          <section className="section">
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 style={{ marginTop: 0 }}>تم إنشاء الطلب بنجاح</h2>
              <p>
                رقم الطلب: <strong>{createdOrder.orderNumber}</strong>
              </p>
              <p style={{ color: "var(--muted)" }}>
                احتفظ برقم الطلب لاستخدامه في صفحة التتبع. الدفع سيكون عند الاستلام.
              </p>
            </div>
          </section>
        ) : null}

        <section
          className="section"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}
        >
          <div className="grid">
            <div className="card" style={{ padding: "1rem" }}>
              <input
                className="input"
                placeholder="ابحث عن طبق أو تصنيف..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <div className="menu-grid">
              {filteredMenu.map((item) => (
                <MenuCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>

          <div className="grid" style={{ alignContent: "start" }}>
            <CartPanel />
            <form className="card" style={{ padding: "1rem" }} onSubmit={handleOrderSubmit}>
              <h2 style={{ marginTop: 0 }}>بيانات الطلب</h2>
              <div className="grid">
                <input
                  className="input"
                  placeholder="الاسم الكامل"
                  required
                  value={customer.name}
                  onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
                />
                <input
                  className="input"
                  placeholder="رقم الهاتف"
                  required
                  value={customer.phone}
                  onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                />
                <textarea
                  className="textarea"
                  placeholder="العنوان الكامل (الحي، الشارع، رقم البناية، الطابق، علامة مميزة...)"
                  required
                  rows={4}
                  value={customer.address}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, address: event.target.value }))
                  }
                />
                <textarea
                  className="textarea"
                  placeholder="ملاحظات إضافية للسائق أو المطبخ"
                  rows={3}
                  value={customer.notes}
                  onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
                />
                <button className="button button-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الحفظ..." : "تأكيد الطلب والدفع عند الاستلام"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
