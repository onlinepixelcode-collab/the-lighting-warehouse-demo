# The Lighting Warehouse: premium demo site

A demo website for The Lighting Warehouse (TLW), built by Pixel Code. It's a static multi-page site with a small Node server for the AI assistant.

## Run it locally

```bash
npm install
npm start
```

Then open http://localhost:8080.

## TLW Light Assistant (AI chat)

- **Live AI mode:** copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The server streams answers from Claude (`claude-opus-5-5`, low effort, server-side refusal fallback turned on). Every answer is grounded in TLW's real catalogue: the site's search sends up to 18 matching product IDs, and the server looks those up in `assets/data/products.json` itself, so the model only ever sees real products, prices and specs. Store details, policies and contact numbers sit in the system prompt, which is cached.
- **Quick-answer mode:** with no key set, `/api/chat` returns 503 and the chat falls back to a built-in rules engine that answers from the same catalogue. It covers choosing lights, globes and fittings, fan sizing, load-shedding, stores and order tracking. The chat header shows which mode is active.
- A public demo is rate-limited to 20 messages per minute per IP (see `server.js`).
- Endpoint override: set `window.TLW_CHAT_ENDPOINT` before `chat.js` loads.

## Deploying to demo.pixelcode.co.za/lightingwarehouse

All links are relative, so the site works from a subfolder.
- **Node host:** run `npm start` behind your proxy. The server strips a leading `/lightingwarehouse` from paths.
- **Static-only host (cPanel etc.):** upload everything except `server.js`, `node_modules`, `.env` and `package*.json`. The chat runs in quick-answer mode. For live AI, host `server.js` anywhere that runs Node and point `window.TLW_CHAT_ENDPOINT` at it.

## Data and imagery

- `assets/data/products.json`: 800 real products (names, prices, SKUs, specs, image URLs) taken from TLW's public WooCommerce Store API in November 2026. Product images load from lightingwarehouse.co.za.
- `assets/js/data-static.js`: all 12 stores with addresses, managers, phones and hours, taken from lightingwarehouse.co.za/stores. **Map coordinates are approximate; check them before launch.**
- Logo: TLW's own logo file, unchanged (`assets/img/tlw-logo.png`).
- `assets/img/cutouts/`: real TLW product photos with the white studio background removed (Karbonell, Perla, Ginevra, Tomasso, Kehlani, G125 filament globe). These are the lamps in the hero, the pull-cord lamp and the preloader.
- `assets/img/hero-room.jpg` and `assets/img/rooms/*.jpg`: interior photographs from Unsplash (free licence). Hero room by Clay Banks. Room photos by Ariel Domenden, Jp Valery, Point3D Commercial Imaging, Peter Muniz, Bimbingan Islam, Akshat Jhingran, Val Vesa and Priscilla Du Preez. Swap them for TLW's own shoots before launch if you have them.
- Reviews on the home page are marked as demo content. TLW's public review feed was empty, so connect live Google reviews at launch.

## Structure

```
index.html            home (day-to-night hero, all sections)
shop / range / product / compare / checkout / track / account / stores / story /
inspiration / planner / tools / trade / promotions / contact / privacy / 404 .html
assets/css/tlw.css    design system (tokens, components, light/dark themes)
assets/js/core.js     shared shell: header, mega menu, pull-cord lamp theme switch,
                      torch cursor, bag, wishlist, compare, smart search, toasts
assets/js/chat.js     TLW Light Assistant
server.js             static server + /api/chat (Anthropic SDK)
```
