/* ==========================================================================
   THE GALLERY — category / room / search listing (shop.html)
   ?cat=indoor|outdoor|fans|globes|switches  &sub=<category>  ?room=<room id>  ?q=<natural language>
   ========================================================================== */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA, $ = T.$, $$ = T.$$, esc = T.esc;
  const PAGE = 24;
  const decode = (s) => { const t = document.createElement("textarea"); t.innerHTML = s || ""; return t.value; };
  const norm = (s) => decode(s).toLowerCase().trim();

  /* ---------- URL context ---------- */
  const P = new URLSearchParams(location.search);
  const ctx = { cat: P.get("cat"), sub: P.get("sub"), room: P.get("room"), q: P.get("q") };
  if (ctx.cat && !D.cats[ctx.cat]) ctx.cat = null;
  const roomDef = ctx.room ? D.rooms.find((r) => r.id === ctx.room) : null;

  /* ---------- derived facets ---------- */
  const FINISHES = [
    ["Black", /\bblack|graphite|gun ?metal|matt black|charcoal/],
    ["Brass", /brass/],
    ["Gold", /\bgold|champagne/],
    ["Chrome", /chrome|nickel|silver|stainless|aluminium|titanium/],
    ["Wood", /wood|timber|rattan|bamboo|natural|teak|oak|walnut/],
    ["White", /(?<!warm |cool |day)\bwhite\b/],
    ["Copper", /copper|rose gold|bronze|bronza/],
    ["Smoked glass", /smoke|amber glass|smokey/]
  ];
  const STYLES = [["Modern", /modern|contemporary/], ["Industrial", /industrial|metallic|fabrica/], ["Natural", /natural|wood|rattan|woven|textile/], ["Luxe", /luxe|crystal|chandelier/], ["Farmhouse", /farmhouse/], ["Glass", /glass/]];
  const GLOBES = ["E27", "E14", "B22", "GU10", "G9", "Integrated LED"];
  function facets(p) {
    if (p._g) return p._g;
    const col = ((p.sp.Colour || "") + " " + (p.sp.Material || "") + " " + p.n).toLowerCase();
    const all = (p._s + " " + JSON.stringify(p.sp)).toLowerCase();
    const gt = ((p.sp["Globe Type"] || "") + " " + (p.sp["Base type"] || p.sp["Base Type"] || "")).toUpperCase();
    const globes = GLOBES.filter((g) => g === "Integrated LED" ? /INTEGRATED|BUILT[- ]IN/.test(gt) || (!gt.trim() && /\bled\b/i.test(p.n) && p.t !== "globes" && p.t !== "switches") : new RegExp("\\b" + g + "\\b").test(gt) || (p.t === "globes" && new RegExp("\\b" + g + "\\b", "i").test(p.n)));
    const roomsRaw = (p.sp.Room || "").split("|").map((x) => x.trim().toLowerCase()).filter(Boolean);
    const rooms = D.rooms.filter((r) => r.match.some((m) => roomsRaw.includes(m.toLowerCase()))).map((r) => r.id);
    const cats = p.c.join(" ").toLowerCase();
    return (p._g = {
      fin: FINISHES.filter(([, re]) => re.test(col)).map((f) => f[0]),
      sty: STYLES.filter(([, re]) => re.test(cats)).map((s) => s[0]),
      globe: globes,
      rooms,
      io: p.t === "outdoor" || /outdoor|solar|flood|garden|patio/.test(cats) ? "Outdoor" : p.t === "switches" || p.t === "globes" ? "Either" : "Indoor",
      dim: /dimmable|dimmer/.test(all),
      solar: /solar|rechargeable|emergency|loadshedding|battery/.test(all),
      ip: (+String(p.sp["IP Rating"] || p.sp["Ip Rating"] || p.sp["IP rating"] || "").replace(/\D/g, "").slice(0, 2) || 0) >= 44
    });
  }

  /* ---------- state ---------- */
  const st = { fin: new Set(), sty: new Set(), rooms: new Set(), io: new Set(), globe: new Set(), rg: new Set(), dim: false, solar: false, ip: false, stock: false, min: null, max: null, sort: P.get("sort") || "feat", shown: PAGE };
  ["fin", "sty", "rooms", "io", "globe", "rg"].forEach((k) => { const v = P.get("f_" + k); if (v) v.split(",").forEach((x) => st[k].add(x)); });
  ["dim", "solar", "ip", "stock"].forEach((k) => { if (P.get("f_" + k)) st[k] = true; });
  if (P.get("f_min")) st.min = +P.get("f_min"); if (P.get("f_max")) st.max = +P.get("f_max");

  let BASE = [], LIST = [], PRICE_MAX = 0, parsed = null;

  /* ---------- header copy ---------- */
  // TLW lifestyle photos without baked-in "SHOP …" banner text
  const U = "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/";
  const CLEAN = { bed: U + "Website-BedroomLighting-03.jpg", fabrica: U + "Shop-fabrica.jpg", wood: U + "shop-wood.jpg", solar: U + "shop-solar.jpg", fans: U + "shop-fans.jpg", outdoor: U + "shop-outdoor.jpg", pool: U + "1-1.jpg", dining: U + "Tris.jpg" };
  const ROOM_IMG = { lounge: CLEAN.wood, bedroom: CLEAN.bed, kitchen: CLEAN.dining, dining: CLEAN.dining, bathroom: CLEAN.wood, office: CLEAN.outdoor, patio: CLEAN.fans, garden: CLEAN.solar, garage: CLEAN.outdoor };
  const ROOM_COPY = {
    lounge: "Low, layered light for long conversations: a pendant to anchor the room, lamps to soften the corners.",
    kitchen: "Light that works as hard as you do. Bright where you chop, warm where everyone gathers.",
    dining: "Hang it low, dim it down. The dining table is where light becomes the mood.",
    bedroom: "Soft at the bedside, gentle overhead. Light for winding down.",
    bathroom: "Splash-rated, flattering and bright enough for the morning routine.",
    office: "Even, glare-free light for the hours you put in at home.",
    patio: "For braais that run late and summer evenings on the stoep.",
    garden: "Paths, trees and facades, lit to look their best after dark.",
    garage: "Entrances, passages and garages: the practical light that welcomes you home."
  };
  function headCopy() {
    const h = { kicker: "— 01 / The Gallery", title: "Every<br><em>light</em>", intro: "Pendants, fans, lanterns and globes, chosen by a family that has lived with light since 1974.", img: CLEAN.wood, crumbs: [] };
    if (ctx.q) {
      h.kicker = "— Smart search"; h.title = `“${esc(ctx.q.length > 28 ? ctx.q.slice(0, 26) + "…" : ctx.q)}”`;
      h.intro = "We read that the way a showroom consultant would. Here is everything that fits."; h.img = CLEAN.pool; h.crumbs = [["Search", null]];
    } else if (roomDef) {
      h.kicker = "— Shop by room"; h.title = `The<br><em>${esc(roomDef.name)}</em>`; h.intro = ROOM_COPY[roomDef.id] || ""; h.img = ROOM_IMG[roomDef.id] || CLEAN.bed; h.crumbs = [["Rooms", null], [roomDef.name, null]];
    } else if (ctx.cat) {
      const c = D.cats[ctx.cat], nm = decode(c.name);
      h.img = c.img; h.intro = c.intro;
      const idx = Object.keys(D.cats).indexOf(ctx.cat) + 1;
      h.kicker = `— 0${idx} / ${esc(nm)} collection`;
      h.crumbs = [[nm, ctx.sub ? `shop.html?cat=${ctx.cat}` : null]];
      if (ctx.sub) { const s = decode(ctx.sub); const w = s.split(" "); h.title = w.length > 1 ? `${esc(w.slice(0, -1).join(" "))}<br><em>${esc(w[w.length - 1])}</em>` : `<em>${esc(s)}</em>`; h.crumbs.push([s, null]); }
      else { const w = nm.split(" & "); h.title = w.length > 1 ? `${esc(w[0])} &amp;<br><em>${esc(w[1])}</em>` : `<em>${esc(nm)}</em>`; }
    }
    return h;
  }
  function paintHead() {
    const h = headCopy();
    $("#gKicker").textContent = decode(h.kicker.replace(/<[^>]+>/g, ""));
    const t = $("#gTitle"); t.innerHTML = h.title; delete t.dataset.done; t.classList.remove("is-in"); T.reveal(t.parentNode);
    $("#gIntro").textContent = h.intro;
    const im = $("#gHeadImg"); im.src = h.img; im.alt = "";
    $("#gCrumbs").innerHTML = `<a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a>` + h.crumbs.map(([n, u]) => `<span>/</span>${u ? `<a href="${u}">${esc(n)}</a>` : `<span aria-current="page" style="opacity:1">${esc(n)}</span>`}`).join("");
    const title = h.title.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    document.title = `${decode(title)} | The Gallery · The Lighting Warehouse`;
  }
  paintHead();

  /* ---------- sub-category strip ---------- */
  function paintSubs(products) {
    const box = $("#gSubs");
    let items = [];
    if (ctx.cat) {
      items = [["All " + decode(D.cats[ctx.cat].name), `shop.html?cat=${ctx.cat}`, !ctx.sub]].concat(D.cats[ctx.cat].subs.map((s) => {
        const n = products.filter((p) => p.c.some((c) => norm(c) === norm(s))).length;
        return n ? [decode(s), `shop.html?cat=${ctx.cat}&sub=${encodeURIComponent(decode(s))}`, ctx.sub && norm(ctx.sub) === norm(s), n] : null;
      }).filter(Boolean));
    } else if (roomDef || !ctx.q) {
      items = [["Everything", "shop.html", !ctx.room]].concat(D.rooms.map((r) => [r.name, `shop.html?room=${r.id}`, ctx.room === r.id]));
      items = items.concat(Object.entries(D.cats).map(([k, c]) => [decode(c.name), `shop.html?cat=${k}`, false]));
    } else {
      items = [["All lights", "shop.html", false]].concat(Object.entries(D.cats).map(([k, c]) => [decode(c.name), `shop.html?cat=${k}`, false]));
    }
    box.innerHTML = items.map(([n, u, on, c]) => `<a class="g-sub ${on ? "on" : ""}" href="${u}" ${on ? 'aria-current="page"' : ""}><i aria-hidden="true"></i>${esc(n)}${c ? `<small>${c}</small>` : ""}</a>`).join("");
    const on = $(".g-sub.on", box); if (on) requestAnimationFrame(() => { box.scrollLeft = on.offsetLeft - 40; });
  }

  /* ---------- filtering ---------- */
  function pass(p, skip) {
    const f = facets(p);
    if (skip !== "fin" && st.fin.size && !f.fin.some((x) => st.fin.has(x))) return false;
    if (skip !== "sty" && st.sty.size && !f.sty.some((x) => st.sty.has(x))) return false;
    if (skip !== "rooms" && st.rooms.size && !f.rooms.some((x) => st.rooms.has(x))) return false;
    if (skip !== "io" && st.io.size && !(st.io.has(f.io) || f.io === "Either")) return false;
    if (skip !== "globe" && st.globe.size && !f.globe.some((x) => st.globe.has(x))) return false;
    if (skip !== "rg" && st.rg.size && !st.rg.has(p.rg)) return false;
    if (st.dim && !f.dim) return false;
    if (st.solar && !f.solar) return false;
    if (st.ip && !f.ip) return false;
    if (st.stock && !p.st) return false;
    if (st.min != null && p.p < st.min) return false;
    if (st.max != null && p.p > st.max) return false;
    return true;
  }
  function sortList(list) {
    const l = list.slice();
    if (st.sort === "low") l.sort((a, b) => a.p - b.p);
    else if (st.sort === "high") l.sort((a, b) => b.p - a.p);
    else if (st.sort === "az") l.sort((a, b) => a.n.localeCompare(b.n));
    else if (st.sort === "new") l.sort((a, b) => b.id - a.id);
    else if (st.sort === "sale") l.sort((a, b) => (T.isSale(b) - T.isSale(a)) || ((b.r - b.p) - (a.r - a.p)));
    return l;
  }
  function activeCount() { return st.fin.size + st.sty.size + st.rooms.size + st.io.size + st.globe.size + st.rg.size + (st.dim ? 1 : 0) + (st.solar ? 1 : 0) + (st.ip ? 1 : 0) + (st.stock ? 1 : 0) + (st.min != null || st.max != null ? 1 : 0); }
  function syncUrl() {
    const u = new URLSearchParams();
    ["cat", "sub", "room", "q"].forEach((k) => ctx[k] && u.set(k, ctx[k]));
    ["fin", "sty", "rooms", "io", "globe", "rg"].forEach((k) => st[k].size && u.set("f_" + k, [...st[k]].join(",")));
    ["dim", "solar", "ip", "stock"].forEach((k) => st[k] && u.set("f_" + k, 1));
    if (st.min != null) u.set("f_min", st.min); if (st.max != null) u.set("f_max", st.max);
    if (st.sort !== "feat") u.set("sort", st.sort);
    const s = u.toString(); try { history.replaceState(null, "", s ? "?" + s : location.pathname); } catch (e) { }
  }

  /* ---------- grid rendering ---------- */
  const LIFE = [CLEAN.bed, CLEAN.dining, CLEAN.fabrica, CLEAN.fans, CLEAN.wood, CLEAN.pool, CLEAN.outdoor, CLEAN.solar];
  const STORIES = [
    ["Hung like", "art", "Every piece in the gallery is photographed exactly as it arrives in our showrooms. Switch it on in your mind: this is the one people ask about."],
    ["The quiet", "statement", "A single good light changes a room more than new paint. Start with the piece you will look at every evening."],
    ["Made for", "evenings", "Warm 2700K to 3000K globes, a dimmer and the right height. The rest of the room follows."],
    ["Chosen by", "family", "Since 1974 the same family has picked what goes on our walls. This is one of their favourites right now."]
  ];
  function heroFor(k) {
    // pick a striking product from the current list that is not on screen right next to the feature
    const pool = LIST.filter((p) => p.i.length > 1 && p.p >= 500);
    const src = pool.length ? pool : LIST;
    return src[(k * 7 + 3) % src.length];
  }
  function featureHTML(k) {
    const p = heroFor(k); if (!p) return "";
    const s = STORIES[k % STORIES.length], img = LIFE[(k + (ctx.cat ? Object.keys(D.cats).indexOf(ctx.cat) * 2 : 0)) % LIFE.length];
    const flip = k % 2 ? " flip" : "";
    return `<section class="g-feature${flip}" aria-label="Featured: ${esc(p.n)}">
      <div class="g-f-life"><img src="${esc(img)}" alt="A warmly lit South African home styled by The Lighting Warehouse" loading="lazy"></div>
      <a class="g-f-piece" href="${T.pUrl(p)}" aria-label="${esc(p.n)}"><span class="g-f-pool"><img src="${esc(p.i[0])}" alt="${esc(p.n)}" loading="lazy"></span><span class="g-f-glow" aria-hidden="true"></span></a>
      <div class="g-f-copy">
        <span class="num">— Feature ${String(k + 1).padStart(2, "0")}</span>
        <h2 class="h3">${s[0]} <em>${s[1]}</em>.</h2>
        <p>${esc(s[2])}</p>
        <div class="g-f-name"><span class="sub">${esc(T.rangeOf(p))}</span><b>${esc(p.n)}</b><span class="price">${T.money(p.p)}${T.isSale(p) ? `<s>${T.money(p.r)}</s>` : ""}</span></div>
        <div class="flex"><button class="btn sm" data-add="${p.id}">Add to bag</button><a class="link-u" href="${T.pUrl(p)}">View the piece <span aria-hidden="true">→</span></a></div>
      </div>
    </section>`;
  }
  function aiHTML(k) {
    const qs = ctx.cat === "fans" ? ["Which fan size for a 4x4m bedroom?", "Quietest fan with a light?"] : ctx.cat === "outdoor" ? ["Best lights for a coastal stoep?", "Solar lights that last all night?"] : ctx.cat === "globes" ? ["Which globe fits a GU10 downlight?", "Warm white vs daylight?"] : ["How high should a dining pendant hang?", "Lights that work during load-shedding?"];
    return `<aside class="g-ai" aria-label="Ask the AI Assistant">
      <div class="g-ai-orb" aria-hidden="true"></div>
      <div class="g-ai-copy"><span class="eyebrow">Light Assistant</span><h2 class="h3">Not sure what you <em>need</em>?</h2><p>Tell our AI Assistant about your room and it will shortlist the right lights, globes and sizes.</p></div>
      <div class="g-ai-acts">${qs.map((q) => `<button class="chip" data-ask="${esc(q)}">${esc(q)}</button>`).join("")}<button class="btn sm" data-open="chat">Ask the AI Assistant</button></div>
    </aside>`;
  }
  function cellHTML(p, i) {
    return `<div class="g-cell" style="--i:${i % 4}"><span class="g-no" aria-hidden="true">No. ${String(i + 1).padStart(3, "0")}</span>${T.card(p)}</div>`;
  }
  function chunk(from, to) {
    let h = "";
    for (let i = from; i < to && i < LIST.length; i++) {
      h += cellHTML(LIST[i], i);
      const n = i + 1;
      if (n < LIST.length && n % 8 === 0) h += (n % 16 === 0) ? aiHTML(n / 16) : featureHTML(Math.floor(n / 16));
    }
    return h;
  }
  function skeletons(n) { return Array.from({ length: n }, () => `<div class="g-cell g-skel" aria-hidden="true"><div class="skel g-sk-img"></div><div class="skel g-sk-l"></div><div class="skel g-sk-s"></div></div>`).join(""); }
  function emptyHTML() {
    return `<div class="g-empty"><span class="num">— No match</span><h2 class="h2">Nothing in this <em>light</em>.</h2><p class="lead">Try removing a filter or two, or let our assistant find the closest match.</p><div class="flex mt-m"><button class="btn" id="gEmptyClear">Clear filters</button><button class="btn ghost" data-open="chat">Ask the AI Assistant</button></div></div>`;
  }
  function paintCount() {
    const n = LIST.length, shown = Math.min(st.shown, n);
    $("#gResult").innerHTML = `<b>${n}</b> ${n === 1 ? "light" : "lights"}`;
    $("#gCount").textContent = n; $("#gCountLbl").textContent = n === 1 ? "piece on show" : "pieces on show";
    $("#gShown").textContent = n ? `Showing ${shown} of ${n}` : "";
    $("#gProg").style.width = n ? (shown / n * 100) + "%" : "0";
    $("#gMore").hidden = !n;
    $("#gLoad").hidden = shown >= n;
    const fc = activeCount(); $("#gFcount").textContent = fc; $("#gFcount").hidden = !fc;
  }
  function render(reset) {
    LIST = sortList(BASE.filter((p) => pass(p)));
    if (reset) st.shown = PAGE;
    const g = $("#gGrid");
    g.innerHTML = LIST.length ? chunk(0, st.shown) : emptyHTML();
    g.setAttribute("aria-busy", "false");
    T.reveal(g); T.magnetic(g);
    paintCount(); paintChips();
    const ec = $("#gEmptyClear"); ec && ec.addEventListener("click", clearAll);
  }
  function loadMore() {
    const g = $("#gGrid"), from = st.shown, to = Math.min(LIST.length, from + PAGE);
    const btn = $("#gLoad"); btn.disabled = true;
    g.insertAdjacentHTML("beforeend", skeletons(Math.min(6, to - from)));
    setTimeout(() => {
      $$(".g-skel", g).forEach((s) => s.remove());
      // the break after the last visible card of the previous batch (if any) was already written; continue
      g.insertAdjacentHTML("beforeend", chunk(from, to));
      st.shown = to; T.reveal(g); T.magnetic(g); paintCount(); btn.disabled = false;
      const first = g.querySelectorAll(".g-cell")[from]; first && first.querySelector("a") && first.querySelector("a").focus({ preventScroll: true });
      T.track("view_item_list_more", { shown: to, total: LIST.length });
    }, T.reduced() ? 60 : 650);
  }
  $("#gLoad").addEventListener("click", loadMore);

  /* ---------- active chips ---------- */
  function paintChips() {
    const c = [];
    const lbl = { rooms: (v) => (D.rooms.find((r) => r.id === v) || {}).name || v };
    ["fin", "sty", "rooms", "io", "globe", "rg"].forEach((k) => st[k].forEach((v) => c.push([k, v, (lbl[k] ? lbl[k](v) : v)])));
    if (st.dim) c.push(["dim", 1, "Dimmable"]); if (st.solar) c.push(["solar", 1, "Solar / rechargeable"]); if (st.ip) c.push(["ip", 1, "Weatherproof IP44+"]); if (st.stock) c.push(["stock", 1, "In stock"]);
    if (st.min != null || st.max != null) c.push(["price", 1, `${T.moneyShort(st.min || 0)} – ${T.moneyShort(st.max != null ? st.max : PRICE_MAX)}`]);
    const box = $("#gActive");
    box.innerHTML = c.map(([k, v, l]) => `<button class="chip on g-chip" data-k="${k}" data-v="${esc(v)}" aria-label="Remove filter ${esc(l)}">${esc(l)} <span aria-hidden="true">×</span></button>`).join("") + (c.length > 1 ? `<button class="g-chip-clear" data-k="all">Clear all</button>` : "");
  }
  $("#gActive").addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k, v = b.dataset.v;
    if (k === "all") return clearAll();
    if (k === "price") { st.min = st.max = null; }
    else if (st[k] instanceof Set) st[k].delete(v); else st[k] = false;
    commit();
  });
  function commit() { syncUrl(); render(true); paintPanel(); T.track("filter_change", { n: activeCount(), results: LIST.length }); }
  function clearAll() { ["fin", "sty", "rooms", "io", "globe", "rg"].forEach((k) => st[k].clear()); st.dim = st.solar = st.ip = st.stock = false; st.min = st.max = null; commit(); }

  /* ---------- filter panel ---------- */
  const SW = { Black: "#141414", Brass: "linear-gradient(135deg,#7a5a24,#e6c886 45%,#a87e3a 60%,#5d441c)", Gold: "linear-gradient(135deg,#8d6b1f,#f3d77d 45%,#c79a34 65%,#7a5a16)", Chrome: "linear-gradient(135deg,#7d828a,#f4f6f8 40%,#a8adb4 60%,#5d6168)", Wood: "linear-gradient(120deg,#6b4423,#a87a4c 30%,#7d5430 55%,#b88a5a 80%)", White: "#f3efe7", Copper: "linear-gradient(135deg,#6e3b1f,#e0a07a 45%,#b56a3e 65%,#5e301a)", "Smoked glass": "linear-gradient(135deg,rgba(60,50,40,.9),rgba(160,130,90,.6) 50%,rgba(40,34,28,.95))" };
  function countFor(key, val) { return BASE.filter((p) => pass(p, key) && (key === "rg" ? p.rg === val : facets(p)[key].includes ? facets(p)[key].includes(val) : facets(p)[key] === val)).length; }
  function group(title, num, inner, open) { return `<details class="g-grp" ${open ? "open" : ""}><summary><span class="num">${num}</span>${title}</summary><div class="g-grp-b">${inner}</div></details>`; }
  function opt(key, val, label, extra) {
    const n = countFor(key, val), on = st[key].has(val);
    if (!n && !on) return "";
    return `<button type="button" class="g-opt ${extra || ""} ${on ? "on" : ""}" data-fk="${key}" data-fv="${esc(val)}" aria-pressed="${on}">${extra === "sw" ? `<i style="background:${SW[val]}" aria-hidden="true"></i>` : ""}<span>${esc(label)}</span><small>${n}</small></button>`;
  }
  function paintPanel() {
    const b = $("#gPanelB");
    const lo = st.min != null ? st.min : 0, hi = st.max != null ? st.max : PRICE_MAX;
    const ranges = [...new Set(BASE.map((p) => p.rg).filter(Boolean))].sort();
    const ioOpts = ["Indoor", "Outdoor"].map((v) => { const n = BASE.filter((p) => pass(p, "io") && (facets(p).io === v)).length; const on = st.io.has(v); return n || on ? `<button type="button" class="g-opt ${on ? "on" : ""}" data-fk="io" data-fv="${v}" aria-pressed="${on}"><span>${v}</span><small>${n}</small></button>` : ""; }).join("");
    const tog = (k, l) => { const sv = st[k]; st[k] = false; const n = BASE.filter((p) => pass(p) && (k === "stock" ? p.st : facets(p)[k])).length; st[k] = sv; return `<label class="g-tog"><input type="checkbox" data-tk="${k}" ${st[k] ? "checked" : ""}><span class="g-tog-sw" aria-hidden="true"></span><span>${l}</span><small>${n}</small></label>`; };
    let h = group("Price", "01", `<div class="g-price"><div class="g-price-v"><span id="gPmin">${T.moneyShort(lo)}</span><span id="gPmax">${T.moneyShort(hi)}</span></div>
      <div class="g-dual"><input type="range" id="gRmin" min="0" max="${PRICE_MAX}" step="10" value="${lo}" aria-label="Minimum price"><input type="range" id="gRmax" min="0" max="${PRICE_MAX}" step="10" value="${hi}" aria-label="Maximum price"></div>
      <div class="g-presets">${[[0, 500, "Under R500"], [500, 1500, "R500 – R1,500"], [1500, 4000, "R1,500 – R4,000"], [4000, PRICE_MAX, "R4,000+"]].map(([a, z, l]) => `<button type="button" class="chip" data-pa="${a}" data-pz="${z}">${l}</button>`).join("")}</div></div>`, true);
    h += group("Finish", "02", `<div class="g-opts sw-grid">${FINISHES.map(([f]) => opt("fin", f, f, "sw")).join("")}</div>`, true);
    const sty = STYLES.map(([s]) => opt("sty", s, s)).join(""); if (sty) h += group("Style", "03", `<div class="g-opts">${sty}</div>`);
    const rms = D.rooms.map((r) => opt("rooms", r.id, r.name)).join(""); if (rms && !roomDef) h += group("Room", "04", `<div class="g-opts">${rms}</div>`, !!st.rooms.size);
    if (ioOpts && ctx.cat !== "switches" && ctx.cat !== "globes") h += group("Indoor or outdoor", "05", `<div class="g-opts">${ioOpts}</div>`, !!st.io.size);
    const gl = GLOBES.map((g) => opt("globe", g, g)).join(""); if (gl) h += group("Globe type", "06", `<div class="g-opts">${gl}</div>`, !!st.globe.size);
    if (ranges.length) h += group("Range", "07", `<div class="g-opts">${ranges.map((r) => opt("rg", r, r)).join("")}</div>`, !!st.rg.size);
    h += group("Features", "08", tog("dim", "Dimmable") + tog("solar", "Solar or rechargeable") + tog("ip", "Weatherproof (IP44+)") + tog("stock", "In stock online"), st.dim || st.solar || st.ip || st.stock);
    b.innerHTML = h;
    $("#gApply").textContent = `Show ${LIST.length} ${LIST.length === 1 ? "light" : "lights"}`;
    const rmin = $("#gRmin"), rmax = $("#gRmax");
    const upd = (final) => { let a = +rmin.value, z = +rmax.value; if (a > z) [a, z] = [z, a]; $("#gPmin").textContent = T.moneyShort(a); $("#gPmax").textContent = T.moneyShort(z); if (final) { st.min = a > 0 ? a : null; st.max = z < PRICE_MAX ? z : null; commit(); } };
    [rmin, rmax].forEach((r) => { r.addEventListener("input", () => upd(false)); r.addEventListener("change", () => upd(true)); });
  }
  $("#gPanelB").addEventListener("click", (e) => {
    const o = e.target.closest("[data-fk]");
    if (o) { const k = o.dataset.fk, v = o.dataset.fv; st[k].has(v) ? st[k].delete(v) : st[k].add(v); const keep = o.closest("details"); const idx = $$("details", $("#gPanelB")).indexOf(keep); commit(); const d = $$("details", $("#gPanelB"))[idx]; d && (d.open = true); const again = $(`[data-fk="${k}"][data-fv="${CSS.escape(v)}"]`, $("#gPanelB")); again && again.focus(); return; }
    const pr = e.target.closest("[data-pa]");
    if (pr) { st.min = +pr.dataset.pa || null; st.max = +pr.dataset.pz >= PRICE_MAX ? null : +pr.dataset.pz; commit(); }
  });
  $("#gPanelB").addEventListener("change", (e) => { const t = e.target.closest("[data-tk]"); if (!t) return; st[t.dataset.tk] = t.checked; const k = t.dataset.tk; commit(); const again = $(`[data-tk="${k}"]`, $("#gPanelB")); again && again.focus(); $$("details", $("#gPanelB")).pop().open = true; });

  const panel = $("#gPanel"), scrim = $("#gScrim"), fbtn = $("#gFilterBtn"); let lastFocus = null;
  function openPanel() {
    lastFocus = document.activeElement; paintPanel(); scrim.hidden = false; panel.removeAttribute("inert"); panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => { panel.classList.add("open"); scrim.classList.add("on"); });
    fbtn.setAttribute("aria-expanded", "true"); T.lenis && T.lenis.stop(); document.documentElement.classList.add("g-lock");
    setTimeout(() => { const f = $("#gPanelX"); f && f.focus(); }, 60);
  }
  function closePanel() {
    panel.classList.remove("open"); scrim.classList.remove("on"); panel.setAttribute("aria-hidden", "true"); panel.setAttribute("inert", "");
    fbtn.setAttribute("aria-expanded", "false"); T.lenis && T.lenis.start(); document.documentElement.classList.remove("g-lock");
    setTimeout(() => { scrim.hidden = true; }, 500); lastFocus && lastFocus.focus && lastFocus.focus();
  }
  fbtn.addEventListener("click", openPanel);
  $("#gPanelX").addEventListener("click", closePanel); scrim.addEventListener("click", closePanel);
  $("#gApply").addEventListener("click", () => { closePanel(); const top = $("#gBar").getBoundingClientRect().top + scrollY - 80; T.lenis ? T.lenis.scrollTo(top) : scrollTo({ top, behavior: "smooth" }); });
  $("#gClear").addEventListener("click", clearAll);
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closePanel(); }
    if (e.key !== "Tab") return;
    const f = $$("button, input, summary, select, a[href]", panel).filter((x) => x.offsetParent !== null);
    if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
  // mobile bottom sheet: drag the handle down to close
  (function sheetDrag() {
    const h = $(".g-panel-h"); let y0 = null, dy = 0;
    h.addEventListener("touchstart", (e) => { if (innerWidth > 760) return; y0 = e.touches[0].clientY; panel.style.transition = "none"; }, { passive: true });
    h.addEventListener("touchmove", (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = `translateY(${dy}px)`; }, { passive: true });
    h.addEventListener("touchend", () => { if (y0 == null) return; panel.style.transition = ""; panel.style.transform = ""; if (dy > 110) closePanel(); y0 = null; dy = 0; });
  })();

  /* ---------- sort + lights off + ask ---------- */
  const sortSel = $("#gSort"); sortSel.value = st.sort;
  sortSel.addEventListener("change", () => { st.sort = sortSel.value; syncUrl(); render(true); T.track("sort", { by: st.sort }); });
  const lights = $("#gLights");
  let lightsOff = T.store.get("tlw-lights-off", false);
  function paintLights() { $("#gHall").classList.toggle("lights-off", lightsOff); $("#gGrid").classList.toggle("lights-off", lightsOff); lights.setAttribute("aria-pressed", lightsOff);  }
  lights.addEventListener("click", () => { lightsOff = !lightsOff; T.store.set("tlw-lights-off", lightsOff); paintLights(); T.sound.click(); T.track("lights_off_toggle", { on: lightsOff }); });
  paintLights();
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-ask]"); if (!a) return; e.preventDefault(); if (window.TLWChat && TLWChat.send) TLWChat.send(a.dataset.ask); else T.openOv("chat"); });

  // sticky bar state
  const bar = $("#gBar");
  addEventListener("scroll", () => bar.classList.toggle("stuck", bar.getBoundingClientRect().top <= 70), { passive: true });

  /* ---------- boot ---------- */
  $("#gGrid").innerHTML = skeletons(6);
  T.ready((products) => {
    if (ctx.q) { const r = T.search(ctx.q, 9999); BASE = r.items; parsed = r.parsed; const chips = T.parsedChips(parsed); if (chips.length) { const box = $("#gParsed"); box.hidden = false; box.innerHTML = `<span class="eyebrow no-line">We understood</span><div class="parsed">${chips.map((c) => `<span class="chip on">${esc(c)}</span>`).join("")}</div>`; } T.track("search", { q: ctx.q, results: r.total }); }
    else if (roomDef) BASE = products.filter((p) => facets(p).rooms.includes(roomDef.id));
    else if (ctx.cat) { BASE = products.filter((p) => p.t === ctx.cat); if (ctx.sub) BASE = BASE.filter((p) => p.c.some((c) => norm(c) === norm(ctx.sub))); if (!BASE.length && ctx.sub) BASE = products.filter((p) => p.c.some((c) => norm(c).includes(norm(ctx.sub)))); }
    else BASE = products.slice();
    paintSubs(ctx.cat ? products.filter((p) => p.t === ctx.cat) : products);
    PRICE_MAX = Math.ceil(Math.max(100, ...BASE.map((p) => p.p)) / 100) * 100;
    render(true);
    T.track("view_item_list", { list: ctx.cat || ctx.room || (ctx.q ? "search" : "all"), sub: ctx.sub || null, total: LIST.length });
    if (window.gsap && !T.reduced()) {
      gsap.to("#gHeadImg", { yPercent: 12, scale: 1.12, ease: "none", scrollTrigger: { trigger: ".g-head", start: "top top", end: "bottom top", scrub: true } });
    }
  });
})();
