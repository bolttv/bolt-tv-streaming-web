import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    authStep, 
    pendingEmail,
    sendOtp, 
    verifyOtp,
    setAuthStep,
    setPendingEmail 
  } = useAuth();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation(returnTo);
    }
  }, [isAuthenticated, isLoading, returnTo, setLocation]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setSending(true);
    setError(null);

    const result = await sendOtp(email.trim());
    
    if (!result.success) {
      setError(result.error || "Failed to send code");
    }
    
    setSending(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 7) {
      otpInputs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit) && newOtp.join("").length === 8) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    if (pastedData.length === 8) {
      handleVerifyOtp(pastedData);
    } else {
      otpInputs.current[pastedData.length]?.focus();
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!pendingEmail) return;
    
    setVerifying(true);
    setError(null);

    const result = await verifyOtp(pendingEmail, code);
    
    if (!result.success) {
      setError(result.error || "Invalid code");
      setOtp(["", "", "", "", "", "", "", ""]);
      otpInputs.current[0]?.focus();
    }
    
    setVerifying(false);
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    
    setSending(true);
    setError(null);
    
    const result = await sendOtp(pendingEmail);
    
    if (!result.success) {
      setError(result.error || "Failed to resend code");
    }
    
    setSending(false);
  };

  const handleBack = () => {
    setAuthStep("email");
    setPendingEmail(null);
    setOtp(["", "", "", "", "", "", "", ""]);
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 md:p-8">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition" data-testid="button-back-home">
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
            {authStep === "email" ? (
              <>
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-purple-500" />
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">Sign In or Sign Up</h1>
                <p className="text-gray-400 text-center mb-8">
                  Enter your email to receive a verification code
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendOtp}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition mb-4"
                    data-testid="input-email"
                    autoComplete="email"
                    autoFocus
                  />
                  
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    data-testid="button-send-code"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6"
                  data-testid="button-back-email"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <h1 className="text-2xl font-bold text-center mb-2">Check Your Email</h1>
                <p className="text-gray-400 text-center mb-2">
                  We sent an 8-digit code to
                </p>
                <p className="text-white font-semibold text-center mb-8">
                  {pendingEmail}
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                      data-testid={`input-otp-${index}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOtp(otp.join(""))}
                  disabled={verifying || otp.some(d => !d)}
                  className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mb-4"
                  data-testid="button-verify"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={handleResend}
                    disabled={sending}
                    className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
                    data-testid="button-resend"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
