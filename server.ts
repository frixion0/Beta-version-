import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy Route
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, model, guidance, seed, count = 1 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const batchCount = Math.min(Math.max(parseInt(count) || 1, 1), 4);

      const generateSingle = async (index: number) => {
        const response = await fetch("https://image-api.annemravindhrareddy.workers.dev/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            model: model || "@cf/blackforestlabs/ux-1-schnell",
            guidance: guidance || 7.5,
            seed: (seed || Math.floor(Math.random() * 1000000)) + index,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const blob = await response.blob();
        return Buffer.from(await blob.arrayBuffer());
      };

      if (batchCount === 1) {
        const buffer = await generateSingle(0);
        res.setHeader("Content-Type", "image/png");
        return res.send(buffer);
      } else {
        const buffers = await Promise.all(
          Array.from({ length: batchCount }).map((_, i) => generateSingle(i))
        );
        
        const base64Images = buffers.map(buf => `data:image/png;base64,${buf.toString('base64')}`);
        return res.json({ images: base64Images });
      }
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
