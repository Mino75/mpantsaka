const express = require("express");
const cors = require("cors");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 8080;

// Read allowed origins and targets from environment variables
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",");
const ALLOWED_TARGETS = (process.env.ALLOWED_TARGETS || "").split(",");

// Debugging: Print loaded environment variables
console.log("🔍 ALLOWED_ORIGINS:", ALLOWED_ORIGINS);
console.log("🔍 ALLOWED_TARGETS:", ALLOWED_TARGETS);

// CORS middleware to allow only specific frontends
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    console.warn("⚠️ No Origin header found, skipping CORS check.");
    return next();
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`❌ Blocked Origin: ${origin}`);
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Proxy request handler
app.get("/:targetUrl(*)", async (req, res) => {
  try {
    const targetUrl = req.params.targetUrl;

    if (!targetUrl) {
      console.warn("⚠️ No target URL provided.");
      return res.status(400).json({ error: "Bad Request: No target URL provided" });
    }

    const parsedUrl = new URL(targetUrl);
    const targetDomain = parsedUrl.hostname;

    if (!ALLOWED_TARGETS.includes(targetDomain)) {
      console.warn(`❌ Blocked Target: ${targetDomain}`);
      return res.status(403).json({ error: "Forbidden: Target domain not allowed" });
    }

    // Debug: Log allowed request
    console.log(`✅ Proxying request to: ${targetUrl}`);

    const fetch = (await import("node-fetch")).default;
    const response = await fetch(targetUrl);

    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    res.status(response.status);
    response.body.pipe(res);
  } catch (error) {
    console.error("🚨 Proxy Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Mpantsaka Proxy running on port ${PORT}`);
});
