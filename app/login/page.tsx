"use client";

import dynamic from "next/dynamic";

const LoginPageContent = dynamic(
  () => import("@/components/LoginPageContent"),
  { ssr: false }
);

export default function LoginPage() {
  return <LoginPageContent />;
}
