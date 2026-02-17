import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, Loader2, AlertCircle, Lock, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getCleengConfig, getOffers, CleengOffer, formatPrice } from "@/lib/cleeng";
import LoadingSpinner from "@/components/LoadingSpinner";

let sdkConfigured = false;
let cssLoaded = false;

function CleengPurchaseWrapper({ offerId, onSuccess }: { offerId: string; onSuccess: () => void }) {
  const [SdkComponents, setSdkComponents] = useState<{
    Purchase: any;
    store: any;
    Provider: any;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSdk() {
      try {
        if (!cssLoaded) {
          await Promise.all([
            import('@adyen/adyen-web/dist/adyen.css'),
            import('react-loading-skeleton/dist/skeleton.css'),
            import('@cleeng/mediastore-sdk/dist/styles/msdFont.css'),
          ]);
          cssLoaded = true;
        }
        const [sdk, redux] = await Promise.all([
          import("@cleeng/mediastore-sdk"),
          import("react-redux"),
        ]);
        if (!cancelled) {
          setSdkComponents({
            Purchase: sdk.Purchase,
            store: sdk.store,
            Provider: redux.Provider,
          });
        }
      } catch (err) {
        console.error("Failed to load Cleeng SDK:", err);
        if (!cancelled) {
          setLoadError("Failed to load payment form. Please refresh and try again.");
        }
      }
    }
    loadSdk();
    return () => { cancelled = true; };
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-400">{loadError}</p>
      </div>
    );
  }

  if (!SdkComponents) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-400">Loading payment form...</span>
      </div>
    );
  }

  const { Purchase, store, Provider } = SdkComponents;

  return (
    <Provider store={store}>
      <Purchase offerId={offerId} onSuccess={onSuccess} />
    </Provider>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, linkFailed, retryLink, user, isLoading: authLoading } = useAuth();
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [offerDetails, setOfferDetails] = useState<{ name: string; price: string; period: string; description?: string } | null>(null);

  const offerId = new URLSearchParams(window.location.search).get("offerId");

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
      setLocation("/subscribe");
      return;
    }
    if (!offerId) {
      const pendingOffer = localStorage.getItem("pending_checkout_offer");
      if (pendingOffer) {
        setLocation(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
      } else {
        setSdkError("No offer selected. Please go back and choose a plan.");
      }
    }
  }, [authLoading, isAuthenticated, offerId, setLocation]);

  useEffect(() => {
    if (authLoading || isLinking || !isAuthenticated || !cleengCustomer?.jwt || !offerId) return;
    let cancelled = false;
    async function initSDK() {
      try {
        let sdk: any;
        try {
          sdk = await import("@cleeng/mediastore-sdk");
        } catch (importErr: any) {
          throw new Error(`SDK import failed: ${importErr?.message || "Unknown import error"}`);
        }
        const { Config } = sdk;
        if (!sdkConfigured) {
          const config = await getCleengConfig();
          Config.setEnvironment(config.environment);
          Config.setPublisher(config.publisherId);
          sdkConfigured = true;
        }
        Config.setJWT(cleengCustomer!.jwt!);
        if (cleengCustomer!.refreshToken) {
          Config.setRefreshToken(cleengCustomer!.refreshToken);
        }
        if (!cancelled) {
          setSdkReady(true);
        }
      } catch (err: any) {
        console.error("Failed to initialize Cleeng SDK:", err?.message || err);
        if (!cancelled) {
          setSdkError("Failed to initialize payment system. Please refresh and try again.");
        }
      }
    }
    initSDK();
    return () => { cancelled = true; };
  }, [authLoading, isLinking, isAuthenticated, cleengCustomer, offerId]);

  const handleSuccess = () => {
    setSuccess(true);
    localStorage.removeItem("pending_checkout_offer");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
          <p className="text-gray-400 mb-2">Your subscription is now active.</p>
          <p className="text-gray-500 text-sm mb-10">You now have full access to all premium content.</p>
          <Link
            href="/home"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-colors cursor-pointer"
            data-testid="button-start-streaming"
          >
            Start Streaming
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || isLinking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sdkError) {
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
          <p className="text-red-400 mb-6">{sdkError}</p>
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
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-checkout-title">Add Your Billing Info</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="lg:sticky lg:top-8 space-y-6">
                {offerDetails && (
                  <div className="border border-white/10 rounded-lg p-5" data-testid="plan-summary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Your Plan</h3>
                      <Link
                        href="/subscribe"
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
              <div className="cleeng-checkout-container" data-testid="cleeng-checkout">
                {sdkReady && offerId ? (
                  <CleengPurchaseWrapper offerId={offerId} onSuccess={handleSuccess} />
                ) : linkFailed ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Unable to connect to payment system</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                      We couldn't link your account to the payment provider. This is usually a temporary issue.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => retryLink()}
                        className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition cursor-pointer"
                        data-testid="button-retry-link"
                      >
                        Try Again
                      </button>
                      <Link
                        href="/subscribe"
                        className="px-6 py-3 text-gray-400 hover:text-white transition"
                        data-testid="button-back-to-plans"
                      >
                        Back to Plans
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
                    <span className="text-gray-400 text-sm">
                      {isLinking ? "Linking your account..." : "Preparing checkout..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
