import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Profile, getProfile, updateProfile } from "./supabase";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer } from "./cleeng";

type AuthStep = "email" | "verification_sent" | "create_password" | "authenticated";

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
  signUp: (email: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
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
      const profile = await getProfile(currentUser.id);
      
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
  }, [cleengCustomer]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if user needs to set password (just verified email)
        const needsPassword = !session.user.user_metadata?.password_set;
        if (needsPassword && session.user.email_confirmed_at) {
          setAuthStep("create_password");
        } else {
          setAuthStep("authenticated");
        }
        getProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if this is a new signup that just verified email
          const needsPassword = !session.user.user_metadata?.password_set;
          if (needsPassword && session.user.email_confirmed_at) {
            setAuthStep("create_password");
          } else {
            setAuthStep("authenticated");
          }
          getProfile(session.user.id).then(setProfile);
        } else {
          setAuthStep("email");
          setProfile(null);
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

  const signUp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = window.location.origin;
      
      // Sign up with a temporary random password - user will set real password after verification
      const tempPassword = crypto.randomUUID();
      
      const { error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${baseUrl}/verify-callback`,
          data: {
            password_set: false, // Flag to indicate user needs to set password
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setPendingEmail(email);
      setAuthStep("verification_sent");
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to send verification email" };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setAuthStep("authenticated");
        return { success: true };
      }

      return { success: false, error: "Sign in failed" };
    } catch (error) {
      return { success: false, error: "Failed to sign in" };
    }
  };

  const setPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
        data: {
          password_set: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setAuthStep("authenticated");
        return { success: true };
      }

      return { success: false, error: "Failed to set password" };
    } catch (error) {
      return { success: false, error: "Failed to set password" };
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
        signUp,
        signIn,
        setPassword,
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
