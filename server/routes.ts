import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const CLEENG_API_URL = "https://mediastoreapi.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get Cleeng configuration for frontend
  app.get("/api/cleeng/config", (req, res) => {
    res.json({
      publisherId: CLEENG_PUBLISHER_ID,
      environment: "production",
    });
  });

  // Cleeng customer registration
  app.post("/api/cleeng/register", async (req, res) => {
    try {
      const { email, password, locale, country, currency } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ errors: ["Email and password are required"] });
      }
      
      const response = await fetch(`${CLEENG_API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          locale: locale || "en_US",
          country: country || "US",
          currency: currency || "USD",
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
      res.status(500).json({ errors: ["Registration failed. Please try again."] });
    }
  });

  // Cleeng customer login
  app.post("/api/cleeng/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ errors: ["Email and password are required"] });
      }
      
      const response = await fetch(`${CLEENG_API_URL}/auths`, {
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
      res.status(500).json({ errors: ["Login failed. Please try again."] });
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
        `${CLEENG_API_URL}/customers/${customerId}/subscriptions`,
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

  // Cleeng SSO Login - Link Auth0 user to Cleeng customer
  app.post("/api/cleeng/sso-login", async (req, res) => {
    try {
      const { email, auth0Id } = req.body;
      
      if (!email) {
        return res.status(400).json({ errors: ["Email is required"] });
      }
      
      // Use Cleeng SSO endpoint to get/create customer
      const response = await fetch(`${CLEENG_API_URL}/customers/sso`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Publisher-Token": CLEENG_API_SECRET,
        },
        body: JSON.stringify({
          publisherId: CLEENG_PUBLISHER_ID,
          email,
          externalCustomerId: auth0Id || email,
          locale: "en_US",
          country: "US",
          currency: "USD",
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Cleeng SSO error:", data);
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Cleeng SSO login error:", error);
      res.status(500).json({ errors: ["SSO login failed. Please try again."] });
    }
  });

  // Get available offers (using Cleeng API 3.1 with X-Publisher-Token)
  app.get("/api/cleeng/offers", async (req, res) => {
    try {
      // Cleeng API 3.1 endpoint for offers - publisher is identified by the token
      const response = await fetch(
        `https://api.cleeng.com/3.1/offers`,
        { 
          headers: { 
            "Content-Type": "application/json",
            "X-Publisher-Token": CLEENG_API_SECRET,
          } 
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Cleeng offers API error:", data);
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Cleeng offers error:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
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
