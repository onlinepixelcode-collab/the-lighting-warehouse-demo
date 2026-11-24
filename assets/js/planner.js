/* AI Lighting Planner: "Design your light" */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA;
  if (!T || !D || document.body.dataset.page !== "planner") return;
  const { $, $$, esc, money } = T;
  const UP = "https://lightingwarehouse.co.za/wp-content/uploads/";
  const pic = (path, cb) => `src="${UP + path}"${cb ? ` class="cb" style="--cb:${cb}"` : ""}`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- questions ---------------- */
  const ROOMS = [
    { id: "lounge", name: "Lounge", note: "Sofas, TV, reading and long evenings", img: pic("2025/12/shop-fans.jpg", 1.14), lm: [100, 150], m2: 20, re: /lounge|living/ },
    { id: "kitchen", name: "Kitchen", note: "Cooking, homework, the heart of the house", img: pic("2026/06/Shop-Dublin.jpg", 1.42), lm: [300, 400], m2: 12, re: /kitchen/ },
    { id: "dining", name: "Dining room", note: "Sunday lunches and candlelit dinners", img: pic("2025/12/Tris.jpg"), lm: [150, 250], m2: 14, re: /dining/ },
    { id: "bedroom", name: "Bedroom", note: "Calm, warm and easy to dim", img: pic("2025/12/Website-BedroomLighting-03.jpg"), lm: [100, 150], m2: 14, re: /bedroom|bedroon|bedside/ },
    { id: "bathroom", name: "Bathroom", note: "Bright at the mirror, safe near water", prod: "Saxon Led 1 Light Long Gold", lm: [200, 300], m2: 6, re: /bathroom/ },
    { id: "office", name: "Home office", note: "Focus light for long working days", prod: "Monty 1 Light", lm: [300, 500], m2: 10, re: /office|study|reading/ },
    { id: "patio", name: "Patio & stoep", note: "Braais, pool evenings and the garden", img: pic("2025/12/1-1.jpg"), lm: [50, 100], m2: 16, re: /patio|deck|garden|outdoor/ }
  ];
  const CEIL = [
    { id: 2.4, name: "2.4 m", note: "Standard ceiling. Most South African homes.", k: 1 },
    { id: 2.7, name: "2.7 m", note: "High ceiling. Room for longer pendants.", k: 1.1 },
    { id: 3.2, name: "3 m +", note: "Double volume or raked. Statement pieces.", k: 1.25 }
  ];
  const STYLES = [
    { id: "industrial", name: "Industrial", note: "Black steel, cages and timber", img: pic("2025/12/Shop-fabrica.jpg", 1.14), re: /industrial|fabrica|cage|black/ },
    { id: "natural", name: "Natural & woven", note: "Rattan, bamboo and soft texture", img: pic("2025/12/03-ShopWoven.jpg", 1.42), re: /natural|rattan|woven|bamboo|cane|textile|seagrass|wicker|jute/ },
    { id: "glass", name: "Glass", note: "Clear, smoked and amber glass", img: pic("2025/12/04-ShopGlass.jpg", 1.42), re: /glass|smoked|amber|clear|opal/ },
    { id: "modern", name: "Modern minimal", note: "Clean lines and integrated LED", img: pic("2025/12/shop-modern.jpg", 1.42), re: /modern|minimal|linear|white|led/ },
    { id: "wood", name: "Warm wood", note: "Timber, linen and calm", img: pic("2025/12/shop-wood.jpg", 1.14), re: /wood|timber|oak|walnut|riviera|natural/ },
    { id: "luxe", name: "Luxe brass", note: "Brass, gold and crystal", prod: "Penna 10 Light", re: /luxe|brass|gold|crystal|champagne|satin|chandelier/ }
  ];
  const MOODS = [
    { id: "cosy", name: "Cosy", note: "Warm 2700–3000K, low and dimmable", cls: "m-cosy", share: 0.6, k: 3000 },
    { id: "bright", name: "Bright", note: "Even, clear light. 4000K where it helps", cls: "m-bright", share: 0.7, k: 4000 },
    { id: "dramatic", name: "Dramatic", note: "Pools of light, shadows and accents", cls: "m-dramatic", share: 0.45, k: 2700 }
  ];
  const BUDGETS = [
    { id: 3000, name: "R3,000", note: "Essentials. The right light, sensibly." },
    { id: 7500, name: "R7,500", note: "Considered. Good pieces in every layer." },
    { id: 15000, name: "R15,000", note: "Statement. A piece people ask about." },
    { id: 30000, name: "R30,000", note: "Showpiece. No compromises." }
  ];
  const STEPS = [
    { key: "room", label: "Room", q: "Which room are we <em>lighting?</em>", sub: "Pick one room. You can run the planner again for the next one." },
    { key: "size", label: "Size", q: "How big is the <em>room?</em>", sub: "Length × width in metres. A rough number is fine: we work out how much light you need from this." },
    { key: "ceil", label: "Ceiling", q: "How high is the <em>ceiling?</em>", sub: "Higher ceilings need more light and longer drops." },
    { key: "style", label: "Style", q: "Which look feels like <em>you?</em>", sub: "We'll lean towards pieces in this style." },
    { key: "mood", label: "Mood", q: "How should the room <em>feel</em> at night?", sub: "The same room, lit three ways." },
    { key: "budget", label: "Budget", q: "What would you like to <em>spend?</em>", sub: "For the whole room, including globes. We'll keep the plan inside it." }
  ];
  const A = { room: null, size: null, ceil: null, style: null, mood: null, budget: null };
  let step = 0;

  /* ---------------- catalogue helpers ---------------- */
  const GLM = { E27: 806, B22: 800, E14: 470, GU10: 480, G9: 450, G4: 180, "GU5.3": 480 };
  const firstNum = (s, min) => (String(s || "").match(/\d[\d,.]*/g) || []).map((x) => parseFloat(x.replace(/,/g, ""))).find((x) => x >= (min || 0));
  function lumensOf(p) {
    const all = Object.values(p.sp).join(" | ");
    const m = all.match(/(\d[\d,.]*)\s*(?:lm|lumen)/i); if (m) return parseFloat(m[1].replace(/,/g, ""));
    return /^\s*\d[\d,]*\s*$/.test(p.sp.Lumens || "") ? parseFloat(p.sp.Lumens.replace(/,/g, "")) : 0;
  }
  function fx(p) {
    if (p._fx) return p._fx;
    const gt = p.sp["Globe Type"] || "";
    const fit = ((gt.match(/\b(E27|E14|B22|GU10|G9|G4|GU5\.3)\b/i) || [])[1] || "").toUpperCase() || null;
    const integrated = /integrated/i.test(gt) || (!fit && /\bled\b/i.test(p.n));
    const count = +((gt.match(/(\d+)\s*x/i) || [])[1] || 1);
    let lm = integrated ? (lumensOf(p) || (firstNum(p.sp.Wattage, 1) || 10) * 90) : count * (GLM[fit] || 600);
    if (p.t === "outdoor" && !integrated && !fit) lm = 600;
    return (p._fx = { fit, integrated, count: fit ? count : 0, lm: clamp(Math.round(lm), 120, 9000) });
  }
  const room = () => ROOMS.find((r) => r.id === A.room);
  const style = () => STYLES.find((s) => s.id === A.style);
  const mood = () => MOODS.find((m) => m.id === A.mood);
  const cats = (p) => p.c.join(" ");
  const roomOf = (p) => (p.sp.Room || "").toLowerCase();
  const C = {
    pendant: /pendant/i, ceiling: /ceiling lighting|led ceiling|modern ceiling|glass ceiling|crystal ceiling|traditional ceiling|chandelier/i,
    down: /panels and down|recessed|surface mount/i, spots: /spotlight|spots for track/i, wall: /indoor wall lighting|led wall light|sconce|wall light/i,
    floor: /floor lamp/i, table: /table lamp/i, desk: /desk lamp|table lamp/i, strip: /strip/i, bathceil: /ceiling bathroom|bathroom lighting/i, bathwall: /wall bathroom|bathroom lighting/i,
    outwall: /outdoor .*wall|lantern/i, spike: /spike|bollard|garden recessed|pedestal/i, flood: /flood|motion sensor/i
  };
  const PLAN = {
    lounge: { amb: ["pendant", "ceiling"], task: [["floor"], (a) => a > 25 ? 2 : 1, "Task", "A floor lamp beside the sofa for reading, and a soft second source at eye level."], acc: [["table", "wall"], () => 2, "Accent", "Lamps and wall lights in the corners stop the room feeling flat."] },
    kitchen: { amb: ["down", "ceiling"], task: [["pendant"], (a) => clamp(Math.round(a / 6), 2, 3), "Task", "Pendants over the island or counter, 65–75 cm above the surface."], acc: [["strip"], (a) => clamp(Math.round(Math.sqrt(a) * 1.5), 2, 8), "Accent", "LED strip under the wall cupboards lights the worktop where you chop. Quantity in metres."] },
    dining: { amb: ["spots", "down", "ceiling"], task: [["pendant"], (a) => a > 18 ? 2 : 1, "Feature", "The statement over the table: bottom of the shade 75–85 cm above the top."], acc: [["wall"], () => 2, "Accent", "A pair of wall lights for when the pendant is dimmed low."] },
    bedroom: { amb: ["pendant", "ceiling"], task: [["table"], () => 2, "Task", "A matching pair of bedside lamps, so each side reads without waking the other."], acc: [["wall", "floor"], () => 1, "Accent", "A warm accent in the corner for the last hour of the evening."] },
    bathroom: { amb: ["bathceil"], task: [["bathwall"], () => 2, "Task", "Lights either side of the mirror light your face evenly, with no shadows."], acc: null },
    office: { amb: ["ceiling", "down", "pendant"], task: [["desk"], () => 1, "Task", "A desk lamp on the opposite side to your writing hand."], acc: [["floor", "wall"], () => 1, "Accent", "Soft background light cuts screen glare and eye strain."] },
    patio: { out: true, amb: ["outwall"], ambQ: (a) => clamp(Math.round(a / 6), 2, 6), task: [["flood"], () => 1, "Task", "A sensor flood over the braai area and side passage. Light where you need it, only when you need it."], acc: [["spike"], (a) => clamp(Math.round(a / 6), 2, 5), "Accent", "Spike and bollard lights along the path and into the plants."] }
  };
  function pool(keys, out) {
    const R = room(), P = T.products;
    let list = P.filter((p) => (p.t === (out ? "outdoor" : "indoor") || (keys.includes("strip") && p.t === "globes" && !/solar/i.test(p.n))) && p.p > 0 && keys.some((k) => C[k].test(cats(p))));
    if (!out && !keys.includes("strip")) { const inRoom = list.filter((p) => R.re.test(roomOf(p)) || (R.id === "bathroom" && /bathroom/i.test(cats(p)))); if (inRoom.length >= 3) list = inRoom; }
    return list;
  }
  function score(p) {
    const s = style(), m = mood(); const str = p._s + " " + (p.sp.Material || "").toLowerCase();
    let sc = s.re.test(str) ? 3 : 0;
    if (s.id !== "modern" && /\bled\b/.test(str) && s.id === "luxe") sc -= .5;
    const k = String(p.sp.Kelvin || "") + " " + p.n;
    if (m.id === "cosy" && /warm|2700|3000|dimmable/i.test(k + str)) sc += 1;
    if (m.id === "bright" && (fx(p).integrated || /4000|6500|daylight|cool/i.test(k))) sc += 1;
    if (m.id === "dramatic" && /black|smoked|brass|spot|wall/i.test(str)) sc += 1;
    if (p.st) sc += .6; sc += (p.ra || 0) * .1;
    return sc;
  }
  function choose(list, qtyFn, budget) {
    if (!list.length) return null;
    const ranked = list.map((p) => ({ p, sc: score(p) })).sort((a, b) => b.sc - a.sc || a.p.p - b.p.p);
    const top = ranked.filter((r) => r.sc >= ranked[0].sc - 1.5);
    const fits = top.filter((r) => qtyFn(r.p) * r.p.p <= budget * 1.15).sort((a, b) => Math.abs(qtyFn(a.p) * a.p.p - budget * 0.8) - Math.abs(qtyFn(b.p) * b.p.p - budget * 0.8) - (b.sc - a.sc) * budget * 0.15);
    const alts = (fits.length ? fits : ranked.slice().sort((a, b) => a.p.p - b.p.p)).slice(0, 10).map((r) => r.p);
    return { alts, i: 0 };
  }

  /* globes */
  function globeFor(fit, decorative) {
    const m = mood(), P = T.products.filter((p) => p.t === "globes" && !/strip|emergency|module|tube/i.test(p.n));
    const hasFit = (p) => new RegExp("\\b" + fit.replace(".", "\\.") + "\\b", "i").test((p.sp["Base type"] || p.sp["Base Type"] || "") + " " + p.n + " " + p.c.join(" "));
    let L = P.filter(hasFit); if (!L.length) return null;
    const warm = (p) => /warm|2700|2200|3000/i.test(p.n + " " + (p.sp.Kelvin || ""));
    const cool = (p) => /cool|4000/i.test(p.n + " " + (p.sp.Kelvin || ""));
    const pref = m.id === "bright" && A.room !== "bedroom" && A.room !== "dining" ? L.filter(cool) : L.filter(warm);
    if (pref.length) L = pref; else { const w = L.filter(warm); if (w.length) L = w; }
    if (decorative) { const d = L.filter((p) => /filament/i.test(p.n)); if (d.length) L = d; }
    else { const d = L.filter((p) => !/filament/i.test(p.n)); if (d.length) L = d; }
    if (m.id !== "bright") { const d = L.filter((p) => /dimmable/i.test(p.n)); if (d.length && (A.room === "dining" || A.room === "bedroom")) L = d; }
    const std = (p) => /\b(a60|a65|st64|gu10|g9|candle|golf)\b/i.test(p.n) ? 0 : 1;
    const glm = (p) => lumensOf(p) || 0;
    return L.sort((a, b) => (decorative ? 0 : std(a) - std(b)) || glm(b) - glm(a) || a.p - b.p)[0];
  }

  /* ---------------- build the plan ---------------- */
  let PLANRES = null;
  function build() {
    const R = room(), M = mood(), Pl = PLAN[R.id], area = A.size, ce = CEIL.find((c) => c.id === A.ceil);
    const lmM2 = M.id === "cosy" ? R.lm[0] : M.id === "bright" ? R.lm[1] : (R.lm[0] + R.lm[1]) / 2;
    const target = Math.round(area * lmM2 * ce.k / 50) * 50;
    const B = A.budget, shares = M.id === "dramatic" ? [0.38, 0.3, 0.24] : [0.46, 0.3, 0.14];
    const layers = [];
    // ambient
    const ambList = pool(Pl.amb, Pl.out);
    const ambQty = (p) => Pl.ambQ ? Pl.ambQ(area) : clamp(Math.round(target * M.share / fx(p).lm), 1, C.down.test(cats(p)) ? 16 : (area > 30 ? 6 : 4));
    const amb = choose(ambList, ambQty, B * shares[0]);
    if (amb) layers.push({ key: "amb", name: "Ambient", why: Pl.out ? "Wall lights every 2–3 m give the whole stoep a soft, even glow." : "The general glow that fills the room. Quantity worked out from lumens so the room is evenly lit.", sel: amb, qty: ambQty });
    [Pl.task, Pl.acc].forEach((def, k) => {
      if (!def) return; const [keys, qf, name, why] = def; const list = pool(keys, Pl.out);
      const q = () => qf(area); const c = choose(list, q, B * shares[k + 1]);
      if (c) layers.push({ key: k ? "acc" : "task", name, why, sel: c, qty: q });
    });
    PLANRES = { R, M, area, ce, target, B, layers };
    return PLANRES;
  }
  function compute() {
    const { layers } = PLANRES; let total = 0, lm = 0; const items = [], globeMap = {};
    layers.forEach((L) => {
      const p = L.sel.alts[L.sel.i], f = fx(p); let q = L.qty(p);
      const deco = /glass|industrial|cage|filament|bar pendant/i.test(cats(p) + " " + p.n);
      const g = f.fit && !f.integrated ? globeFor(f.fit, deco) : null;
      const glm = g ? (lumensOf(g) || GLM[f.fit] || 600) : 0;
      if (g && L.key === "amb" && !PLAN[PLANRES.R.id].ambQ) q = clamp(Math.round(PLANRES.target * PLANRES.M.share / (glm * f.count)), 1, q);
      L.p = p; L.q = q; L.lm = f.lm * q; total += p.p * q;
      items.push({ id: p.id, q });
      if (f.fit && !f.integrated) {
        if (g) {
          L.lm = glm * f.count * q; L.glm = glm;
          const k = g.id; globeMap[k] = globeMap[k] || { p: g, q: 0, fit: f.fit, for: [] }; globeMap[k].q += q * f.count; globeMap[k].for.push(p.n);
        }
      }
      lm += L.lm;
    });
    const globes = Object.values(globeMap); globes.forEach((g) => { total += g.p.p * g.q; items.push({ id: g.p.id, q: g.q }); });
    Object.assign(PLANRES, { total, lm, items, globes });
    return PLANRES;
  }

  /* ---------------- step UI ---------------- */
  const stage = $("#plStage");
  const tick = '<span class="pl-tick" aria-hidden="true">✓</span>';
  function prodImg(q) { const p = T.find(q) || T.findAll(q, 1)[0]; return p ? `src="${esc(T.img(p))}"` : ""; }
  function cardsHTML(key, list, extra) {
    return `<div class="pl-choices ${list.length === 3 ? "c3" : ""}" role="radiogroup" aria-label="${esc(STEPS[step].label)}">${list.map((o, i) => {
      const sel = String(A[key]) === String(o.id);
      const body = extra ? extra(o, i) : (o.prod ? `<img ${prodImg(o.prod)} alt="" loading="lazy">` : `<img ${o.img} alt="" loading="lazy">`);
      const cls = extra && extra.cls ? extra.cls(o) : (o.prod ? "prod" : "");
      return `<button type="button" class="pl-card ${cls}" role="radio" aria-checked="${sel}" tabindex="${sel || (!A[key] && i === 0) ? 0 : -1}" data-val="${o.id}">${body}<span class="glow" aria-hidden="true"></span>${tick}<span class="pl-lab"><span class="num">${String(i + 1).padStart(2, "0")}</span><strong>${esc(o.name)}</strong><small>${esc(o.note)}</small></span></button>`;
    }).join("")}</div>`;
  }
  function ceilSVG(h) {
    const top = 150 - h * 40; // 2.4 -> 54
    return `<svg viewBox="0 0 200 170" aria-hidden="true"><line class="ln" x1="10" y1="150" x2="190" y2="150"/><line class="hl" x1="10" y1="${top}" x2="190" y2="${top}"/><line class="ln" x1="20" y1="${top}" x2="20" y2="150"/><line class="ln" x1="180" y1="${top}" x2="180" y2="150"/>
      <line class="ln" x1="150" y1="${top + 4}" x2="150" y2="146" stroke-dasharray="3 4"/><path class="ln" d="M146 ${top + 10}l4-6 4 6M146 140l4 6 4-6"/><text class="tx" x="140" y="${(top + 150) / 2 + 4}" text-anchor="end">${h === 3.2 ? "3.0 M+" : h.toFixed(1) + " M"}</text>
      <line class="ln" x1="60" y1="82" x2="60" y2="146" stroke-dasharray="2 3" opacity=".6"/><text class="tx" x="66" y="118" opacity=".7">1.7 M</text></svg>`;
  }
  function stepHTML() {
    const S = STEPS[step], key = S.key;
    let body = "";
    if (key === "room") body = cardsHTML("room", ROOMS);
    if (key === "size") {
      const R = room(), v = A.size || R.m2;
      body = `<div class="pl-size"><div><div class="pl-m2" id="plM2">${v}<small>m²</small></div><p class="pl-m2-note" id="plM2n"></p>
        <label class="sr-only" for="plRange">Room size in square metres</label><input class="rng" id="plRange" type="range" min="4" max="80" step="1" value="${v}">
        <div class="row-b x-hint"><span>4 m²</span><span>80 m²</span></div>
        <div class="pl-presets">${[["Small", Math.round(R.m2 * 0.6)], ["Medium", R.m2], ["Large", Math.round(R.m2 * 1.6)], ["Open-plan", Math.round(R.m2 * 2.4)]].map(([n, m]) => `<button type="button" class="chip" data-m2="${clamp(m, 4, 80)}">${n} · ${clamp(m, 4, 80)} m²</button>`).join("")}</div></div>
        <div class="pl-plan" aria-hidden="true"><div class="room" id="plRoomBox"><span id="plRoomLbl"></span></div><span class="scale">Grid: 1 m</span></div></div>`;
    }
    if (key === "ceil") { const f = (o) => ceilSVG(o.id); f.cls = () => "diag"; body = cardsHTML("ceil", CEIL, f); }
    if (key === "style") body = cardsHTML("style", STYLES);
    if (key === "mood") { const f = () => `<img ${pic("2025/12/Tris.jpg")} alt="" loading="lazy">`; f.cls = (o) => o.cls; body = cardsHTML("mood", MOODS, f); }
    if (key === "budget") {
      const f = (o) => { const p = budgetPick(o.id); return p ? `<span class="x-pool" aria-hidden="true"><img src="${esc(T.img(p))}" alt="" loading="lazy"></span>` : ""; };
      f.cls = () => "typo"; body = cardsHTML("budget", BUDGETS, f);
    }
    return `<div class="pl-step" data-step="${step}"><div class="pl-qrow"><div><h2 class="pl-q" tabindex="-1">${S.q}</h2><p class="pl-sub">${S.sub}</p></div></div>${body}</div>`;
  }
  function budgetPick(b) {
    if (!A.room || !T.products.length) return null; const Pl = PLAN[A.room]; const list = pool(Pl.amb.concat(Pl.task[0]), Pl.out).filter((p) => p.p <= b * 0.45 && p.p >= b * 0.12);
    return list.sort((x, y) => (style() ? score(y) - score(x) : 0) || y.p - x.p)[0] || null;
  }
  function renderSteps() {
    $("#plSteps").innerHTML = STEPS.map((s, i) => {
      const done = A[s.key] != null && i !== step, can = i <= firstOpen();
      return `<li class="${i === step ? "cur" : done ? "done" : ""}"><button type="button" data-go="${i}" ${can ? "" : "disabled"} ${i === step ? 'aria-current="step"' : ""}><span class="n">0${i + 1}</span><span class="lbl">${s.label}</span>${A[s.key] != null && i !== step ? `<span class="sr-only">: ${esc(answerLabel(s.key))}</span>` : ""}</button></li>`;
    }).join("");
  }
  const firstOpen = () => { const i = STEPS.findIndex((s) => A[s.key] == null); return i < 0 ? STEPS.length - 1 : i; };
  function answerLabel(k) { const v = A[k]; if (k === "size") return v + " m²"; const L = { room: ROOMS, ceil: CEIL, style: STYLES, mood: MOODS, budget: BUDGETS }[k]; const o = L && L.find((x) => String(x.id) === String(v)); return o ? o.name : ""; }
  function go(i, focus) {
    const old = $(".pl-step", stage);
    step = clamp(i, 0, STEPS.length - 1);
    if (STEPS[step].key === "size" && A.size == null) A.size = room() ? room().m2 : 16;
    const wrap = document.createElement("div"); wrap.innerHTML = stepHTML(); const el = wrap.firstElementChild;
    if (old) { old.classList.remove("on"); old.classList.add("out"); setTimeout(() => old.remove(), T.reduced() ? 0 : 600); }
    stage.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
    bindStep(el); renderSteps(); navState();
    $("#plCount").textContent = `Step ${step + 1} of ${STEPS.length}`;
    if (focus !== false) setTimeout(() => { const h = $(".pl-q", el); h && h.focus({ preventScroll: true }); }, 80);
    T.track("planner_step", { step: STEPS[step].key });
  }
  function navState() {
    $("#plBack").disabled = step === 0;
    const has = A[STEPS[step].key] != null; const nx = $("#plNext");
    nx.disabled = !has; nx.innerHTML = step === STEPS.length - 1 ? 'See my plan <span class="arr">→</span>' : 'Next <span class="arr">→</span>';
  }
  let adv = 0;
  function bindStep(el) {
    const key = STEPS[step].key;
    $$(".pl-card", el).forEach((b) => b.addEventListener("click", () => {
      A[key] = isNaN(+b.dataset.val) ? b.dataset.val : +b.dataset.val;
      $$(".pl-card", el).forEach((x) => { x.setAttribute("aria-checked", x === b); x.tabIndex = x === b ? 0 : -1; });
      navState(); renderSteps();
      clearTimeout(adv); adv = setTimeout(() => next(), T.reduced() ? 150 : 650);
    }));
    const group = $("[role=radiogroup]", el);
    group && group.addEventListener("keydown", (e) => {
      const cards = $$(".pl-card", el), i = cards.indexOf(document.activeElement); if (i < 0) return;
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); const n = cards[(i + d + cards.length) % cards.length]; cards.forEach((c) => c.tabIndex = -1); n.tabIndex = 0; n.focus();
    });
    if (key === "size") {
      const r = $("#plRange", el);
      const upd = () => {
        const v = +r.value; A.size = v; $("#plM2").innerHTML = `${v}<small>m²</small>`; r.style.setProperty("--v", ((v - 4) / 76 * 100) + "%");
        const side = Math.sqrt(v), w = Math.min(96, side * 1.25 / 10 * 100), h = Math.min(96, side * 0.8 / 10 * 100);
        const box = $("#plRoomBox"); box.style.width = w + "%"; box.style.height = h + "%";
        $("#plRoomLbl").textContent = `≈ ${(side * 1.25).toFixed(1)} × ${(side * 0.8).toFixed(1)} m`;
        const R = room(); $("#plM2n").textContent = `${R.name}: about ${(v * R.lm[0]).toLocaleString("en-ZA").replace(/\s/g, ",")}–${(v * R.lm[1]).toLocaleString("en-ZA").replace(/\s/g, ",")} lumens needed`;
        $$("[data-m2]", el).forEach((c) => c.classList.toggle("on", +c.dataset.m2 === v)); navState();
      };
      r.addEventListener("input", upd); upd();
      $$("[data-m2]", el).forEach((c) => c.addEventListener("click", () => { r.value = c.dataset.m2; upd(); }));
    }
  }
  function next() { clearTimeout(adv); if (A[STEPS[step].key] == null) return; if (step < STEPS.length - 1) go(step + 1); else result(); }
  $("#plNext").addEventListener("click", next);
  $("#plBack").addEventListener("click", () => { clearTimeout(adv); go(step - 1); });
  $("#plSteps").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) { clearTimeout(adv); showSteps(); go(+b.dataset.go); } });
  $("#plRestart").addEventListener("click", () => { Object.keys(A).forEach((k) => A[k] = null); showSteps(); go(0); });
  function showSteps() { $("#plResult").innerHTML = ""; $("#plStage").hidden = false; $("#plNavWrap").hidden = false; $(".pl").classList.remove("res"); }

  /* ---------------- result ---------------- */
  const kelvinTxt = () => ({ cosy: "2700–3000K warm white", bright: A.room === "bedroom" || A.room === "dining" ? "3000K warm white" : "4000K cool white", dramatic: "2700K warm white" })[A.mood];
  function itemHTML(p, q, sub, note, layerIdx) {
    const f = fx(p);
    return `<div class="pl-item"><a class="x-pool" href="${T.pUrl(p)}" aria-hidden="true" tabindex="-1"><img src="${esc(T.img(p))}" alt="" loading="lazy"></a>
      <div><span class="sub">${esc(sub)}</span><h4><a href="${T.pUrl(p)}">${esc(p.n)}</a></h4><p class="note">${note}</p></div>
      <div class="qp"><span class="q">${q} × ${money(p.p)}</span><span class="price">${money(p.p * q)}</span>${layerIdx != null ? `<button class="swap" type="button" data-swap="${layerIdx}" aria-label="Swap for another option">↻ Swap</button>` : ""}${f && !f.integrated && f.fit ? "" : ""}</div></div>`;
  }
  function result() {
    if (!T.products.length) { T.ready(result); return; }
    build(); compute(); renderResult(true);
    T.track("planner_complete", { room: A.room, size: A.size, ceiling: A.ceil, style: A.style, mood: A.mood, budget: A.budget, total: Math.round(PLANRES.total), items: PLANRES.items.length });
  }
  function renderResult(first) {
    const P = PLANRES, R = P.R, over = P.total - P.B;
    const roomImg = R.img || pic("2025/12/Tris.jpg");
    const pct = clamp(P.lm / P.target * 100, 0, 100);
    const layersHTML = P.layers.map((L, i) => {
      const f = fx(L.p); const unit = L.key === "acc" && /strip/i.test(cats(L.p)) ? "metres" : L.q > 1 ? "pieces" : "piece";
      const note = `${L.q} ${unit} · about ${Math.round(L.lm).toLocaleString("en-ZA").replace(/\s/g, ",")} lm${f.integrated ? " · integrated LED" : f.fit ? ` · ${f.count} × ${f.fit} globe${f.count > 1 ? "s" : ""} per fitting` : ""}`;
      return `<div class="pl-layer"><div><span class="num">— 0${i + 1}</span><h3 class="mt-s">${esc(L.name)}</h3><p class="why">${esc(L.why)}</p></div><div class="pl-items">${itemHTML(L.p, L.q, L.p.rg || L.p.c.find((c) => !/^(indoor|outdoor|globes|fans|wood|textiles)$/i.test(c)) || L.p.c[0], note, i)}</div></div>`;
    }).join("");
    const globesHTML = P.globes.length ? `<div class="pl-layer"><div><span class="num">— 0${P.layers.length + 1}</span><h3 class="mt-s">Globes</h3><p class="why">The fittings above take globes that are sold separately. These match the fitting and the ${esc(P.M.name.toLowerCase())} mood.</p></div><div class="pl-items">${P.globes.map((g) => itemHTML(g.p, g.q, g.fit + " globe", `For the ${esc(g.for.join(" and "))}`, null)).join("")}</div></div>` : "";
    const advice = [
      R.id === "kitchen" ? "Hang the pendants 65–75 cm above the counter, one every 60–80 cm." : R.id === "dining" ? "Hang the feature pendant so the bottom of the shade is 75–85 cm above the table." : R.id === "bathroom" ? "Choose IP44 or better for anything within 60 cm of the bath or shower (zone 2)." : R.id === "patio" ? "Use IP44 under cover and IP65 for anything exposed to Highveld storms or sprinklers." : "Put each layer on its own switch, and add a dimmer to the ambient layer.",
      A.ceil >= 3.2 ? "With a 3 m+ ceiling, use the full cable length so the light sits in the room, not up in the void." : A.ceil >= 2.7 ? "A 2.7 m ceiling gives you room for a longer drop. Keep 2.1 m clear under anything you walk beneath." : "On a 2.4 m ceiling, keep at least 2.1 m clear under pendants where people walk.",
      `Stick to ${kelvinTxt()} throughout the room so the layers feel like one scheme.`,
      "Add an emergency globe in one fitting so the room still has light during load-shedding.",
      "Have a registered electrician install new fittings and issue a Certificate of Compliance (CoC)."
    ];
    $("#plStage").hidden = true; $("#plNavWrap").hidden = true; $(".pl").classList.add("res"); $("#plRestart").hidden = false;
    renderSteps(); $$("#plSteps li").forEach((l) => { l.className = "done"; });
    $("#plResult").innerHTML = `<section class="pl-res" aria-labelledby="plResH"><div class="wrap">
      <div class="pl-res-head"><div><span class="eyebrow">Your plan is ready</span><h2 class="mt-s" id="plResH" tabindex="-1">Your <em>${esc(R.name.toLowerCase())}</em>, in ${["", "one layer", "two layers", "three layers", "four layers"][P.layers.length] || P.layers.length + " layers"} of light.</h2>
        <p class="lead mt-s">${A.size} m², ${A.ceil >= 3.2 ? "3 m+" : A.ceil + " m"} ceiling, ${esc(style().name.toLowerCase())} style, ${esc(P.M.name.toLowerCase())} mood. Every product is from our current range and in stock unless marked otherwise.</p></div>
        <figure class="pl-room" style="margin:0"><img ${roomImg} alt=""><span class="l1"></span><span class="l2"></span><span class="tag dark tagline">${esc(P.M.name)} · ${kelvinTxt()}</span></figure></div>
      <dl class="pl-stats">
        <div><dt>Room</dt><dd>${A.size} m²<small>${esc(R.name)}</small></dd></div>
        <div><dt>Light needed</dt><dd>${P.target.toLocaleString("en-ZA").replace(/\s/g, ",")} lm<small>${R.lm[0]}–${R.lm[1]} lm per m²${A.ceil > 2.4 ? " + ceiling height" : ""}</small></dd></div>
        <div><dt>This plan gives</dt><dd>${Math.round(P.lm).toLocaleString("en-ZA").replace(/\s/g, ",")} lm<small><span class="pl-meter" style="display:block"><i style="width:${pct}%"></i></span></small></dd></div>
        <div><dt>Colour</dt><dd>${P.M.id === "bright" && A.room !== "bedroom" && A.room !== "dining" ? "4000K" : "2700–3000K"}<small>${esc(kelvinTxt())}</small></dd></div>
        <div><dt>Budget</dt><dd>${T.moneyShort(P.B)}<small>${over > 0 ? `${money(over)} over. Swap a piece to save.` : `${money(-over)} to spare`}</small></dd></div>
      </dl>
      <div class="pl-layers">${layersHTML}${globesHTML}</div>
      <div class="pl-advice"><div><span class="num">— Installer notes</span><h3 class="h3 mt-s">Before you <em>hang it</em></h3></div><ul>${advice.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
      <div class="pl-more"><button class="btn ghost sm" type="button" id="plRefine">${T.I.spark} Refine with the AI assistant</button><a class="btn ghost sm" href="stores.html?book=1" data-ev="planner_consult">Book an in-store consultation</a><button class="btn ghost sm" type="button" id="plEmailBtn">Email me this plan</button><a class="btn ghost sm" href="tools.html#lumen">Check with the lumen calculator</a></div>
      <p class="demo-note mt-m">Quantities are worked out from lumens per m² and are a starting point. A consultant can fine-tune the plan for your exact room.</p>
    </div></section>
    <div class="pl-total"><div class="wrap"><div class="sum"><span>Whole plan · ${P.items.reduce((a, b) => a + b.q, 0)} items</span><b>${money(P.total)}</b><small>${P.total >= D.freeShip ? "Free delivery included" : "Delivery calculated at checkout"}</small></div>
      <div class="acts"><button class="btn ghost" type="button" id="plSave">Save<span class="long"> plan</span></button><button class="btn" type="button" id="plAddAll">Add<span class="long"> whole plan</span> to bag <span class="arr">→</span></button></div></div></div>`;
    const res = $("#plResult");
    $$("[data-swap]", res).forEach((b) => b.addEventListener("click", () => { const L = PLANRES.layers[+b.dataset.swap]; if (L.sel.alts.length < 2) { T.toast("That's the best match for this layer in your budget."); return; } L.sel.i = (L.sel.i + 1) % L.sel.alts.length; compute(); renderResult(false); const nb = $(`[data-swap="${b.dataset.swap}"]`); nb && nb.focus(); T.track("planner_swap", { layer: L.key }); }));
    $("#plAddAll").addEventListener("click", (e) => {
      PLANRES.items.forEach((it) => { const ex = T.bag.items.find((x) => x.id === it.id); ex ? ex.q += it.q : T.bag.items.push({ id: it.id, q: it.q }); });
      T.bag.save(); T.toast(`<span>✨ Your ${esc(R.name.toLowerCase())} plan is in your bag · <b>${money(PLANRES.total)}</b></span>`); T.openOv && T.openOv("bag");
      T.track("add_to_cart", { source: "planner", value: Math.round(PLANRES.total), items: PLANRES.items.length });
    });
    $("#plSave").addEventListener("click", () => {
      const plans = T.store.get("tlw-plans", []);
      const name = `${R.name} · ${A.size} m² · ${style().name} · ${P.M.name}`;
      plans.unshift({ id: "pl" + Date.now().toString(36), name, date: new Date().toISOString(), items: PLANRES.items.map((x) => ({ id: x.id, q: x.q })), total: Math.round(PLANRES.total * 100) / 100 });
      T.store.set("tlw-plans", plans.slice(0, 20)); T.toast(`<span>Plan saved · find it any time in <a href="account.html" style="color:var(--amber)">My account</a></span>`); T.track("planner_save", { room: A.room });
      $("#plSave").textContent = "Saved ✓";
    });
    $("#plRefine").addEventListener("click", () => {
      const list = PLANRES.layers.map((L) => `${L.q} × ${L.p.n} (${L.name.toLowerCase()})`).concat(PLANRES.globes.map((g) => `${g.q} × ${g.p.n}`)).join("; ");
      const msg = `I used the lighting planner for my ${R.name.toLowerCase()}: ${A.size} m², ${A.ceil >= 3.2 ? "3 m+" : A.ceil + " m"} ceiling, ${style().name.toLowerCase()} style, ${P.M.name.toLowerCase()} mood, budget ${money(P.B)}. It suggested ${list}. Total ${money(PLANRES.total)}. Can you help me refine this plan?`;
      window.TLWChat ? window.TLWChat.send(msg) : T.openOv("chat"); T.track("planner_refine", {});
    });
    $("#plEmailBtn").addEventListener("click", openMail);
    if (first) { const h = $("#plResH"); setTimeout(() => { const y = $(".pl-res").getBoundingClientRect().top + scrollY - 80; T.lenis ? T.lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: "smooth" }); h.focus({ preventScroll: true }); }, 60); }
    T.magnetic(res);
  }

  /* email modal */
  const mail = $("#plMail"); let lastF = null;
  function openMail() { lastF = document.activeElement; mail.classList.add("open"); mail.setAttribute("aria-hidden", "false"); setTimeout(() => $("#plEmail").focus(), 60); }
  function closeMail() { mail.classList.remove("open"); mail.setAttribute("aria-hidden", "true"); lastF && lastF.focus && lastF.focus(); }
  mail.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeMail(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mail.classList.contains("open")) closeMail(); });
  $("#plMailForm").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#plEmail").value; closeMail(); T.toast(`<span>📩 Plan sent to <b>${esc(v)}</b> (demo)</span>`); T.track("planner_email", {}); e.target.reset(); });

  /* boot: room cards can show immediately; product-photo cards fill in once products load */
  go(0, false);
  T.ready(() => { if (step === 0 || STEPS[step].key === "style" || STEPS[step].key === "budget") { const s = step; const old = $(".pl-step", stage); old && old.remove(); go(s, false); } });
  T.reveal(); T.magnetic();
})();
