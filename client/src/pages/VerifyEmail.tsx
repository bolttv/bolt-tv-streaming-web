import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/checkout";

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.email_verified) {
      setLocation(returnTo);
    }
  }, [isLoading, isAuthenticated, user?.email_verified, returnTo, setLocation]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      
      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = () => {
    loginWithRedirect({
      appState: { returnTo: `/verify-email?returnTo=${encodeURIComponent(returnTo)}` },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 md:p-8">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img 
              src="/assets/bolt-logo-white.png" 
              alt="Bolt TV" 
              className="h-8 mx-auto mb-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-purple-500" />
            </div>

            <h1 className="text-2xl font-bold text-center mb-4">Check Your Email</h1>
            
            <p className="text-gray-400 text-center mb-2">
              A verification link has been sent to:
            </p>
            <p className="text-white font-semibold text-center mb-6">
              {user?.email || "your email address"}
            </p>

            <p className="text-gray-500 text-sm text-center mb-8">
              Click the link in the email to verify your account and continue with your subscription. 
              If you don't see an email, check your spam folder.
            </p>

            <button
              onClick={handleCheckVerification}
              className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors mb-4"
              data-testid="button-check-verification"
            >
              I've Verified My Email
            </button>

            <div className="text-center">
              {resent ? (
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verification email sent!</span>
                </div>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
                  data-testid="button-resend-email"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Email"
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center mt-6">
            Having trouble? Contact support at support@bolt.tv
          </p>
        </div>
      </div>
    </div>
  );
}
