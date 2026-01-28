import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import ContentDetails from "@/pages/ContentDetails";
import Watch from "@/pages/Watch";
import SportCategory from "@/pages/SportCategory";
import SignIn from "@/pages/SignIn";
import Register from "@/pages/Register";
import Subscribe from "@/pages/Subscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/content/:id" component={ContentDetails} />
      <Route path="/watch/:id" component={Watch} />
      <Route path="/sport/:playlistId" component={SportCategory} />
      <Route path="/signin" component={SignIn} />
      <Route path="/register" component={Register} />
      <Route path="/subscribe" component={Subscribe} />
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
