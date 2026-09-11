// backend-server.js
// A minimal backend "worker" server. Run several instances on different
// ports to give the load balancer something to distribute traffic to.
//
// Usage: node server1.js <port>

const express = require("express");

const PORT = process.argv[2] || 4001;
const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", port: PORT });
});

app.get("/", (req, res) => {
  res.json({
    message: `Hello from backend server`,
    port: PORT,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});

// Simulate variable work so you can see load distribution/latency differences
app.get("/work", (req, res) => {
  const delay = Math.floor(Math.random() * 500);
  setTimeout(() => {
    res.json({ message: "work done", port: PORT, delayMs: delay });
  }, delay);
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

// to start server
// node server1.js 8001
// node server1.js 8002
