process.env.PORT = '0'; // Listen on a random ephemeral port to avoid EADDRINUSE

export default async function handler(req, res) {
  try {
    const serverModule = await import('../build/server/index.js');
    const server = serverModule.default;
    server.emit('request', req, res);
  } catch (err) {
    console.error("Error loading server:", err);
    res.status(500).send("Internal Server Error loading Hono");
  }
}
