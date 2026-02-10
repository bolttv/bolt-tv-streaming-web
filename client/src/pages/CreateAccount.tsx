import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertCircle, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CreateAccount() {
  const [, setLocation] = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    authStep,
    user,
    completeAccountSetup 
  } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Check for pending offer in localStorage or user metadata (for cross-device persistence)
  const pendingOfferId = localStorage.getItem("pending_checkout_offer") || 
    user?.user_metadata?.pending_offer;

  useEffect(() => {
    // If fully authenticated (account setup complete), redirect
    if (isAuthenticated && authStep === "authenticated" && !isLoading) {
      if (pendingOfferId) {
        setLocation(`/checkout?offerId=${encodeURIComponent(pendingOfferId)}`);
      } else {
        setLocation("/home");
      }
    }
  }, [isAuthenticated, authStep, isLoading, pendingOfferId, setLocation]);

  useEffect(() => {
    // If not in create_password step and not loading, redirect to login
    // Give extra time for auth state to settle
    if (!isLoading && authStep !== "create_password" && !isAuthenticated) {
      // Wait a bit more before redirecting as a fallback
      const timeout = setTimeout(() => {
        setLocation("/login");
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, authStep, isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await completeAccountSetup(password, firstName.trim(), lastName.trim());
    
    if (!result.success) {
      setError(result.error || "Failed to create account");
      setSubmitting(false);
    } else {
      // Clear localStorage pending offer since we've captured it
      // Account setup will have cleared user metadata version
      const offer = pendingOfferId;
      localStorage.removeItem("pending_checkout_offer");
      
      // Redirect to checkout if we have a pending offer
      if (offer) {
        setLocation(`/checkout?offerId=${encodeURIComponent(offer)}`);
      } else {
        setLocation("/home");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading if auth step isn't determined yet
  if (authStep !== "create_password" && !isAuthenticated) {
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
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold text-center mb-2">Create Your Account</h1>
              <p className="text-gray-400 text-center mb-2">
                You'll use this to watch on your favorite devices.
              </p>
              {user?.email && (
                <p className="text-purple-400 text-center mb-6 text-sm">
                  {user.email}
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={submitting}
                      data-testid="input-firstname"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={submitting}
                      data-testid="input-lastname"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <p className="text-xs text-gray-500 mb-2">Must be at least 6 characters</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
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

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={submitting}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !firstName.trim() || !lastName.trim() || !password || !confirmPassword}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                data-testid="button-create-account"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-6">
                By selecting Create Account, you agree to our{" "}
                <a href="#" className="text-purple-400 hover:underline">Terms of Use</a>
                {" "}and acknowledge you have read our{" "}
                <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>.
              </p>
            </form>
          </div>

          <p className="text-center mt-6 text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
