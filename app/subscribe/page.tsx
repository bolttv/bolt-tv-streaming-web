import { Suspense } from "react";
import SubscribePageContent from "@/components/SubscribePageContent";

function PageLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SubscribePageContent />
    </Suspense>
  );
}
