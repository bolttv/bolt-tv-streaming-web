import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  // SSO login - link Auth0 user to Cleeng customer
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
          return res.json({
            jwt: jwtData.jwt,
            refreshToken: jwtData.refreshToken,
            customerId: jwtData.customerId || email,
            email: email
          });
        }
        
        // If SSO JWT fails, try using the customerToken from registration
        if (registerData.result?.token) {
          console.log("SSO JWT failed, using customerToken as fallback");
          return res.json({ 
            jwt: registerData.result.token,
            customerId: registerData.result.customerId || email,
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
          return res.json({
            jwt: tokenData.result.token,
            customerId: tokenData.result.customerId || email,
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

  // Create a subscription (free trial or immediate activation)
  app.post("/api/cleeng/subscribe", async (req, res) => {
    try {
      const { offerId, customerToken, customerEmail } = req.body;
      
      if (!offerId) {
        return res.status(400).json({ error: "Offer ID is required" });
      }
      
      if (!customerToken) {
        return res.status(401).json({ error: "Customer authentication required" });
      }

      console.log("Cleeng subscribe request - offerId:", offerId, "email:", customerEmail);

      // Use Core API to create a subscription directly (for free trials or testing)
      const subscribeResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "registerSubscription",
          params: {
            publisherToken: CLEENG_API_SECRET,
            customerEmail: customerEmail,
            offerId: offerId,
          },
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

  // Get all hero items for the carousel (with prefetched next episode data)
  app.get("/api/content/hero", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const heroItems = await storage.getHeroItems();
      
      // Prefetch next episode data for series items
      const heroItemsWithNextEpisode = await Promise.all(
        heroItems.map(async (item) => {
          if (item.contentType === "Series") {
            try {
              const nextEpisode = sessionId 
                ? await storage.getNextEpisodeToWatch(sessionId, item.id)
                : await storage.getFirstEpisode(item.id);
              return { ...item, nextEpisode };
            } catch {
              return item;
            }
          }
          return item;
        })
      );
      
      // Cache for 60 seconds (content refreshes every 60s on server)
      res.set("Cache-Control", "public, max-age=60");
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
      
      if (!sessionId) {
        // If no session, return first episode
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
      
      const nextEpisode = await storage.getNextEpisodeToWatch(sessionId, seriesId);
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
        category
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

  // Get continue watching items
  app.get("/api/continue-watching/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const items = await storage.getContinueWatching(sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching continue watching:", error);
      res.status(500).json({ error: "Failed to fetch continue watching" });
    }
  });

  // Remove item from continue watching
  app.delete("/api/continue-watching/:sessionId/:mediaId", async (req, res) => {
    try {
      const { sessionId, mediaId } = req.params;
      await storage.removeFromContinueWatching(sessionId, mediaId);
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

  // Get episodes for a series
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
