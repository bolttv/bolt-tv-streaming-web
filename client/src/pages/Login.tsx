import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, Loader2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    authStep, 
    signIn 
  } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/home";

  useEffect(() => {
    if (isAuthenticated && authStep === "authenticated" && !isLoading) {
      setLocation(returnTo);
    }
  }, [isAuthenticated, authStep, isLoading, returnTo, setLocation]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await signIn(email.trim(), password);
    
    if (!result.success) {
      setError(result.error || "Failed to sign in");
    }
    
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
            <form onSubmit={handleSignIn}>
              <h1 className="text-2xl font-bold text-center mb-2">Sign In</h1>
              <p className="text-gray-400 text-center mb-8">
                Welcome back! Enter your credentials to continue.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

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
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={submitting}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="mb-6">
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
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={submitting}
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

              <button
                type="submit"
                disabled={submitting || !email.trim() || !password}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                data-testid="button-signin"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <p className="text-center mt-6 text-gray-400">
                Don't have an account?{" "}
                <Link href="/subscribe" className="text-purple-400 hover:text-purple-300 font-medium">
                  Subscribe
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
