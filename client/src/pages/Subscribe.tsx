import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
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
    badge: "Most Popular",
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

export default function Subscribe() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [loading, setLoading] = useState(false);

  const filteredPlans = plans
    .filter(plan => plan.period === `/${billingPeriod}`)
    .sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: "/subscribe" },
        authorizationParams: { screen_hint: "signup" },
      });
      return;
    }

    setLoading(true);
    
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    setTimeout(() => {
      setLoading(false);
      alert(`Proceeding to checkout for: ${selectedPlanData?.name} (${selectedPlanData?.price}${selectedPlanData?.period})\n\nPayment integration coming soon.`);
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
        </div>

        <div className={`grid gap-6 mb-12 ${filteredPlans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
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
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-lg text-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-subscribe"
          >
            {loading ? "Processing..." : isAuthenticated ? "Continue to Payment" : "Sign Up to Subscribe"}
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
