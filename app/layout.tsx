import type { Metadata } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "Djaje Restaurant System",
  description: "Restaurant ordering and delivery system powered by Firebase."
};

const criticalGlobalStyles = `
:root {
  --background: #f5efe6;
  --surface: #fffaf3;
  --surface-strong: #ffffff;
  --text: #24170f;
  --muted: #6f5d53;
  --primary: #c2410c;
  --primary-dark: #7c2d12;
  --secondary: #14532d;
  --border: rgba(36, 23, 15, 0.08);
  --warning: #92400e;
  --success: #166534;
  --shadow: 0 20px 40px rgba(36, 23, 15, 0.08);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(194, 65, 12, 0.14), transparent 28%),
    radial-gradient(circle at bottom left, rgba(20, 83, 45, 0.12), transparent 24%),
    var(--background);
  color: var(--text);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}

img {
  max-width: 100%;
  display: block;
}

.page-shell {
  width: min(1200px, calc(100% - 2rem));
  margin: 0 auto;
}

.section {
  padding: 1.5rem 0;
}

.card {
  background: rgba(255, 250, 243, 0.88);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.grid {
  display: grid;
  gap: 1rem;
}

.button {
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.35rem;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
}

.button-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
}

.button-secondary {
  background: rgba(36, 23, 15, 0.06);
  color: var(--text);
}

.input,
.textarea,
.select {
  width: 100%;
  border: 1px solid rgba(36, 23, 15, 0.12);
  border-radius: 16px;
  padding: 0.95rem 1rem;
  background: white;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.88rem;
  background: rgba(36, 23, 15, 0.07);
}

.status-pending {
  color: var(--warning);
}

.status-out-for-delivery,
.status-picked-up {
  color: var(--primary-dark);
}

.status-delivered {
  color: var(--success);
}

@media (max-width: 768px) {
  .page-shell {
    width: min(100% - 1rem, 100%);
  }
}
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalGlobalStyles }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
