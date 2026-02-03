import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Profile, getProfile, updateProfile } from "./supabase";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer } from "./cleeng";

type AuthStep = "email" | "magic_link_sent" | "authenticated";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authStep: AuthStep;
  pendingEmail: string | null;
  cleengCustomer: CleengCustomer | null;
  isLinking: boolean;
  sendMagicLink: (email: string, returnTo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setAuthStep: (step: AuthStep) => void;
  setPendingEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => getCleengCustomer());
  const [isLinking, setIsLinking] = useState(false);
  const [linkAttempted, setLinkAttempted] = useState(false);

  const isAuthenticated = !!session && !!user;

  const linkToCleeng = useCallback(async (currentUser: User) => {
    if (!currentUser.email) return;

    const existingCustomer = getCleengCustomer();
    if (existingCustomer?.jwt && existingCustomer?.email === currentUser.email) {
      if (!cleengCustomer) {
        setCleengCustomer(existingCustomer);
      }
      return;
    }

    setIsLinking(true);
    try {
      console.log("Linking Supabase user to Cleeng:", currentUser.email);
      const response = await ssoLogin(currentUser.email, currentUser.id);
      
      if (response.jwt) {
        const customer: CleengCustomer = {
          id: response.customerId || response.email || currentUser.email,
          email: response.email || currentUser.email,
          jwt: response.jwt,
          refreshToken: response.refreshToken,
        };
        saveCleengCustomer(customer);
        setCleengCustomer(customer);

        if (profile && !profile.cleeng_customer_id) {
          await updateProfile(currentUser.id, { cleeng_customer_id: customer.id });
        }

        console.log("Cleeng customer linked successfully");
      } else if (response.errors) {
        console.error("Cleeng SSO error:", response.errors);
      }
    } catch (error) {
      console.error("Failed to link to Cleeng:", error);
    } finally {
      setIsLinking(false);
      setLinkAttempted(true);
    }
  }, [cleengCustomer, profile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAuthStep("authenticated");
        getProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setAuthStep("authenticated");
          const userProfile = await getProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
          setAuthStep("email");
          clearCleengCustomer();
          setCleengCustomer(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !cleengCustomer && !isLinking && !linkAttempted) {
      linkToCleeng(user);
    }
  }, [isAuthenticated, user, cleengCustomer, isLinking, linkAttempted, linkToCleeng]);

  useEffect(() => {
    if (!isAuthenticated && cleengCustomer) {
      clearCleengCustomer();
      setCleengCustomer(null);
    }
  }, [isAuthenticated, cleengCustomer]);

  const sendMagicLink = async (email: string, returnTo?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = window.location.origin;
      const redirectUrl = returnTo ? `${baseUrl}${returnTo}` : baseUrl;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setPendingEmail(email);
      setAuthStep("magic_link_sent");
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to send magic link" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthStep("email");
    setPendingEmail(null);
    clearCleengCustomer();
    setCleengCustomer(null);
    setLinkAttempted(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAuthenticated,
        authStep,
        pendingEmail,
        cleengCustomer,
        isLinking,
        sendMagicLink,
        logout,
        setAuthStep,
        setPendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
