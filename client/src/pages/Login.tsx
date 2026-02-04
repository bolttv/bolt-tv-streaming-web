import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

type Mode = "signin" | "signup";

export default function Login() {
  const [, setLocation] = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    authStep, 
    pendingEmail,
    signUp,
    signIn,
    setPassword,
    setAuthStep,
    setPendingEmail 
  } = useAuth();
  
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/";

  useEffect(() => {
    if (isAuthenticated && authStep === "authenticated" && !isLoading) {
      setLocation(returnTo);
    }
  }, [isAuthenticated, authStep, isLoading, returnTo, setLocation]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setSending(true);
    setError(null);

    const result = await signUp(email.trim());
    
    if (!result.success) {
      setError(result.error || "Failed to sign up");
    }
    
    setSending(false);
  };

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

    setSending(true);
    setError(null);

    const result = await signIn(email.trim(), password);
    
    if (!result.success) {
      setError(result.error || "Failed to sign in");
    }
    
    setSending(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setSending(true);
    setError(null);

    const result = await setPassword(password);
    
    if (!result.success) {
      setError(result.error || "Failed to set password");
    }
    
    setSending(false);
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setSending(true);
    setError(null);
    
    const result = await signUp(pendingEmail);
    
    if (!result.success) {
      setError(result.error || "Failed to resend verification email");
    }
    
    setSending(false);
  };

  const handleBack = () => {
    setAuthStep("email");
    setPendingEmail(null);
    setError(null);
    setPasswordValue("");
    setConfirmPassword("");
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setPasswordValue("");
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
            
            {/* Sign In Form */}
            {authStep === "email" && mode === "signin" && (
              <form onSubmit={handleSignIn}>
                <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-center mb-8">
                  Sign in to your account
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
                      disabled={sending}
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
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
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
                  disabled={sending || !email.trim() || !password}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  data-testid="button-signin"
                >
                  {sending ? (
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
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                    data-testid="button-switch-signup"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* Sign Up Form */}
            {authStep === "email" && mode === "signup" && (
              <form onSubmit={handleSignUp}>
                <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
                <p className="text-gray-400 text-center mb-8">
                  Enter your email to get started
                </p>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="mb-6">
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="signup-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
                      data-testid="input-signup-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  data-testid="button-signup"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>

                <p className="text-center mt-6 text-gray-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                    data-testid="button-switch-signin"
                  >
                    Sign In
                  </button>
                </p>

                <p className="text-xs text-gray-500 text-center mt-6">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-purple-400 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>.
                </p>
              </form>
            )}

            {/* Verification Email Sent */}
            {authStep === "verification_sent" && (
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
                  onClick={handleResendVerification}
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
                    "Resend Verification Email"
                  )}
                </button>
              </div>
            )}

            {/* Create Password */}
            {authStep === "create_password" && (
              <form onSubmit={handleSetPassword}>
                <h1 className="text-2xl font-bold text-center mb-2">Create Your Password</h1>
                <p className="text-gray-400 text-center mb-8">
                  Set a password to complete your account setup
                </p>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="new-password"
                      value={password}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
                      data-testid="input-new-password"
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
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || !password || !confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  data-testid="button-set-password"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
