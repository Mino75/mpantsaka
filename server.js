const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Allowed callers (who can use the proxy)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",");

// Allowed target domains (where the proxy is allowed to forward requests)
const ALLOWED_TARGETS = (process.env.ALLOWED_TARGETS || "").split(",");

// Read README.md for the frontend
const README_PATH = path.join(__dirname, "README.md");
let readmeContent = fs.existsSync(README_PATH) ? fs.readFileSync(README_PATH, "utf-8") : "No README available";

// Serve the README as raw Markdown
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/markdown");
  res.send(readmeContent);
});

// Middleware to check allowed callers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }
  next();
});

// Proxy request handler
app.get("/*", async (req, res) => {
  try {
    const targetURL = req.url.substring(1); // Remove leading "/"
    const targetDomain = new URL(targetURL).hostname;

    // Check if target domain is allowed
    if (!ALLOWED_TARGETS.includes(targetDomain)) {
      return res.status(403).json({ error: "Forbidden: Target domain not allowed" });
    }

    console.log(`Proxying request to: ${targetURL}`);

    // Fetch target resource
    const response = await axios.get(targetURL, { responseType: "stream" });
    res.set("Access-Control-Allow-Origin", "*");
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching target:", error.message);
    res.status(500).json({ error: "Error fetching target" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Mpantsaka Proxy running on port ${PORT}`));
