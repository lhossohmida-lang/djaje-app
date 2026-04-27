# Restaurant Ordering & Delivery System

تطبيق متكامل لإدارة مطعم باستخدام `Next.js + Firebase + Firestore + Authentication + Storage`.

## المزايا

- واجهة زبون بدون تسجيل دخول.
- تتبع الطلب عبر `Order ID`.
- لوحة سائق لتحديث حالة الطلب.
- لوحة إدارة لإدارة المنيو والطلبات والصور.
- تحديثات لحظية عبر `Firestore onSnapshot`.
- إشعارات متصفح أساسية داخل الواجهة.
- قواعد صلاحيات مبدئية حسب الدور.

## هيكل المشروع

```text
app/
  admin/page.tsx        لوحة الإدارة
  driver/page.tsx       لوحة السائق
  track/page.tsx        تتبع الطلب
  page.tsx              واجهة الزبون
components/
  customer/             كروت المنيو والسلة
  shared/               الهيدر وبادج الحالة
contexts/
  cart-context.tsx      إدارة السلة
data/
  mock-data.ts          بيانات أولية للمنيو
firebase/
  firestore.rules       صلاحيات Firestore
  storage.rules         صلاحيات Storage
lib/
  firebase.ts           إعداد Firebase
services/
  order-service.ts      أوامر الطلبات
  menu-service.ts       أوامر المنيو
  auth-service.ts       أوامر تسجيل الدخول
  storage-service.ts    رفع الصور
types/
  index.ts              أنواع البيانات
```

## 1) تثبيت المشروع

نفّذ داخل المجلد:

```powershell
npm.cmd install
npm.cmd run dev
```

ثم افتح:

- [http://localhost:3000](http://localhost:3000)

## 2) ربط Firebase خطوة بخطوة

### Authentication

1. افتح Firebase Console.
2. فعّل `Email/Password`.
3. أنشئ مستخدمًا للإدارة ومستخدمًا للسائق.
4. أنشئ collection باسم `users`.
5. أضف مستندًا لكل مستخدم بنفس `uid` القادم من Authentication.

مثال مستند Admin:

```json
{
  "fullName": "Restaurant Owner",
  "email": "admin@example.com",
  "role": "admin"
}
```

مثال مستند Driver:

```json
{
  "fullName": "Delivery Driver",
  "phone": "0550000000",
  "role": "driver"
}
```

### Firestore

أنشئ هذه المجموعات:

- `menuItems`
- `orders`
- `users`

ثم انسخ محتوى [firebase/firestore.rules](/D:/program/jaje/firebase/firestore.rules:1) إلى Firestore Rules.

### Storage

انسخ محتوى [firebase/storage.rules](/D:/program/jaje/firebase/storage.rules:1) إلى Storage Rules.

## 3) أمثلة عملية من الكود

### إضافة طلب

الملف: [services/order-service.ts](/D:/program/jaje/services/order-service.ts:37)

- الدالة `createOrder(...)` تحفظ بيانات الزبون والسلة داخل `orders`.
- يتم توليد `orderNumber` تلقائيًا.
- يتم استخدام `serverTimestamp()` للتواريخ.

### تحديث حالة الطلب

الملف: [services/order-service.ts](/D:/program/jaje/services/order-service.ts:89)

- الدالة `updateOrderStatus(orderId, status)` تغيّر حالة الطلب.
- السائق يستخدمها من [app/driver/page.tsx](/D:/program/jaje/app/driver/page.tsx:59).
- الإدارة تستخدمها من [app/admin/page.tsx](/D:/program/jaje/app/admin/page.tsx:177).

### جلب البيانات لحظيًا من Firestore

الملفات:

- [services/menu-service.ts](/D:/program/jaje/services/menu-service.ts:13)
- [services/order-service.ts](/D:/program/jaje/services/order-service.ts:58)

الدوال `subscribeToMenu` و`subscribeToOrders` و`subscribeToDriverOrders` تعتمد على `onSnapshot` للتحديث اللحظي.

## 4) ملاحظات مهمة

- الدفع الحالي هو `الدفع عند الاستلام`.
- رابط Google Maps يُبنى من عنوان الزبون.
- إذا كانت قاعدة البيانات فارغة، الواجهة تعرض بيانات أولية من [data/mock-data.ts](/D:/program/jaje/data/mock-data.ts:1).
- يمكنك لاحقًا إضافة `Firebase Cloud Messaging` للإشعارات الفعلية.
- الإشعارات الحالية داخل المتصفح عبر `Notification API` في [services/notification-service.ts](/D:/program/jaje/services/notification-service.ts:1).

## 5) تحسينات مقترحة لاحقًا

- إضافة فلترة حسب التصنيف.
- إضافة صفحة تفاصيل لكل طلب.
- ربط السائقين الفعليين من مجموعة `users`.
- إضافة إشعارات Push عبر FCM.
- إضافة تقارير يومية وشهرية.
