import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
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

type Step = "plan" | "email" | "verification_sent";

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, authStep, signUp, pendingEmail, setPendingEmail, setAuthStep } = useAuth();
  const [step, setStep] = useState<Step>("plan");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredPlans = plans
    .filter(plan => plan.period === `/${billingPeriod}`)
    .sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && authStep === "authenticated") {
      const pendingOffer = localStorage.getItem("pending_checkout_offer");
      if (pendingOffer) {
        setLocation(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
      }
    }
  }, [isAuthenticated, authStep, setLocation]);

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

  const handleContinue = () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) {
      setError("Please select a plan");
      return;
    }

    // If already authenticated, go directly to checkout
    if (isAuthenticated && authStep === "authenticated") {
      localStorage.setItem("pending_checkout_offer", selectedPlanData.offerId);
      setLocation(`/checkout?offerId=${encodeURIComponent(selectedPlanData.offerId)}`);
      return;
    }

    // Store the selected plan
    localStorage.setItem("pending_checkout_offer", selectedPlanData.offerId);
    
    // Move to email step
    setStep("email");
    setError(null);
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signUp(email.trim());
    
    if (result.success) {
      setStep("verification_sent");
    } else if (result.existingUser) {
      // Redirect to login for existing users
      setLocation(`/login?returnTo=${encodeURIComponent("/subscribe")}`);
    } else {
      setError(result.error || "Failed to send verification email");
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    
    setLoading(true);
    setError(null);
    
    const result = await signUp(pendingEmail);
    
    if (!result.success) {
      setError(result.error || "Failed to resend verification email");
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    if (step === "verification_sent") {
      setStep("email");
      setAuthStep("email");
      setPendingEmail(null);
    } else if (step === "email") {
      setStep("plan");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 md:p-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        {step !== "plan" && (
          <Link href="/login" className="text-[#A50104] hover:text-[#c41418] font-medium">
            Sign In
          </Link>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Step 1: Plan Selection */}
        {step === "plan" && (
          <>
            <div className="text-center mb-12">
              <img 
                src="/assets/bolt-logo-white.png" 
                alt="Bolt TV" 
                className="h-10 mx-auto mb-6"
              />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Start streaming today. Cancel anytime.
              </p>
            </div>

            {error && !loadingOffers && (
              <div className="max-w-md mx-auto mb-8">
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {loadingOffers ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#A50104]" />
              </div>
            ) : plans.length > 0 && (
              <>
                <div className="flex justify-center mb-8">
                  <div className="bg-white/10 p-1 rounded-full flex">
                    <button
                      onClick={() => setBillingPeriod("month")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                        billingPeriod === "month" 
                          ? "bg-[#A50104] text-white" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      data-testid="button-monthly"
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("year")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                        billingPeriod === "year" 
                          ? "bg-[#A50104] text-white" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      data-testid="button-yearly"
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className={`grid gap-6 max-w-4xl mx-auto mb-8 ${
                  filteredPlans.length === 1 ? 'grid-cols-1 max-w-md' :
                  filteredPlans.length === 2 ? 'md:grid-cols-2' : 
                  'md:grid-cols-3'
                }`}>
                  {filteredPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-6 rounded-2xl cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "bg-gradient-to-br from-[#2E1C2B]/80 to-[#050404]/80 border-2 border-[#A50104] scale-105"
                          : "bg-white/5 border border-white/10 hover:border-white/30"
                      }`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-[#A50104] to-[#4A1942] text-white text-xs font-bold px-3 py-1 rounded-full">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-gray-400">{plan.period}</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={`w-6 h-6 rounded-full border-2 mx-auto ${
                        selectedPlan === plan.id 
                          ? "border-[#A50104] bg-[#A50104]" 
                          : "border-white/30"
                      }`}>
                        {selectedPlan === plan.id && (
                          <Check className="w-4 h-4 text-white m-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={handleContinue}
                    disabled={!selectedPlan}
                    className="px-12 py-4 bg-gradient-to-r from-[#A50104] to-[#4A1942] hover:from-[#8a0103] hover:to-[#2E1C2B] disabled:from-[#A50104]/40 disabled:to-[#4A1942]/40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-full transition"
                    data-testid="button-continue"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Email Entry */}
        {step === "email" && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#A50104] hover:text-[#c41418] transition mb-8"
              data-testid="button-back-step"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to plans
            </button>

            <div className="text-center mb-8">
              <img 
                src="/assets/bolt-logo-white.png" 
                alt="Bolt TV" 
                className="h-8 mx-auto mb-6"
              />
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Get Started</h1>
              <p className="text-gray-400">
                Enter your email address to get started. If you're already a subscriber, enter the email associated with that account.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#2E1C2B]/60 to-[#050404]/60 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <form onSubmit={handleSendVerification}>
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A50104] focus:border-transparent"
                      disabled={loading}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#A50104] to-[#4A1942] hover:from-[#8a0103] hover:to-[#2E1C2B] disabled:from-[#A50104]/40 disabled:to-[#4A1942]/40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  data-testid="button-continue-email"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            </div>

            <p className="text-center mt-6 text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#A50104] hover:text-[#c41418] font-medium">
                Sign In
              </Link>
            </p>
          </div>
        )}

        {/* Step 3: Verification Sent */}
        {step === "verification_sent" && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#A50104] hover:text-[#c41418] transition mb-8"
              data-testid="button-back-step"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="bg-gradient-to-br from-[#2E1C2B]/60 to-[#050404]/60 rounded-2xl p-8 backdrop-blur-sm border border-white/10 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-gray-400 mb-2">
                  We sent a verification link to
                </p>
                <p className="text-white font-semibold mb-4">
                  {pendingEmail}
                </p>
                <p className="text-gray-400 text-sm">
                  Click the link in the email to verify your account and create your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400">
                  <strong className="text-white">Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or click below to resend.
                </p>
              </div>

              <button
                onClick={handleResend}
                disabled={loading}
                className="text-[#A50104] hover:text-[#c41418] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                data-testid="button-resend"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
