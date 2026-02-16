import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin, getUserIdFromToken } from "./supabase";

// Cleeng API configuration
const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
// MediaStore API - for customer operations (registration, login, subscriptions)
const CLEENG_MEDIASTORE_URL = CLEENG_SANDBOX 
  ? "https://mediastoreapi-sandbox.cleeng.com" 
  : "https://mediastoreapi.cleeng.com";
// Core API - for publisher operations (offers listing via JSON-RPC)
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/player-config", (_req, res) => {
    const siteId = process.env.JWPLAYER_SITE_ID || "";
    const playerKey = process.env.JWPLAYER_PLAYER_KEY || "EBg26wOK";
    res.json({
      libraryUrl: `https://cdn.jwplayer.com/libraries/${playerKey}.js`,
      siteId,
    });
  });

  // Cleeng configuration endpoint for frontend
  app.get("/api/cleeng/config", (req, res) => {
    res.json({
      publisherId: CLEENG_PUBLISHER_ID,
      environment: CLEENG_SANDBOX ? "sandbox" : "production",
    });
  });

  // List subscription offers using REST API (Core API 3.1)
  app.get("/api/cleeng/offers", async (req, res) => {
    try {
      if (!CLEENG_API_SECRET) {
        return res.status(500).json({ error: "Cleeng API not configured" });
      }
      
      // Core API 3.1 uses X-Publisher-Token header for authentication
      const apiUrl = `${CLEENG_CORE_API_URL}/3.1/offers?active=true`;
      console.log(`Cleeng offers request to ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "X-Publisher-Token": CLEENG_API_SECRET
        }
      });
      
      const data = await response.json();
      console.log("Cleeng offers response:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error("Cleeng offers error:", data);
        return res.status(response.status).json({ error: data.message || "Failed to fetch offers" });
      }
      
      // Core API 3.1 returns items array directly or in responseData
      const offers = data.items || data.responseData?.items || data || [];
      res.json(Array.isArray(offers) ? offers : []);
    } catch (error) {
      console.error("Cleeng offers error:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Customer registration (MediaStore API)
  app.post("/api/cleeng/register", async (req, res) => {
    try {
      const { email, password, locale = "en_US", country = "US", currency = "USD" } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ errors: ["Email and password are required"] });
      }
      
      const response = await fetch(`${CLEENG_MEDIASTORE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          locale,
          country,
          currency,
          publisherId: CLEENG_PUBLISHER_ID,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Cleeng registration error:", error);
      res.status(500).json({ errors: ["Registration failed"] });
    }
  });

  // Customer login (MediaStore API)
  app.post("/api/cleeng/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ errors: ["Email and password are required"] });
      }
      
      const response = await fetch(`${CLEENG_MEDIASTORE_URL}/auths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          publisherId: CLEENG_PUBLISHER_ID,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Cleeng login error:", error);
      res.status(500).json({ errors: ["Login failed"] });
    }
  });

  // Helper function to decode JWT and extract customer ID
  const extractCustomerIdFromJwt = (jwt: string): string | null => {
    try {
      // JWT has 3 parts: header.payload.signature
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (second part) - it's base64url encoded
      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      const data = JSON.parse(decoded);
      
      // Cleeng JWT contains customerId in various possible fields
      const customerId = data.customerId || data.cid || data.sub || data.customer_id;
      console.log("Decoded JWT payload:", JSON.stringify(data, null, 2));
      
      return customerId ? String(customerId) : null;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // SSO login - link Supabase user to Cleeng customer
  // First registers the customer if they don't exist, then gets a JWT from MediaStore API
  app.post("/api/cleeng/sso", async (req, res) => {
    try {
      const { email, externalId } = req.body;
      
      if (!email) {
        return res.status(400).json({ errors: ["Email is required"] });
      }
      
      console.log("Cleeng SSO request for email:", email);
      
      // Generate a secure random password for SSO customers
      const randomPassword = `SSO_${crypto.randomUUID()}_${Date.now()}!`;
      
      // Step 1: Try to register customer with Core API (bypasses reCAPTCHA)
      const registerResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "registerCustomer",
          params: {
            publisherToken: CLEENG_API_SECRET,
            customerData: {
              email,
              password: randomPassword,
              locale: "en_US",
              country: "US",
              currency: "USD",
              externalId: externalId || email,
            }
          },
          jsonrpc: "2.0",
          id: 1
        }),
      });
      
      const registerData = await registerResponse.json();
      console.log("Cleeng registration response:", JSON.stringify(registerData, null, 2));
      
      // Step 2: Get JWT from MediaStore API's SSO endpoint
      // This works for both new and existing customers
      const getJwt = async () => {
        const ssoResponse = await fetch(`${CLEENG_MEDIASTORE_URL}/sso/auths`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publisherToken: CLEENG_API_SECRET,
            publisherId: parseInt(CLEENG_PUBLISHER_ID),
            customerEmail: email,
          }),
        });
        
        const ssoData = await ssoResponse.json();
        console.log("Cleeng SSO JWT response:", JSON.stringify(ssoData, null, 2));
        return ssoData;
      };
      
      // If registration succeeded or customer already exists, get JWT
      if (registerData.result?.token || 
          registerData.error?.message?.includes("already") || 
          registerData.error?.message?.includes("exists") ||
          registerData.error?.code === -1) {
        
        const jwtData = await getJwt();
        
        if (jwtData.jwt) {
          // Extract the real customer ID from the JWT token
          const extractedCustomerId = extractCustomerIdFromJwt(jwtData.jwt);
          const customerId = extractedCustomerId || jwtData.customerId;
          console.log("Cleeng customer ID extracted:", customerId);
          
          return res.json({
            jwt: jwtData.jwt,
            refreshToken: jwtData.refreshToken,
            customerId: customerId,
            email: email
          });
        }
        
        // If SSO JWT fails, try using the customerToken from registration
        if (registerData.result?.token) {
          console.log("SSO JWT failed, using customerToken as fallback");
          const extractedCustomerId = extractCustomerIdFromJwt(registerData.result.token);
          const customerId = extractedCustomerId || registerData.result.customerId;
          console.log("Cleeng customer ID from registration:", customerId);
          
          return res.json({ 
            jwt: registerData.result.token,
            customerId: customerId,
            email: email
          });
        }
        
        // Last resort: generate customerToken via Core API
        console.log("Trying generateCustomerToken...");
        const tokenResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "generateCustomerToken",
            params: {
              publisherToken: CLEENG_API_SECRET,
              customerEmail: email
            },
            jsonrpc: "2.0",
            id: 1
          }),
        });
        
        const tokenData = await tokenResponse.json();
        console.log("Cleeng token generation response:", JSON.stringify(tokenData, null, 2));
        
        if (tokenData.result?.token) {
          const extractedCustomerId = extractCustomerIdFromJwt(tokenData.result.token);
          const customerId = extractedCustomerId || tokenData.result.customerId;
          console.log("Cleeng customer ID from token generation:", customerId);
          
          return res.json({
            jwt: tokenData.result.token,
            customerId: customerId,
            email: email
          });
        }
        
        console.error("All token methods failed:", jwtData, tokenData);
        return res.status(400).json({ 
          errors: ["Failed to generate authentication token"],
        });
      }
      
      // Some other registration error
      console.error("Cleeng registration error:", registerData);
      return res.status(400).json({ 
        errors: [registerData.error?.message || "Registration failed"] 
      });
      
    } catch (error) {
      console.error("Cleeng SSO error:", error);
      res.status(500).json({ errors: ["SSO login failed"] });
    }
  });

  // Get customer subscriptions
  app.get("/api/cleeng/subscriptions/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const response = await fetch(
        `${CLEENG_MEDIASTORE_URL}/customers/${customerId}/subscriptions`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Cleeng subscriptions error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get Cleeng checkout URL for hosted checkout
  app.post("/api/cleeng/checkout", async (req, res) => {
    try {
      const { offerId, customerJwt } = req.body;
      
      if (!offerId) {
        return res.status(400).json({ error: "Offer ID is required" });
      }
      
      if (!customerJwt) {
        return res.status(401).json({ error: "Customer authentication required" });
      }

      console.log("Cleeng checkout request - offerId:", offerId, "token length:", customerJwt?.length);

      // For Cleeng hosted checkout, return the checkout URL directly
      // The customer token is passed as a query parameter
      const baseUrl = CLEENG_SANDBOX 
        ? "https://checkout.sandbox.cleeng.com"
        : "https://checkout.cleeng.com";
      
      const checkoutUrl = `${baseUrl}?offerId=${encodeURIComponent(offerId)}&publisherId=${encodeURIComponent(CLEENG_PUBLISHER_ID)}&customerToken=${encodeURIComponent(customerJwt)}`;
      
      console.log("Generated checkout URL:", checkoutUrl);

      res.json({
        checkoutUrl: checkoutUrl,
        offerId: offerId,
        publisherId: CLEENG_PUBLISHER_ID,
        environment: CLEENG_SANDBOX ? "sandbox" : "production",
      });
    } catch (error) {
      console.error("Cleeng checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });

  // Cleeng Webhook endpoint - receives subscription events and syncs to Supabase
  app.post("/api/cleeng/webhook", async (req, res) => {
    try {
      const { broadcasterId, topic, data } = req.body;
      console.log("Cleeng webhook received:", { topic, broadcasterId, data: JSON.stringify(data, null, 2) });
      
      // Verify the webhook is from our publisher
      if (broadcasterId && String(broadcasterId) !== CLEENG_PUBLISHER_ID) {
        console.warn("Webhook from unknown publisher:", broadcasterId);
        return res.status(200).json({ received: true }); // Always return 200 to prevent retries
      }

      if (!supabaseAdmin) {
        console.error("Supabase admin client not configured - cannot sync subscription");
        return res.status(200).json({ received: true, warning: "Supabase not configured" });
      }

      // Handle subscription-related events
      if (topic === "transactionCreated" || topic === "subscriptionRenewed" || topic === "subscriptionSwitched") {
        const customerEmail = data?.customerEmail || data?.email;
        const customerId = data?.customerId;
        const offerId = data?.offerId || data?.offer?.id;
        const period = data?.period || data?.billingPeriod || data?.subscriptionPeriod;
        
        console.log("Processing subscription event:", { topic, customerEmail, customerId, offerId, period });
        
        if (customerEmail) {
          // Determine subscription tier and billing period from offer
          let subscriptionTier: "free" | "basic" | "premium" = "basic";
          let billingPeriodValue: "monthly" | "annual" | "none" = "monthly";
          
          // Try to get offer details from Cleeng to determine billing period
          if (offerId && CLEENG_API_SECRET) {
            try {
              const offerResponse = await fetch(`${CLEENG_CORE_API_URL}/3.1/offers/${offerId}`, {
                headers: { "X-Publisher-Token": CLEENG_API_SECRET },
              });
              if (offerResponse.ok) {
                const offerData = await offerResponse.json();
                console.log("Fetched offer details:", JSON.stringify(offerData, null, 2));
                
                // Check offer period (e.g., "month", "year", "week")
                const offerPeriod = offerData.period || offerData.freePeriod || "";
                if (offerPeriod.toLowerCase().includes("year")) {
                  billingPeriodValue = "annual";
                } else if (offerPeriod.toLowerCase().includes("month")) {
                  billingPeriodValue = "monthly";
                }
                
                // Check offer title for tier hints
                const offerTitle = (offerData.title || "").toLowerCase();
                if (offerTitle.includes("premium") || offerTitle.includes("pro")) {
                  subscriptionTier = "premium";
                }
              }
            } catch (offerError) {
              console.error("Error fetching offer details:", offerError);
            }
          }
          
          // Fallback: Parse billing period from webhook data
          if (period && billingPeriodValue === "monthly") {
            const periodLower = String(period).toLowerCase();
            if (periodLower.includes("year") || periodLower.includes("annual") || periodLower === "year" || periodLower === "yearly") {
              billingPeriodValue = "annual";
            }
          }
          
          // Parse tier from offer ID (format: S123456789_US for basic, premium offers have different IDs)
          if (offerId) {
            const offerIdStr = String(offerId).toLowerCase();
            if (offerIdStr.includes("premium")) {
              subscriptionTier = "premium";
            }
          }
          
          // Update Supabase profile by email
          const { data: profiles, error: findError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail);
          
          if (findError) {
            console.error("Error finding profile by email:", findError);
          } else if (profiles && profiles.length > 0) {
            const profileId = profiles[0].id;
            
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                subscription_tier: subscriptionTier,
                billing_period: billingPeriodValue,
                cleeng_customer_id: customerId ? String(customerId) : undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profileId);
            
            if (updateError) {
              console.error("Error updating profile from webhook:", updateError);
            } else {
              console.log(`Successfully synced subscription to Supabase: ${customerEmail} -> ${subscriptionTier}/${billingPeriodValue}`);
            }
          } else {
            console.log("No Supabase profile found for email:", customerEmail);
          }
        }
      }
      
      // Handle subscription cancellation
      if (topic === "subscriptionCanceled" || topic === "subscriptionTerminated") {
        const customerEmail = data?.customerEmail || data?.email;
        
        if (customerEmail && supabaseAdmin) {
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail);
          
          if (profiles && profiles.length > 0) {
            await supabaseAdmin
              .from("profiles")
              .update({
                subscription_tier: "free",
                billing_period: "none",
                updated_at: new Date().toISOString(),
              })
              .eq("id", profiles[0].id);
            
            console.log(`Subscription cancelled for ${customerEmail}`);
          }
        }
      }
      
      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Cleeng webhook error:", error);
      // Still return 200 to prevent Cleeng from retrying
      res.status(200).json({ received: true, error: "Processing error" });
    }
  });

  // Endpoint to register webhooks with Cleeng (call once to set up)
  app.post("/api/cleeng/register-webhooks", async (req, res) => {
    try {
      if (!CLEENG_API_SECRET) {
        return res.status(500).json({ error: "Cleeng API not configured" });
      }

      // Use the public HTTPS domain for webhooks
      const publicDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || req.get("host");
      const webhookUrl = `https://${publicDomain}/api/cleeng/webhook`;
      console.log("Registering Cleeng webhook URL:", webhookUrl);
      
      const topics = ["transactionCreated", "subscriptionRenewed", "subscriptionSwitched", "subscriptionCanceled", "subscriptionTerminated"];
      const results = [];
      
      for (const topic of topics) {
        const response = await fetch(`${CLEENG_CORE_API_URL}/3.1/webhook_subscriptions/${topic}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Publisher-Token": CLEENG_API_SECRET,
          },
          body: JSON.stringify([{ url: webhookUrl }]),
        });
        
        const data = await response.json();
        results.push({ topic, status: response.status, data });
        console.log(`Registered webhook for ${topic}:`, data);
      }
      
      res.json({ success: true, webhookUrl, results });
    } catch (error) {
      console.error("Error registering webhooks:", error);
      res.status(500).json({ error: "Failed to register webhooks" });
    }
  });

  app.post("/api/cleeng/coupon", async (req, res) => {
    try {
      const { couponCode, offerId } = req.body;

      if (!couponCode || !offerId) {
        return res.status(400).json({ error: "Coupon code and offer ID are required" });
      }

      const response = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "getCouponDetails",
          params: {
            publisherToken: CLEENG_API_SECRET,
            couponCode: couponCode,
            offerId: offerId,
          },
          jsonrpc: "2.0",
          id: 1,
        }),
      });

      const data = await response.json();
      console.log("Cleeng coupon response:", JSON.stringify(data, null, 2));

      if (data.error) {
        return res.status(400).json({
          error: data.error.message || "Invalid promo code",
          valid: false,
        });
      }

      if (data.result) {
        res.json({
          valid: true,
          discount: data.result,
        });
      } else {
        res.status(400).json({ error: "Invalid promo code", valid: false });
      }
    } catch (error) {
      console.error("Cleeng coupon error:", error);
      res.status(500).json({ error: "Failed to validate promo code", valid: false });
    }
  });

  // Create a subscription (free trial or immediate activation)
  app.post("/api/cleeng/subscribe", async (req, res) => {
    try {
      const { offerId, customerToken, customerEmail, couponCode } = req.body;
      
      if (!offerId) {
        return res.status(400).json({ error: "Offer ID is required" });
      }
      
      if (!customerToken) {
        return res.status(401).json({ error: "Customer authentication required" });
      }

      console.log("Cleeng subscribe request - offerId:", offerId, "email:", customerEmail, "coupon:", couponCode || "none");

      const params: any = {
        publisherToken: CLEENG_API_SECRET,
        customerEmail: customerEmail,
        offerId: offerId,
      };

      if (couponCode) {
        params.couponCode = couponCode;
      }

      const subscribeResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "registerSubscription",
          params,
          jsonrpc: "2.0",
          id: 1
        }),
      });

      const subscribeData = await subscribeResponse.json();
      console.log("Cleeng subscribe response:", JSON.stringify(subscribeData, null, 2));

      if (subscribeData.error) {
        return res.status(400).json({ 
          error: subscribeData.error.message || "Subscription failed",
          details: subscribeData.error
        });
      }

      res.json({
        success: true,
        subscription: subscribeData.result,
      });
    } catch (error) {
      console.error("Cleeng subscribe error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.get("/api/landing/content", async (req, res) => {
    try {
      const rows = await storage.getContentRows();
      const heroItems = await storage.getHeroItems();
      const limitedRows = rows.map(row => ({
        id: row.id,
        title: row.title,
        items: row.items.slice(0, 8).map(item => ({
          id: item.id,
          title: item.title,
          posterImage: item.posterImage,
          verticalPosterImage: item.verticalPosterImage,
          contentType: item.contentType,
        }))
      }));
      const limitedHero = heroItems.slice(0, 6).map(item => ({
        id: item.id,
        title: item.title,
        posterImage: item.posterImage,
        heroImage: item.heroImage,
        verticalPosterImage: item.verticalPosterImage,
        description: item.description,
        contentType: item.contentType,
      }));
      res.set("Cache-Control", "public, max-age=300");
      res.json({ rows: limitedRows, hero: limitedHero });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch landing content" });
    }
  });

  // Get all hero items for the carousel (with prefetched next episode data)
  app.get("/api/content/hero", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      const heroItems = await storage.getHeroItems();
      
      const heroItemsWithNextEpisode = await Promise.all(
        heroItems.map(async (item) => {
          if (item.contentType === "Series") {
            try {
              const nextEpisode = (sessionId || userId)
                ? await storage.getNextEpisodeToWatch(sessionId || "", item.id, userId || undefined)
                : await storage.getFirstEpisode(item.id);
              return { ...item, nextEpisode };
            } catch {
              return item;
            }
          }
          return item;
        })
      );
      
      res.set("Cache-Control", "private, max-age=30");
      res.json(heroItemsWithNextEpisode);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hero items" });
    }
  });

  // Get all content rows
  app.get("/api/content/rows", async (req, res) => {
    try {
      const rows = await storage.getContentRows();
      // Cache for 60 seconds
      res.set("Cache-Control", "public, max-age=60");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content rows" });
    }
  });

  // Get content by ID
  app.get("/api/content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContentById(id);
      
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      // Enrich with category from cached map
      const category = storage.getCategoryForMedia(id);
      
      res.json({ ...content, category });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get next episode to watch for a series
  app.get("/api/series/:seriesId/next-episode", async (req, res) => {
    try {
      const { seriesId } = req.params;
      const sessionId = req.headers["x-session-id"] as string;
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      
      if (!sessionId && !userId) {
        const episodes = await storage.getSeriesEpisodes(seriesId);
        if (episodes.length > 0) {
          const firstEpisode = episodes.sort((a, b) => {
            const seasonDiff = (a.seasonNumber || 1) - (b.seasonNumber || 1);
            if (seasonDiff !== 0) return seasonDiff;
            return (a.episodeNumber || 1) - (b.episodeNumber || 1);
          })[0];
          return res.json({
            seasonNumber: firstEpisode.seasonNumber || 1,
            episodeNumber: firstEpisode.episodeNumber || 1,
            mediaId: firstEpisode.mediaId
          });
        }
        return res.json(null);
      }
      
      const nextEpisode = await storage.getNextEpisodeToWatch(sessionId || "", seriesId, userId || undefined);
      res.json(nextEpisode);
    } catch (error) {
      console.error("Error fetching next episode:", error);
      res.status(500).json({ error: "Failed to fetch next episode" });
    }
  });

  // Get sport categories for "Browse by Sport" section
  app.get("/api/sports", async (req, res) => {
    try {
      const categories = await storage.getSportCategories();
      // Cache for 5 minutes (sport categories rarely change)
      res.set("Cache-Control", "public, max-age=300");
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sport categories" });
    }
  });

  // Get content for a specific sport playlist
  app.get("/api/sports/:playlistId/content", async (req, res) => {
    try {
      const { playlistId } = req.params;
      const content = await storage.getSportContent(playlistId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sport content" });
    }
  });

  // Update watch progress
  app.post("/api/watch-progress", async (req, res) => {
    try {
      const { sessionId, mediaId, title, posterImage, duration, watchedSeconds, category } = req.body;
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      
      if (!sessionId || !mediaId || !title || duration === undefined || watchedSeconds === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const validDuration = Math.max(0, Number(duration) || 0);
      const validWatchedSeconds = Math.max(0, Math.min(Number(watchedSeconds) || 0, validDuration));
      
      if (validDuration === 0) {
        return res.status(400).json({ error: "Invalid duration" });
      }
      
      const result = await storage.updateWatchProgress(
        sessionId,
        mediaId,
        title,
        posterImage || "",
        validDuration,
        validWatchedSeconds,
        category,
        userId || undefined
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error updating watch progress:", error);
      res.status(500).json({ error: "Failed to update watch progress" });
    }
  });

  // Get personalized recommendations
  app.get("/api/recommendations/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const recommendations = await storage.getPersonalizedRecommendations(sessionId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/continue-watching/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      const items = await storage.getContinueWatching(sessionId, userId || undefined);
      res.json(items);
    } catch (error) {
      console.error("Error fetching continue watching:", error);
      res.status(500).json({ error: "Failed to fetch continue watching" });
    }
  });

  app.delete("/api/continue-watching/:sessionId/:mediaId", async (req, res) => {
    try {
      const { sessionId, mediaId } = req.params;
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      await storage.removeFromContinueWatching(sessionId, mediaId, userId || undefined);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from continue watching:", error);
      res.status(500).json({ error: "Failed to remove from continue watching" });
    }
  });

  // Search content
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      const results = await storage.searchContent(query.trim());
      res.json(results);
    } catch (error) {
      console.error("Error searching content:", error);
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  app.post("/api/migrate-watch-history", async (req, res) => {
    try {
      const userId = await getUserIdFromToken(req.headers.authorization as string);
      const { sessionId } = req.body;
      
      if (!userId || !sessionId) {
        return res.status(400).json({ error: "Missing auth or session" });
      }
      
      await storage.migrateSessionToUser(sessionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error migrating watch history:", error);
      res.status(500).json({ error: "Failed to migrate watch history" });
    }
  });

  app.get("/api/series/:seriesId/episodes", async (req, res) => {
    try {
      const { seriesId } = req.params;
      const episodes = await storage.getSeriesEpisodes(seriesId);
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching series episodes:", error);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  return httpServer;
}
