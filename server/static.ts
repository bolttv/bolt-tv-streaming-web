import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  let indexHtml = fs.readFileSync(indexPath, "utf-8");

  const playerKey = process.env.JWPLAYER_PLAYER_KEY || "EBg26wOK";
  indexHtml = indexHtml.replace(
    /https:\/\/cdn\.jwplayer\.com\/libraries\/[^"]+\.js/,
    `https://cdn.jwplayer.com/libraries/${playerKey}.js`
  );

  app.use(express.static(distPath, { index: false }));

  app.use("/{*path}", (_req, res) => {
    res.set("Content-Type", "text/html");
    res.send(indexHtml);
  });
}
