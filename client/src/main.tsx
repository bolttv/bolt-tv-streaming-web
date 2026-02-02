import { createRoot } from "react-dom/client";
import { Auth0Provider, AppState } from "@auth0/auth0-react";
import App from "./App";
import "./index.css";

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";

const onRedirectCallback = (appState?: AppState) => {
  const returnTo = appState?.returnTo || "/";
  // Use full page navigation to ensure the route is properly loaded
  window.location.replace(returnTo);
};

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
    cacheLocation="localstorage"
    onRedirectCallback={onRedirectCallback}
  >
    <App />
  </Auth0Provider>
);
