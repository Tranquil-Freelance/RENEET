"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackSelectContent } from "@/lib/gtag-client";

type Base = {
  contentType: string;
  itemId: string;
  className?: string;
  children: ReactNode;
};

export function SelectContentLink({
  href,
  contentType,
  itemId,
  className,
  children,
}: Base & { href: string }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackSelectContent({ content_type: contentType, item_id: itemId })}
    >
      {children}
    </Link>
  );
}

export function SelectContentAnchor({
  href,
  contentType,
  itemId,
  className,
  children,
}: Base & { href: string }) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackSelectContent({ content_type: contentType, item_id: itemId })}
    >
      {children}
    </a>
  );
}
