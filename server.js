require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("AI is not connected yet. Add OPENAI_API_KEY to your .env file and restart NEXA AI.");
    err.status = 503;
    throw err;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.get("/api/status", (_req, res) => {
  res.json({
    app: "NEXA AI",
    chat: Boolean(process.env.OPENAI_API_KEY),
    image: Boolean(process.env.OPENAI_API_KEY),
    video: Boolean(process.env.VIDEO_API_URL && process.env.VIDEO_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const client = getClient();
    const { messages = [], system = "You are NEXA AI, a helpful, accurate and thoughtful assistant." } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "Please provide a message." });
    const safeMessages = messages.slice(-20).map(m => ({
      role: ["user", "assistant"].includes(m.role) ? m.role : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    const result = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: system.slice(0, 4000) }, ...safeMessages],
      temperature: 0.7
    });
    res.json({ reply: result.choices?.[0]?.message?.content || "I couldn't generate a response." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Chat request failed." });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const client = getClient();
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Describe the image you want to create." });
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: prompt.slice(0, 4000),
      size: "1024x1024"
    });
    const item = result.data?.[0];
    if (item?.b64_json) return res.json({ image: `data:image/png;base64,${item.b64_json}` });
    if (item?.url) return res.json({ image: item.url });
    res.status(502).json({ error: "The image provider returned no image." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Image generation failed." });
  }
});

app.post("/api/video", async (req, res) => {
  const endpoint = process.env.VIDEO_API_URL;
  const key = process.env.VIDEO_API_KEY;
  if (!endpoint || !key) {
    return res.status(503).json({ error: "Video generation is not connected yet. Add your video provider endpoint and API key to .env. The video interface is ready for integration." });
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ prompt: String(req.body?.prompt || "").slice(0, 4000) })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error || "Video provider request failed." });
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Could not reach the video provider. Check VIDEO_API_URL and provider documentation." });
  }
});

app.post("/api/document", upload.single("file"), async (req, res) => {
  try {
    const client = getClient();
    if (!req.file) return res.status(400).json({ error: "Choose a text or PDF file first." });
    const name = req.file.originalname || "document";
    const isText = /\.(txt|md|csv|json)$/i.test(name) || req.file.mimetype.startsWith("text/");
    if (!isText) return res.status(415).json({ error: "For this starter version, upload TXT, MD, CSV or JSON files. PDF text extraction can be added with a PDF parser." });
    const content = req.file.buffer.toString("utf8").slice(0, 18000);
    const result = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are NEXA AI Document Assistant. Summarize clearly, identify key points, and answer based only on the supplied document." },
        { role: "user", content: `Analyze this file: ${name}\n\n${content}` }
      ]
    });
    res.json({ result: result.choices?.[0]?.message?.content || "No analysis returned." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Document analysis failed." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`NEXA AI running at http://localhost:${PORT}`));
