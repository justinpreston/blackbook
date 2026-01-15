import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertCommentSchema, type FeedFilter } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get current user (for demo, returns guest user)
  app.get("/api/users/me", async (req, res) => {
    const user = await storage.getUser("guest");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Get user stats
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getUserStats();
    res.json(stats);
  });

  // Get trades with optional filter
  app.get("/api/trades", async (req, res) => {
    const filter = (req.query.filter as FeedFilter) || "all";
    const trades = await storage.getTrades(filter);
    res.json(trades);
  });

  // Get single trade
  app.get("/api/trades/:id", async (req, res) => {
    const trade = await storage.getTrade(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    res.json(trade);
  });

  // Create new trade
  app.post("/api/trades", async (req, res) => {
    try {
      const data = insertTradeSchema.parse({
        ...req.body,
        userId: "guest", // For demo, use guest user
      });
      const trade = await storage.createTrade(data);
      res.status(201).json(trade);
    } catch (error: any) {
      console.error("Trade creation error:", error);
      res.status(400).json({ error: error.message || "Invalid trade data" });
    }
  });

  // Toggle like on trade
  app.post("/api/trades/:id/like", async (req, res) => {
    const tradeId = req.params.id;
    const userId = "guest"; // For demo
    
    const trade = await storage.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const liked = await storage.toggleLike(tradeId, userId);
    res.json({ liked });
  });

  // Get comments for a trade
  app.get("/api/trades/:id/comments", async (req, res) => {
    const tradeId = req.params.id;
    const trade = await storage.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const comments = await storage.getComments(tradeId);
    res.json(comments);
  });

  // Create comment on trade
  app.post("/api/trades/:id/comments", async (req, res) => {
    try {
      const tradeId = req.params.id;
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const data = insertCommentSchema.parse({
        tradeId,
        userId: "guest", // For demo
        content: req.body.content,
      });

      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Comment creation error:", error);
      res.status(400).json({ error: error.message || "Invalid comment data" });
    }
  });

  return httpServer;
}
