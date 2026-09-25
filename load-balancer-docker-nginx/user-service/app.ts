import express, { Application, Request, Response } from "express";

const app: Application = express();

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: "welcomome to the express server",
    server: process.env.SERVER_SERVICE_NAME || null,
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: "Health check successful",
    server: process.env.SERVER_SERVICE_NAME || null,
  });
});

export default app;
