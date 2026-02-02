import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, CreditCard, Loader2, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getOffers, CleengOffer, formatPrice } from "@/lib/cleeng";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, user } = useAuth();
  const [offer, setOffer] = useState<CleengOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offerId = new URLSearchParams(window.location.search).get("offerId");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/subscribe");
      return;
    }

    const fetchOffer = async () => {
      if (!offerId) {
        setError("No offer selected");
        setLoading(false);
        return;
      }

      try {
        const offers = await getOffers();
        const selectedOffer = offers.find(o => o.id === offerId || o.longId === offerId);
        if (selectedOffer) {
          setOffer(selectedOffer);
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
  }, [offerId, isAuthenticated, setLocation]);

  if (loading || isLinking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/subscribe">
          <a className="inline-flex items-center text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to plans
          </a>
        </Link>

        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {offer && (
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Plan</span>
                <span className="font-medium">{offer.title}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Billing</span>
                <span className="font-medium">
                  {offer.billingCycle?.periodUnit === "year" ? "Yearly" : "Monthly"}
                </span>
              </div>

              {offer.freeDays && offer.freeDays > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Free Trial</span>
                  <span className="font-medium text-green-500">{offer.freeDays} days</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(offer.price.amount, offer.price.currency)}
                  <span className="text-sm text-gray-400 font-normal">
                    /{offer.billingCycle?.periodUnit || "month"}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Account Information
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Email</span>
                <span className="font-medium">{user?.email || cleengCustomer?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Cleeng Customer ID</span>
                <span className="font-medium text-sm">{cleengCustomer?.customerId || "Pending"}</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Payment Integration Pending</p>
                <p className="text-blue-300/80">
                  Your account has been registered with Cleeng. To complete your subscription, 
                  payment processing needs to be configured in the Cleeng dashboard with Adyen or PayPal.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">What's Included</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Unlimited access to all content</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Watch on any device</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>HD streaming quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <Link href="/">
            <a 
              className="w-full py-4 bg-gray-700 text-white rounded-lg font-semibold text-lg hover:bg-gray-600 flex items-center justify-center gap-2"
              data-testid="button-back-home"
            >
              Return to Home
            </a>
          </Link>

          <p className="text-center text-gray-500 text-sm mt-4">
            Contact support for assistance with completing your subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
