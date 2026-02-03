import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    authStep, 
    pendingEmail,
    sendMagicLink, 
    setAuthStep,
    setPendingEmail 
  } = useAuth();
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/";

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation(returnTo);
    }
  }, [isAuthenticated, isLoading, returnTo, setLocation]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setSending(true);
    setError(null);

    const result = await sendMagicLink(email.trim(), returnTo);
    
    if (!result.success) {
      setError(result.error || "Failed to send magic link");
    }
    
    setSending(false);
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    
    setSending(true);
    setError(null);
    
    const result = await sendMagicLink(pendingEmail, returnTo);
    
    if (!result.success) {
      setError(result.error || "Failed to resend magic link");
    }
    
    setSending(false);
  };

  const handleBack = () => {
    setAuthStep("email");
    setPendingEmail(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 md:p-8">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back-home">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <img 
                src="/assets/bolt-logo-white.png" 
                alt="Bolt TV" 
                className="h-8 mx-auto mb-6"
              />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            {authStep === "email" && (
              <form onSubmit={handleSendMagicLink}>
                <h1 className="text-2xl font-bold text-center mb-2">Welcome to Bolt TV</h1>
                <p className="text-gray-400 text-center mb-8">
                  Enter your email to sign in or create an account
                </p>

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
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  data-testid="button-send-magic-link"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Continue with Email"
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-6">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-purple-400 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>.
                </p>
              </form>
            )}

            {authStep === "magic_link_sent" && (
              <div className="text-center">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition mb-6"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
                  <p className="text-gray-400 mb-2">
                    We sent a magic link to
                  </p>
                  <p className="text-white font-semibold mb-4">
                    {pendingEmail}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Click the link in the email to sign in. The link will expire in 60 minutes.
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
                  disabled={sending}
                  className="text-purple-400 hover:text-purple-300 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  data-testid="button-resend"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Magic Link"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
