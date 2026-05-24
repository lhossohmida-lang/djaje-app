import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doudou Admin Dashboard",
  manifest: "/admin.webmanifest",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
