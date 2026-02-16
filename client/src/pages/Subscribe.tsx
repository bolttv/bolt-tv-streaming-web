import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, Loader2, Mail, AlertCircle, Lock, Eye, EyeOff, User, ChevronDown } from "lucide-react";
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

type Step = "plan" | "account";

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, authStep, signUp } = useAuth();
  const [step, setStep] = useState<Step>("plan");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredPlans = plans
    .filter(plan => plan.period === `/${billingPeriod}`)
    .sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));

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

    if (isAuthenticated && authStep === "authenticated") {
      localStorage.setItem("pending_checkout_offer", selectedPlanData.offerId);
      setLocation(`/checkout?offerId=${encodeURIComponent(selectedPlanData.offerId)}`);
      return;
    }

    localStorage.setItem("pending_checkout_offer", selectedPlanData.offerId);
    
    setStep("account");
    setError(null);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signUp(email.trim(), password, {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      gender: gender || undefined,
      birthYear: birthYear || undefined,
      zipCode: zipCode.trim() || undefined,
    });
    
    if (result.success) {
      const pendingOffer = localStorage.getItem("pending_checkout_offer");
      if (pendingOffer) {
        setLocation(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
      } else {
        setLocation("/home");
      }
    } else if (result.existingUser) {
      setError("An account with this email already exists. Please sign in instead.");
    } else {
      setError(result.error || "Failed to create account");
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    if (step === "account") {
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
          <Link href="/login" className="text-white hover:text-white/80 font-medium">
            Sign In
          </Link>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
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
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : plans.length > 0 && (
              <>
                <div className="flex justify-center mb-8">
                  <div className="bg-white/10 p-1 rounded-full flex">
                    <button
                      onClick={() => setBillingPeriod("month")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        billingPeriod === "month" 
                          ? "bg-white text-black" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      data-testid="button-monthly"
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("year")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        billingPeriod === "year" 
                          ? "bg-white text-black" 
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
                          ? "bg-white/[0.08] border-2 border-white scale-105"
                          : "bg-white/5 border border-white/10 hover:border-white/30"
                      }`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
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
                          ? "border-white bg-white" 
                          : "border-white/30"
                      }`}>
                        {selectedPlan === plan.id && (
                          <Check className="w-4 h-4 text-black m-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={handleContinue}
                    disabled={!selectedPlan}
                    className="px-12 py-4 bg-white hover:bg-white/90 disabled:bg-white/40 disabled:cursor-not-allowed text-black font-bold text-lg rounded-full transition cursor-pointer"
                    data-testid="button-continue"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === "account" && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white hover:text-white/80 transition mb-8 cursor-pointer"
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
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Your Account</h1>
              <p className="text-gray-400">
                Enter your email and password to get started.
              </p>
            </div>

            <form onSubmit={handleCreateAccount}>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="bg-white/[0.04] rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="mb-4">
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
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                        confirmPassword && confirmPassword !== password
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      disabled={loading}
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.04] rounded-2xl p-8 backdrop-blur-sm border border-white/10 mt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  About You
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent appearance-none cursor-pointer"
                      disabled={loading}
                      data-testid="select-gender"
                    >
                      <option value="" className="bg-gray-900">Select</option>
                      <option value="man" className="bg-gray-900">Man</option>
                      <option value="woman" className="bg-gray-900">Woman</option>
                      <option value="none_of_the_above" className="bg-gray-900">None of the Above</option>
                      <option value="prefer_not_to_say" className="bg-gray-900">Prefer Not To Say</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birth-year" className="block text-sm font-medium text-gray-300 mb-2">
                      Birth Year
                    </label>
                    <input
                      type="text"
                      id="birth-year"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="YYYY"
                      maxLength={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-birth-year"
                    />
                  </div>
                  <div>
                    <label htmlFor="zip-code" className="block text-sm font-medium text-gray-300 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zip-code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))}
                      placeholder="12345"
                      maxLength={10}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      disabled={loading}
                      data-testid="input-zip-code"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password || !confirmPassword || password !== confirmPassword}
                className="w-full mt-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/40 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
                data-testid="button-create-account"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:text-white/80 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
