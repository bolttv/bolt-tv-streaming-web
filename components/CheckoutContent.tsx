"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, AlertCircle, Lock, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOffers, CleengOffer, formatPrice } from "@/lib/cleeng";
import LoadingSpinner from "@/components/LoadingSpinner";

const PUBLISHER_ID = "870553921";

function CleengCheckoutWidget({ offerId }: { offerId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const widget = document.createElement("div");
    widget.setAttribute("data-cleeng-offer-id", offerId);
    widget.setAttribute("data-cleeng-publisher-id", PUBLISHER_ID);
    widget.setAttribute("data-cleeng-widget", "checkout");
    containerRef.current.appendChild(widget);
  }, [offerId]);

  return <div ref={containerRef} className="cleeng-checkout-container" data-testid="cleeng-checkout" />;
}

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<{ name: string; price: string; period: string; description?: string } | null>(null);

  const offerId = searchParams.get("offerId");

  useEffect(() => {
    if (!offerId) return;
    async function fetchOffer() {
      try {
        const offers = await getOffers();
        const match = offers.find((o: CleengOffer) => o.longId === offerId);
        if (match) {
          const periodUnit = match.billingCycle?.periodUnit || "month";
          setOfferDetails({
            name: match.title,
            price: formatPrice(match.price.amount, match.price.currency),
            period: `/${periodUnit.toLowerCase()}`,
            description: match.description,
          });
        }
      } catch (err) {}
    }
    fetchOffer();
  }, [offerId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/subscribe");
      return;
    }
    if (!offerId) {
      const pendingOffer = localStorage.getItem("pending_checkout_offer");
      if (pendingOffer) {
        router.push(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
      } else {
        setError("No offer selected. Please go back and choose a plan.");
      }
    }
  }, [authLoading, isAuthenticated, offerId, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-4 md:p-6 flex justify-between items-center border-b border-white/5">
          <Link href="/subscribe" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back-error">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <img src="/assets/bolt-logo-white.png" alt="Bolt TV" className="h-7" />
          <div className="w-16" />
        </div>
        <div className="max-w-md mx-auto text-center px-4 py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-5" />
          <p className="text-red-400 mb-6">{error}</p>
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition cursor-pointer"
          >
            Choose a Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-4 md:px-8 py-4 flex justify-between items-center border-b border-white/5 flex-shrink-0">
        <Link href="/subscribe" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </Link>
        <img src="/assets/bolt-logo-white.png" alt="Bolt TV" className="h-7" />
        <div className="w-16" />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 md:px-8 py-6 md:py-10">
        <div className="w-full max-w-5xl">
          <div className="mb-6 md:mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2" data-testid="text-step-indicator">
              Step 3 of 3
            </p>
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-checkout-title">
              Set up your payment
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="lg:sticky lg:top-8 space-y-6">
                {offerDetails && (
                  <div className="border border-white/10 rounded-lg p-5" data-testid="plan-summary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Your Plan</h3>
                      <Link
                        href="/subscribe?changePlan=true"
                        className="text-sm font-semibold text-white/70 hover:text-white transition cursor-pointer"
                        data-testid="button-change-plan"
                      >
                        Change
                      </Link>
                    </div>
                    <div className="space-y-3">
                      <p className="text-white font-bold text-2xl">
                        {offerDetails.price}
                        <span className="text-base font-normal text-gray-400">{offerDetails.period}</span>
                      </p>
                      <p className="text-white text-sm font-medium">{offerDetails.name}</p>
                      {offerDetails.description && (
                        <p className="text-gray-500 text-xs leading-relaxed">{offerDetails.description}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 py-2">
                  <div className="flex items-start gap-3">
                    <Lock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Your payment is encrypted and processed securely.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Cancel anytime. No commitments, no cancellation fees.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  By completing your purchase, you agree to our Terms of Use and Privacy Policy. Your subscription will automatically renew and you will be charged the subscription fee until you cancel.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 order-1 lg:order-2">
              {offerId ? (
                <CleengCheckoutWidget offerId={offerId} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
                  <span className="text-gray-400 text-sm">Preparing checkout...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
