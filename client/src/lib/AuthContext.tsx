import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Profile, getProfile, updateProfile, upsertProfile } from "./supabase";
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
  signUp: (email: string) => Promise<{ success: boolean; error?: string; existingUser?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  completeAccountSetup: (password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
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
      const response = await ssoLogin(currentUser.email, currentUser.id);
      console.log("Cleeng SSO response:", response);
      
      if (response.jwt) {
        const cleengId = response.customerId;
        console.log("Cleeng customer ID from response:", cleengId);
        
        const customer: CleengCustomer = {
          id: cleengId || currentUser.email,
          email: response.email || currentUser.email,
          jwt: response.jwt,
          refreshToken: response.refreshToken,
        };
        saveCleengCustomer(customer);
        setCleengCustomer(customer);

        // Always upsert the profile with the Cleeng customer ID
        if (cleengId) {
          console.log("Upserting profile with Cleeng customer ID:", cleengId);
          const updatedProfile = await upsertProfile(
            currentUser.id, 
            currentUser.email, 
            { cleeng_customer_id: cleengId }
          );
          console.log("Profile upsert result:", updatedProfile);
          if (updatedProfile) {
            setProfile(updatedProfile);
          }
        }

        console.log("Cleeng customer linked successfully with ID:", cleengId);
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

  const checkAccountSetupComplete = (currentUser: User): boolean => {
    // Check if user has completed account setup (has password set and profile info)
    const passwordSet = currentUser.user_metadata?.password_set === true;
    return passwordSet;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if user needs to complete account setup
        const setupComplete = checkAccountSetupComplete(session.user);
        if (!setupComplete && session.user.email_confirmed_at) {
          setAuthStep("create_password");
        } else if (setupComplete) {
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
          const setupComplete = checkAccountSetupComplete(session.user);
          if (!setupComplete && session.user.email_confirmed_at) {
            setAuthStep("create_password");
          } else if (setupComplete) {
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
    if (isAuthenticated && user && authStep === "authenticated" && !cleengCustomer && !isLinking && !linkAttempted) {
      linkToCleeng(user);
    }
  }, [isAuthenticated, user, authStep, cleengCustomer, isLinking, linkAttempted, linkToCleeng]);

  useEffect(() => {
    if (!isAuthenticated && cleengCustomer) {
      clearCleengCustomer();
      setCleengCustomer(null);
    }
  }, [isAuthenticated, cleengCustomer]);

  const signUp = async (email: string): Promise<{ success: boolean; error?: string; existingUser?: boolean }> => {
    try {
      const baseUrl = window.location.origin;
      
      // Get pending offer to include in user metadata for cross-device persistence
      const pendingOffer = localStorage.getItem("pending_checkout_offer");
      
      // Sign up with a temporary random password - user will set real password after verification
      const tempPassword = crypto.randomUUID();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${baseUrl}/create-account`,
          data: {
            password_set: false,
            pending_offer: pendingOffer || undefined,
          },
        },
      });

      if (error) {
        // Check if user already exists
        if (error.message.toLowerCase().includes("already registered") || 
            error.message.toLowerCase().includes("user already exists")) {
          return { success: false, error: "An account with this email already exists. Please sign in instead.", existingUser: true };
        }
        return { success: false, error: error.message };
      }

      // Check if this is an existing user (Supabase returns user but no session for existing emails)
      if (data.user && !data.session && data.user.identities?.length === 0) {
        return { success: false, error: "An account with this email already exists. Please sign in instead.", existingUser: true };
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

  const completeAccountSetup = async (
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Update user password and metadata
      const { data, error } = await supabase.auth.updateUser({
        password,
        data: {
          password_set: true,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        
        // Try to update profile in database (may fail if table doesn't have columns yet)
        try {
          await updateProfile(data.user.id, {
            first_name: firstName,
            last_name: lastName,
          });
        } catch (profileError) {
          // Profile update is non-critical - names are stored in user metadata
          console.log("Profile update skipped - names stored in user metadata");
        }
        
        // Clear pending offer from user metadata now that setup is complete
        // The checkout flow will read it before we clear it
        await supabase.auth.updateUser({
          data: {
            pending_offer: null,
          },
        });
        
        setAuthStep("authenticated");
        return { success: true };
      }

      return { success: false, error: "Failed to complete account setup" };
    } catch (error) {
      return { success: false, error: "Failed to complete account setup" };
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
        completeAccountSetup,
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
