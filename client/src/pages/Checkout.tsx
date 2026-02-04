import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

declare global {
  interface Window {
    cleeng?: {
      setAuthTokens: (tokens: { jwt: string; refreshToken?: string }) => Promise<void>;
    };
  }
}

const CLEENG_PUBLISHER_ID = "870553921";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [authSet, setAuthSet] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const offerId = new URLSearchParams(window.location.search).get("offerId") || "S899494078_US";

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

  const setCleengAuth = useCallback(async () => {
    const jwt = localStorage.getItem("cleeng_jwt") || cleengCustomer?.jwt;
    const refreshToken = localStorage.getItem("cleeng_refresh_token") || cleengCustomer?.refreshToken;
    
    if (!jwt) {
      console.log("No Cleeng JWT available");
      return false;
    }

    const waitForCleeng = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const check = () => {
          attempts++;
          if (window.cleeng?.setAuthTokens) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
            resolve(false);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const cleengReady = await waitForCleeng();
    if (!cleengReady) {
      console.error("Cleeng SDK not available");
      return false;
    }

    try {
      console.log("Setting Cleeng auth tokens...");
      await window.cleeng!.setAuthTokens({
        jwt: jwt,
        refreshToken: refreshToken || undefined,
      });
      console.log("Cleeng auth tokens set successfully");
      return true;
    } catch (error) {
      console.error("Error setting Cleeng auth tokens:", error);
      return false;
    }
  }, [cleengCustomer]);

  useEffect(() => {
    if (loading || authSet) return;

    const initAuth = async () => {
      const success = await setCleengAuth();
      setAuthSet(success);
    };

    initAuth();
  }, [loading, authSet, setCleengAuth]);

  useEffect(() => {
    if (loading || !authSet || !widgetContainerRef.current) return;

    const container = widgetContainerRef.current;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.setAttribute("data-cleeng-widget", "checkout");
    widgetDiv.setAttribute("data-cleeng-publisher-id", CLEENG_PUBLISHER_ID);
    widgetDiv.setAttribute("data-cleeng-offer-id", offerId);
    widgetDiv.setAttribute("data-cleeng-language", "en-US");

    container.appendChild(widgetDiv);
  }, [loading, authSet, offerId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "cleeng:checkout:success" || 
          event.data?.event === "checkout_success" ||
          event.data?.status === "success") {
        console.log("Cleeng checkout success detected:", event.data);
        setSuccess(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/subscribe" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to plans
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Account:</span>
              <span className="text-gray-300">{user?.email || cleengCustomer?.email}</span>
            </div>
          </div>

          <div 
            ref={widgetContainerRef}
            className="cleeng-checkout-container bg-white rounded-xl min-h-[500px] overflow-hidden"
            style={{ colorScheme: 'light' }}
          >
            {!authSet && (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Secure checkout powered by Cleeng
          </p>
        </div>
      </div>
    </div>
  );
}
