const express = require("express");
const { URL } = require("url");
const http = require("http");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 8080;

// Read allowed origins and targets from environment variables.
// If not set, allow all (empty array means "no check")
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];
const ALLOWED_TARGETS = process.env.ALLOWED_TARGETS
  ? process.env.ALLOWED_TARGETS.split(",")
  : [];

// Debug: print loaded environment variables
console.log("🔍 ALLOWED_ORIGINS:", ALLOWED_ORIGINS);
console.log("🔍 ALLOWED_TARGETS:", ALLOWED_TARGETS);

// Manual CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // If ALLOWED_ORIGINS is not empty and the request's origin isn’t allowed, block it.
  if (ALLOWED_ORIGINS.length && origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`❌ Blocked Origin: ${origin}`);
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  // Always set these CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Proxy request handler using Node's http/https and streaming
app.get("/:targetUrl(*)", (req, res) => {
  try {
    const targetUrl = req.params.targetUrl;
    console.log(`🔍 Received Target URL: ${targetUrl}`);

    if (!targetUrl) {
      console.warn("⚠️ No target URL provided.");
      return res
        .status(400)
        .json({ error: "Bad Request: No target URL provided" });
    }

    // Validate and parse the target URL
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (err) {
      console.error("Invalid URL:", targetUrl);
      return res.status(400).json({ error: "Bad Request: Invalid URL" });
    }

    console.log(`🔍 Parsed Hostname: ${parsedUrl.hostname}`);

    // If ALLOWED_TARGETS is set and the target domain isn’t allowed, block it.
    if (
      ALLOWED_TARGETS.length &&
      !ALLOWED_TARGETS.includes(parsedUrl.hostname)
    ) {
      console.warn(`❌ Blocked Target: ${parsedUrl.hostname}`);
      return res
        .status(403)
        .json({ error: "Forbidden: Target domain not allowed" });
    }

    console.log(`✅ Forwarding request to: ${targetUrl}`);

    // Choose the appropriate module based on protocol.
    const requester = parsedUrl.protocol === "https:" ? https : http;

    // Forward the request
    requester.get(targetUrl, (proxyRes) => {
      // Set CORS headers on the response
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Content-Type, Accept, Authorization"
      );

      // Copy headers from the proxied response, skipping 'content-length'
      for (let key in proxyRes.headers) {
        if (key.toLowerCase() === "content-length") continue;
        res.setHeader(key, proxyRes.headers[key]);
      }

      // Set the status code from the proxied response
      res.status(proxyRes.statusCode);

      // Stream the response data to the client
      proxyRes.pipe(res);
    }).on("error", (err) => {
      console.error("🚨 Proxy Request Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });
  } catch (error) {
    console.error("🚨 Unexpected Proxy Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Mpantsaka Proxy running on port ${PORT}`);
});
