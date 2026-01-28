import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { isLoggedIn, getCleengAuth, getOffers, CleengOffer } from "@/lib/cleeng";

interface PricingPlan {
  id: string;
  offerId?: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const defaultPlans: PricingPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited streaming",
      "HD quality",
      "Watch on 1 device",
      "Cancel anytime",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    price: "$99.99",
    period: "/year",
    features: [
      "Unlimited streaming",
      "4K Ultra HD quality",
      "Watch on 4 devices",
      "Cancel anytime",
      "Save $20 per year",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$14.99",
    period: "/month",
    features: [
      "Unlimited streaming",
      "4K Ultra HD + HDR",
      "Watch on 6 devices",
      "Download for offline",
      "Priority support",
    ],
  },
];

function formatCurrency(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price);
}

function mapCleengOffersToPlan(offers: CleengOffer[]): PricingPlan[] {
  if (!offers || offers.length === 0) return defaultPlans;
  
  return offers.map((offer, index) => ({
    id: offer.offerId,
    offerId: offer.offerId,
    name: offer.offerTitle || `Plan ${index + 1}`,
    price: formatCurrency(offer.price, offer.currency),
    period: offer.period ? `/${offer.period}` : "/month",
    features: [
      "Unlimited streaming",
      "HD quality",
      "Cancel anytime",
    ],
    popular: index === 0,
  }));
}

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [selectedPlan, setSelectedPlan] = useState<string>("annual");
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offers = await getOffers();
        // Filter to only active offers
        const activeOffers = offers.filter((o: any) => o.active !== false);
        if (activeOffers.length > 0) {
          const mappedPlans = mapCleengOffersToPlan(activeOffers);
          setPlans(mappedPlans);
          if (mappedPlans.length > 0) {
            setSelectedPlan(mappedPlans[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setLoadingOffers(false);
      }
    };
    
    fetchOffers();
  }, []);

  const handleSubscribe = async () => {
    if (!loggedIn) {
      setLocation("/register");
      return;
    }

    setLoading(true);
    
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    // In production, this would initiate the Cleeng/Adyen checkout flow
    // The offerId would be used to create an order via the Cleeng API
    setTimeout(() => {
      setLoading(false);
      if (selectedPlanData?.offerId) {
        alert(`Proceeding to checkout for: ${selectedPlanData.name} (${selectedPlanData.price}${selectedPlanData.period})\n\nOffer ID: ${selectedPlanData.offerId}\n\nIn production, this initiates the Cleeng/Adyen payment flow.`);
      } else {
        alert("Checkout integration with Cleeng/Adyen is configured. In production, this will redirect to the payment flow.");
      }
    }, 1000);
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
        </div>

        {loadingOffers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
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
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
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
        )}

        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-lg text-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-subscribe"
          >
            {loading ? "Processing..." : loggedIn ? "Continue to Payment" : "Sign Up to Subscribe"}
          </button>

          <p className="text-center text-white/40 text-sm mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
