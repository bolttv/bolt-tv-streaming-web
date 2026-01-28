import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const CLEENG_API_URL = "https://mediastoreapi.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";

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
      res.json(data);
    } catch (error) {
      console.error("Cleeng registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Cleeng customer login
  app.post("/api/cleeng/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
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
      res.json(data);
    } catch (error) {
      console.error("Cleeng login error:", error);
      res.status(500).json({ error: "Login failed" });
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

  // Get available offers
  app.get("/api/cleeng/offers", async (req, res) => {
    try {
      const response = await fetch(
        `${CLEENG_API_URL}/publishers/${CLEENG_PUBLISHER_ID}/offers`,
        { headers: { "Content-Type": "application/json" } }
      );
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Cleeng offers error:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Get all hero items for the carousel
  app.get("/api/content/hero", async (req, res) => {
    try {
      const heroItems = await storage.getHeroItems();
      res.json(heroItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hero items" });
    }
  });

  // Get all content rows
  app.get("/api/content/rows", async (req, res) => {
    try {
      const rows = await storage.getContentRows();
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
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get sport categories for "Browse by Sport" section
  app.get("/api/sports", async (req, res) => {
    try {
      const categories = await storage.getSportCategories();
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
      const { sessionId, mediaId, title, posterImage, duration, watchedSeconds } = req.body;
      
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
        validWatchedSeconds
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error updating watch progress:", error);
      res.status(500).json({ error: "Failed to update watch progress" });
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

  return httpServer;
}
