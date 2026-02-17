import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import App from "@/App";
import "./index.css";

window.addEventListener("error", (e) => {
  if (e.message === "(unknown runtime error)" || !e.message) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

window.addEventListener("unhandledrejection", (e) => {
  if (!e.reason || (e.reason instanceof Error && !e.reason.message)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

// Handle Supabase auth callback before React app initializes
// This ensures tokens from email verification links are processed first
async function handleAuthCallback() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    console.log("Main: Processing auth callback from URL");
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error("Main: Error setting session:", error);
      } else {
        console.log("Main: Session set successfully from URL tokens");
      }
      
      // Clear the hash from URL
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) {
      console.error("Main: Auth callback error:", err);
    }
  }
}

// Initialize the app after handling auth callback
handleAuthCallback().then(() => {
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
});
