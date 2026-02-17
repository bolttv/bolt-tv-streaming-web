import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Profile, getProfile, updateProfile, upsertProfile } from "./supabase";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer, getSubscriptions } from "./cleeng";
import { getSessionId } from "./session";

type AuthStep = "email" | "authenticated";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authStep: AuthStep;
  hasActiveSubscription: boolean;
  cleengCustomer: CleengCustomer | null;
  isLinking: boolean;
  signUp: (email: string, password: string, profileData?: { firstName?: string; lastName?: string; gender?: string; birthYear?: string; zipCode?: string }) => Promise<{ success: boolean; error?: string; existingUser?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => getCleengCustomer());
  const [isLinking, setIsLinking] = useState(false);
  const [linkAttempted, setLinkAttempted] = useState(false);
  const migrationAttempted = useRef(false);

  const isAuthenticated = !!session && !!user;
  const hasActiveSubscription = !!profile && profile.subscription_tier !== "free";

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
      const metadata = currentUser.user_metadata || {};
      const response = await ssoLogin(currentUser.email, currentUser.id, metadata.first_name, metadata.last_name);
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

        let subscriptionTier: "free" | "basic" | "premium" = "free";
        let billingPeriod: "none" | "monthly" | "annual" = "none";
        
        try {
          const subscriptionsResponse = await getSubscriptions(cleengId || currentUser.email, response.jwt);
          console.log("Cleeng subscriptions response:", subscriptionsResponse);
          
          if (subscriptionsResponse.items && subscriptionsResponse.items.length > 0) {
            const activeSubscription = subscriptionsResponse.items.find(
              (sub: any) => sub.status === "active" || sub.status === "paid"
            );
            
            if (activeSubscription) {
              const offerId = activeSubscription.offerId || "";
              const period = activeSubscription.period || "";
              console.log("Active subscription - offerId:", offerId, "period:", period);
              
              if (period.toLowerCase().includes("year") || period.toLowerCase().includes("annual")) {
                billingPeriod = "annual";
              } else if (period.toLowerCase().includes("month")) {
                billingPeriod = "monthly";
              } else {
                if (offerId.toLowerCase().includes("annual") || offerId.toLowerCase().includes("yearly")) {
                  billingPeriod = "annual";
                } else if (offerId.toLowerCase().includes("monthly")) {
                  billingPeriod = "monthly";
                }
              }
              
              if (offerId.toLowerCase().includes("premium")) {
                subscriptionTier = "premium";
              } else {
                subscriptionTier = "basic";
              }
            }
          }
        } catch (subError) {
          console.error("Error fetching subscriptions:", subError);
        }

        if (cleengId) {
          const profileFields: Partial<Profile> = {
            cleeng_customer_id: cleengId,
            subscription_tier: subscriptionTier,
            billing_period: billingPeriod,
          };
          if (metadata.first_name) profileFields.first_name = metadata.first_name;
          if (metadata.last_name) profileFields.last_name = metadata.last_name;
          if (metadata.gender) profileFields.gender = metadata.gender;
          if (metadata.birth_year) profileFields.birth_year = metadata.birth_year;
          if (metadata.zip_code) profileFields.zip_code = metadata.zip_code;
          if (metadata.first_name || metadata.last_name) {
            profileFields.display_name = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
          }

          console.log("Upserting profile with Cleeng customer ID:", cleengId, "tier:", subscriptionTier, "billing:", billingPeriod);
          const updatedProfile = await upsertProfile(
            currentUser.id, 
            currentUser.email, 
            profileFields
          );
          console.log("Profile upsert result:", updatedProfile);
          if (updatedProfile) {
            setProfile(updatedProfile);
          }
        }

        console.log("Cleeng customer linked successfully with ID:", cleengId, "tier:", subscriptionTier, "billing:", billingPeriod);
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
        setAuthStep("authenticated");
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
          setAuthStep("authenticated");
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
    if (isAuthenticated && session?.access_token && !migrationAttempted.current) {
      migrationAttempted.current = true;
      fetch("/api/migrate-watch-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId: getSessionId() }),
      }).catch(() => {});
    }
  }, [isAuthenticated, session]);

  useEffect(() => {
    if (!isAuthenticated && cleengCustomer) {
      clearCleengCustomer();
      setCleengCustomer(null);
    }
    if (!isAuthenticated) {
      migrationAttempted.current = false;
    }
  }, [isAuthenticated, cleengCustomer]);

  const signUp = async (email: string, password: string, profileData?: { firstName?: string; lastName?: string; gender?: string; birthYear?: string; zipCode?: string }): Promise<{ success: boolean; error?: string; existingUser?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            password_set: true,
            first_name: profileData?.firstName || undefined,
            last_name: profileData?.lastName || undefined,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || 
            error.message.toLowerCase().includes("user already exists")) {
          return { success: false, error: "An account with this email already exists. Please sign in instead.", existingUser: true };
        }
        if (error.message.toLowerCase().includes("database error")) {
          console.error("Supabase signup database error (likely missing profile columns):", error.message);
          return { success: false, error: "Database error saving new user" };
        }
        return { success: false, error: error.message };
      }

      if (data.user && !data.session && data.user.identities?.length === 0) {
        return { success: false, error: "An account with this email already exists. Please sign in instead.", existingUser: true };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setAuthStep("authenticated");

        if (profileData?.gender || profileData?.birthYear || profileData?.zipCode) {
          supabase.auth.updateUser({
            data: {
              gender: profileData.gender || undefined,
              birth_year: profileData.birthYear || undefined,
              zip_code: profileData.zipCode || undefined,
            },
          }).catch((err) => console.error("Failed to save extra profile metadata:", err));
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to create account" };
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

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthStep("email");
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
        hasActiveSubscription,
        cleengCustomer,
        isLinking,
        signUp,
        signIn,
        logout,
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
