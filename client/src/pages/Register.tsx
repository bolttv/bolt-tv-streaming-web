import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { registerCustomer, saveCleengAuth } from "@/lib/cleeng";

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await registerCustomer(email, password);
      
      if (response.errors && response.errors.length > 0) {
        setError(response.errors[0] || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      if (response.responseData?.jwt) {
        saveCleengAuth(
          response.responseData.jwt,
          response.responseData.refreshToken,
          {
            id: response.responseData.id,
            email: response.responseData.email,
            locale: response.responseData.locale,
            country: response.responseData.country,
            currency: response.responseData.currency,
          }
        );
        setLocation("/subscribe");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 md:p-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/assets/bolt-logo-white.png" 
              alt="Bolt TV" 
              className="h-8 mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-white/60">Sign up to start watching</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition"
                placeholder="you@example.com"
                required
                data-testid="input-email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition pr-12"
                  placeholder="At least 8 characters"
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition"
                placeholder="Confirm your password"
                required
                data-testid="input-confirm-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-register"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-white/60">
            <p>
              Already have an account?{" "}
              <Link href="/signin">
                <span className="text-white hover:underline cursor-pointer">Sign in</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
