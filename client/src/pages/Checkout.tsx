import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, CreditCard, Loader2, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getOffers, CleengOffer, formatPrice } from "@/lib/cleeng";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, user } = useAuth();
  const [offer, setOffer] = useState<CleengOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const offerId = new URLSearchParams(window.location.search).get("offerId");

  useEffect(() => {
    // If not authenticated at all, redirect to subscribe
    if (!isAuthenticated) {
      setLocation("/subscribe");
      return;
    }

    // Wait for Cleeng SSO to complete before fetching offer
    if (isLinking) {
      setLoading(true);
      return;
    }

    const fetchOffer = async () => {
      if (!offerId) {
        // Check localStorage for pending checkout offer
        const pendingOffer = localStorage.getItem("pending_checkout_offer");
        if (pendingOffer) {
          setLocation(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
          return;
        }
        setError("No offer selected");
        setLoading(false);
        return;
      }

      try {
        const offers = await getOffers();
        const selectedOffer = offers.find(o => o.id === offerId || o.longId === offerId);
        if (selectedOffer) {
          setOffer(selectedOffer);
          // Clear pending checkout offer from localStorage
          localStorage.removeItem("pending_checkout_offer");
        } else {
          setError("Offer not found");
        }
      } catch (err) {
        setError("Failed to load offer details");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, isAuthenticated, isLinking, setLocation]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubscribe = async () => {
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      setError("Please fill in all payment details");
      return;
    }

    setProcessing(true);
    setError(null);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For testing: Show success without actual payment
    setSuccess(true);
    setProcessing(false);
  };

  if (loading || isLinking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">{isLinking ? "Setting up your account..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Welcome to Bolt TV!</h1>
          <p className="text-gray-400 mb-2">
            Your subscription is now active.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {offer?.freeDays && offer.freeDays > 0 
              ? `Your ${offer.freeDays}-day free trial has started. You won't be charged until it ends.`
              : `You now have full access to all premium content.`
            }
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            data-testid="button-start-watching"
          >
            Start Watching
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/subscribe" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to plans
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-5 gap-6">
            {/* Payment Form - Left Side */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Name on Card</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      data-testid="input-card-name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      data-testid="input-card-number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                        data-testid="input-expiry"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                        data-testid="input-cvv"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-offset-0"
                      data-testid="checkbox-terms"
                    />
                    <span className="text-sm text-gray-400">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>. 
                      {offer?.freeDays && offer.freeDays > 0 && (
                        <span className="block mt-1 text-gray-500">
                          After the free trial, you will be charged {formatPrice(offer.price.amount, offer.price.currency)}/{offer.billingCycle?.periodUnit || "month"}.
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={processing}
                className="w-full py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                data-testid="button-subscribe"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {offer?.freeDays && offer.freeDays > 0 
                      ? `Start ${offer.freeDays}-Day Free Trial`
                      : `Subscribe - ${offer ? formatPrice(offer.price.amount, offer.price.currency) : ""}`
                    }
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secured with 256-bit SSL encryption</span>
              </div>
            </div>

            {/* Order Summary - Right Side */}
            <div className="md:col-span-2">
              <div className="bg-gray-900 rounded-xl p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                {offer && (
                  <>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Plan</span>
                        <span className="font-medium">{offer.title}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Billing</span>
                        <span className="font-medium">
                          {offer.billingCycle?.periodUnit === "year" ? "Yearly" : "Monthly"}
                        </span>
                      </div>

                      {offer.freeDays && offer.freeDays > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                          <span className="text-gray-400">Free Trial</span>
                          <span className="font-medium text-green-500">{offer.freeDays} days</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-3 border-t border-gray-700">
                      <span className="text-gray-400">
                        {offer.freeDays && offer.freeDays > 0 ? "Due today" : "Total"}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {offer.freeDays && offer.freeDays > 0 ? (
                          "$0.00"
                        ) : (
                          formatPrice(offer.price.amount, offer.price.currency)
                        )}
                      </span>
                    </div>

                    {offer.freeDays && offer.freeDays > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Then {formatPrice(offer.price.amount, offer.price.currency)}/{offer.billingCycle?.periodUnit || "month"} after trial ends
                      </p>
                    )}
                  </>
                )}

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium mb-3">What's Included</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Unlimited streaming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>HD quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Watch on any device</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Account:</span>
                    <span className="text-gray-300">{user?.email || cleengCustomer?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
