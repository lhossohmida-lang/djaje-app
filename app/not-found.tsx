import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell section">
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <h1>الصفحة غير موجودة</h1>
        <p>يمكنك العودة إلى الصفحة الرئيسية والبدء من هناك.</p>
        <Link href="/" className="button button-primary">
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
