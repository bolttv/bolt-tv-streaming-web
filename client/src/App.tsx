import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import ContentDetails from "@/pages/ContentDetails";
import Watch from "@/pages/Watch";
import SportCategory from "@/pages/SportCategory";
import Login from "@/pages/Login";
import VerifyCallback from "@/pages/VerifyCallback";
import Subscribe from "@/pages/Subscribe";
import Checkout from "@/pages/Checkout";
import Search from "@/pages/Search";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/content/:id" component={ContentDetails} />
      <Route path="/watch/:id" component={Watch} />
      <Route path="/sport/:playlistId" component={SportCategory} />
      <Route path="/login" component={Login} />
      <Route path="/signin" component={Login} />
      <Route path="/verify-callback" component={VerifyCallback} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/search" component={Search} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
