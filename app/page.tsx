"use client";

import Link from "next/link";
import { Download, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

const roles = [
  {
    href: "/admin",
    label: "إدارة",
    Icon: ShieldCheck,
    className: "role-admin",
  },
  {
    href: "/driver",
    label: "سائق",
    Icon: Truck,
    className: "role-driver",
  },
  {
    href: "/customer",
    label: "زبون",
    Icon: ShoppingBag,
    className: "role-customer",
  },
];

export default function LandingPage() {
  return (
    <main className="welcome-page">
      <section className="welcome-card">
        <h1 className="welcome-title">مرحبا</h1>

        <div className="role-row">
          {roles.map(({ href, label, Icon, className }) => (
            <Link key={href} href={href} className={`role-bubble ${className}`}>
              <span className="role-icon">
                <Icon size={22} strokeWidth={2.4} />
              </span>
              <span className="role-text">{label}</span>
            </Link>
          ))}
        </div>

        <a href="#" className="download-button">
          <Download size={20} strokeWidth={2.6} />
          <span>حمل الآن</span>
        </a>
      </section>
    </main>
  );
}
