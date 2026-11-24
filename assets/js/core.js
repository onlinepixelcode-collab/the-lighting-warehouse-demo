/* ==========================================================================
   TLW core — shared on every page
   header/footer, pull-cord lamp theme switch, torch cursor, bag, wishlist,
   compare, smart search, toasts, preloader, transitions, sound, analytics
   ========================================================================== */
(function () {
  "use strict";
  const D = window.TLW_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const reduced = () => html.classList.contains("reduce") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "R" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const moneyShort = (n) => "R" + Math.round(n).toLocaleString("en-US");
  const qs = (k) => new URLSearchParams(location.search).get(k);

  /* ---------------- icons ---------------- */
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 4 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4 20 4 22.4 7.2 21.2 10.6 19.5 15.4 12 20 12 20Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path class="w" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 5 6m0-6-5 6"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h16M4 16h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 11 9-7 9 7v9H3z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.8c-1.4.1-2.6-.3-3.9-1.1v5.3c0 6.6-7.2 8.7-10.1 4-1.9-3-.7-8.3 5.3-8.5v3c-.5.1-1 .2-1.4.4-1.4.5-2.1 1.3-1.9 2.8.4 2.9 5.8 3.8 5.3-1.9V3h2.8Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/><path d="M12 7v3l1.5 1.5"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 4v16M16 4v16M4 8h8M12 16h8"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ---------------- analytics ---------------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, data) { window.dataLayer.push(Object.assign({ event }, data || {})); }

  /* ---------------- products ---------------- */
  let PRODUCTS = [], BYID = {}, loaded = false; const waiters = [];
  function ready(cb) { loaded ? cb(PRODUCTS) : waiters.push(cb); }
  function loadProducts() {
    return fetch("assets/data/products.json").then((r) => r.json()).then((list) => {
      PRODUCTS = list; list.forEach((p) => { BYID[p.id] = p; p._s = (p.n + " " + p.c.join(" ") + " " + (p.sp.Colour || "") + " " + (p.sp.Material || "")).toLowerCase(); });
      loaded = true; waiters.splice(0).forEach((cb) => cb(PRODUCTS));
    }).catch((e) => { console.warn("Products failed to load", e); loaded = true; waiters.splice(0).forEach((cb) => cb([])); });
  }
  const get = (id) => BYID[id];
  const find = (q) => PRODUCTS.find((p) => p.n.toLowerCase().includes(q.toLowerCase()));
  const findAll = (q, n) => PRODUCTS.filter((p) => p.n.toLowerCase().includes(q.toLowerCase())).slice(0, n || 99);
  const inCat = (cat, n) => PRODUCTS.filter((p) => p.c.some((c) => c.toLowerCase() === cat.toLowerCase())).slice(0, n || 999);
  const img = (p, i) => (p && p.i && (p.i[i || 0] || p.i[0])) || "";
  const thumb = (u) => u ? u.replace(/\.(jpg|jpeg|png)$/i, "-300x300.$1") : u;
  const isSale = (p) => p.r > p.p;
  const rangeOf = (p) => p.rg || (p.c[1] || p.c[0] || "");
  const pUrl = (p) => "product.html?id=" + p.id;

  /* ---------------- smart search (natural language, typo tolerant) ---------------- */
  const CAT_WORDS = [
    [/pendant|hanging/, ["pendant"]], [/chandelier/, ["chandelier"]], [/\bfans?\b|ceiling fan/, ["fan"]],
    [/globe|bulb|lamp globe/, ["globe"]], [/flood ?light/, ["flood"]], [/table lamp/, ["table lamp"]], [/floor lamp|standing lamp/, ["floor lamp"]],
    [/down ?light|panel/, ["panel", "down light"]], [/spot ?light|track/, ["spot"]], [/strip/, ["strip"]], [/switch/, ["switch"]], [/plug|socket|multi/, ["plug"]],
    [/lantern/, ["lantern"]], [/bathroom/, ["bathroom"]], [/ceiling light/, ["ceiling light"]], [/wall light|sconce/, ["wall light"]], [/desk lamp/, ["desk"]],
    [/bollard/, ["bollard"]], [/pole/, ["pole"]], [/gu10/, ["gu10"]]
  ];
  const COLOURS = ["black", "white", "brass", "gold", "chrome", "wood", "copper", "grey", "bronze", "silver", "glass", "rattan", "nickel", "antique"];
  let VOCAB = null;
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; } for (let j = 0; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function fix(tok) {
    if (!VOCAB) { VOCAB = new Set(); PRODUCTS.forEach((p) => p._s.split(/[^a-z0-9]+/).forEach((w) => w.length > 2 && VOCAB.add(w))); }
    if (tok.length < 4 || VOCAB.has(tok)) return tok;
    let best = tok, bd = tok.length > 6 ? 2 : 1;
    VOCAB.forEach((w) => { if (w[0] !== tok[0]) return; const d = lev(tok, w); if (d < bd || (d === bd && best === tok)) { bd = d; best = w; } });
    return best;
  }
  function parseQuery(q) {
    const s = " " + q.toLowerCase().replace(/[,]/g, "") + " ";
    const f = { max: null, min: null, cats: [], colours: [], outdoor: false, indoor: false, ls: false, solar: false, dim: false, led: false, warm: false, day: false, terms: [] };
    let m;
    if ((m = s.match(/between\s*r?\s*(\d+)\s*(?:and|-|to)\s*r?\s*(\d+)/))) { f.min = +m[1]; f.max = +m[2]; }
    if ((m = s.match(/(?:under|below|less than|max|cheaper than|up to|<)\s*r?\s*(\d+)\s*(k)?/))) f.max = +m[1] * (m[2] ? 1000 : 1);
    if ((m = s.match(/(?:over|above|more than|from|>)\s*r?\s*(\d+)\s*(k)?/)) && !/between/.test(s)) f.min = +m[1] * (m[2] ? 1000 : 1);
    if (/load ?shedding|loadshed|power cut|outage|emergency|rechargeable|backup|eskom|grid/.test(s)) f.ls = true;
    if (/solar/.test(s)) f.solar = true;
    if (/outdoor|outside|garden|patio|exterior|wall outside|stoep/.test(s)) f.outdoor = true;
    if (/indoor|inside|lounge|bedroom|kitchen|dining/.test(s)) f.indoor = true;
    if (/dimmable|dimmer/.test(s)) f.dim = true;
    if (/warm white|warm light|2700|3000k|cosy|cozy/.test(s)) f.warm = true;
    if (/daylight|cool white|6500|bright white/.test(s)) f.day = true;
    CAT_WORDS.forEach(([re, words]) => { if (re.test(s)) f.cats.push(...words); });
    COLOURS.forEach((c) => { if (new RegExp("\\b" + c).test(s)) f.colours.push(c === "gold" ? "gold" : c); });
    const stop = /^(a|an|the|for|my|i|need|want|looking|light|lights|lighting|that|works|work|during|with|and|or|under|below|over|above|less|than|more|from|to|r\d+|\d+k?|in|on|of|me|some|show|find|cheap|best|new|please|something|is|it|can|which|what|room)$/;
    f.terms = s.replace(/r?\d+k?/g, " ").split(/[^a-z0-9]+/).filter((w) => w && !stop.test(w) && !COLOURS.includes(w)).map(fix);
    return f;
  }
  function search(q, limit) {
    const f = parseQuery(q || "");
    let res = PRODUCTS.filter((p) => {
      if (f.max != null && p.p > f.max) return false;
      if (f.min != null && p.p < f.min) return false;
      if (f.outdoor && p.t !== "outdoor" && !/outdoor|solar|flood/i.test(p._s)) return false;
      if (f.ls && !(/loadshedding|emergency|rechargeable|solar/.test(p._s))) return false;
      if (f.solar && !/solar/.test(p._s)) return false;
      if (f.dim && !/dimmable/.test(p._s)) return false;
      if (f.colours.length && !f.colours.some((c) => p._s.includes(c))) return false;
      if (f.cats.length && !f.cats.some((c) => p._s.includes(c))) return false;
      return true;
    }).map((p) => {
      let sc = 0; f.terms.forEach((t) => { if (p.n.toLowerCase().includes(t)) sc += 3; else if (p._s.includes(t)) sc += 1; });
      if (f.warm && /warm/.test(p._s)) sc += 2; if (f.day && /daylight/.test(p._s)) sc += 2;
      if (p.st) sc += .5; return { p, sc };
    });
    const hasStructure = f.max || f.min || f.cats.length || f.colours.length || f.outdoor || f.ls || f.solar || f.dim;
    if (f.terms.length && !hasStructure) res = res.filter((r) => r.sc >= 1);
    else if (f.terms.length) { const strong = res.filter((r) => r.sc >= 1); if (strong.length) res = strong; }
    res.sort((a, b) => b.sc - a.sc || a.p.p - b.p.p);
    return { items: res.slice(0, limit || 24).map((r) => r.p), total: res.length, parsed: f };
  }
  function parsedChips(f) {
    const c = [];
    if (f.cats.length) c.push(f.cats[0]); f.colours.forEach((x) => c.push(x));
    if (f.outdoor) c.push("outdoor"); if (f.ls) c.push("load-shedding ready"); if (f.solar) c.push("solar"); if (f.dim) c.push("dimmable");
    if (f.warm) c.push("warm white"); if (f.day) c.push("daylight");
    if (f.max) c.push("under " + moneyShort(f.max)); if (f.min) c.push("from " + moneyShort(f.min));
    return c;
  }

  /* ---------------- product card ---------------- */
  function card(p, opts) {
    opts = opts || {};
    const alt = p.i[1] ? `<img class="alt has" src="${esc(p.i[1])}" alt="" loading="lazy">` : "";
    const wished = wish.has(p.id);
    const badges = (isSale(p) ? `<span class="tag">−${Math.round((1 - p.p / p.r) * 100)}%</span>` : "") + (p.ls && p.ls <= 5 ? `<span class="tag dark">Only ${p.ls} left</span>` : "");
    const stock = p.st ? `<span class="stock in">In stock</span>` : `<span class="stock out">Out of stock</span>`;
    return `<article class="pcard" data-id="${p.id}">
      <div class="frame">
        <a href="${pUrl(p)}" class="stage" aria-label="${esc(p.n)}" data-cursor="VIEW">
          <span class="pool" aria-hidden="true"></span>
          <img class="main ${p.i[1] ? "swap" : ""}" src="${esc(p.i[0])}" alt="${esc(p.n)}" loading="lazy">${alt}
          <span class="floor" aria-hidden="true"></span>
        </a>
        ${badges ? `<div class="tags">${badges}</div>` : ""}
        <button class="wishbtn ${wished ? "on" : ""}" data-wish="${p.id}" aria-label="Add ${esc(p.n)} to wishlist" aria-pressed="${wished}">${I.heart}</button>
        <div class="acts">
          <button class="add" data-quick="${p.id}" ${p.st ? "" : "disabled"}>${I.bag}<span>${p.st ? "Add to bag" : "Sold out"}</span></button>
          <button class="ic" data-compare="${p.id}" aria-label="Compare ${esc(p.n)}">${I.compare}</button>
        </div>
      </div>
      <div class="meta">
        <div class="meta-top"><span class="sub">${esc(opts.sub || rangeOf(p))}</span>${stock}</div>
        <h4><a href="${pUrl(p)}">${esc(p.n)}</a></h4>
        <div class="meta-price"><span class="price">${money(p.p)}${isSale(p) ? `<s>${money(p.r)}</s>` : ""}</span>${p.rc ? `<span class="stars">★ ${p.ra.toFixed(1)}</span>` : ""}</div>
        <span class="pf">or 4 × ${money(p.p / 4)} with Payflex</span>
      </div>
    </article>`;
  }


  /* ---------------- bag / wishlist / compare / recently viewed ---------------- */
  const bag = {
    items: store.get("tlw-bag", []),
    save() { store.set("tlw-bag", this.items); renderBag(); },
    count() { return this.items.reduce((a, b) => a + b.q, 0); },
    subtotal() { return this.items.reduce((a, b) => { const p = get(b.id); return a + (p ? p.p * b.q : 0); }, 0); },
    add(id, q, fromEl) {
      id = +id; const p = get(id); if (!p) return;
      const it = this.items.find((x) => x.id === id); it ? (it.q += q || 1) : this.items.push({ id, q: q || 1 });
      this.save(); flyToBag(p, fromEl); sound.click(); track("add_to_cart", { id, name: p.n, price: p.p, qty: q || 1 });
      toast(`<img src="${esc(thumb(img(p)))}" alt=""> <span><b>${esc(p.n)}</b><br>added to your bag</span>`);
    },
    setQ(id, q) { const it = this.items.find((x) => x.id === +id); if (!it) return; it.q = Math.max(0, q); if (!it.q) this.items = this.items.filter((x) => x !== it); this.save(); },
    clear() { this.items = []; this.save(); }
  };
  const wish = {
    ids: new Set(store.get("tlw-wish", [])),
    has(id) { return this.ids.has(+id); },
    toggle(id) { id = +id; this.has(id) ? this.ids.delete(id) : this.ids.add(id); store.set("tlw-wish", [...this.ids]); updateBadges(); $$(`[data-wish="${id}"]`).forEach((b) => { b.classList.toggle("on", this.has(id)); b.setAttribute("aria-pressed", this.has(id)); }); const p = get(id); if (p && this.has(id)) toast(`<span>♡ <b>${esc(p.n)}</b> saved to your wishlist</span>`); }
  };
  const compare = {
    ids: store.get("tlw-compare", []),
    toggle(id) { id = +id; const p = get(id); if (this.ids.includes(id)) this.ids = this.ids.filter((x) => x !== id); else { if (this.ids.length >= 4) this.ids.shift(); this.ids.push(id); } store.set("tlw-compare", this.ids); if (p) toast(`<span>${this.ids.includes(id) ? "Added to" : "Removed from"} compare (${this.ids.length}/4) · <a href="compare.html" style="color:var(--amber)">View</a></span>`); }
  };
  const recent = {
    ids: store.get("tlw-recent", []),
    push(id) { this.ids = [+id, ...this.ids.filter((x) => x !== +id)].slice(0, 8); store.set("tlw-recent", this.ids); },
    // styles a customer keeps viewing, for "Recommended for you"
    profile() { const c = {}; this.ids.forEach((id) => { const p = get(id); if (p) p.c.forEach((x) => c[x] = (c[x] || 0) + 1); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map((x) => x[0]); }
  };

  /* ---------------- shell markup ---------------- */
  const NAV = [
    ["indoor", "Indoor"], ["outdoor", "Outdoor"], ["fans", "Fans"], ["globes", "Globes"], ["switches", "Switches & Plugs"], ["ranges", "Ranges"], ["inspiration", "Inspiration"], ["contact", "Contact"], ["sale", "Sale"]
  ];
  const MEGA = {
    indoor: [["Pendants · Glass", "Glass Pendants"], ["Pendants · Modern", "Modern Pendants"], ["Pendants · Industrial", "Industrial Pendants"], ["Pendants · Natural", "Natural Pendants"], ["Pendants · Luxe", "Luxe Pendants"], ["Chandeliers", "Chandeliers"], ["Ceiling Lights", "Ceiling Lighting"], ["Wall Lights", "Indoor Wall Lighting"], ["Spotlights", "Spotlights"], ["Floor Lamps", "Floor Lamps"], ["Table Lamps", "Table Lamps"], ["Bathroom Lighting", "Bathroom Lighting"], ["LED Panels & Downlights", "LED Panels and Down Lights"], ["Linear Lighting", "LED Linear Lighting"]],
    outdoor: [["Wall Lights", "Outdoor Modern Wall Lights"], ["Solar Lighting", "Solar Lighting"], ["Solar & Motion Sensor", "Solar Motion Sensors"], ["Floodlights", "LED Flood Lights"], ["Pole Lights", "Outdoor Pole Lighting"], ["Baskets & Spheres", "Baskets &amp; Sphere Lighting"], ["Lanterns", "Outdoor Wall Glass Box Light"], ["Flat Mask Lights", "Outdoor Wall Flat Mask Light"]],
    fans: [["Fans with Light", "Fans with Lights"], ["Fans without Light", "Fans without Lights"], ["Wall & Standing Fans", "Wall and Standing Fans"]],
    globes: [["LED Decorative Filament", "LED Decorative Filament Globes"], ["LED Globes", "LED Globes"], ["Value Packs", "Globe Packs"], ["Load-Shedding", "Loadshedding Globes"], ["LED Strip Lights", "LED Strip Lights"], ["GU10", "GU10"]],
    switches: [["Veti", "Veti 3"], ["Legrand Ysalis", "Legrand Ysalis"], ["Legrand Arteor", "Legrand Arteor"], ["Lesco", "Lesco"], ["Qwikswitch", "Qwikswitch"], ["Multi-plugs", "Multi Plugs"]],
    ranges: [["Sussurro", "r:Sussurro"], ["Svolta", "r:Svolta"], ["Trinity", "r:Trinity"], ["Trax", "r:Trax"], ["Fabrica", "r:Fabrica"], ["Marzio", "r:Marzio"], ["Riviera", "r:Riviera"], ["Europa", "r:Europa"], ["Mistral", "r:Mistral"], ["Phantom", "r:Phantom"], ["Phoenix", "r:Phoenix"], ["Belmont", "r:Belmont"]]
  };
  const FEATURE = { indoor: "Penna 10 Light", outdoor: "Belmont Black Outdoor Wall Lantern", fans: "Sussurro Led 3 Blade Black", globes: "St64 Led Decorative Filament", switches: "Legrand", ranges: "Fabrica 4 Light" };
  function megaHref(cat, v) { return v.startsWith("r:") ? `range.html?r=${encodeURIComponent(v.slice(2))}` : `shop.html?cat=${cat}&sub=${encodeURIComponent(v)}`; }
  function navHref(k) { return k === "ranges" ? "range.html" : k === "inspiration" ? "inspiration.html" : k === "contact" ? "contact.html" : k === "sale" ? "promotions.html" : `shop.html?cat=${k}`; }

  function shell() {
    const page = document.body.dataset.page || "";
    const bf = new Date(D.blackFriday);
    const annItems = [
      `FREE delivery on orders over R500 nationwide`,
      `Black Friday Sale ${Date.now() < bf ? `in <span class="cd" data-countdown></span>` : "is ON"} · <a href="promotions.html">Preview the deals</a>`,
      `Summer Ceiling Fan Sale now on · <a href="shop.html?cat=fans">Shop fans</a>`,
      `12 showrooms across Gauteng &amp; KZN · <a href="stores.html">Find your nearest</a>`,
      `Pay with card, EFT or Payflex · 4 interest-free payments`,
      `WhatsApp us: <a href="${D.waHref}" target="_blank" rel="noopener">${D.whatsapp}</a>`
    ];
    const annRun = annItems.map((t) => `<span class="ann-item">${t}</span><i class="ann-sep">✦</i>`).join("");
    // infinite ticker: the run is repeated so the loop is seamless; the copy is hidden from screen readers
    const ann = `<div class="announce" role="region" aria-label="Announcements"><div class="ann-track"><div class="ann-run">${annRun}</div><div class="ann-run" aria-hidden="true">${annRun}</div></div></div>`;
    const nav = NAV.map(([k, l]) => `<${MEGA[k] ? "button" : "a"} ${MEGA[k] ? `data-mega="${k}" aria-expanded="false" aria-controls="mega"` : `href="${navHref(k)}"`} class="${k === "sale" ? "sale" : ""} ${page === k ? "on" : ""}">${l}</${MEGA[k] ? "button" : "a"}>`).join("");
    const header = `<header class="header" id="hdr"><div class="wrap header-in">
      <a href="index.html" class="logo" aria-label="The Lighting Warehouse home"><img src="assets/img/tlw-logo-transparent.png" alt="The Lighting Warehouse — Learn what light can do" width="1056" height="992"></a>
      <nav class="nav" aria-label="Main">${nav}</nav>
      <div class="tools">
        <button class="icon-btn" data-open="search" aria-label="AI search">${I.search}</button>
        <a class="icon-btn hide-m" href="stores.html" aria-label="Find a store" data-ev="store_nav">${I.pin}</a>
        <a class="icon-btn hide-m" href="account.html#wishlist" aria-label="Wishlist">${I.heart}<span class="badge" data-badge="wish"></span></a>
        <a class="icon-btn hide-m" href="account.html" aria-label="My account">${I.user}</a>
        <button class="icon-btn" data-open="bag" aria-label="Bag" id="bagBtn">${I.bag}<span class="badge" data-badge="bag"></span></button>
        <button class="icon-btn burger" data-open="menu" aria-label="Menu">${I.burger}</button>
      </div></div></header>
      <div class="mega" id="mega" role="region" aria-label="Menu"></div>`;
    const MM_CATS = ["indoor", "outdoor", "fans", "globes", "switches", "ranges"];
    const mobile = `<div class="mmenu" id="mmenu" aria-hidden="true" role="dialog" aria-label="Menu">
      <div class="mm-glow" aria-hidden="true"></div>
      <div class="mmenu-top"><a href="index.html" class="logo"><img src="assets/img/tlw-logo-transparent.png" alt="The Lighting Warehouse"></a><div class="flex"><button class="icon-btn" data-theme-toggle aria-label="Lights on / off">${I.bulb}</button><button class="icon-btn mm-x" data-close aria-label="Close menu">${I.close}</button></div></div>
      <div class="mm-body">
        <button class="mm-search mm-i" style="--i:0" data-open="search">${I.search}<span>Search 800+ lights…</span></button>
        <div class="mm-quick mm-i" style="--i:1">
          <a href="stores.html">${I.pin}<span>Stores</span></a>
          <a href="track.html">${I.bag}<span>Track order</span></a>
          <button data-open="chat">${I.spark}<span>AI assistant</span></button>
          <a href="${D.phoneHref}">${I.user}<span>Call us</span></a>
        </div>
        <span class="mm-label mm-i" style="--i:2">Shop</span>
        <nav class="mm-cats" aria-label="Shop categories">
          ${MM_CATS.map((k, i) => `<details class="mm-i" style="--i:${i + 3}"><summary><span class="mm-n">0${i + 1}</span><span class="mm-th" data-mm-thumb="${k}"></span><span class="mm-t">${NAV.find((n) => n[0] === k)[1]}</span><span class="mm-c" data-mm-count="${k}"></span></summary>
            <div class="sub">${MEGA[k].map(([l, v]) => `<a href="${megaHref(k, v)}">${l}</a>`).join("")}<a class="all" href="${navHref(k)}">View all ${NAV.find((n) => n[0] === k)[1]} →</a></div></details>`).join("")}
        </nav>
        <a class="mm-sale mm-i" style="--i:9" href="promotions.html"><span>Black Friday &amp; Summer Fan Sale</span><b>Shop the sale →</b></a>
        <span class="mm-label mm-i" style="--i:10">Explore</span>
        <div class="mm-links mm-i" style="--i:11">
          <a href="planner.html">Plan my lighting</a><a href="inspiration.html">Inspiration</a><a href="tools.html">Lighting tools</a><a href="story.html">Our story</a><a href="trade.html">Trade portal</a><a href="account.html">My account</a><a href="account.html#wishlist">Wishlist</a><a href="contact.html">Contact &amp; help</a>
        </div>
        <div class="mm-foot mm-i" style="--i:12">
          <a href="${D.phoneHref}">${D.phone}</a><a href="mailto:${D.email}">${D.email}</a>
          <div class="socials"><a href="https://www.instagram.com/lightingwarehouse/" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a><a href="https://www.facebook.com/TLWSouthAfrica/" target="_blank" rel="noopener" aria-label="Facebook">${I.fb}</a></div>
        </div>
      </div>
    </div>`;
    const bnav = `<nav class="bnav" aria-label="Quick">
      <a href="index.html">${I.home}<span>Home</span></a><a href="shop.html">${I.grid}<span>Shop</span></a>
      <button class="ai" data-open="chat">${I.spark}<span>AI Assistant</span></button>
      <a href="stores.html">${I.pin}<span>Stores</span></a><button data-open="bag">${I.bag}<span>Bag</span><span class="badge" data-badge="bag" style="right:22%"></span></button></nav>`;
    const fl = `<div class="floaters">
      <button class="fab ai" data-open="chat" aria-label="Open the TLW Light Assistant" data-cursor="ASK">${I.spark}</button></div>`;
    const drawers = `<div class="scrim" id="scrim"></div>
      <aside class="drawer" id="bag" aria-label="Your bag" aria-hidden="true"><div class="drawer-h"><h3>Your bag</h3><button class="icon-btn" data-close aria-label="Close bag">${I.close}</button></div><div class="drawer-b" id="bagBody"></div><div class="drawer-f" id="bagFoot"></div></aside>
      <div class="search-ov" id="search" role="dialog" aria-modal="true" aria-label="Search"><div class="search-in">
        <div class="row-b" style="margin-bottom:28px"><span class="eyebrow">AI smart search</span><button class="icon-btn" data-close aria-label="Close search">${I.close}</button></div>
        <div class="search-field">${I.search.replace("<svg", '<svg width="34" height="34" style="color:var(--gold);flex:none"')}<input id="sq" type="search" placeholder="Try “black outdoor light for load shedding under R800”" autocomplete="off" aria-label="Search products">
        <button class="icon-btn" id="voiceBtn" aria-label="Voice search">${I.mic}</button><label class="icon-btn" aria-label="Search by image" style="cursor:pointer">${I.camera}<input type="file" accept="image/*" id="imgSearch" hidden></label></div>
        <div class="search-hints">${["Brass pendant for dining room", "Solar garden lights", "E27 warm white filament", "Ceiling fan with light under R5000", "Black outdoor wall light", "Rechargeable load-shedding globe"].map((h) => `<button class="chip" data-q="${h}">${h}</button>`).join("")}</div>
        <div id="sOut"></div></div></div>
      <div class="toasts" id="toasts" aria-live="polite"></div>
      <div class="cursor hidden" id="cursor" aria-hidden="true"><div class="ring"><span></span></div><div class="dot"></div></div>
      <div class="torch" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
      <div class="rv-tray" id="rvTray" aria-label="Recently viewed"></div>`;
    // showroom slider: an endless row of store tabs fixed to the top edge of the footer (not on the stores page, which lists them already)
    const storeTab = (st) => `<a class="fs-tab" href="stores.html#${st.id}" data-store-tab="${st.id}"><span class="fs-dot"></span><span class="fs-name">${esc(st.name)}${st.isNew ? ' <i>New</i>' : ""}</span><span class="fs-region">${esc(st.region)}</span><span class="fs-phone">${esc(st.phone)}</span></a>`;
    const storeRun = D.stores.map(storeTab).join("");
    const storeSlider = document.body.dataset.page === "stores" ? "" : `<div class="f-showrooms" aria-label="Our showrooms"><span class="fs-label">Visit a<br>showroom</span><div class="fs-viewport"><div class="fs-track"><div class="fs-run">${storeRun}</div><div class="fs-run" aria-hidden="true">${storeRun}</div></div></div></div>`;
    const footer = `<footer class="footer">${storeSlider}
      <div class="wrap">
        <div class="f-top">
          <div class="f-brand">
            <a href="index.html" class="f-logo" aria-label="The Lighting Warehouse home"><img src="assets/img/tlw-logo-transparent.png" alt="The Lighting Warehouse"></a>
            <p class="f-claim">Learn what <em>light</em> can do.</p>
            <p class="f-about">South Africa's leading independent lighting retailer. A family business, lighting homes since 1974.</p>
            <div class="socials"><a href="https://www.instagram.com/lightingwarehouse/" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a><a href="https://www.facebook.com/TLWSouthAfrica/" target="_blank" rel="noopener" aria-label="Facebook">${I.fb}</a><a href="https://www.tiktok.com/" target="_blank" rel="noopener" aria-label="TikTok">${I.tt}</a><a href="https://x.com/" target="_blank" rel="noopener" aria-label="X">${I.x}</a></div>
          </div>
          <nav class="f-cols" aria-label="Footer">
            <div><h5>Shop</h5><a href="shop.html?cat=indoor">Indoor</a><a href="shop.html?cat=outdoor">Outdoor</a><a href="shop.html?cat=fans">Fans</a><a href="shop.html?cat=globes">Globes</a><a href="shop.html?cat=switches">Switches &amp; Plugs</a><a href="range.html">Ranges</a><a href="promotions.html" class="f-sale">Sale</a></div>
            <div><h5>Help</h5><a href="track.html">Track order</a><a href="contact.html#delivery">Delivery</a><a href="contact.html#returns">Returns</a><a href="contact.html#faq">FAQ</a><a href="contact.html">Contact us</a></div>
            <div><h5>Company</h5><a href="story.html">Our story</a><a href="stores.html">Stores</a><a href="trade.html">Trade portal</a><a href="inspiration.html">Inspiration</a><a href="planner.html">Plan my lighting</a><a href="tools.html">Lighting tools</a></div>
            <div class="f-contact"><h5>Talk to us</h5><a href="${D.phoneHref}"><small>Call</small>${D.phone}</a><a href="${D.waHref}" target="_blank" rel="noopener"><small>WhatsApp</small>${D.whatsapp}</a><a href="mailto:${D.email}"><small>Email</small>${D.email}</a></div>
          </nav>
        </div>
        <div class="f-pay"><h5>Pay securely with</h5><div class="pay-viewport"><div class="pay-track"><div class="pays" aria-label="Payment methods we accept"><span><img src="assets/img/pay/visa.svg" alt="Visa" loading="lazy"></span><span><img src="assets/img/pay/mastercard.svg" alt="Mastercard" loading="lazy"></span><span><img src="assets/img/pay/amex-logo.svg" alt="American Express" loading="lazy"></span><span><img src="assets/img/pay/diners.svg" alt="Diners Club" loading="lazy"></span><span><img src="assets/img/pay/payflex.svg" alt="Payflex" loading="lazy"></span><span><img src="assets/img/pay/ozow.png" alt="Ozow instant EFT" loading="lazy"></span><span><img src="assets/img/pay/snapscan.svg" alt="SnapScan" loading="lazy"></span><span><img src="assets/img/pay/zapper.png" alt="Zapper" loading="lazy"></span><span><img src="assets/img/pay/mobicred.png" alt="Mobicred" loading="lazy"></span><span><img src="assets/img/pay/peach.svg" alt="Peach Payments" loading="lazy"></span></div><div class="pays pays-dup" aria-hidden="true"><span><img src="assets/img/pay/visa.svg" alt="Visa" loading="lazy"></span><span><img src="assets/img/pay/mastercard.svg" alt="Mastercard" loading="lazy"></span><span><img src="assets/img/pay/amex-logo.svg" alt="American Express" loading="lazy"></span><span><img src="assets/img/pay/diners.svg" alt="Diners Club" loading="lazy"></span><span><img src="assets/img/pay/payflex.svg" alt="Payflex" loading="lazy"></span><span><img src="assets/img/pay/ozow.png" alt="Ozow instant EFT" loading="lazy"></span><span><img src="assets/img/pay/snapscan.svg" alt="SnapScan" loading="lazy"></span><span><img src="assets/img/pay/zapper.png" alt="Zapper" loading="lazy"></span><span><img src="assets/img/pay/mobicred.png" alt="Mobicred" loading="lazy"></span><span><img src="assets/img/pay/peach.svg" alt="Peach Payments" loading="lazy"></span></div></div></div></div>
        <div class="f-bottom">
          <span>© ${new Date().getFullYear()} The Lighting Warehouse. All rights reserved.</span>
          <span class="f-legal"><a href="privacy.html">Privacy &amp; cookies</a><a href="contact.html#delivery">Delivery</a><a href="contact.html#returns">Returns</a></span>
          <span class="madeby">Made with <svg class="heart" viewBox="0 0 24 24" aria-label="love" role="img"><path d="M12 21s-7.8-4.8-9.6-9.8C1.2 7.6 3.7 4 7.2 4c2.1 0 3.7 1.1 4.8 2.8C13.1 5.1 14.7 4 16.8 4c3.5 0 6 3.6 4.8 7.2C19.8 16.2 12 21 12 21Z"/></svg> by <a href="https://pixelcode.co.za" target="_blank" rel="noopener">Pixel Code</a></span>
        </div>
      </div>
      <div class="word" aria-hidden="true">THE LIGHTING WAREHOUSE</div>
    </footer>`;
    const cookie = `<div class="cookie" id="cookie" role="dialog" aria-label="Cookie consent"><b>A little light housekeeping</b>We use essential cookies to run your bag and checkout, and optional analytics cookies to improve the site, in line with POPIA. <a href="privacy.html" style="color:var(--amber)">Privacy policy</a>
      <div class="row-b"><button class="btn sm" data-cookie="all">Accept all</button><button class="btn sm ghost" data-cookie="essential">Essential only</button></div></div>
`;

    document.body.insertAdjacentHTML("afterbegin", `<a class="skip" href="#main">Skip to content</a>` + ann + header);
    document.body.insertAdjacentHTML("beforeend", footer + mobile + bnav + fl + drawers + cookie + `<div class="curtain on" id="curtain"></div>`);
  }

  /* ---------------- mega menu ---------------- */
  function initMega() {
    const mega = $("#mega"); let open = null, t;
    const show = (k, btn) => {
      clearTimeout(t); if (open === k) return; open = k;
      $$("[data-mega]").forEach((b) => b.setAttribute("aria-expanded", b === btn));
      const hdr = $("#hdr").getBoundingClientRect(); mega.style.setProperty("--mega-top", hdr.bottom + "px");
      ready(() => {
        const fp = find(FEATURE[k]) || PRODUCTS[0];
        mega.innerHTML = `<div class="mega-in"><div><h4>${NAV.find((n) => n[0] === k)[1]}</h4><div class="mega-links">${MEGA[k].map(([l, v]) => `<a href="${megaHref(k, v)}">${l}</a>`).join("")}<a href="${navHref(k)}" style="color:var(--amber)">View all →</a></div>
          <div class="flex mt-m"><span class="eyebrow no-line">Shop by room</span>${D.rooms.slice(0, 5).map((r) => `<a class="chip" href="shop.html?room=${r.id}">${r.name}</a>`).join("")}</div></div>
          ${fp ? `<a class="mega-feature" href="${pUrl(fp)}"><img src="${esc(img(fp))}" alt="${esc(fp.n)}"><span class="cap">Featured · ${esc(fp.n)} · ${money(fp.p)}</span></a>` : "<div></div>"}
          <div class="mega-promo"><span class="eyebrow">Black Friday</span><strong>Up to 40% off. Doors open Friday 27 November.</strong><a class="link-u" href="promotions.html">Preview the deals ${I.arrow}</a></div></div>`;
      });
      mega.classList.add("open");
    };
    const hide = () => { t = setTimeout(() => { open = null; mega.classList.remove("open"); $$("[data-mega]").forEach((b) => b.setAttribute("aria-expanded", "false")); }, 160); };
    $$("[data-mega]").forEach((b) => {
      b.addEventListener("mouseenter", () => show(b.dataset.mega, b));
      b.addEventListener("mouseleave", hide);
      b.addEventListener("click", () => open === b.dataset.mega ? (location.href = navHref(b.dataset.mega)) : show(b.dataset.mega, b));
      b.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { show(b.dataset.mega, b); setTimeout(() => { const a = mega.querySelector("a"); a && a.focus(); }, 60); } });
    });
    mega.addEventListener("mouseenter", () => clearTimeout(t)); mega.addEventListener("mouseleave", hide);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { open = null; mega.classList.remove("open"); } });
  }

  /* ---------------- mobile menu: real product thumbnails + counts ---------------- */
  let menuFilled = false;
  function fillMenu() {
    if (menuFilled) return;
    ready((P) => {
      menuFilled = true;
      Object.keys(FEATURE).forEach((k) => {
        const fp = find(FEATURE[k]) || P.find((p) => p.t === k); const th = $(`[data-mm-thumb="${k}"]`);
        if (fp && th) th.innerHTML = `<img src="${esc(thumb(img(fp)))}" alt="">`;
        const n = k === "ranges" ? new Set(P.map((p) => p.rg).filter(Boolean)).size : P.filter((p) => p.t === k).length;
        const c = $(`[data-mm-count="${k}"]`); if (c) c.textContent = k === "ranges" ? n + " ranges" : n;
      });
    });
  }

  /* ---------------- overlays ---------------- */
  const OV = { bag: "#bag", search: "#search", menu: "#mmenu" };
  let current = null, lastFocus = null;
  function openOv(k) {
    if (k === "chat") { closeOv(); window.TLWChat ? window.TLWChat.open() : null; return; }
    if (k === "menu") fillMenu();
    closeOv(); const el = $(OV[k]); if (!el) return; current = k; lastFocus = document.activeElement;
    el.classList.add("open"); el.setAttribute("aria-hidden", "false");
    if (k === "bag") { $("#scrim").classList.add("on"); renderBag(); }
    if (k === "search") setTimeout(() => $("#sq").focus(), 80);
    lenis && lenis.stop();
  }
  function closeOv() {
    if (!current) return; const el = $(OV[current]); el.classList.remove("open"); el.setAttribute("aria-hidden", "true");
    $("#scrim").classList.remove("on"); current = null; lenis && lenis.start(); lastFocus && lastFocus.focus && lastFocus.focus();
  }

  /* ---------------- bag rendering ---------------- */
  function renderBag() {
    updateBadges(); const body = $("#bagBody"), foot = $("#bagFoot"); if (!body) return;
    if (!bag.items.length) {
      body.innerHTML = `<div class="empty"><svg class="bulb-off" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/></svg><h3 class="h3">Your bag is in the dark.</h3><p class="mt-s">Let's light it up.</p><a href="shop.html" class="btn mt-s">Start shopping ${I.arrow}</a></div>`;
      foot.innerHTML = ""; return;
    }
    ready(() => {
      body.innerHTML = bag.items.map((it) => { const p = get(it.id); if (!p) return ""; return `<div class="bag-item"><a class="th" href="${pUrl(p)}"><img src="${esc(thumb(img(p)))}" alt=""></a>
        <div><h5>${esc(p.n)}</h5><span class="mute" style="font-size:13px">${esc(p.sp.Colour || p.sp.Finish || rangeOf(p))} · SKU ${esc(p.sku)}</span><br><div class="qty"><button data-q="${p.id}" data-d="-1" aria-label="Decrease">−</button><span>${it.q}</span><button data-q="${p.id}" data-d="1" aria-label="Increase">+</button></div></div>
        <div style="text-align:right"><div class="price">${money(p.p * it.q)}</div><button class="mute" style="font-size:13px;margin-top:10px;text-decoration:underline;min-height:44px" data-rm="${p.id}">Remove</button></div></div>`; }).join("");
      const needsGlobe = bag.items.some((it) => { const p = get(it.id); return p && p.t === "indoor" && /E27|E14|B22|GU10/i.test(p.sp["Globe Type"] || ""); }) && !bag.items.some((it) => (get(it.id) || {}).t === "globes");
      if (needsGlobe) { const g = find("St64 Led Decorative Filament") || inCat("LED Decorative Filament Globes", 1)[0]; if (g) body.insertAdjacentHTML("beforeend", `<div class="panel" style="padding:16px;margin-top:18px;display:flex;gap:14px;align-items:center"><img src="${esc(thumb(img(g)))}" alt="" style="width:56px;height:56px;background:#fff;border-radius:10px;object-fit:contain"><div style="flex:1"><span class="eyebrow no-line" style="font-size:10.5px">Globes not included</span><div style="color:var(--head);font-size:14px">${esc(g.n)} · ${money(g.p)}</div></div><button class="btn sm" data-add="${g.id}">Add</button></div>`); }
      const sub = bag.subtotal(), left = Math.max(0, D.freeShip - sub);
      foot.innerHTML = `<div style="font-size:14px">${left > 0 ? `You're <b style="color:var(--amber)">${money(left)}</b> away from FREE delivery 🚚` : "You've unlocked <b style='color:var(--amber)'>FREE delivery</b> 🚚"}</div>
        <div class="ship-bar"><i style="width:${Math.min(100, sub / D.freeShip * 100)}%"></i></div>
        <div class="row-b"><span>Subtotal</span><span class="price" style="font-size:20px">${money(sub)}</span></div>
        <span class="mute" style="font-size:13px">or 4 interest-free payments of ${money(sub / 4)} with Payflex</span>
        <a href="checkout.html" class="btn" data-ev="begin_checkout">Checkout ${I.arrow}</a>`;
    });
  }
  function updateBadges() {
    $$('[data-badge="bag"]').forEach((b) => { const n = bag.count(); b.textContent = n || ""; b.dataset.n = n; });
    $$('[data-badge="wish"]').forEach((b) => { const n = wish.ids.size; b.textContent = n || ""; b.dataset.n = n; });
  }
  function flyToBag(p, from) {
    const target = window.innerWidth <= 860 ? $('.bnav [data-open="bag"]') : $("#bagBtn"); if (!target || reduced()) return;
    const s = (from && from.getBoundingClientRect && from.getBoundingClientRect()) || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const t = target.getBoundingClientRect(); const f = document.createElement("div"); f.className = "fly"; f.innerHTML = `<img src="${esc(thumb(img(p)))}" alt="">`;
    document.body.appendChild(f); const x0 = s.left + s.width / 2 - 35, y0 = s.top + s.height / 2 - 35, x1 = t.left + t.width / 2 - 35, y1 = t.top + t.height / 2 - 35;
    f.animate([{ transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1 }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 120}px) scale(.8)`, opacity: 1, offset: .5 }, { transform: `translate(${x1}px,${y1}px) scale(.2)`, opacity: .4 }], { duration: 900, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { f.remove(); target.classList.remove("bag-glow"); void target.offsetWidth; target.classList.add("bag-glow"); };
  }
  function toast(h, ms) { const box = $("#toasts"); if (!box) return; const t = document.createElement("div"); t.className = "toast"; t.innerHTML = h; box.appendChild(t); setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 500); }, ms || 3200); }

  /* ---------------- search overlay ---------------- */
  function initSearch() {
    const input = $("#sq"), out = $("#sOut"); let tm;
    const run = () => {
      const q = input.value.trim(); if (!q) { out.innerHTML = ""; return; }
      ready(() => {
        const r = search(q, 18); const chips = parsedChips(r.parsed);
        const guides = D.guides.filter((g) => q.toLowerCase().split(/\s+/).some((w) => w.length > 3 && (g.title + g.kicker).toLowerCase().includes(w))).slice(0, 2);
        out.innerHTML = (chips.length ? `<div class="parsed"><span class="search-meta" style="margin:6px 8px 0 0">Understood:</span>${chips.map((c) => `<span class="chip on">${esc(c)}</span>`).join("")}</div>` : "") +
          `<div class="search-meta">${r.total} products</div><div class="search-res">${r.items.map((p) => `<a class="sr-card" href="${pUrl(p)}"><span class="th"><img src="${esc(thumb(img(p)))}" alt="" loading="lazy"></span><span><b>${esc(p.n)}</b><span>${money(p.p)}</span></span></a>`).join("") || `<p>No exact matches. Try fewer words, or <button class="link-u" data-open="chat">ask the AI Assistant</button>.</p>`}</div>` +
          (guides.length ? `<div class="search-meta mt-m">Guides</div><div class="flex">${guides.map((g) => `<a class="chip" href="inspiration.html#${g.slug}">${esc(g.title)}</a>`).join("")}</div>` : "") +
          (r.total > 18 ? `<a class="btn ghost mt-m" href="shop.html?q=${encodeURIComponent(q)}">See all ${r.total} results ${I.arrow}</a>` : "");
        track("search", { q, results: r.total });
      });
    };
    input.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(run, 160); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && input.value.trim()) location.href = `shop.html?q=${encodeURIComponent(input.value.trim())}`; });
    $$("#search [data-q]").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.q; run(); }));
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const vb = $("#voiceBtn");
    if (!SR) vb.style.display = "none"; else vb.addEventListener("click", () => { const r = new SR(); r.lang = "en-ZA"; r.onresult = (e) => { input.value = e.results[0][0].transcript; run(); }; r.start(); vb.style.color = "var(--amber)"; r.onend = () => vb.style.color = ""; });
    $("#imgSearch").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; window.TLWChat && (closeOv(), window.TLWChat.open(), window.TLWChat.sendImage(f, "Find me lights that look like this")); });
  }

  /* ---------------- theme: pull-cord lamp ---------------- */
  let theme = store.get("tlw-theme", "dark");
  function applyTheme(t) { theme = t; html.dataset.theme = t; store.set("tlw-theme", t); $$("[data-theme-toggle]").forEach((b) => b.setAttribute("aria-pressed", t === "light")); $$(".lamp").forEach((l) => l.classList.toggle("on", t === "light")); document.dispatchEvent(new CustomEvent("tlw:theme", { detail: t })); }
  function toggleTheme(origin) {
    const next = theme === "light" ? "dark" : "light"; sound.click(); track("theme_toggle", { to: next });
    const o = origin || { x: innerWidth - 100, y: 80 };
    const bulb = $$(".lamp .lamp-bulb");
    const go = () => {
      if (!document.startViewTransition || reduced()) { applyTheme(next); return; }
      const r = Math.hypot(Math.max(o.x, innerWidth - o.x), Math.max(o.y, innerHeight - o.y));
      if (next === "dark") html.classList.add("vt-off");
      const vt = document.startViewTransition(() => applyTheme(next));
      vt.ready.then(() => {
        const frames = [`circle(0px at ${o.x}px ${o.y}px)`, `circle(${r}px at ${o.x}px ${o.y}px)`];
        html.animate({ clipPath: next === "light" ? frames : frames.slice().reverse() }, { duration: 1050, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: next === "light" ? "::view-transition-new(root)" : "::view-transition-old(root)" });
      }).catch(() => {});
      vt.ready.catch(() => {}); vt.finished.catch(() => {}).finally(() => html.classList.remove("vt-off"));
    };
    if (next === "light" && !reduced() && bulb.length) { // flicker once, then glow
      bulb.forEach((b) => b.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: .1 }, { opacity: 1 }], { duration: 260 })); setTimeout(go, 240);
    } else go();
  }
  // The hanging lamp is a real TLW product photo (Karbonell Medium Gold pendant), cut out from its studio shot.
  function lampSVG() {
    return `<div class="glow-pool"></div><div class="lamp-halo"></div>
      <img class="lamp-img" src="assets/img/cutouts/karbonell-gold.png" alt="" width="395" height="569" draggable="false">
      <div class="lamp-bulb"></div>
      <svg class="lamp-lines" width="140" height="300" viewBox="0 0 140 300" aria-hidden="true">
        <defs><radialGradient id="beadG" cx=".35" cy=".3"><stop offset="0" stop-color="#fff3cf"/><stop offset=".45" stop-color="#d4b06a"/><stop offset="1" stop-color="#6b4f22"/></radialGradient></defs>
        <line class="cable" x1="70" y1="0" x2="70" y2="70" stroke-width="1.6"/>
        <path class="cord" d="M70 222 L 70 262" stroke="#b8975a" stroke-width="1.1" fill="none"/>
        <circle class="bead" cx="70" cy="267" r="5.5" fill="url(#beadG)"/>
        <rect class="cord-hit" x="44" y="200" width="52" height="70" fill="transparent" aria-hidden="true"/>
        <circle class="bead-hit" cx="70" cy="267" r="40" fill="transparent" tabindex="0" role="switch" aria-checked="false" aria-label="Pull the cord to switch the lights on or off"/>
      </svg><span class="hint">Pull to switch on ↓</span>`;
  }
  function initLamp() {
    const host = $("[data-lamp-host]") || $("main") || document.body; if (!host) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const lamp = document.createElement("div"); lamp.className = "lamp"; lamp.innerHTML = lampSVG(); host.prepend(lamp);
    const hit = $(".bead-hit", lamp), cordHit = $(".cord-hit", lamp), bead = $(".bead", lamp), cord = $(".cord", lamp), hint = $(".hint", lamp), ball = $(".lamp-img", lamp);
    const setHint = () => { hint.textContent = theme === "light" ? "Pull to switch off ↑" : "Pull to switch on ↓"; hit.setAttribute("aria-checked", theme === "light"); };
    setHint(); document.addEventListener("tlw:theme", setHint);
    const S = () => (innerWidth <= 700 ? .46 : .58);           // the lamp is drawn at 140×300 and scaled down
    const calm = () => reduced();

    // ---- physics: lamp swing (angle spring) + cord pull (length spring) ----
    let ang = 0, vel = 0;                       // swing angle (radians) and angular velocity
    let pull = 0, pv = 0, pullTarget = 0;       // cord stretch in lamp units
    let dragging = false, startY = 0, startX = 0, lastScroll = scrollY, toggledThisPull = false;
    const tick = () => {
      if (!calm()) { const sv = scrollY - lastScroll; vel += sv * 0.0007; }
      lastScroll = scrollY;
      vel += -ang * 0.014 - vel * 0.03; ang += vel; ang = Math.max(-0.4, Math.min(0.4, ang));
      if (!dragging) { pv += (pullTarget - pull) * 0.2 - pv * 0.16; pull += pv; } // springy: overshoots and bounces back
      lamp.style.transform = `rotate(${(ang * 57.3).toFixed(2)}deg) scale(${S()})`;
      const y = 262 + pull; cord.setAttribute("d", `M70 222 L 70 ${y.toFixed(1)}`);
      bead.setAttribute("cy", (y + 5).toFixed(1)); hit.setAttribute("cy", (y + 5).toFixed(1)); cordHit.setAttribute("height", Math.max(40, y - 200).toFixed(1));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const origin = () => { const r = ball.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .62 }; };
    const toggle = () => { if (toggledThisPull) return; toggledThisPull = true; lamp.classList.add("pulled"); toggleTheme(origin()); };

    // ---- hover: the lamp swings away from the pointer, like brushing past a real pendant ----
    let lastX = null;
    const nudge = (dx) => { if (!calm()) vel += Math.max(-.007, Math.min(.007, dx * 0.0007)); };
    ball.addEventListener("pointerenter", (e) => { lastX = e.clientX; if (e.pointerType === "mouse") nudge((e.movementX || 6) * 1.6); });
    ball.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const dx = lastX == null ? 0 : e.clientX - lastX; lastX = e.clientX; nudge(dx); });
    ball.addEventListener("pointerleave", () => { lastX = null; });
    // touch: tapping the globe gives it a push
    ball.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; const r = ball.getBoundingClientRect(); vel += (e.clientX < r.left + r.width / 2 ? 1 : -1) * 0.02; });

    // ---- pull the cord: drag it down, or simply click / tap it ----
    const down = (e) => {
      dragging = true; toggledThisPull = false; startY = e.clientY; startX = e.clientX; pv = 0;
      e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); lamp.classList.add("grab");
    };
    const move = (e) => {
      if (!dragging) return;
      pull = Math.max(-4, Math.min(120, (e.clientY - startY) / S() * 0.9));   // follows the finger/mouse
      vel += ((e.clientX - startX) / S()) * 0.00004;                          // a sideways tug tilts the lamp
      if (pull > 46) toggle();                                                // the switch clicks at the bottom of the pull
    };
    const up = (e) => {
      if (!dragging) return; dragging = false; lamp.classList.remove("grab");
      const moved = Math.abs(e.clientY - startY);
      if (moved < 6) {                                                        // a click or tap: play a full pull
        pullTarget = 58; setTimeout(() => { toggle(); pullTarget = 0; }, 170);
      } else { pullTarget = 0; pv = -pull * 0.05; }
      vel += (Math.random() > .5 ? 1 : -1) * 0.012;                          // the lamp jiggles as the cord snaps back
    };
    [hit, cordHit].forEach((el) => {
      el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    });
    hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggledThisPull = false; pullTarget = 58; setTimeout(() => { toggle(); pullTarget = 0; }, 170); vel += .012; } });
  }


  /* ---------------- cursor + torch ---------------- */
  function initCursor() {
    const c = $("#cursor"), ring = $(".ring span", c), torch = $(".torch"); const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    const move = (px, py) => { x = px; y = py; torch.style.setProperty("--tx", px + "px"); torch.style.setProperty("--ty", py + "px"); };
    addEventListener("pointermove", (e) => { move(e.clientX, e.clientY); c.classList.remove("hidden"); }, { passive: true });
    addEventListener("touchmove", (e) => { const t = e.touches[0]; t && move(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener("mouseleave", () => c.classList.add("hidden"));
    if (!fine) return; document.body.classList.add("has-cursor");
    const loop = () => { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); }; loop();
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("a,button,[data-cursor],input[type=range],label,summary,.bead-hit");
      if (!t) { c.classList.remove("hover"); return; }
      c.classList.add("hover"); ring.textContent = (t.closest("[data-cursor]") || {}).dataset ? (t.closest("[data-cursor]").dataset.cursor || "") : "";
      if (t.closest("[data-cursor]") && t.closest("a,button") && t.closest("a,button") !== t.closest("[data-cursor]")) ring.textContent = t.matches("[data-quick]") ? "ADD" : "";
    });
  }

  /* ---------------- smooth scroll + reveals + magnetic ---------------- */
  let lenis = null;
  function initScroll() {
    if (window.Lenis && !reduced()) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      if (window.gsap && window.ScrollTrigger) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    }
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const hdr = $("#hdr"), top = $(".totop");
    const onS = () => { const y = scrollY; hdr.classList.toggle("scrolled", y > 60); top && top.classList.toggle("show", y > innerHeight * 1.2); };
    addEventListener("scroll", onS, { passive: true }); onS();
    top && top.addEventListener("click", () => { top.animate([{ transform: "translateY(0)" }, { transform: "translateY(14px)" }, { transform: "translateY(0)" }], { duration: 500, easing: "cubic-bezier(.3,1.6,.5,1)" }); sound.click(); lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: "smooth" }); });
  }
  function splitLines(root) {
    $$("[data-lines]", root).forEach((el) => { if (el.dataset.done) return; el.dataset.done = 1; el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="reveal-line"><span>${l.trim()}</span></span>`).join(""); });
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }) : null;
  function reveal(root) {
    splitLines(root || document);
    $$("[data-lines], .fade-up, [data-reveal]", root || document).forEach((el, i) => { if (io) io.observe(el); else el.classList.add("is-in"); });
    $$("[data-stagger]", root || document).forEach((g) => $$(":scope > *", g).forEach((c, i) => { c.style.transitionDelay = i * 0.07 + "s"; c.classList.add("fade-up"); io ? io.observe(c) : c.classList.add("is-in"); }));
  }
  function magnetic(root) {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduced()) return;
    $$(".btn, .magnetic", root || document).forEach((b) => { if (b._mag) return; b._mag = 1;
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      b.addEventListener("mouseleave", () => b.style.transform = ""); });
  }

  /* ---------------- sound (off by default; synthesised, no files) ---------------- */
  // Sound removed at the client's request; kept as no-ops so existing calls stay safe.
  const sound = { on: false, click() { }, hum() { }, toggle() { }, sync() { } };

  /* ---------------- misc ---------------- */
  function storeOpenDots() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" })); const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    D.stores.forEach((st) => {
      const sun = st.sun === "Closed" ? null : st.sun.split("–").map((x) => { const [h, mm] = x.trim().split(":").map(Number); return h * 60 + (mm || 0); });
      const span = d === 0 ? sun : d === 6 ? [540, 900] : [510, 1020]; const open = !!span && m >= span[0] && m < span[1];
      $$(`[data-store-tab="${st.id}"]`).forEach((t) => { t.classList.toggle("open", open); t.title = open ? "Open now" : "Closed now"; });
    });
  }
  function initAnnounce() {
    const end = new Date(D.blackFriday).getTime();
    const cd = () => { const s = Math.max(0, end - Date.now()) / 1000; const t = `${Math.floor(s / 86400)}d ${String(Math.floor(s % 86400 / 3600)).padStart(2, "0")}h ${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`; $$("[data-countdown]").forEach((e) => e.textContent = t); };
    cd(); setInterval(cd, 1000);
  }
  function initCookie() {
    if (store.get("tlw-cookie", null)) return; const c = $("#cookie"); setTimeout(() => c.classList.add("show"), 2200);
    $$("[data-cookie]").forEach((b) => b.addEventListener("click", () => { store.set("tlw-cookie", b.dataset.cookie); c.classList.remove("show"); }));
  }
  function initExit() {
    const m = $("#exit"); if (!m || /checkout/.test(document.body.dataset.page || "")) return; let armed = false; setTimeout(() => armed = true, 15000);
    let seen = false; try { seen = sessionStorage.getItem("tlw-exit"); } catch (e) { }
    document.addEventListener("mouseout", (e) => { if (!armed || seen || e.relatedTarget || e.clientY > 8) return; seen = true; try { sessionStorage.setItem("tlw-exit", 1); } catch (er) { } m.classList.add("open"); });
    $$("[data-close]", m).forEach((b) => b.addEventListener("click", () => m.classList.remove("open")));
  }
  function initRecentTray() {
    const t = $("#rvTray"); if (!t || !recent.ids.length || document.body.dataset.page === "home") return;
    ready(() => { const ps = recent.ids.map(get).filter(Boolean).slice(0, 4); if (!ps.length) return; t.innerHTML = "Recently viewed " + ps.map((p) => `<a href="${pUrl(p)}" title="${esc(p.n)}"><img src="${esc(thumb(img(p)))}" alt="${esc(p.n)}"></a>`).join(""); setTimeout(() => t.classList.add("show"), 1800); });
  }
  function transitions() {
    const cur = $("#curtain");
    let shown = false; const show = () => { if (shown) return; shown = true; cur.classList.add("reveal"); cur.classList.remove("on"); setTimeout(() => cur.classList.remove("reveal"), 900); };
    requestAnimationFrame(show); setTimeout(show, 120);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || ""; if (!href || href.startsWith("#") || /^(mailto|tel|https?:|javascript)/.test(href)) return;
      if (href.split("#")[0] === location.pathname.split("/").pop() + location.search && href.includes("#")) return;
      e.preventDefault(); cur.classList.add("on"); setTimeout(() => location.href = href, reduced() ? 0 : 420);
    });
    addEventListener("pageshow", (e) => { if (e.persisted) cur.classList.remove("on"); });
  }
  function delegates() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open],[data-close],[data-quick],[data-add],[data-wish],[data-compare],[data-q][data-d],[data-rm],[data-theme-toggle],[data-sound],[data-ev]"); if (!t) return;
      if (t.dataset.ev) track(t.dataset.ev, { href: t.getAttribute("href") });
      if (t.hasAttribute("data-open")) { e.preventDefault(); openOv(t.dataset.open); }
      else if (t.hasAttribute("data-close") && !t.closest("#exit")) closeOv();
      else if (t.dataset.quick) { e.preventDefault(); bag.add(t.dataset.quick, 1, t.closest(".pcard") ? t.closest(".pcard").querySelector("img") : t); }
      else if (t.dataset.add) { e.preventDefault(); bag.add(t.dataset.add, +(t.dataset.qty || 1), t); }
      else if (t.dataset.wish) { e.preventDefault(); wish.toggle(t.dataset.wish); }
      else if (t.dataset.compare) { e.preventDefault(); compare.toggle(t.dataset.compare); }
      else if (t.dataset.d) { const it = bag.items.find((x) => x.id === +t.dataset.q); it && bag.setQ(it.id, it.q + +t.dataset.d); }
      else if (t.dataset.rm) bag.setQ(t.dataset.rm, 0);
      else if (t.hasAttribute("data-theme-toggle")) { const r = t.getBoundingClientRect(); toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); }
    });
    $("#scrim").addEventListener("click", closeOv);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOv(); if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openOv("search"); } });
    document.addEventListener("submit", (e) => {
      const f = e.target; if (!f.matches("[data-news]")) return; e.preventDefault();
      track("newsletter_signup", {}); toast("<span>✨ You're on the list. Watch your inbox for Black Friday early access.</span>"); f.reset(); const m = f.closest(".modal"); m && m.classList.remove("open");
    });
  }
  function preloader(cb) {
    const pre = $(".preloader"); if (!pre) { cb(); return; }
    const count = $(".pre-count b", pre); let p = 0, target = 0, finished = false; const pad = (n) => String(n).padStart(3, "0");
    let quick = false; try { quick = sessionStorage.getItem("tlw-seen") === "1"; sessionStorage.setItem("tlw-seen", "1"); } catch (e) { }
    const dur = reduced() ? 250 : quick ? 800 : 2600; // full show on the first visit, short on return visits
    ready(() => { target = 1; });
    const t0 = performance.now();
    setTimeout(() => pre.classList.add("flick"), 120); // the filament catches, flickers once
    // Finish exactly once; a timer guarantees the loader never blocks the page if frames are throttled.
    const finish = () => {
      if (finished) return; finished = true; pre.style.setProperty("--p", 1); count.textContent = "100";
      pre.classList.add("lit"); // light floods the screen and reveals the site
      setTimeout(() => { pre.classList.add("done"); cb(); setTimeout(() => { pre.style.display = "none"; }, 900); }, reduced() ? 50 : 650);
    };
    const tick = () => {
      if (finished) return;
      const minT = Math.min(1, (performance.now() - t0) / dur); const goal = Math.min(target, minT);
      p += (goal - p) * 0.12; if (goal >= 1 && p > .995) p = 1;
      pre.style.setProperty("--p", p.toFixed(3)); count.textContent = pad(Math.round(p * 100));
      if (p >= 1) finish(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(finish, dur + 1600);
  }



  /* ---------------- boot ---------------- */
  applyTheme(theme);
  if (store.get("tlw-reduce", false)) html.classList.add("reduce");
  shell();
  loadProducts();
  initMega(); initSearch(); initCursor(); initScroll(); initAnnounce(); storeOpenDots(); initCookie(); initRecentTray(); transitions(); delegates(); sound.sync(); updateBadges();
  initLamp();
  document.body.classList.add("torch-on");

  window.TLW = { $, $$, esc, money, moneyShort, qs, store, I, track, ready, get, find, findAll, inCat, img, thumb, isSale, rangeOf, pUrl, card, bag, wish, compare, recent, search, parseQuery, parsedChips, toast, reveal, magnetic, sound, toggleTheme, openOv, closeOv, reduced, get products() { return PRODUCTS; }, get lenis() { return lenis; } };
  document.addEventListener("DOMContentLoaded", () => { });
  preloader(() => { reveal(); magnetic(); document.dispatchEvent(new Event("tlw:ready")); });
})();
