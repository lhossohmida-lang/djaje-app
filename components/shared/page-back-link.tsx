"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PageBackLinkProps {
  href?: string;
  label?: string;
}

export function PageBackLink({ href = "/", label = "العودة للرئيسية" }: PageBackLinkProps) {
  return (
    <div className="page-back-row">
      <Link href={href} className="page-back-link">
        <ArrowRight size={18} />
        <span>{label}</span>
      </Link>
    </div>
  );
}
