import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Check, CreditCard, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const CLEENG_PUBLISHER_ID = "870553921";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const offerId = searchParams.get("offerId") || "S899494078_US";
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      localStorage.setItem("pending_checkout_offer", offerId);
      setLocation("/subscribe");
      return;
    }

    if (isLinking) {
      setLoading(true);
      return;
    }

    setLoading(false);
  }, [isAuthenticated, isLinking, authLoading, setLocation, offerId]);

  const handleCheckout = () => {
    setRedirecting(true);
    const customerToken = localStorage.getItem("cleeng_jwt") || cleengCustomer?.jwt || "";
    
    const checkoutUrl = `https://checkout.cleeng.com?offerId=${encodeURIComponent(offerId)}&publisherId=${CLEENG_PUBLISHER_ID}${customerToken ? `&customerToken=${encodeURIComponent(customerToken)}` : ""}`;
    
    console.log("Redirecting to Cleeng checkout:", checkoutUrl);
    window.location.href = checkoutUrl;
  };

  if (loading || isLinking || authLoading) {
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
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
          <p className="text-gray-400 mb-2">
            Your subscription is now active.
          </p>
          <p className="text-gray-500 text-sm mb-10">
            You now have full access to all premium content.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
            data-testid="button-start-streaming"
          >
            Start Streaming
          </Link>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Redirecting to secure checkout...</p>
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

        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>Account:</span>
              <span className="text-gray-300">{user?.email || cleengCustomer?.email}</span>
            </div>
            
            <div className="border-t border-gray-800 pt-4">
              <h3 className="font-semibold mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited streaming
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  HD quality content
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Watch on any device
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Cancel anytime
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={redirecting}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-3 cursor-pointer"
            data-testid="button-checkout"
          >
            <CreditCard className="w-5 h-5" />
            Continue to Payment
          </button>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
            <Shield className="w-4 h-4" />
            <span>Secure checkout powered by Cleeng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
