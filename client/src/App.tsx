import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "@/components/AuthGuard";
import LandingPage from "@/pages/LandingPage";
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
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/signin" component={Login} />
      <Route path="/create-account" component={CreateAccount} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/home">{() => <AuthGuard><Home /></AuthGuard>}</Route>
      <Route path="/content/:id">{(params) => <AuthGuard><ContentDetails /></AuthGuard>}</Route>
      <Route path="/watch/:id">{(params) => <AuthGuard><Watch /></AuthGuard>}</Route>
      <Route path="/sport/:playlistId">{(params) => <AuthGuard><SportCategory /></AuthGuard>}</Route>
      <Route path="/search">{() => <AuthGuard><Search /></AuthGuard>}</Route>
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
