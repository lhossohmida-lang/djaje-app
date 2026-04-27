"use client";

import { CartProvider } from "@/contexts/cart-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
