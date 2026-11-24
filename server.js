// The Lighting Warehouse demo — static file server + TLW Light Assistant API
// Run:  ANTHROPIC_API_KEY=sk-ant-... npm start   (or put the key in .env)
// Without a key the site still works: the chat falls back to its built-in quick-answer mode.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);

// --- tiny .env loader (no extra dependency) ---
try {
  for (const line of fs.readFileSync(path.join(here, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env file */ }

const MODEL = process.env.TLW_MODEL || "claude-opus-5-5";
const hasCreds = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasCreds ? new Anthropic() : null;

// --- catalogue + store data (same files the site uses) ---
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(here, "assets/data/products.json"), "utf8"));
const BYID = new Map(PRODUCTS.map((p) => [p.id, p]));
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(here, "assets/js/data-static.js"), "utf8"), sandbox);
const SITE = sandbox.window.TLW_DATA;

const storesText = SITE.stores.map((s) =>
  `- ${s.name} (id: ${s.id})${s.isNew ? " — NEW store" : ""}: ${s.addr}. Manager ${s.manager}. Tel ${s.phone}. Mon–Fri 8:30–17:00, Sat 9:00–15:00, Sun ${s.sun}.`
).join("\n");

// Frozen system prompt: identical bytes on every request so it caches.
const SYSTEM = `You are the TLW Light Assistant on the website of The Lighting Warehouse (TLW), South Africa's leading independent lighting retailer. You talk like TLW's in-store staff: friendly, expert, warm and proudly South African. Use South African English (colour, centre) and Rands (R1,299.00).

About TLW
- Family business founded in 1974 by John, who learned the trade in a lampshade factory in London in 1973. Started on Fox Street, Johannesburg: two rooms, two employees, one customer. After John passed away in January 2003, his wife, son, daughter, nephew and staff carried the business forward.
- Mission: to light up every home in South Africa. Tagline: Learn what light can do.
- Phone 011 201 2600 · WhatsApp 082 338 0490 · info@lightingwarehouse.co.za
- Delivery across South Africa; FREE delivery on orders over R500. Returns and exchanges by courier collection. Pay by card, EFT or Payflex (4 interest-free payments). Fragile glass is double-boxed. Trade and reseller discounts through the Trade Portal (trade.html).

Stores
${storesText}

What you help with
- Choosing lights by room, style, size and budget. Explain the three layers (ambient, task, accent) when it helps.
- Plain-language explanations: lumens vs watts (LED: roughly 80–100 lumens per watt), warm white 2700–3000K vs cool/daylight 4000–6500K, IP ratings (IP44 for bathrooms and covered patios, IP65+ for exposed outdoor), fittings (E27 large screw, E14 small screw, B22 bayonet, GU10 two-pin spot), dimmers (need a dimmable globe and a compatible trailing-edge LED dimmer).
- Rough guides: a living room needs about 100–150 lumens per m², a kitchen 300–400, a bathroom 200–300, a bedroom 100–150. Pendant over a dining table: bottom about 75–85 cm above the table. Ceiling fan size: rooms up to 10 m² ~90 cm blades; 10–20 m² ~110–132 cm; over 20 m² 132 cm+ or two fans.
- Globe matching: from a description or photo, identify the cap (E27/E14/B22/GU10), shape (A60, G45 golf ball, ST64 filament, G95/G125 globe) and suggest the replacement.
- Load-shedding: rechargeable emergency globes, solar lights, solar motion sensors.
- Order tracking: you cannot see orders. Send them to the Track Order page (track.html) where they enter order number and email, or offer WhatsApp.
- Nearest store, hours, and stock: give the store details above; for live stock at a store, suggest calling the store or WhatsApp.

Products
- Each user message may end with a block "CATALOGUE MATCHES" listing real TLW products (id, name, price, category, key specs) found for the question. Only recommend products from that list, never invent products, prices or specs. If nothing fits, say so and suggest a category to browse or a chat with a TLW expert.
- To show a product card with an Add to Bag button, write the tag [[product:ID]] on its own line after you mention it. Show 1–4 products, not more.
- To hand over to a human, write [[whatsapp]] on its own line. To suggest the full room planner, write [[planner]]. To show a store card, write [[store:ID]].

Style
- Keep replies short and scannable: 2–5 sentences or a few bullets, then the product tags. Ask one clarifying question when you need room size, style or budget.
- Never claim stock levels or delivery dates you do not have. No medical, legal or financial advice. Stay on lighting, fans, electrical accessories and TLW.`;

function productLine(p) {
  const sp = Object.entries(p.sp || {}).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join("; ");
  return `- id ${p.id} | ${p.n} | R${p.p.toFixed(2)}${p.r > p.p ? ` (was R${p.r.toFixed(2)})` : ""} | ${p.c.slice(0, 3).join(", ")} | ${p.st ? "in stock online" : "out of stock online"}${sp ? " | " + sp : ""}`;
}

// --- per-IP rate limit for the public demo ---
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 60_000, max = 20;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}

function readBody(req, limit = 6_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleChat(req, res) {
  if (!client) { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ offline: true })); return; }
  const ip = req.socket.remoteAddress || "x";
  if (limited(ip)) { res.writeHead(429, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "Too many messages, please wait a minute." })); return; }

  let body;
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end(); return; }

  // Clean the conversation: text turns only, capped, alternating roles.
  const history = (Array.isArray(body.messages) ? body.messages : []).slice(-14)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") { res.writeHead(400); res.end(); return; }

  // Ground the last user turn in real catalogue data (ids suggested by the site's search, verified here).
  const ids = (Array.isArray(body.candidates) ? body.candidates : []).map(Number).filter((id) => BYID.has(id)).slice(0, 18);
  const matches = ids.map((id) => productLine(BYID.get(id))).join("\n") || "(no direct matches; suggest a category or ask a clarifying question)";
  const last = history[history.length - 1];
  const content = [];
  if (typeof body.image === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(body.image) && body.image.length < 4_500_000) {
    const [, mediaType, data] = body.image.match(/^data:(image\/\w+);base64,(.*)$/);
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
  }
  content.push({ type: "text", text: `${last.content}\n\nCATALOGUE MATCHES\n${matches}` });
  history[history.length - 1] = { role: "user", content };

  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive", "x-accel-buffering": "no" });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: history,
    });
    req.on("close", () => stream.abort());
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ t: event.delta.text });
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") send({ t: "\n\nI can't help with that one, but a TLW expert can.\n[[whatsapp]]" });
    send({ done: true });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) send({ error: "The assistant is busy right now. Please try again in a moment." });
    else if (err instanceof Anthropic.AuthenticationError) { console.error("Anthropic auth failed: check ANTHROPIC_API_KEY"); send({ error: "offline" }); }
    else if (err instanceof Anthropic.APIError) { console.error("Anthropic API error", err.status, err.message); send({ error: "Something went wrong on our side. Please try again." }); }
    else if (err?.name !== "APIUserAbortError") { console.error(err); send({ error: "Something went wrong on our side. Please try again." }); }
  }
  res.end();
}

// --- static files ---
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain" };
function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  p = p.replace(/^\/lightingwarehouse/, ""); // same paths as demo.pixelcode.co.za/lightingwarehouse
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(here, p));
  if (!file.startsWith(here) || /\/(\.env|server\.js|package(-lock)?\.json|node_modules)/.test(file.slice(here.length))) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      const alt = file + ".html";
      if (fs.existsSync(alt)) { res.writeHead(200, { "content-type": TYPES[".html"] }); fs.createReadStream(alt).pipe(res); return; }
      res.writeHead(404, { "content-type": TYPES[".html"] });
      const nf = path.join(here, "404.html");
      if (fs.existsSync(nf)) fs.createReadStream(nf).on("error", () => res.end()).pipe(res); else res.end("<h1>Not found</h1>");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": /\.(json|png|jpg|webp)$/.test(file) ? "public, max-age=3600" : "no-cache" });
    fs.createReadStream(file).on("error", () => res.end()).pipe(res);
  });
}

http.createServer((req, res) => {
  const url = req.url.replace(/^\/lightingwarehouse/, "");
  if (req.method === "POST" && url.startsWith("/api/chat")) return void handleChat(req, res);
  if (req.method === "GET" && url.startsWith("/api/status")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ live: Boolean(client) })); return; }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`TLW demo on http://localhost:${PORT}  ·  AI assistant: ${client ? `live (${MODEL})` : "quick-answer mode (no ANTHROPIC_API_KEY)"}`);
});
