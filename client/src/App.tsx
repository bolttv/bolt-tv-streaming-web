import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/home";
import ContentDetails from "@/pages/ContentDetails";
import Watch from "@/pages/Watch";
import SportCategory from "@/pages/SportCategory";
import Login from "@/pages/Login";
import CreateAccount from "@/pages/CreateAccount";
import Subscribe from "@/pages/Subscribe";
import Checkout from "@/pages/Checkout";
import Search from "@/pages/Search";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes - anyone can access */}
      <Route path="/login" component={Login} />
      <Route path="/signin" component={Login} />
      <Route path="/create-account" component={CreateAccount} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/plans" component={Subscribe} />
      <Route path="/checkout" component={Checkout} />

      {/* Protected routes - requires auth + subscription */}
      <Route path="/browse">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/content/:id">
        <ProtectedRoute>
          <ContentDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/watch/:id">
        <ProtectedRoute>
          <Watch />
        </ProtectedRoute>
      </Route>
      <Route path="/sport/:playlistId">
        <ProtectedRoute>
          <SportCategory />
        </ProtectedRoute>
      </Route>
      <Route path="/search">
        <ProtectedRoute>
          <Search />
        </ProtectedRoute>
      </Route>

      {/* Landing page - will be marketing page, for now redirect to /browse */}
      <Route path="/" component={Home} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
