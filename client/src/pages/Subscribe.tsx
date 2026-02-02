import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getOffers, CleengOffer, formatPrice } from "@/lib/cleeng";

interface PricingPlan {
  id: string;
  offerId: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const defaultFeatures = [
  "Unlimited streaming",
  "HD quality",
  "Cancel anytime",
];

function mapOffersToPlan(offers: CleengOffer[]): PricingPlan[] {
  return offers.map((offer) => {
    const badgeTags = ["Most Popular", "Most Value", "Best Value", "Popular"];
    const badge = offer.tags?.find(tag => 
      badgeTags.some(b => tag.toLowerCase().includes(b.toLowerCase()))
    );
    
    const periodUnit = offer.billingCycle?.periodUnit || "month";
    const period = `/${periodUnit.toLowerCase()}`;
    
    return {
      id: offer.id,
      offerId: offer.longId,
      name: offer.title,
      price: formatPrice(offer.price.amount, offer.price.currency),
      period,
      features: defaultFeatures,
      popular: !!badge,
      badge: badge,
    };
  });
}

export default function Subscribe() {
  const { isAuthenticated, loginWithRedirect, cleengCustomer, isLinking } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const filteredPlans = plans
    .filter(plan => plan.period === `/${billingPeriod}`)
    .sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoadingOffers(true);
        setError(null);
        
        const offers = await getOffers();
        const activeOffers = offers.filter(o => o.active !== false);
        
        if (activeOffers.length > 0) {
          const mappedPlans = mapOffersToPlan(activeOffers);
          setPlans(mappedPlans);
          
          const monthlyPlans = mappedPlans.filter(p => p.period === "/month");
          if (monthlyPlans.length > 0) {
            setSelectedPlan(monthlyPlans[0].id);
          } else if (mappedPlans.length > 0) {
            setSelectedPlan(mappedPlans[0].id);
            setBillingPeriod("year");
          }
        } else {
          setError("No subscription plans are currently available. Please check back later.");
        }
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setError("Unable to load subscription plans. Please try again later.");
      } finally {
        setLoadingOffers(false);
      }
    };
    
    fetchOffers();
  }, []);

  useEffect(() => {
    const plansForPeriod = plans.filter(p => p.period === `/${billingPeriod}`);
    if (plansForPeriod.length > 0 && !plansForPeriod.find(p => p.id === selectedPlan)) {
      setSelectedPlan(plansForPeriod[0].id);
    }
  }, [billingPeriod, plans, selectedPlan]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: "/subscribe" },
        authorizationParams: { screen_hint: "signup" },
      });
      return;
    }

    // Wait for Cleeng customer to be linked
    if (isLinking) {
      return;
    }

    if (!cleengCustomer?.jwt) {
      setCheckoutError("Please wait while we set up your account...");
      return;
    }

    setLoading(true);
    setCheckoutError(null);
    
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanData) {
      setLoading(false);
      setCheckoutError("Please select a plan");
      return;
    }

    // Redirect to in-app checkout page
    window.location.href = `/checkout?offerId=${encodeURIComponent(selectedPlanData.offerId)}`;
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 md:p-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <img 
            src="/assets/bolt-logo-white.png" 
            alt="Bolt TV" 
            className="h-8 mx-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-white/60">
            Start streaming today with unlimited access to all content
          </p>

          {plans.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="inline-flex bg-zinc-900 rounded-full p-1" data-testid="billing-toggle">
                <button
                  onClick={() => setBillingPeriod("month")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === "month"
                      ? "bg-white text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                  data-testid="button-monthly"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("year")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === "year"
                      ? "bg-white text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                  data-testid="button-yearly"
                >
                  Yearly
                  <span className={`text-xs ${billingPeriod === "year" ? "text-green-600" : "text-green-500"}`}>
                    Save 16%
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {loadingOffers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                data-testid="button-retry"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 mb-12 ${filteredPlans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : filteredPlans.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-3'}`}>
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "bg-white text-black ring-4 ring-white"
                      : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {plan.badge}
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className={selectedPlan === plan.id ? "text-black/60" : "text-white/60"}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          selectedPlan === plan.id ? "text-black" : "text-green-500"
                        }`} />
                        <span className={selectedPlan === plan.id ? "text-black/80" : "text-white/80"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              {checkoutError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                  {checkoutError}
                </div>
              )}
              
              <button
                onClick={handleSubscribe}
                disabled={loading || isLinking || !selectedPlan}
                className="w-full bg-white text-black font-bold py-4 rounded-full text-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-subscribe"
              >
                {loading ? "Processing..." : isLinking ? "Setting up account..." : isAuthenticated ? "Continue to Payment" : "Start 7-Day Free Trial"}
              </button>

              <p className="text-center text-white/40 text-sm mt-4">
                By subscribing, you agree to our Terms of Service and Privacy Policy.
                You can cancel your subscription at any time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
