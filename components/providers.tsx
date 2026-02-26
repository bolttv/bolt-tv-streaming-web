"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
        <Script
          src="https://cdn.jwplayer.com/libraries/EBg26wOK.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://widgets.prod.cleeng.com/cleeng.js"
          strategy="lazyOnload"
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
