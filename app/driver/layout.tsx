import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doudou Driver Dashboard",
  manifest: "/driver.webmanifest",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
