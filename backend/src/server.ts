import "dotenv/config";
import app from "./app";
import { connectRedis } from "./config/redis.caching";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server Startup Failed:", error);
    process.exit(1);
  }
}

// On Vercel the platform runs the exported app itself, so we must not listen.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
