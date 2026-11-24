/* ==========================================================================
   THE SHOWCASE — product page (product.html?id=)
   Real TLW product photos only. "Light on" = real photo + warm glow layers.
   ========================================================================== */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA, $ = T.$, $$ = T.$$, esc = T.esc, money = T.money;
  const U = "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/";
  const CLEAN = { bed: U + "Website-BedroomLighting-03.jpg", fabrica: U + "Shop-fabrica.jpg", wood: U + "shop-wood.jpg", solar: U + "shop-solar.jpg", fans: U + "shop-fans.jpg", outdoor: U + "shop-outdoor.jpg", pool: U + "1-1.jpg", dining: U + "Tris.jpg" };
  const ROOMS = [["Bedroom", CLEAN.bed], ["Dining", CLEAN.dining], ["Lounge", CLEAN.wood], ["Loft", CLEAN.fabrica], ["Patio", CLEAN.fans], ["Entrance", CLEAN.outdoor]];
  // transparent cut-outs of real TLW product photos (assets/img/cutouts)
  const CUTOUTS = { 144777: "karbonell-gold.png", 144780: "karbonell-gold-small.png", 157055: "perla-bar.png", 157252: "ginevra-table.png", 144655: "tomasso-floor.png", 144693: "kehlani-gold.png", 144861: "g125-filament.png" };
  const COLOUR_RE = /\b(black|white|gold|brass|chrome|natural|grey|gray|silver|bronze|copper|satin|matt|matte|antique|smoked?|clear|amber|champagne|nickel|brown|red|latte|mocha|graphite|rose|polished|brushed|light wood|dark wood|wood|and|&|daylight|warm|cool)\b/g;
  const baseName = (n) => n.toLowerCase().replace(COLOUR_RE, " ").replace(/\s+/g, " ").trim();
  const pad = (n) => String(n).padStart(2, "0");
  const top = $("#scTop"), rest = $("#scRest");

  T.ready((products) => {
    const p = T.get(+T.qs("id"));
    if (!p) return notFound(products);
    render(p, products);
  });

  /* ---------- not found ---------- */
  function notFound(products) {
    document.title = "Light not found | The Lighting Warehouse";
    const picks = products.filter((x) => x.i.length > 1 && x.p > 900).slice(0, 4);
    top.innerHTML = `<div class="wrap sc-nf"><span class="num">— 404 / Showcase</span><h1 class="h1" data-lines>This light has<br><em>gone out</em>.</h1><p class="lead">We couldn't find that product. It may have sold out or moved to a new range.</p><div class="flex mt-m"><a class="btn" href="shop.html">Browse the gallery</a><button class="btn ghost" data-open="search">Search</button></div><div class="sc-nf-grid mt-l">${picks.map((x) => T.card(x)).join("")}</div></div>`;
    T.reveal(top);
  }

  /* ---------- helpers ---------- */
  function variantsOf(p, all) {
    const b = baseName(p.n);
    let v = all.filter((x) => x.id !== p.id && baseName(x.n) === b && x.t === p.t);
    return v.slice(0, 8);
  }
  function finishLabel(x) { const w = (x.sp.Colour || x.n).replace(/blades?|body|–|-/gi, " ").split(/\s+/).filter(Boolean); const seen = new Set(); return w.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).join(" "); }
  function catLabel(p) { return p.c.find((c) => !/^(indoor|outdoor|fans|globes|wall switches and plugs)$/i.test(c)) || p.c[0] || ""; }
  function lifestyleFor(p) {
    const c = p.c.join(" ").toLowerCase();
    if (p.t === "fans") return CLEAN.fans; if (p.t === "outdoor") return /solar|pole|bollard|garden/.test(c + p.n.toLowerCase()) ? CLEAN.solar : CLEAN.outdoor;
    if (p.t === "globes") return CLEAN.pool; if (/industrial|fabrica/.test(c + p.n.toLowerCase())) return CLEAN.fabrica;
    if (/pendant|chandelier/.test(c)) return CLEAN.dining; if (/wall/.test(c)) return CLEAN.wood; return CLEAN.bed;
  }
  function addWorkdays(d, n) { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); const w = x.getDay(); if (w !== 0 && w !== 6) n--; } return x; }
  const fmtDay = (d) => d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  function normKey(k) { const m = { "ip rating": "IP rating", "recommmended globes": "Recommended globes", "speedsettings": "Speed settings", "lamp shade": "Lamp shade", "lampshade": "Lamp shade", "base type": "Base type", "base size": "Base size", "cable length": "Cable length", "chain length": "Chain length", "rod length": "Rod length", "motor wattage": "Motor wattage", "extended description": "Extended description" }; return m[k.toLowerCase()] || k; }
  function specRows(p) {
    const seen = {}, rows = [];
    Object.entries(p.sp).forEach(([k, v]) => { const nk = normKey(k); if (!v || seen[nk] || /^(Room|Extended description|Available)$/.test(nk)) return; seen[nk] = 1; rows.push([nk, String(v)]); });
    return rows;
  }

  /* ---------- globes you'll need ---------- */
  function globePlan(p, all) {
    const raw = p.sp["Globe Type"] || p.sp["Recommmended Globes"] || "";
    if (!raw || p.t === "globes" || p.t === "switches") return null;
    if (/integrated|built[- ]?in/i.test(raw)) return { integrated: true, raw };
    if (!/excluded|exclude/i.test(raw) && !/x\s*[a-z]/i.test(raw)) return null;
    const bm = raw.match(/\b(E27|E14|B22|GU10|G9|G4|GU5\.3)\b/i); if (!bm) return null;
    const base = bm[1].toUpperCase();
    const qm = raw.match(/(\d+)\s*[x×]/i); const qty = qm ? +qm[1] : 1;
    const wm = raw.match(/(\d+(?:\.\d+)?)\s*w/i); const maxW = wm ? +wm[1] : 99;
    const decorative = /pendant|chandelier|table|floor|filament|industrial|glass/i.test(p.c.join(" ") + p.n);
    const globeBase = (g) => { const b = String(g.sp["Base type"] || g.sp["Base Type"] || "").toUpperCase().replace(/B22D/, "B22"); if (/^(E27|E14|B22|GU10|G9|G4|GU5\.3)/.test(b)) return b.match(/^(E27|E14|B22|GU10|G9|G4|GU5\.3)/)[1]; const nm = g.n.toUpperCase().match(/\b(GU10|G9|G4|MR16)\b/); return nm ? (nm[1] === "MR16" ? "GU5.3" : nm[1]) : ""; };
    const watt = (g) => { const m = (g.sp.Wattage || g.n).match(/(\d+(?:\.\d+)?)\s*w/i); return m ? +m[1] : 0; };
    const kel = (g) => { const m = String(g.sp.Kelvin || "").match(/(\d{4})/); return m ? +m[1] : (/warm/i.test(g.n) ? 3000 : 5000); };
    const packOf = (g) => { const m = g.n.match(/(\d+)\s*pack/i); return m ? +m[1] : /twin pack/i.test(g.n) ? 2 : 1; };
    const cands = all.filter((g) => g.t === "globes" && !/emergency|strip|module|tube/i.test(g.n) && globeBase(g) === base && watt(g) <= maxW + 0.01)
      .map((g) => ({ g, sc: (kel(g) <= 3000 ? 3 : 0) + (decorative && /filament/i.test(g.n) ? 2 : 0) + (/dimmable/i.test(g.n) ? 0.5 : 0) - g.p / 400 + (g.st ? 1 : 0), pack: packOf(g) }))
      .sort((a, b) => b.sc - a.sc);
    const seen = new Set(); const opts = [];
    cands.forEach((c) => { const k = c.g.n.toLowerCase(); if (!seen.has(k) && opts.length < 3) { seen.add(k); opts.push(c); } });
    return { qty, base, maxW, raw, opts };
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  function render(p, all) {
    const variants = variantsOf(p, all);
    const rangeItems = p.rg ? all.filter((x) => x.rg === p.rg && x.id !== p.id) : [];
    const cat = catLabel(p);
    const sale = T.isSale(p);
    const gp = globePlan(p, all);
    const recentBefore = T.recent.ids.filter((id) => id !== p.id).map(T.get).filter(Boolean);
    const hasViews = p.i.length > 1;
    const crumbs = [["Home", "index.html"], ["Shop", "shop.html"], [{ indoor: "Indoor", outdoor: "Outdoor", fans: "Fans", globes: "Globes", switches: "Switches & Plugs" }[p.t], `shop.html?cat=${p.t}`]];
    if (cat && !/^(indoor|outdoor|fans|globes)$/i.test(cat)) crumbs.push([cat, `shop.html?cat=${p.t}&sub=${encodeURIComponent(cat)}`]);
    document.title = `${p.n} | The Lighting Warehouse`;
    const md = document.querySelector('meta[name="description"]'); md && md.setAttribute("content", `${p.n} — ${money(p.p)}. ${p.d.replace(/…$/, "").slice(0, 120)}… Free delivery over R500.`);

    /* ---- top: gallery + purchase panel ---- */
    top.innerHTML = `
    <div class="wrap"><nav class="crumbs sc-crumbs" aria-label="Breadcrumb">${crumbs.map(([n, u]) => `<a href="${u}">${esc(n)}</a><span>/</span>`).join("")}<span aria-current="page" style="opacity:1">${esc(p.n)}</span></nav></div>
    <div class="sc-split">
      <div class="sc-gal">
        <div class="sc-gal-in">
          <div class="sc-modes" role="tablist" aria-label="Gallery view">
            <button role="tab" class="sc-mode on" id="tabPhotos" aria-selected="true" aria-controls="scPhotos" data-mode="photos">Photos <small>${pad(p.i.length)}</small></button>
            ${hasViews ? `<button role="tab" class="sc-mode" id="tabSpin" aria-selected="false" aria-controls="scSpin" data-mode="spin" tabindex="-1">360° view</button>` : ""}
          </div>
          <div class="sc-viewer lit-off" id="scViewer">
            <div class="sc-photos" id="scPhotos" role="tabpanel" aria-labelledby="tabPhotos">
              ${hasViews ? `<div class="sc-rail" role="group" aria-label="Choose a photo">${p.i.map((u, k) => `<button class="sc-th ${k ? "" : "on"}" data-k="${k}" aria-label="Photo ${k + 1} of ${p.i.length}" aria-pressed="${!k}"><img src="${esc(T.thumb(u))}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
              <div class="sc-stage" id="scStage" data-cursor="ZOOM">
                <div class="sc-pool"><img id="scMain" src="${esc(p.i[0])}" alt="${esc(p.n)} — photo 1" draggable="false"></div>
                <div class="sc-glow" aria-hidden="true"></div><div class="sc-glow2" aria-hidden="true"></div>
                <div class="sc-lens" id="scLens" aria-hidden="true"></div>
                <button class="sc-zoom icon-btn" id="scZoom" aria-label="Open full-screen zoom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></button>
              </div>
            </div>
            ${hasViews ? `<div class="sc-spin" id="scSpin" role="tabpanel" aria-labelledby="tabSpin" hidden>
              <div class="sc-spin-stage" id="scSpinStage" tabindex="0" aria-label="360 degree view: drag or use the arrow keys to turn the light" data-cursor="DRAG">
                <div class="sc-pool">${p.i.map((u, k) => `<img class="sc-frame ${k ? "" : "on"}" src="${esc(u)}" alt="${k ? "" : esc(p.n) + " — studio angles"}" draggable="false" loading="${k ? "lazy" : "eager"}">`).join("")}</div>
                <div class="sc-glow" aria-hidden="true"></div><div class="sc-glow2" aria-hidden="true"></div>
              </div>
              <div class="sc-dial" aria-hidden="true">${p.i.map((u, k) => `<i class="${k ? "" : "on"}" style="--a:${(k / p.i.length) * 360}deg"></i>`).join("")}<span id="scDialN">01</span></div>
              <p class="sc-spin-hint"><span aria-hidden="true">⟵</span> Drag to turn <span aria-hidden="true">⟶</span></p>
            </div>` : ""}
          </div>
          <div class="sc-gal-ui">
            <span class="sc-counter"><b id="scK">01</b> / ${pad(p.i.length)}</span>
            <button class="sc-lit" id="scLit" aria-pressed="false"><span class="sc-lit-sw" aria-hidden="true"><i></i></span><span id="scLitL">Switch on</span></button>
          </div>
          <div class="sc-dots" aria-hidden="true">${p.i.map((u, k) => `<i class="${k ? "" : "on"}"></i>`).join("")}</div>
        </div>
      </div>

      <aside class="sc-buy" aria-label="Buy ${esc(p.n)}">
        <div class="sc-buy-in">
          <p class="sc-kicker">${p.rg ? `<a href="range.html?r=${encodeURIComponent(p.rg)}">${esc(p.rg)} range</a><span>·</span>` : ""}<a href="${crumbs[crumbs.length - 1][1]}">${esc(cat)}</a></p>
          <h1 class="sc-name">${esc(p.n)}</h1>
          <p class="sc-meta"><span>SKU ${esc(p.sku)}</span><a href="#reviews" class="sc-rate" data-tab-go="rev"><span class="stars" aria-hidden="true">☆☆☆☆☆</span> No reviews yet · be the first</a></p>
          <div class="sc-price">
            <span class="price">${money(p.p)}</span>${sale ? `<s>${money(p.r)}</s><span class="tag">Save ${T.moneyShort(p.r - p.p)}</span>` : ""}
          </div>
          <p class="sc-payflex">or 4 interest-free payments of <b>${money(Math.round(p.p / 4 * 100) / 100)}</b> with <span class="sc-pf">Payflex</span></p>

          ${variants.length ? `<div class="sc-block"><span class="sc-lbl">Finish · <b>${esc(finishLabel(p))}</b></span>
            <div class="sc-vars"><span class="sc-var on" aria-current="true" title="${esc(p.n)}"><img src="${esc(T.thumb(p.i[0]))}" alt="${esc(finishLabel(p))} (selected)"></span>${variants.map((v) => `<a class="sc-var" href="${T.pUrl(v)}" title="${esc(v.n)}"><img src="${esc(T.thumb(v.i[0]))}" alt="${esc(finishLabel(v))}"></a>`).join("")}</div></div>` : ""}

          <div class="sc-block sc-cta" id="scCta">
            <div class="sc-qty" role="group" aria-label="Quantity"><button type="button" data-qd="-1" aria-label="Decrease quantity">−</button><input id="scQty" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Quantity"><button type="button" data-qd="1" aria-label="Increase quantity">+</button></div>
            <button class="btn sc-add" id="scAdd" data-add="${p.id}" data-qty="1" data-cursor="ADD">Add to bag <span class="arr">→</span></button>
          </div>
          <div class="sc-cta2">
            <button class="btn ghost" id="scBuyNow">Buy now</button>
            <button class="icon-btn sc-ic ${T.wish.has(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Save to wishlist" aria-pressed="${T.wish.has(p.id)}">${T.I.heart}</button>
            <button class="icon-btn sc-ic" data-compare="${p.id}" aria-label="Add to compare">${T.I.compare}</button>
          </div>

          <p class="sc-stock ${p.st ? "" : "out"}"><i aria-hidden="true"></i>${p.st ? (p.ls && p.ls <= 5 ? `Only ${p.ls} left online` : "In stock online") : "Out of stock online"}</p>

          ${gp ? (gp.integrated ? `<div class="sc-globes int"><span class="sc-lbl">Globes</span><p><b>Integrated LED.</b> No globes needed: the light source is built in.</p></div>` : gp.opts.length ? `
          <div class="sc-globes" id="scGlobes">
            <span class="sc-lbl">Globes you'll need</span>
            <p class="sc-g-need"><b>${gp.qty} × ${esc(gp.base)}</b>, max ${gp.maxW}W LED <span class="mute">(not included)</span></p>
            <div class="sc-g-opts" role="radiogroup" aria-label="Choose a globe">${gp.opts.map((o, k) => { const packs = Math.ceil(gp.qty / o.pack); return `<label class="sc-g-opt"><input type="radio" name="globe" value="${o.g.id}" data-packs="${packs}" ${k ? "" : "checked"}><span class="sc-g-th"><img src="${esc(T.thumb(o.g.i[0]))}" alt=""></span><span class="sc-g-t"><b>${esc(o.g.n)}</b><small>${packs} × ${money(o.g.p)}${o.pack > 1 ? ` (pack of ${o.pack})` : ""}</small></span></label>`; }).join("")}</div>
            <button class="btn sm sc-g-add" id="scGlobeAdd">Add light + globes</button>
            <button class="link-u sc-g-only" id="scGlobeOnly">Add globes only</button>
          </div>` : "") : ""}

          <details class="sc-store" id="scStoreBox">
            <summary><span class="sc-lbl">Check stock at a store</span></summary>
            <div class="field"><label for="scStore" class="sr-only">Choose a store</label><select id="scStore"><option value="">Choose your nearest store</option>${D.stores.map((s) => `<option value="${s.id}">${esc(s.name)}${s.isNew ? " (new)" : ""} · ${esc(s.region)}</option>`).join("")}</select></div>
            <div class="sc-store-res" id="scStoreRes" aria-live="polite"></div>
          </details>

          <form class="sc-deliv" id="scDeliv" novalidate>
            <label class="sc-lbl" for="scPost">Delivery estimate</label>
            <div class="sc-deliv-row"><input class="input" id="scPost" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Postal code, e.g. 2196" autocomplete="postal-code"><button class="btn ghost sm" type="submit">Check</button></div>
            <p class="sc-deliv-res" id="scDelivRes" aria-live="polite">${p.p >= D.freeShip ? "Free delivery on this light." : `Free delivery on orders over ${T.moneyShort(D.freeShip)}.`}</p>
          </form>

          <a class="sc-wa" href="${D.waHref}?text=${encodeURIComponent(`Hi TLW, I'd like to ask about the ${p.n} (SKU ${p.sku}).`)}" target="_blank" rel="noopener" data-ev="whatsapp_product">${T.I.wa}<span>Ask about this product on WhatsApp</span></a>

          <ul class="sc-trust"><li>Free delivery over ${T.moneyShort(D.freeShip)}</li><li>Collect from ${D.stores.length} stores</li><li>Family-run since 1974</li></ul>
        </div>
      </aside>
    </div>`;

    /* ---- the rest of the page ---- */
    const H = p.sp.Height, W = p.sp.Width || p.sp.Diameter || p.sp["Blade Span"] || p.sp.Length;
    const wLbl = p.sp.Width ? "Width" : p.sp.Diameter ? "Diameter" : p.sp["Blade Span"] ? "Blade span" : p.sp.Length ? "Length" : "";
    const rows = specRows(p);
    const rooms = (p.sp.Room || "").split("|").map((x) => x.trim()).filter((x) => x && !/^(led|globe|switches|multiplug|filament|tube|wireless|app|battery)$/i.test(x));
    const life = lifestyleFor(p);
    const story = p.rg && (D.ranges.find((r) => r.id === p.rg) || {}).story;
    const complete = (rangeItems.length >= 3 ? rangeItems : rangeItems.concat(all.filter((x) => x.id !== p.id && !rangeItems.includes(x) && x.t === p.t && x.c.includes(cat)))).filter((x) => !variants.includes(x)).slice(0, 10);
    const also = [];
    if (gp && gp.opts) gp.opts.forEach((o) => also.push(o.g));
    const roomSet = new Set(rooms.map((r) => r.toLowerCase()));
    all.forEach((x) => { if (also.length >= 8 || x.id === p.id || complete.includes(x) || also.includes(x) || variants.includes(x)) return; const xr = (x.sp.Room || "").toLowerCase().split("|").map((s) => s.trim()); if (x.t !== p.t && xr.some((r) => roomSet.has(r))) also.push(x); });
    const care = careCopy(p);

    rest.innerHTML = `
    <section class="sc-room section" aria-labelledby="scRoomH">
      <div class="wrap sc-room-grid">
        <div class="sc-room-copy">
          <span class="num">— 01 / Visualiser</span>
          <h2 class="h2" id="scRoomH" data-lines>See it in<br><em>your room</em>.</h2>
          <p class="lead">Upload a photo of your space, or try one of our showroom rooms. Drag the ${esc(p.n.split(" ")[0])} into place, size it, then switch it on for an evening view.</p>
          <div class="flex mt-m"><button class="btn" id="scVisOpen">${T.I.camera} View in your room</button></div>
          <p class="demo-note mt-s">Your photo stays on your device</p>
        </div>
        <button class="sc-ba glass-card" id="scBA" aria-label="Open the room visualiser" data-cursor="TRY">
          <span class="sc-ba-room"><img src="${esc(CLEAN.wood)}" alt="" loading="lazy"></span>
          <span class="sc-ba-after"><img src="${esc(CLEAN.wood)}" alt="" loading="lazy"><span class="sc-ba-piece"><img src="${esc(CUTOUTS[p.id] ? "assets/img/cutouts/" + CUTOUTS[p.id] : p.i[0])}" alt="" class="${CUTOUTS[p.id] ? "cut" : ""}" loading="lazy"></span><span class="sc-ba-glow"></span></span>
          <span class="sc-ba-line" aria-hidden="true"><i>⟷</i></span>
          <span class="sc-ba-lbl l">Before</span><span class="sc-ba-lbl r">After</span>
        </button>
      </div>
    </section>

    <section class="sc-bleed" aria-label="${esc(p.n)} styled in a home">
      <img src="${esc(life)}" alt="A warmly lit South African home styled with TLW lighting" loading="lazy">
      <div class="sc-bleed-cap wrap"><span class="eyebrow">In situ</span><p data-lines>${story ? esc(story) : `Light that makes a room feel <em>finished</em> the moment you switch it on.`}</p></div>
    </section>

    <section class="sc-draw section" aria-labelledby="scDrawH">
      <div class="wrap">
        <div class="sc-draw-head"><span class="num">— 02 / Specifications</span><h2 class="h2" id="scDrawH" data-lines>Drawn to<br><em>measure</em>.</h2></div>
        <div class="sc-draw-grid">
          <figure class="sc-sheet">
            <div class="sc-sheet-in">
              ${H ? `<div class="dim-v" aria-hidden="true"><span>${esc(H)}</span></div>` : ""}
              <div class="sc-sheet-photo"><img src="${esc(p.i[0])}" alt="${esc(p.n)} with dimension lines" loading="lazy"></div>
              ${W ? `<div class="dim-h" aria-hidden="true"><span>${esc(W)}</span></div>` : ""}
            </div>
            <figcaption class="sc-tblock"><span><b>TLW</b> Sheet 01</span><span>${esc(p.n)}</span><span>SKU ${esc(p.sku)}</span><span>${H ? "H " + esc(H) : ""}${H && W ? " · " : ""}${W ? wLbl.charAt(0) + " " + esc(W) : ""}${!H && !W ? "Dimensions on request" : ""}</span><span>Scale NTS</span></figcaption>
          </figure>
          <div class="sc-spec">
            <table class="sc-table"><caption class="sr-only">Full specifications</caption><tbody>
              <tr><th scope="row">SKU</th><td>${esc(p.sku)}</td></tr>
              ${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}
              ${rooms.length ? `<tr><th scope="row">Ideal for</th><td>${rooms.map((r) => `<span class="sc-roomtag">${esc(r)}</span>`).join(" ")}</td></tr>` : ""}
            </tbody></table>
          </div>
        </div>
      </div>
    </section>

    <section class="sc-tabs-sec section" id="reviews" aria-label="Product information">
      <div class="wrap">
        <div class="sc-tabs" role="tablist" aria-label="Product information">
          ${[["desc", "Description"], ["spec", "Specifications"], ["care", "Installation & Care"], ["del", "Delivery & Returns"], ["rev", "Reviews (0)"]].map(([k, l], i) => `<button role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${!i}" tabindex="${i ? -1 : 0}" class="sc-tab ${i ? "" : "on"}" data-tab="${k}">${l}</button>`).join("")}
          <span class="sc-tab-ink" aria-hidden="true"></span>
        </div>
        <div class="sc-panels">
          <div role="tabpanel" id="p-desc" aria-labelledby="t-desc" class="sc-panel on" tabindex="0">
            <div class="sc-desc"><p class="sc-desc-lead">${esc(p.d)}</p>${p.sp["Extended description"] || p.sp["Extended Description"] ? `<p>${esc(p.sp["Extended description"] || p.sp["Extended Description"])}</p>` : ""}
            <ul class="sc-points">${[p.sp.Material && `Made from ${p.sp.Material.toLowerCase()}`, p.sp.Colour && `Finish: ${p.sp.Colour}`, p.sp["Globe Type"] && `Takes ${p.sp["Globe Type"]}`, rooms.length && `Works well in the ${rooms.slice(0, 3).join(", ").toLowerCase()}`].filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
            <a class="link-u" href="${esc(p.u)}" target="_blank" rel="noopener">View on lightingwarehouse.co.za <span aria-hidden="true">↗</span></a></div>
          </div>
          <div role="tabpanel" id="p-spec" aria-labelledby="t-spec" class="sc-panel" tabindex="0" hidden>
            <dl class="sc-keys">${keySpecs(p).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("") || "<p>Full specifications are listed in the drawing above.</p>"}</dl>
          </div>
          <div role="tabpanel" id="p-care" aria-labelledby="t-care" class="sc-panel" tabindex="0" hidden>
            <div class="sc-cols"><div><h3 class="h3">Installation</h3>${care[0]}</div><div><h3 class="h3">Care</h3>${care[1]}</div></div>
          </div>
          <div role="tabpanel" id="p-del" aria-labelledby="t-del" class="sc-panel" tabindex="0" hidden>
            <div class="sc-cols">
              <div><h3 class="h3">Delivery</h3><p>Free delivery on orders over ${T.moneyShort(D.freeShip)}, anywhere in South Africa. Gauteng orders usually arrive in 1–2 working days, other provinces in 2–4 working days. You will get tracking updates by email and SMS.</p><p>Prefer to collect? Choose click &amp; collect at checkout and pick up from any of our ${D.stores.length} stores.</p></div>
              <div><h3 class="h3">Returns</h3><p>Changed your mind? Unused items in their original packaging can be returned to any TLW store or collected by our courier. Faulty items are covered by the manufacturer's warranty. See our full returns policy or call us on <a class="gold" href="${D.phoneHref}">${esc(D.phone)}</a>.</p></div>
            </div>
          </div>
          <div role="tabpanel" id="p-rev" aria-labelledby="t-rev" class="sc-panel" tabindex="0" hidden>
            <div class="sc-rev">
              <div class="sc-rev-empty"><span class="sc-rev-stars" aria-hidden="true">☆☆☆☆☆</span><h3 class="h3">Be the first to <em>review</em>.</h3><p>Bought this light? Tell other South African homes how it looks once it is up. Photos of it switched on are especially helpful.</p></div>
              <form class="sc-rev-form" id="scRevForm">
                <fieldset class="sc-stars-in"><legend class="sc-lbl">Your rating</legend>${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="rs${n}" name="rating" value="${n}" ${n === 5 ? "required" : ""}><label for="rs${n}" title="${n} star${n > 1 ? "s" : ""}"><span class="sr-only">${n} star${n > 1 ? "s" : ""}</span>★</label>`).join("")}</fieldset>
                <div class="field"><label for="rvName">Your name</label><input id="rvName" required autocomplete="name"></div>
                <div class="field"><label for="rvText">Your review</label><textarea id="rvText" required minlength="10" placeholder="How does it look in your home?"></textarea></div>
                <div class="field"><label for="rvPics">Add photos (optional)</label><input id="rvPics" type="file" accept="image/*" multiple class="sc-file"></div>
                <div class="sc-rev-pics" id="rvPrev"></div>
                <button class="btn" type="submit">Submit review</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${complete.length ? railHTML("03", p.rg ? `Complete the <em>${esc(p.rg)}</em> look` : "Complete the <em>look</em>", complete, p.rg ? `range.html?r=${encodeURIComponent(p.rg)}` : `shop.html?cat=${p.t}`) : ""}
    ${also.length ? railHTML(complete.length ? "04" : "03", "Customers also <em>bought</em>", also, null) : ""}
    ${recentBefore.length ? railHTML("05", "Recently <em>viewed</em>", recentBefore.slice(0, 8), null) : ""}

    <div class="sc-mbar" id="scMbar" aria-hidden="true">
      <span class="sc-mbar-th"><img src="${esc(T.thumb(p.i[0]))}" alt=""></span>
      <span class="sc-mbar-t"><b>${esc(p.n)}</b><span>${money(p.p)}</span></span>
      <button class="btn sm" data-add="${p.id}" id="scMAdd" tabindex="-1">Add to bag</button>
    </div>

    <div class="sc-vis" id="scVis" role="dialog" aria-modal="true" aria-labelledby="scVisH" hidden>
      <div class="sc-vis-scrim" data-vclose></div>
      <div class="sc-vis-box">
        <div class="sc-vis-head"><div><span class="eyebrow">Visualiser</span><h2 id="scVisH">View in your <em>room</em></h2></div><button class="icon-btn" data-vclose aria-label="Close visualiser">${T.I.close}</button></div>
        <div class="sc-vis-body">
          <div class="sc-vis-stage" id="visStage">
            <img class="vis-bg" id="visBg" src="${esc(CLEAN.wood)}" alt="Room photo">
            <div class="vis-after" id="visAfter">
              <div class="vis-dim"></div>
              <div class="vis-glow" id="visGlow"></div>
              <div class="vis-item" id="visItem" tabindex="0" role="slider" aria-label="${esc(p.n)} position. Arrow keys move, plus and minus resize." aria-valuetext="centre">
                <img id="visImg" src="${esc(CUTOUTS[p.id] ? "assets/img/cutouts/" + CUTOUTS[p.id] : p.i[0])}" alt="${esc(p.n)}" class="${CUTOUTS[p.id] ? "cut" : ""}" draggable="false">
                <span class="vis-handle" id="visHandle" aria-hidden="true"></span>
              </div>
            </div>
            <div class="vis-split" id="visSplit" aria-hidden="true"><i></i></div>
            <span class="vis-tag l">Before</span><span class="vis-tag r">After</span>
          </div>
          <div class="sc-vis-ctl">
            <div class="vis-step"><span class="sc-lbl">01 · Your room</span>
              <label class="btn ghost sm vis-up">${T.I.camera} Upload or take a photo<input type="file" id="visFile" accept="image/*" class="sr-only"></label>
              <div class="vis-rooms">${ROOMS.map(([n, u], k) => `<button class="vis-room ${k === 2 ? "on" : ""}" data-room="${esc(u)}" aria-label="Use the ${n} room" aria-pressed="${k === 2}"><img src="${esc(u)}" alt="" loading="lazy"><span>${n}</span></button>`).join("")}</div>
            </div>
            ${variants.length ? `<div class="vis-step"><span class="sc-lbl">02 · Finish</span><div class="vis-vars"><button class="vis-var on" data-src="${esc(CUTOUTS[p.id] ? "assets/img/cutouts/" + CUTOUTS[p.id] : p.i[0])}" data-cut="${CUTOUTS[p.id] ? 1 : 0}" aria-pressed="true" aria-label="${esc(finishLabel(p))}"><img src="${esc(T.thumb(p.i[0]))}" alt=""></button>${variants.slice(0, 5).map((v) => `<button class="vis-var" data-src="${esc(CUTOUTS[v.id] ? "assets/img/cutouts/" + CUTOUTS[v.id] : v.i[0])}" data-cut="${CUTOUTS[v.id] ? 1 : 0}" aria-pressed="false" aria-label="${esc(finishLabel(v))}"><img src="${esc(T.thumb(v.i[0]))}" alt=""></button>`).join("")}</div></div>` : ""}
            <div class="vis-step"><label class="sc-lbl" for="visSize">${variants.length ? "03" : "02"} · Size</label><input type="range" id="visSize" min="8" max="70" value="26" class="vis-range"></div>
            <div class="vis-step"><label class="sc-lbl" for="visBA">Before / after</label><input type="range" id="visBA" min="0" max="100" value="0" class="vis-range"></div>
            <div class="vis-step vis-row">
              <button class="sc-lit" id="visLit" aria-pressed="true"><span class="sc-lit-sw" aria-hidden="true"><i></i></span><span>Lights on</span></button>
              <button class="btn sm" id="visSave">Save image</button>
            </div>
            <p class="demo-note">Drag the light to move it · drag the corner to resize · photos are never uploaded</p>
          </div>
        </div>
      </div>
    </div>

    <div class="sc-lb" id="scLb" role="dialog" aria-modal="true" aria-label="Full-screen photo" hidden>
      <button class="icon-btn sc-lb-x" data-lbclose aria-label="Close">${T.I.close}</button>
      <button class="icon-btn sc-lb-p" data-lbstep="-1" aria-label="Previous photo">←</button>
      <img id="scLbImg" alt="">
      <button class="icon-btn sc-lb-n" data-lbstep="1" aria-label="Next photo">→</button>
    </div>`;

    jsonLd(p, crumbs);
    T.reveal(top); T.reveal(rest); T.magnetic(top); T.magnetic(rest);
    wireGallery(p);
    wireBuy(p, gp);
    wireTabs();
    wireReviews();
    wireVisualiser(p);
    wireMobileBar();
    if (window.gsap && !T.reduced()) {
      gsap.fromTo(".sc-bleed img", { yPercent: -8, scale: 1.12 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".sc-bleed", start: "top bottom", end: "bottom top", scrub: true } });
    }
    T.recent.push(p.id);
    T.track("view_item", { id: p.id, name: p.n, price: p.p, sku: p.sku, category: cat, range: p.rg || null });
  }

  function railHTML(num, title, list, more) {
    return `<section class="sc-rail-sec" aria-label="${title.replace(/<[^>]+>/g, "")}">
      <div class="wrap sc-rail-head"><div><span class="num">— ${num}</span><h2 class="h3">${title}</h2></div>${more ? `<a class="link-u" href="${more}">See all <span aria-hidden="true">→</span></a>` : ""}</div>
      <div class="sc-rail-track hscroll">${list.map((x) => `<div class="sc-rail-item">${T.card(x)}</div>`).join("")}</div>
    </section>`;
  }
  function keySpecs(p) {
    const s = p.sp, g = (...k) => k.map((x) => s[x]).find(Boolean);
    return [["Light source", g("Globe Type", "Base type", "Base Type")], ["Wattage", g("Wattage", "Light Kit Wattage", "Motor Wattage", "Motor wattage")], ["Brightness", g("Lumens")], ["Colour temperature", g("Kelvin")], ["IP rating", g("IP Rating", "Ip Rating", "IP rating")], ["Material", g("Material")], ["Finish", g("Colour")], ["Height", g("Height")], ["Width / diameter", g("Width", "Diameter", "Blade Span")], ["Cable / rod", g("Cable length", "Cable Length", "Rod length", "Rod Length", "Chain length")], ["Dimmable", /dimmable/i.test(p.n + JSON.stringify(s)) ? "Yes" : null], ["Control", g("Control")]].filter((r) => r[1]);
  }
  function careCopy(p) {
    if (p.t === "fans") return [`<p>Ceiling fans must be installed by a qualified electrician, fixed to a joist or fan-rated mounting and wired to an isolating switch. Keep blades at least 2.1m above the floor.</p><p>Choose the down-rod length (${esc(p.sp["Rod Length"] || p.sp["Rod length"] || "supplied")}) to suit your ceiling height.</p>`, `<p>Switch off and let the fan stop before cleaning. Wipe blades with a dry or slightly damp cloth; avoid solvents. Check the mounting screws once a year.</p>`];
    if (p.t === "outdoor") return [`<p>Outdoor fittings should be installed by a registered electrician with weatherproof connectors. ${p.sp["IP Rating"] || p.sp["Ip Rating"] ? `This light is rated ${esc(p.sp["IP Rating"] || "IP" + p.sp["Ip Rating"])}.` : ""} Make sure seals are seated properly before switching on.</p>`, `<p>Wipe down with a soft damp cloth every few months. On the coast, rinse with fresh water to prevent salt build-up. Solar panels work best when kept clean and in direct sun.</p>`];
    if (p.t === "globes") return [`<p>Switch off and let the old globe cool before replacing it. Check the fitting (${esc(p.sp["Base type"] || p.sp["Base Type"] || "see specifications")}) and the maximum wattage on your light fitting.</p><p>Dimmable globes need a compatible LED dimmer.</p>`, `<p>LED globes run cool and last for years. Dust with a dry cloth when switched off.</p>`];
    if (p.t === "switches") return [`<p>Switches and plugs must be installed by a registered electrician who will issue a Certificate of Compliance (CoC).</p>`, `<p>Clean with a dry cloth only. Never spray cleaner directly onto switches or sockets.</p>`];
    return [`<p>Have your light installed by a registered electrician, who can issue a Certificate of Compliance (CoC). Always switch off at the distribution board first.</p>${p.sp["Globe Type"] ? `<p>Uses ${esc(p.sp["Globe Type"])}: never exceed the maximum wattage.</p>` : ""}`, `<p>Switch off and let the light cool. Dust with a soft, dry cloth; use a slightly damp cloth on glass and metal, and avoid abrasive cleaners on painted or brass finishes.</p>`];
  }
  function jsonLd(p, crumbs) {
    const s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify([{
      "@context": "https://schema.org", "@type": "Product", name: p.n, sku: p.sku, image: p.i, description: p.d, brand: { "@type": "Brand", name: "The Lighting Warehouse" },
      offers: { "@type": "Offer", priceCurrency: "ZAR", price: p.p.toFixed(2), availability: p.st ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: p.u, seller: { "@type": "Organization", name: "The Lighting Warehouse" } }
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.concat([[p.n, T.pUrl(p)]]).map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: new URL(u, location.href).href }))
    }]);
    document.head.appendChild(s);
  }

  /* =====================================================================
     GALLERY: photos, zoom, lightbox, 360° stepper, lit / unlit
     ===================================================================== */
  function wireGallery(p) {
    const viewer = $("#scViewer"), main = $("#scMain"), stage = $("#scStage"), lens = $("#scLens");
    let k = 0, lit = false;
    const setK = (n, from) => {
      k = (n + p.i.length) % p.i.length;
      $("#scK").textContent = pad(k + 1);
      $$(".sc-th").forEach((b, i) => { b.classList.toggle("on", i === k); b.setAttribute("aria-pressed", i === k); });
      $$(".sc-dots i").forEach((d, i) => d.classList.toggle("on", i === k));
      if (from !== "spin") { main.classList.add("out"); setTimeout(() => { main.src = p.i[k]; main.alt = `${p.n} — photo ${k + 1}`; main.onload = () => main.classList.remove("out"); }, T.reduced() ? 0 : 180); }
      $$(".sc-frame").forEach((f, i) => f.classList.toggle("on", i === k));
      $$(".sc-dial i").forEach((d, i) => d.classList.toggle("on", i === k));
      const dn = $("#scDialN"); dn && (dn.textContent = pad(k + 1));
    };
    $$(".sc-th").forEach((b) => b.addEventListener("click", () => setK(+b.dataset.k)));
    // swipe on mobile
    let sx = null;
    stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40 && p.i.length > 1) setK(k + (dx < 0 ? 1 : -1)); sx = null; });

    // lit toggle — warm glow layers over the real photo
    const litBtn = $("#scLit");
    const paintLit = () => { viewer.classList.toggle("lit", lit); viewer.classList.toggle("lit-off", !lit); litBtn.setAttribute("aria-pressed", lit); $("#scLitL").textContent = lit ? "Light on" : "Switch on"; };
    litBtn.addEventListener("click", () => { lit = !lit; paintLit(); T.sound.click(); T.track("product_light_toggle", { id: p.id, on: lit }); });
    setTimeout(() => { lit = true; paintLit(); }, T.reduced() ? 0 : 900);

    // zoom lens (fine pointers) + lightbox
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      stage.addEventListener("pointermove", (e) => {
        const r = main.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        if (x < 0 || y < 0 || x > r.width || y > r.height) { lens.classList.remove("on"); return; }
        const z = 2.6, sr = stage.getBoundingClientRect();
        lens.style.backgroundImage = `url("${main.src}")`; lens.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
        lens.style.backgroundPosition = `${-(x * z - 95)}px ${-(y * z - 95)}px`;
        lens.style.transform = `translate(${e.clientX - sr.left - 95}px, ${e.clientY - sr.top - 95}px)`; lens.classList.add("on");
      });
      stage.addEventListener("pointerleave", () => lens.classList.remove("on"));
    }
    const lb = $("#scLb"), lbImg = $("#scLbImg"); let lastF = null;
    const openLb = () => { lastF = document.activeElement; lbImg.src = p.i[k]; lbImg.alt = `${p.n} — photo ${k + 1}`; lb.hidden = false; requestAnimationFrame(() => lb.classList.add("open")); T.lenis && T.lenis.stop(); $(".sc-lb-x", lb).focus(); };
    const closeLb = () => { lb.classList.remove("open"); setTimeout(() => lb.hidden = true, 350); T.lenis && T.lenis.start(); lastF && lastF.focus(); };
    stage.addEventListener("click", (e) => { if (e.target.closest(".sc-zoom") || !e.target.closest("button")) openLb(); });
    lb.addEventListener("click", (e) => { if (e.target.closest("[data-lbclose]") || e.target === lb) closeLb(); const s = e.target.closest("[data-lbstep]"); if (s) { setK(k + +s.dataset.lbstep); lbImg.src = p.i[k]; } });
    lb.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeLb(); } if (e.key === "ArrowRight" || e.key === "ArrowLeft") { setK(k + (e.key === "ArrowRight" ? 1 : -1)); lbImg.src = p.i[k]; } if (e.key === "Tab") { const f = $$("button", lb); const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); } });
    if (p.i.length < 2) $$(".sc-lb-p, .sc-lb-n", lb).forEach((b) => b.hidden = true);

    // mode tabs
    const modes = $$(".sc-mode");
    modes.forEach((m) => m.addEventListener("click", () => setMode(m.dataset.mode)));
    $(".sc-modes").addEventListener("keydown", (e) => { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; const i = modes.indexOf(document.activeElement); const n = modes[(i + 1) % modes.length]; n && (n.focus(), setMode(n.dataset.mode)); });
    function setMode(m) {
      modes.forEach((b) => { const on = b.dataset.mode === m; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      $("#scPhotos").hidden = m !== "photos"; const sp = $("#scSpin"); sp && (sp.hidden = m !== "spin");
      viewer.classList.toggle("spin", m === "spin");
      if (m === "photos") setK(k); T.track("gallery_mode", { mode: m });
    }

    // 360° stepper: drag left/right through the real studio photos
    const spin = $("#scSpinStage");
    if (spin) {
      let x0 = null, k0 = 0; const step = Math.max(40, Math.min(90, 360 / p.i.length));
      spin.addEventListener("pointerdown", (e) => { x0 = e.clientX; k0 = k; spin.setPointerCapture(e.pointerId); spin.classList.add("drag"); });
      spin.addEventListener("pointermove", (e) => { if (x0 == null) return; const n = k0 + Math.round((x0 - e.clientX) / step); if (((n % p.i.length) + p.i.length) % p.i.length !== k) setK(n, "spin"); });
      const end = () => { x0 = null; spin.classList.remove("drag"); };
      spin.addEventListener("pointerup", end); spin.addEventListener("pointercancel", end);
      spin.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); setK(k + 1, "spin"); } if (e.key === "ArrowLeft") { e.preventDefault(); setK(k - 1, "spin"); } });
      spin.style.touchAction = "pan-y";
    }
  }

  /* =====================================================================
     PURCHASE PANEL
     ===================================================================== */
  function wireBuy(p, gp) {
    const qty = $("#scQty"), add = $("#scAdd"), madd = $("#scMAdd");
    const setQ = (n) => { n = Math.max(1, Math.min(99, n | 0 || 1)); qty.value = n; add.dataset.qty = n; madd && (madd.dataset.qty = n); };
    $$("[data-qd]").forEach((b) => b.addEventListener("click", () => setQ(+qty.value + +b.dataset.qd)));
    qty.addEventListener("change", () => setQ(+qty.value));
    $("#scBuyNow").addEventListener("click", () => { T.bag.add(p.id, +qty.value, $("#scMain")); T.track("begin_checkout", { id: p.id, qty: +qty.value, via: "buy_now" }); setTimeout(() => location.href = "checkout.html", T.reduced() ? 50 : 650); });

    // globes
    const gAdd = $("#scGlobeAdd"), gOnly = $("#scGlobeOnly");
    if (gAdd && gp) {
      const sel = () => $('input[name="globe"]:checked');
      const paint = () => { const s = sel(); if (!s) return; const g = T.get(+s.value), n = +s.dataset.packs; gAdd.textContent = `Add light + ${n} globe${n > 1 ? (/pack/i.test(g.n) ? " packs" : "s") : ""} · ${money(p.p * +qty.value + g.p * n * +qty.value)}`; };
      $$('input[name="globe"]').forEach((r) => r.addEventListener("change", paint)); qty.addEventListener("change", paint); $$("[data-qd]").forEach((b) => b.addEventListener("click", paint)); paint();
      gAdd.addEventListener("click", () => { const s = sel(); if (!s) return; const q = +qty.value; T.bag.add(p.id, q, $("#scMain")); setTimeout(() => T.bag.add(+s.value, +s.dataset.packs * q, s.closest("label").querySelector("img")), 350); T.track("add_globes_bundle", { id: p.id, globe: +s.value }); });
      gOnly.addEventListener("click", () => { const s = sel(); if (!s) return; T.bag.add(+s.value, +s.dataset.packs * +qty.value, s.closest("label").querySelector("img")); });
    }

    // store stock (demo levels, deterministic per store + product)
    const storeSel = $("#scStore"), res = $("#scStoreRes");
    try { const saved = T.store.get("tlw-store", ""); if (saved) { storeSel.value = saved; } } catch (e) { }
    const paintStore = () => {
      const s = D.stores.find((x) => x.id === storeSel.value); if (!s) { res.innerHTML = ""; return; }
      T.store.set("tlw-store", s.id);
      const h = (p.id * 7 + D.stores.indexOf(s) * 13) % 10; const lvl = !p.st ? 0 : h < 6 ? 2 : h < 9 ? 1 : 0;
      const lbl = ["Not on the floor: we can transfer it in 2–3 days", "Limited stock: call to reserve", "In stock on the showroom floor"][lvl];
      res.innerHTML = `<div class="sc-sres lvl${lvl}"><p class="sc-sres-st"><i aria-hidden="true"></i>${lbl}</p><p><b>${esc(s.name)}</b> · ${esc(s.addr)}</p><p><a href="tel:${s.phone.replace(/[^\d]/g, "").replace(/^0/, "+27")}">${esc(s.phone)}</a> · Mon–Fri 8:30–17:00 · Sat 9:00–15:00 · Sun ${esc(s.sun)}</p><p class="demo-note">Demo stock levels · live store stock at launch</p></div>`;
      T.track("check_store_stock", { id: p.id, store: s.id });
    };
    storeSel.addEventListener("change", paintStore); if (storeSel.value) { $("#scStoreBox").open = true; paintStore(); }

    // delivery estimate
    const post = $("#scPost"), dres = $("#scDelivRes");
    const savedPc = T.store.get("tlw-postal", ""); if (savedPc) post.value = savedPc;
    const est = (e) => {
      e && e.preventDefault(); const v = post.value.trim();
      if (!/^\d{4}$/.test(v)) { dres.innerHTML = `<span class="err">Please enter a 4-digit South African postal code.</span>`; post.setAttribute("aria-invalid", "true"); post.focus(); return; }
      post.removeAttribute("aria-invalid"); T.store.set("tlw-postal", v);
      const n = +v, gt = n >= 1 && n <= 2199; const [a, b] = gt ? [1, 2] : [2, 4]; const now = new Date();
      dres.innerHTML = `<b>${gt ? "Gauteng" : "Nationwide"}: ${a}–${b} working days.</b> Order today and it should arrive between <b>${fmtDay(addWorkdays(now, a))}</b> and <b>${fmtDay(addWorkdays(now, b))}</b>. ${p.p >= D.freeShip ? "Delivery is free." : `Free delivery on orders over ${T.moneyShort(D.freeShip)}.`}`;
      T.track("delivery_estimate", { zone: gt ? "gauteng" : "national" });
    };
    $("#scDeliv").addEventListener("submit", est); if (savedPc) est();

    // review link → open reviews tab
    $$("[data-tab-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const t = $(`[data-tab="${a.dataset.tabGo}"]`); t && t.click(); const sec = $("#reviews"); const y = sec.getBoundingClientRect().top + scrollY - 90; T.lenis ? T.lenis.scrollTo(y) : scrollTo({ top: y, behavior: "smooth" }); setTimeout(() => t && t.focus({ preventScroll: true }), 700); }));
  }

  /* ---------- tabs ---------- */
  function wireTabs() {
    const tabs = $$(".sc-tab"), ink = $(".sc-tab-ink");
    const moveInk = (t) => { ink.style.width = t.offsetWidth + "px"; ink.style.transform = `translateX(${t.offsetLeft}px)`; };
    const go = (t, focus) => {
      tabs.forEach((x) => { const on = x === t; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; const pnl = $("#" + x.getAttribute("aria-controls")); pnl.hidden = !on; pnl.classList.toggle("on", on); });
      moveInk(t); focus && t.focus(); t.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    tabs.forEach((t) => t.addEventListener("click", () => go(t)));
    $(".sc-tabs").addEventListener("keydown", (e) => { const i = tabs.indexOf(document.activeElement); if (i < 0) return; let n = null; if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length]; if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length]; if (e.key === "Home") n = tabs[0]; if (e.key === "End") n = tabs[tabs.length - 1]; if (n) { e.preventDefault(); go(n, true); } });
    requestAnimationFrame(() => moveInk(tabs[0])); addEventListener("resize", () => moveInk($(".sc-tab.on")));
  }

  /* ---------- reviews (no fake reviews: form only) ---------- */
  function wireReviews() {
    const f = $("#scRevForm"), pics = $("#rvPics"), prev = $("#rvPrev");
    pics.addEventListener("change", () => { prev.innerHTML = [...pics.files].slice(0, 6).map((fl) => `<img src="${URL.createObjectURL(fl)}" alt="Your photo: ${esc(fl.name)}">`).join(""); });
    f.addEventListener("submit", (e) => { e.preventDefault(); if (!f.reportValidity()) return; T.toast("<span>Thank you. Your review will appear once our team has checked it.</span>", 4200); T.track("review_submit", {}); f.reset(); prev.innerHTML = ""; });
  }

  /* ---------- sticky mobile add-to-bag bar ---------- */
  function wireMobileBar() {
    const bar = $("#scMbar"), cta = $("#scCta"); if (!bar || !cta) return;
    let was = null;
    const check = () => { const r = cta.getBoundingClientRect(); const show = r.bottom < 0 && r.width > 0; if (show === was) return; was = show; bar.classList.toggle("show", show); bar.setAttribute("aria-hidden", !show); $("#scMAdd").tabIndex = show ? 0 : -1; };
    addEventListener("scroll", check, { passive: true }); addEventListener("resize", check); check();
  }

  /* =====================================================================
     VIEW IN YOUR ROOM — real product photo over a room photo
     ===================================================================== */
  function wireVisualiser(p) {
    const vis = $("#scVis"), stage = $("#visStage"), bg = $("#visBg"), item = $("#visItem"), vimg = $("#visImg"), glow = $("#visGlow"), after = $("#visAfter"), split = $("#visSplit");
    const sz = $("#visSize"), ba = $("#visBA"), litB = $("#visLit");
    const st = { x: 0.5, y: 0.3, w: 0.26, lit: true };
    let lastF = null;
    const paint = () => {
      item.style.left = st.x * 100 + "%"; item.style.top = st.y * 100 + "%"; item.style.width = st.w * 100 + "%";
      glow.style.left = st.x * 100 + "%"; glow.style.top = (st.y + st.w * 0.25) * 100 + "%"; glow.style.width = st.w * 260 + "%";
      stage.classList.toggle("lit", st.lit); litB.setAttribute("aria-pressed", st.lit); $("span:last-child", litB).textContent = st.lit ? "Lights on" : "Lights off";
      item.setAttribute("aria-valuetext", `${Math.round(st.x * 100)}% across, ${Math.round(st.y * 100)}% down, size ${Math.round(st.w * 100)}%`);
      sz.value = Math.round(st.w * 100);
    };
    const open = () => { lastF = document.activeElement; vis.hidden = false; requestAnimationFrame(() => vis.classList.add("open")); T.lenis && T.lenis.stop(); document.documentElement.classList.add("sc-lock"); paint(); setTimeout(() => item.focus(), 80); T.track("visualiser_open", { id: p.id }); };
    const close = () => { vis.classList.remove("open"); setTimeout(() => vis.hidden = true, 450); T.lenis && T.lenis.start(); document.documentElement.classList.remove("sc-lock"); lastF && lastF.focus(); };
    $("#scVisOpen").addEventListener("click", open); $("#scBA").addEventListener("click", open);
    $$("[data-vclose]", vis).forEach((b) => b.addEventListener("click", close));
    vis.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close(); return; }
      if (e.key === "Tab") { const f = $$("button, input, label.vis-up, [tabindex='0']", vis).filter((x) => x.offsetParent !== null && !x.matches("input.sr-only")); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    // drag to move, corner to resize
    let drag = null;
    item.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); drag = { mode: e.target === $("#visHandle") ? "size" : "move", x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, sw: st.w, W: r.width, H: r.height }; item.setPointerCapture(e.pointerId); item.classList.add("drag"); e.preventDefault(); });
    item.addEventListener("pointermove", (e) => { if (!drag) return; const dx = (e.clientX - drag.x) / drag.W, dy = (e.clientY - drag.y) / drag.H; if (drag.mode === "move") { st.x = Math.max(0.02, Math.min(0.98, drag.sx + dx)); st.y = Math.max(0.02, Math.min(0.98, drag.sy + dy)); } else st.w = Math.max(0.08, Math.min(0.7, drag.sw + dx * 2)); paint(); });
    const end = () => { drag = null; item.classList.remove("drag"); }; item.addEventListener("pointerup", end); item.addEventListener("pointercancel", end);
    item.addEventListener("keydown", (e) => { const s = e.shiftKey ? 0.05 : 0.01; const m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key]; if (m) { e.preventDefault(); st.x = Math.max(0.02, Math.min(0.98, st.x + m[0])); st.y = Math.max(0.02, Math.min(0.98, st.y + m[1])); paint(); } if (e.key === "+" || e.key === "=") { st.w = Math.min(0.7, st.w + 0.02); paint(); } if (e.key === "-") { st.w = Math.max(0.08, st.w - 0.02); paint(); } });
    sz.addEventListener("input", () => { st.w = +sz.value / 100; paint(); });
    ba.addEventListener("input", () => { const v = +ba.value; after.style.clipPath = `inset(0 0 0 ${v}%)`; split.style.left = v + "%"; stage.classList.toggle("ba", v > 0); });
    litB.addEventListener("click", () => { st.lit = !st.lit; paint(); T.sound.click(); });
    // rooms + upload
    $$(".vis-room", vis).forEach((b) => b.addEventListener("click", () => { bg.src = b.dataset.room; $$(".vis-room", vis).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); }));
    $("#visFile").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; bg.src = URL.createObjectURL(f); $$(".vis-room", vis).forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); }); T.track("visualiser_upload", {}); });
    $$(".vis-var", vis).forEach((b) => b.addEventListener("click", () => { vimg.src = b.dataset.src; vimg.classList.toggle("cut", b.dataset.cut === "1"); $$(".vis-var", vis).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); }));
    // save PNG via canvas (TLW images are served with CORS headers)
    $("#visSave").addEventListener("click", () => {
      const r = stage.getBoundingClientRect(), W = 1600, Hh = Math.round(W * r.height / r.width);
      const c = document.createElement("canvas"); c.width = W; c.height = Hh; const ctx = c.getContext("2d");
      const load = (src, cors) => new Promise((ok, no) => { const im = new Image(); const remote = /^https?:/.test(src) && !src.startsWith(location.origin); if (cors && remote) im.crossOrigin = "anonymous"; im.onload = () => ok(im); im.onerror = no; im.src = remote ? src + (src.includes("?") ? "&" : "?") + "cors=1" : src; });
      Promise.all([load(bg.src, true), load(vimg.src, true)]).then(([b, pi]) => {
        const s = Math.max(W / b.naturalWidth, Hh / b.naturalHeight), bw = b.naturalWidth * s, bh = b.naturalHeight * s;
        ctx.drawImage(b, (W - bw) / 2, (Hh - bh) / 2, bw, bh);
        const cx = st.x * W, cy = st.y * Hh, iw = st.w * W, ih = iw * pi.naturalHeight / pi.naturalWidth;
        if (st.lit) {
          ctx.fillStyle = "rgba(10,7,4,.42)"; ctx.fillRect(0, 0, W, Hh);
          const gy = cy + iw * 0.25 * (Hh / W) * (W / Hh); const gr = ctx.createRadialGradient(cx, cy + ih * 0.1, 0, cx, cy + ih * 0.1, iw * 1.4);
          gr.addColorStop(0, "rgba(255,214,150,.75)"); gr.addColorStop(0.35, "rgba(200, 164, 106,.25)"); gr.addColorStop(1, "rgba(200, 164, 106,0)");
          ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, Hh); void gy;
        }
        ctx.globalCompositeOperation = vimg.classList.contains("cut") ? "source-over" : "multiply";
        ctx.drawImage(pi, cx - iw / 2, cy - ih / 2, iw, ih);
        ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "rgba(10,10,11,.6)"; ctx.fillRect(0, Hh - 54, W, 54);
        ctx.fillStyle = "#f2e6cc"; ctx.font = "500 22px Manrope, sans-serif"; ctx.fillText(`${p.n} · The Lighting Warehouse`, 24, Hh - 20);
        c.toBlob((blob) => { if (!blob) return T.toast("<span>Sorry, this image couldn't be saved.</span>"); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `tlw-${p.s}-in-my-room.png`; document.body.appendChild(a); a.click(); a.remove(); T.toast("<span>Saved. Share it with the family before you decide.</span>"); T.track("visualiser_save", { id: p.id }); }, "image/png");
      }).catch(() => T.toast("<span>Sorry, this image couldn't be saved. Try another room photo.</span>"));
    });
  }
})();
