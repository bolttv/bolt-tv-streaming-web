import { Suspense } from "react";
import CheckoutContent from "@/components/CheckoutContent";

function PageLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
