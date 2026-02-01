import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer } from "./cleeng";

export function useAuth() {
  const auth0 = useAuth0();
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => getCleengCustomer());
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    async function linkToCleeng() {
      if (auth0.isAuthenticated && auth0.user?.email && !cleengCustomer) {
        setIsLinking(true);
        try {
          const response = await ssoLogin(auth0.user.email, auth0.user.sub);
          
          if (response.responseData) {
            const customer: CleengCustomer = {
              id: response.responseData.customerId || response.responseData.id,
              email: auth0.user.email,
              jwt: response.responseData.jwt,
              refreshToken: response.responseData.refreshToken,
            };
            saveCleengCustomer(customer);
            setCleengCustomer(customer);
          }
        } catch (error) {
          console.error("Failed to link Auth0 to Cleeng:", error);
        } finally {
          setIsLinking(false);
        }
      }
    }

    linkToCleeng();
  }, [auth0.isAuthenticated, auth0.user?.email, auth0.user?.sub, cleengCustomer]);

  useEffect(() => {
    if (!auth0.isAuthenticated && cleengCustomer) {
      clearCleengCustomer();
      setCleengCustomer(null);
    }
  }, [auth0.isAuthenticated, cleengCustomer]);

  return {
    ...auth0,
    cleengCustomer,
    isLinking,
    isFullyAuthenticated: auth0.isAuthenticated && !!cleengCustomer,
  };
}

export { getCleengCustomer };
