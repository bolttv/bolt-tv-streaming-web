import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSignIn = () => {
    loginWithRedirect({
      appState: { returnTo: "/" },
    });
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
            <h1 className="text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-white/60">Sign in to access your account</p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition"
                data-testid="button-signin"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="mt-6 text-center text-white/60">
            <p>
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-white hover:underline cursor-pointer">Create one</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
