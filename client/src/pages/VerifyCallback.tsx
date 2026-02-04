import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function VerifyCallback() {
  const [, setLocation] = useLocation();
  const { isLoading, authStep } = useAuth();

  useEffect(() => {
    // The Supabase client automatically handles the auth callback
    // We just need to wait for the auth state to update and redirect to login
    // where the user will be prompted to create a password
    if (!isLoading) {
      if (authStep === "create_password") {
        setLocation("/login");
      } else if (authStep === "authenticated") {
        setLocation("/");
      } else {
        // Give Supabase a moment to process the callback
        const timeout = setTimeout(() => {
          setLocation("/login");
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [isLoading, authStep, setLocation]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
      <h1 className="text-xl font-semibold mb-2">Verifying your email...</h1>
      <p className="text-gray-400">Please wait while we confirm your email address.</p>
    </div>
  );
}
