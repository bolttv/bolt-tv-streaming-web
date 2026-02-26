"use client";

import dynamic from "next/dynamic";

const CheckoutContent = dynamic(
  () => import("@/components/CheckoutContent"),
  { ssr: false }
);

export default function CheckoutPage() {
  return <CheckoutContent />;
}
