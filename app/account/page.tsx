"use client";

import dynamic from "next/dynamic";

const AccountPageContent = dynamic(
  () => import("@/components/AccountPageContent"),
  { ssr: false }
);

export default function AccountPage() {
  return <AccountPageContent />;
}
