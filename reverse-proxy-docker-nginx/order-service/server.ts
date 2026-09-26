import app from "./app";

function startServer(): void {
  const PORT = 8003;
  app.listen(PORT, () => {
    console.log(`Server is running on  : http://localhost:${PORT}`);
  });
}

startServer();
