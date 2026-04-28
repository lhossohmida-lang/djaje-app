"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export function BackButton({ href = "/", label = "رجوع" }: BackButtonProps) {
  return (
    <Link href={href} className="back-button" aria-label={label}>
      <span className="back-button-text">{label}</span>
      <ArrowRight size={18} className="back-button-icon" />
    </Link>
  );
}
