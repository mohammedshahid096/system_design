const express = require("express");
const http = require("http");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { cyan, red, yellow } = require("colorette");

const servers = [
  { url: "http://localhost:8001", healthy: true },
  { url: "http://localhost:8002", healthy: true },
  { url: "http://localhost:8003", healthy: true },
  { url: "http://localhost:8004", healthy: true },
];
// round-robin load balancing index
let currentIndex = 0;
const MAX_RETRIES = 3; // how many different backends to try per request
const HEALTH_CHECK_INTERVAL_MS = 5000; // for ever 5 seconds, check the health of all backend servers

async function checkServerHealth(server) {
  return new Promise((resolve) => {
    const healthCheckUrl = `${server.url}/health`;
    const req = http.get(healthCheckUrl, (res) => {
      console.log(cyan(`Health check for ${server.url}: ${res.statusCode}`));
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => resolve(false));
  });
}

async function runHealthChecks() {
  const allRequests = servers?.map(async (singleServer) => {
    const wasHealthy = singleServer.healthy;
    singleServer.healthy = await checkServerHealth(singleServer);

    if (wasHealthy !== singleServer.healthy) {
      console.log(
        yellow(
          `Server ${singleServer.url} health status changed: ${wasHealthy} -> ${singleServer.healthy}`,
        ),
      );
    }
  });

  await Promise.all(allRequests);
}

function getNextServer(excluded = new Set()) {
  // Filter out the servers that are unhealthy or excluded
  const healthyBackends = servers.filter(
    (item) => item.healthy && !excluded.has(item.url),
  );

  console.log(
    excluded,
    "excluded",
    // healthyBackends,
    // "healthyBackends",
    // servers,
    // "servers",
  );

  if (healthyBackends.length === 0) return null;

  if (currentIndex >= healthyBackends.length) {
    currentIndex = 0; // Reset index if it exceeds the number of healthy backends
  }

  let targetServer = healthyBackends[currentIndex];
  currentIndex = (currentIndex + 1) % healthyBackends.length;

  return targetServer;
}

function startLoadBalancer() {
  const app = express();

  app.get("/lb-status", (req, res) => {
    res.status(200).json({ status: 200, allServers: servers });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", loadBalancer: true });
  });

  app.use("/", (req, res, next) => {
    if (req.path === "/lb-status") return next();
    if (req.path === "/health") return next();

    console.log(
      `Incoming request: ${req.method} ${req.url},currentIndex: ${currentIndex}`,
    );

    const triedServers = new Set();

    let attempts = 0;

    function attemptProxyRequest() {
      const backendServer = getNextServer(triedServers);

      if (!backendServer) {
        return res.status(503).json({
          success: false,
          message: "No healthy backend servers available",
        });
      }

      console.log(`Attempting to proxy request to: ${backendServer.url}`);

      triedServers.add(backendServer?.url);
      attempts++;

      const proxy = createProxyMiddleware({
        target: backendServer?.url,
        changeOrigin: true,
        on: {
          error: (err, req, res) => {
            console.error(
              `Error proxying to ${backendServer?.url}:`,
              err.message,
            );
            backendServer.healthy = false; // Mark the backend as unhealthy
            if (attempts < MAX_RETRIES) {
              console.log(red(`Retrying with another backend server...`));
              attemptProxyRequest(); // Retry with another backend

              if (currentIndex > 0) {
                currentIndex--; // Decrement currentIndex to retry the same index in the next attempt
              }
            } else {
              res.status(502).json({
                success: false,
                message: `Error proxying to ${backendServer?.url}: ${err.message}`,
                error: err,
              });
            }
          },
          proxyRes: (proxyRes, req, res) => {
            proxyRes.headers["x-served-by"] = backendServer?.url;
          },
        },
      });

      proxy(req, res, next);
    }

    attemptProxyRequest();
  });

  const PORT = 8000;
  app.listen(PORT, () => {
    console.log(`Load balancer is running on port ${PORT}`);
  });
}

// Start health checks at regular intervals
setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);
runHealthChecks();

// for starting the load balancer when this file is run directly
startLoadBalancer();
