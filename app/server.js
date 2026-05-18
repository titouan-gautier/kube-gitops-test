const express = require("express");
const client = require("prom-client");
const app = express();

// Métriques Prometheus
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpCounter = new client.Counter({
  name: "http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

// Middleware pour compter les requêtes
app.use((req, res, next) => {
  res.on("finish", () => {
    httpCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ status: "ok", version: process.env.APP_VERSION || "1.0.0" });
});

app.get("/healthz", (req, res) => {
  res.json({ healthy: true });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
