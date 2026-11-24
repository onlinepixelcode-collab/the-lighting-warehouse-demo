/* Home page: day-to-night hero + sections */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA, { $, $$, esc, money } = T;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const desktop = () => matchMedia("(min-width: 861px)").matches;

  /* =============== [01] HERO: DAY TO NIGHT =============== */
  const hero = $("#hero"), hdr = $("#hdr");
  const KF = [12, 15.5, 18, 19.5, 22];
  const V = {
    out: ["#ffffff", "#fff1dc", "#ff9d55", "#4a4a8c", "#0b1030"],
    outGlow: ["#000000", "#000000", "#ff8a3d", "#2b2f6b", "#05081a"],
    outGlowA: [0, 0, 0.35, 0.25, 0.1],
    dark: [0, 0.03, 0.2, 0.55, 0.78],
    golden: [0, 0.1, 0.45, 0.15, 0],
    streaks: [0, 0.1, 0.55, 0, 0],
    prodB: [1, 1, 0.95, 0.8, 0.7]
  };
  const HEAD = [
    ["Daylight does<br>the <em>work.</em>", "Bright, clear, effortless."],
    ["Light that follows<br>the <em>sun.</em>", "Soft afternoon light drifts slowly across the room."],
    ["The best hour<br>of the <em>day.</em>", "Golden hour. The floor lamp takes its cue."],
    ["Then the light<br><em>leaves.</em>", "And the room needs you."],
    ["Made for the hours<br>after <em>dark.</em>", "Learn what light can do."]
  ];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
  const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const ease = (x) => x * x * (3 - 2 * x);
  function seg(t) { let i = 0; while (i < KF.length - 2 && t > KF[i + 1]) i++; return [i, Math.max(0, Math.min(1, (t - KF[i]) / (KF[i + 1] - KF[i])))]; }
  let stage = 0, lastLamps = {}, curT = 12;
  const flick = {};
  function setTime(t) {
    curT = t; const [i, k0] = seg(t), k = ease(k0), s = hero.style;
    // crossfade the five photographs: at any moment only two neighbouring frames are visible
    const KFS = [12, 15.5, 18, 19.5, 22];
    KFS.forEach((h, n) => { const prev = KFS[n - 1], next = KFS[n + 1]; let o = 0;
      if (t <= h && prev !== undefined && t > prev) o = (t - prev) / (h - prev);
      else if (t >= h && next !== undefined && t < next) o = 1 - (t - h) / (next - h);
      else if (t === h || (n === 0 && t <= h) || (n === KFS.length - 1 && t >= h)) o = 1;
      s.setProperty("--f" + n, o.toFixed(3)); });
    // ink + scrim follow the light
    const night = ramp(t, 18.6, 19.6); const ink = mix("#1d1a15", "#f5efe3", night);
    s.setProperty("--hero-ink", ink); s.setProperty("--hero-label", mix("#6b5428", "#c2a77a", night)); s.setProperty("--hero-em", mix("#a2620f", "#c8a46a", night));
    const sc = hex(mix("#ebe2d2", "#0a0a0e", night)); s.setProperty("--scrim-rgb", sc.join(","));
    hero.style.background = mix("#d8ccb8", "#0a0a0b", night);
    
    hero.classList.toggle("night", t >= 21.3);
    // headline per time of day
    const st = t < 13.75 ? 0 : t < 16.75 ? 1 : t < 18.75 ? 2 : t < 20.75 ? 3 : 4; if (st !== stage) swapHead(st);
    updateKnob(t);
  }
  let swapTimer;
  function swapHead(st) {
    stage = st; const h = $("#heroH"), sub = $("#heroSub"); clearTimeout(swapTimer);
    if (T.reduced()) { h.innerHTML = HEAD[st][0].split("<br>").map((l) => `<span class="reveal-line"><span>${l}</span></span>`).join(""); sub.textContent = HEAD[st][1]; return; }
    h.classList.add("swap-out"); sub.style.opacity = 0;
    swapTimer = setTimeout(() => {
      h.innerHTML = HEAD[st][0].split("<br>").map((l) => `<span class="reveal-line"><span>${l}</span></span>`).join("");
      h.classList.remove("swap-out"); h.classList.add("swap-in"); void h.offsetWidth; h.classList.remove("swap-in"); sub.textContent = HEAD[st][1]; sub.style.opacity = "";
    }, 380);
  }
  // time control: drag the sun
  const knob = $("#sunKnob"), clock = $("#clock"), arcSvg = $("#timectl svg");
  function updateKnob(t) {
    const p = (t - 12) / 10, a = Math.PI * (1 - p); const x = 150 + 130 * Math.cos(a), y = 150 - 130 * Math.sin(a);
    knob.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const hh = Math.floor(t), mm = Math.floor((t - hh) * 60); const txt = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    clock.textContent = txt; knob.setAttribute("aria-valuenow", t.toFixed(2)); knob.setAttribute("aria-valuetext", txt);
    const moon = t > 19.4; $(".moon-shape", knob).setAttribute("opacity", moon ? 1 : 0); $(".sun-core", knob).setAttribute("opacity", moon ? 0 : 1); $(".sun-glow", knob).setAttribute("fill", moon ? "#cfd8ff" : "#ffd27a");
  }
  let heroST = null;
  function goTo(t) {
    t = Math.max(12, Math.min(22, t));
    if (heroST) { const y = heroST.start + (t - 12) / 10 * (heroST.end - heroST.start); T.lenis ? T.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }
    else setTime(t);
  }
  let dragging = false;
  const ptToT = (e) => { const pt = arcSvg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(arcSvg.getScreenCTM().inverse()); let a = Math.atan2(150 - p.y, p.x - 150); if (a < 0) a = p.x < 150 ? Math.PI : 0; return 12 + (1 - a / Math.PI) * 10; };
  knob.addEventListener("pointerdown", (e) => { dragging = true; knob.setPointerCapture(e.pointerId); e.preventDefault(); T.track("hero_sun_drag", {}); });
  knob.addEventListener("pointermove", (e) => { if (dragging) goTo(ptToT(e)); });
  knob.addEventListener("pointerup", () => dragging = false);
  arcSvg.addEventListener("click", (e) => { if (e.target.closest("#sunKnob")) return; goTo(ptToT(e)); });
  knob.addEventListener("keydown", (e) => { const d = { ArrowRight: .25, ArrowUp: .25, ArrowLeft: -.25, ArrowDown: -.25, PageUp: 1, PageDown: -1, Home: -10, End: 10 }[e.key]; if (d) { e.preventDefault(); goTo(curT + d); } });

  // hotspots → product cards
  // the real TLW products placed in the photo
  const HS = { pendant: () => T.get(157055), floor: () => T.get(144655), table: () => T.get(157252), wall: () => T.get(158260) };
  const hsCard = $("#hsCard");
  function showHS(g) {
    T.ready(() => {
      const p = HS[g.dataset.hs](); if (!p) return; const hr = hero.getBoundingClientRect(), r = g.getBoundingClientRect();
      hsCard.innerHTML = `<div class="th"><img src="${esc(T.img(p))}" alt=""></div><span>${esc(T.rangeOf(p))}</span><b>${esc(p.n)}</b><div class="row-b"><span class="price" style="color:#fff">${money(p.p)}</span><div class="flex"><a class="link-u" href="${T.pUrl(p)}" style="color:#fff">View</a><button class="btn sm" data-add="${p.id}">Add to Bag</button></div></div>`;
      let x = r.left - hr.left + r.width / 2 - 135, y = r.top - hr.top - 330; if (y < 90) y = r.top - hr.top + 30; x = Math.max(12, Math.min(hr.width - 282, x));
      hsCard.style.left = x + "px"; hsCard.style.top = y + "px"; hsCard.classList.add("on");
    });
  }
  $$(".hotspot").forEach((g) => { g.addEventListener("click", (e) => { e.stopPropagation(); showHS(g); }); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showHS(g); } }); g.addEventListener("mouseenter", () => desktop() && showHS(g)); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#hsCard,.hotspot")) hsCard.classList.remove("on"); });

  // keep the lamps in frame on portrait screens
  const roomSvg = $("#roomSvg");
  const frame = () => { const r = innerWidth / innerHeight; roomSvg.setAttribute("viewBox", r < 0.9 ? "860 0 1340 1244" : r < 1.3 ? "420 0 1780 1244" : "0 0 2200 1244");
    const small = innerWidth < 900; $$("#roomSvg .frame").forEach((im) => { const want = `assets/img/hero/${im.dataset.f}${small ? "-m" : ""}.jpg`; if (im.getAttribute("href") !== want) im.setAttribute("href", want); }); };
  frame(); addEventListener("resize", frame);
  function initHero() {
    if (hasGSAP && !T.reduced()) {
      heroST = ScrollTrigger.create({ trigger: hero, start: "top top", end: "+=320%", pin: true, scrub: true, onUpdate: (self) => { setTime(12 + self.progress * 10); if (self.progress < 0.98) hsCard.classList.remove("on"); }, onLeave: () => hdr.style.removeProperty("--hc"), onEnterBack: () => setTime(curT) });
      setTime(12);
    } else { setTime(22); }
    addEventListener("scroll", () => { if (heroST && scrollY > heroST.end + 10) hdr.style.removeProperty("--hc"); document.body.classList.toggle("torch-on", !heroST || scrollY > heroST.end - 40); }, { passive: true });
    document.body.classList.remove("torch-on");
  }

  /* =============== [04] BENTO =============== */
  function bento(P) {
    const count = (t) => P.filter((p) => p.t === t).length;
    const tiles = [["indoor", "big", "assets/img/rooms/kitchen.jpg?v=2"], ["outdoor", "", D.cats.outdoor.img], ["fans", "kb", D.cats.fans.img], ["globes", "", D.cats.globes.img], ["switches", "", D.cats.switches.img]];
    $("#bento").innerHTML = tiles.map(([k, cls, im], i) => `<a class="tile ${cls}" href="shop.html?cat=${k}" data-cursor="EXPLORE"><img src="${esc(im)}" alt="" loading="lazy">${k === "fans" ? '<span class="tag live">Summer sale</span>' : ""}<div class="t-in"><span class="num">0${i + 1}</span><h3>${esc(D.cats[k].name)}</h3><span class="count">${count(k)} products</span><span class="explore">Explore →</span></div></a>`).join("");
    $$("#bento .tile").forEach((t) => t.addEventListener("mousemove", (e) => { const r = t.getBoundingClientRect(); t.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%"); t.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%"); }));
  }

  /* =============== SHOP BY CATEGORY =============== */
  const CATS = [
    ["Pendants", (p) => p.c.some((c) => /Pendants$/.test(c)), 157055, "shop.html?q=pendant"],
    ["Ceiling Lights", (p) => p.c.includes("Ceiling Lighting"), 165790, "shop.html?cat=indoor&sub=Ceiling%20Lighting"],
    ["Wall Lights", (p) => p.c.includes("Indoor Wall Lighting"), 158260, "shop.html?cat=indoor&sub=Indoor%20Wall%20Lighting"],
    ["Floor Lamps", (p) => p.c.includes("Floor Lamps"), 144655, "shop.html?cat=indoor&sub=Floor%20Lamps"],
    ["Table Lamps", (p) => p.c.includes("Table Lamps"), 157252, "shop.html?cat=indoor&sub=Table%20Lamps"],
    ["Spotlights", (p) => p.c.includes("Spotlights"), 158250, "shop.html?cat=indoor&sub=Spotlights"],
    ["Bathroom", (p) => p.c.includes("Bathroom Lighting"), null, "shop.html?cat=indoor&sub=Bathroom%20Lighting"],
    ["Outdoor", (p) => p.t === "outdoor", 144038, "shop.html?cat=outdoor"],
    ["Solar & Load-shedding", (p) => /solar|loadshedding|emergency/i.test(p._s), 144154, "shop.html?q=solar%20loadshedding"],
    ["Ceiling Fans", (p) => p.t === "fans", 164364, "shop.html?cat=fans"],
    ["Globes", (p) => p.t === "globes", 144861, "shop.html?cat=globes"],
    ["Switches & Plugs", (p) => p.t === "switches", 153602, "shop.html?cat=switches"]
  ];
  function categories(P) {
    $("#catGrid").innerHTML = CATS.map(([name, test, id, href]) => {
      const list = P.filter(test); const p = (id && T.get(id)) || list[0]; if (!p) return "";
      return `<a class="cat" href="${href}" data-cursor="SHOP"><div class="pool"><img src="${esc(T.img(p))}" alt="${esc(name)}: ${esc(p.n)}" loading="lazy"></div><b>${esc(name)}</b><span>${list.length} products</span></a>`;
    }).join("");
  }

  /* =============== [05] HOUSE AFTER DARK =============== */
  const ROOM_ORDER = ["bedroom", "bathroom", "office", "lounge", "dining", "kitchen", "patio", "garden", "garage"];
  function house(P) {
    const box = $("#house");
    box.innerHTML = ROOM_ORDER.map((id) => { const r = D.rooms.find((x) => x.id === id); const n = roomProducts(id, P).length;
      return `<div class="room" data-room="${id}" tabindex="0" role="button" aria-label="${r.name}: switch on and shop ${n} lights"><img src="assets/img/rooms/${id}.jpg?v=2" alt="" loading="lazy"><i class="sw"></i><div class="lbl"><b>${r.name}</b><span>${n} lights</span></div></div>`; }).join("");
    $("#roomList").innerHTML = D.rooms.map((r) => `<button class="chip" data-room="${r.id}">${r.name}</button>`).join("");
    const light = (id, on) => $$(`[data-room="${id}"]`).forEach((el) => el.classList.toggle("on", on));
    $$("[data-room]").forEach((el) => {
      el.addEventListener("mouseenter", () => { light(el.dataset.room, true); T.sound.click(); });
      el.addEventListener("mouseleave", () => light(el.dataset.room, false));
      el.addEventListener("focus", () => light(el.dataset.room, true)); el.addEventListener("blur", () => light(el.dataset.room, false));
      el.addEventListener("click", () => openRoom(el.dataset.room, P));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRoom(el.dataset.room, P); } });
    });
  }
  const ROOM_FALLBACK = { bathroom: /bathroom/i, office: /desk|spot|reading/i, garage: /flood|bulkhead|garage/i, patio: /outdoor/i, garden: /solar|garden|spike|pole/i };
  function roomProducts(id, P) {
    const room = D.rooms.find((r) => r.id === id); const re = new RegExp(room.match.join("|"), "i");
    let list = P.filter((p) => re.test(p.sp.Room || "") && p.t !== "switches" && p.t !== "globes");
    if (list.length < 6 && ROOM_FALLBACK[id]) list = list.concat(P.filter((p) => ROOM_FALLBACK[id].test(p._s)));
    return list.filter((p, i, a) => a.indexOf(p) === i);
  }
  function openRoom(id, P) {
    const room = D.rooms.find((r) => r.id === id), list = roomProducts(id, P);
    $("#roomTitle").innerHTML = `The <em>${esc(room.name.toLowerCase())}</em>, lit.`;
    $("#roomGrid").innerHTML = list.slice(0, 8).map((p) => T.card(p)).join("");
    $("#roomAll").href = `shop.html?room=${id}`; $("#roomAll").textContent = `See all ${list.length} lights for the ${room.name.toLowerCase()} →`;
    $("#roomModal").classList.add("open"); T.lenis && T.lenis.stop(); T.track("shop_by_room", { room: id });
  }
  $$("[data-rclose]").forEach((b) => b.addEventListener("click", () => { $("#roomModal").classList.remove("open"); T.lenis && T.lenis.start(); }));

  /* =============== [06] SIGNATURE GALLERY =============== */
  const SIG = [["Penna 10 Light Polished Brass", "rgba(200, 164, 106,.22)"], ["Sussurro Led 3 Blade Black", "rgba(168, 140, 94,.18)"], ["Kristal Led 1 Light Floor Lamp", "rgba(255,214,150,.2)"], ["Fabrica 4 Light Black", "rgba(230,150,70,.2)"], ["Perla Led 8 Light Satin Brass", "rgba(255,196,110,.24)"], ["Belmont Black Outdoor Wall Lantern", "rgba(160,170,200,.16)"], ["Ginevra Satin Brass Table Lamp", "rgba(242,190,110,.22)"], ["Maypole 3 Light Antique Brass", "rgba(200, 164, 106,.2)"]];
  function gallery() {
    const items = SIG.map(([q, tint]) => [T.find(q), tint]).filter((x) => x[0]);
    const track = $("#hgalTrack");
    track.innerHTML = items.map(([p, tint], i) => `<a class="sig" href="${T.pUrl(p)}" data-tint="${tint}" data-cursor="VIEW"><span class="idx">0${i + 1}</span><div class="pool"><img src="${esc(T.img(p))}" alt="${esc(p.n)}" loading="lazy"></div><span class="sub">${esc(T.rangeOf(p))}</span><h3>${esc(p.n)}</h3><div class="row-b"><span class="price">${money(p.p)}</span><span class="link-u" style="min-height:0">View →</span></div></a>`).join("");
    const sec = $("#hgal"), tint = $(".tint", sec);
    // pin + sideways scroll on wide screens only; re-evaluated when the window is resized
    if (hasGSAP && !T.reduced()) gsap.matchMedia().add("(min-width: 861px)", () => {
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (s) => { const i = Math.min(items.length - 1, Math.floor(s.progress * items.length)); tint.style.setProperty("--tint", items[i][1]); } } });
      gsap.utils.toArray(".sig .pool img").forEach((im, i) => gsap.to(im, { y: i % 2 ? 18 : -18, rotate: i % 2 ? 2 : -2, ease: "sine.inOut", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), scrub: true } }));
    });
  }

  /* =============== [07] FAN EDIT =============== */
  const FINISH = { black: "Sussurro Led 3 Blade Black", dark: "Sussurro Led 3 Blade Dark Wood", light: "Sussurro Led 3 Blade Light Wood", white: "Sussurro Led 3 Blade White" };
  let finish = "black";
  function fanEdit() {
    $$("[data-finish]").forEach((b) => b.addEventListener("click", () => { finish = b.dataset.finish; $$("[data-finish]").forEach((x) => x.classList.toggle("on", x === b)); const p = T.find(FINISH[finish]); if (p) { const ph = $("#fanPhoto"); ph.classList.add("swap"); setTimeout(() => { ph.src = T.img(p); ph.alt = p.n; ph.onload = () => ph.classList.remove("swap"); }, 250); $("#fanPrice").textContent = money(p.p); } }));
    const lb = $("#fanLight"); lb.addEventListener("click", () => { const on = lb.getAttribute("aria-pressed") !== "true"; lb.setAttribute("aria-pressed", on); lb.classList.toggle("on", on); lb.textContent = on ? "Light on" : "Light off"; $("#fanGlow").style.opacity = on ? 1 : 0; $("#fanRing").style.opacity = on ? 1 : 0; T.sound.click(); });
    $("#fanAdd").addEventListener("click", (e) => { const p = T.find(FINISH[finish]); p && T.bag.add(p.id, 1, e.currentTarget); });
    const sec = $("#fanEdit"); if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => T.sound.hum(e.isIntersecting), { threshold: 0.3 }).observe(sec);
    document.addEventListener("tlw:sound", (e) => { if (!e.detail) T.sound.hum(false); });
  }

  /* =============== [08] LOAD-SHEDDING =============== */
  function loadshedding(P) {
    const picks = [T.find("A60 Led 9w Emergency 6 Hour Warm White"), T.find("Carrie Black Outdoor Solar Lantern"), T.find("Solar Led  10 Meter Warm White Strip"), P.find((p) => /solar/i.test(p.n) && /sensor|motion|flood|wall/i.test(p.n))].filter(Boolean);
    const extra = P.filter((p) => /loadshedding|emergency|solar/i.test(p._s) && !picks.includes(p)); while (picks.length < 4 && extra.length) picks.push(extra.shift());
    const notes = ["Charges while the power is on, runs up to 6 hours when it's off.", "Charges in the sun all day. No wiring, no Eskom.", "Warm light along a patio or stoep, powered by its own panel.", "Lights the way when someone walks up, all night."];
    $("#lsGrid").innerHTML = picks.map((p, i) => `<article class="ls-item" style="--d:${i}">
      <a class="pool" href="${T.pUrl(p)}"><span class="disc"><img src="${esc(T.img(p))}" alt="${esc(p.n)}" loading="lazy"></span></a>
      <div class="ls-meta"><span class="ls-no">0${i + 1}</span><h4><a href="${T.pUrl(p)}">${esc(p.n)}</a></h4><p>${notes[i] || ""}</p>
      <div class="ls-buy"><span class="price">${money(p.p)}</span><button class="btn sm" data-add="${p.id}">Add to bag</button></div></div></article>`).join("");
    const ls = $("#ls"); let done = false;
    const go = () => { if (done) return; done = true; ls.classList.add("lit"); };
    "IntersectionObserver" in window ? new IntersectionObserver(([e]) => e.isIntersecting && go(), { threshold: 0.3 }).observe(ls) : go();
  }


  /* =============== [09] RANGES =============== */
  const RANGE_IMG = { Fabrica: "Fabrica 4 Light", Trax: "Trax Led Black Outdoor Wall Light 1200mm", Marzio: "Marzio 2 Light Grey Floor Lamp", Riviera: "Riviera 3 Light Wooden Ceiling", Trinity: "Trinity Led", Sussurro: "Sussurro Led 3 Blade Light Wood" };
  function ranges() {
    const stick = $("#rStick"), name = $("#rName");
    D.ranges.forEach((r, i) => { const p = T.find(RANGE_IMG[r.id]); stick.insertAdjacentHTML("afterbegin", `<img data-r="${i}" class="${i ? "" : "on"}" src="${esc(p ? T.img(p) : "")}" alt="${esc(r.id)} range">`); });
    $("#rChaps").innerHTML = D.ranges.map((r, i) => { const n = T.products.filter((p) => p.rg === r.id).length; return `<div class="r-chap ${i ? "" : "on"}" data-r="${i}"><span class="num">0${i + 1} — ${n} pieces</span><h3 class="h2">${esc(r.id)}</h3><div class="moods">${r.mood.map((m) => `<span class="chip">${esc(m)}</span>`).join("")}</div><p class="lead">${esc(r.story)}</p><a class="link-u" href="range.html?r=${encodeURIComponent(r.id)}">Explore range →</a></div>`; }).join("");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const i = e.target.dataset.r; $$(".r-chap").forEach((c) => c.classList.toggle("on", c === e.target)); $$("#rStick img").forEach((im) => im.classList.toggle("on", im.dataset.r === i)); name.textContent = D.ranges[i].id; }), { rootMargin: "-45% 0px -45% 0px" });
    $$(".r-chap").forEach((c) => io.observe(c));
  }

  /* =============== [10] STORY =============== */
  function story() {
    const sf = $("#shopfront");
    if (hasGSAP && !T.reduced()) ScrollTrigger.create({ trigger: "#story", start: "top 80%", end: "center 40%", scrub: true, onUpdate: (s) => sf.style.setProperty("--gs", (1 - s.progress).toFixed(3)) });
    else sf.style.setProperty("--gs", 0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || ""; const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1800); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; k < 1 && requestAnimationFrame(step); }; requestAnimationFrame(step); }), { threshold: 0.6 });
    $$("[data-count]").forEach((c) => io.observe(c));
  }

  /* =============== [11] SHOP THE LOOK =============== */
  const LOOKS = [
    ["assets/img/rooms/lounge.jpg?v=2", "Lounge", "brass pendant", 47, 31],
    ["assets/img/rooms/kitchen.jpg?v=2", "Kitchen", "smoked glass pendant", 58, 24],
    ["assets/img/rooms/dining.jpg?v=2", "Dining", "glass globe pendant", 45, 17],
    ["assets/img/rooms/bedroom.jpg?v=2", "Bedroom", "opal table lamp", 88, 49],
    ["assets/img/rooms/bathroom.jpg?v=2", "Bathroom", "bathroom wall light", 95, 21],
    ["assets/img/rooms/patio.jpg?v=2", "Patio", "outdoor wall lantern", 10, 21]
  ];
  function looks() {
    $("#mosaic").innerHTML = LOOKS.map(([im, room, q, x, y]) => { const p = T.search(q, 1).items[0] || T.search(q.split(" ").slice(-1)[0], 1).items[0]; if (!p) return "";
      return `<figure class="look"><img src="${esc(im)}" alt="Modern ${esc(room.toLowerCase())} lit at night" loading="lazy"><figcaption class="look-room">${esc(room)}</figcaption>
        <button class="hsp" style="left:${x}%;top:${y}%" aria-label="Show the light in this ${esc(room.toLowerCase())}"></button>
        <div class="mini"><a class="th" href="${T.pUrl(p)}"><img src="${esc(T.thumb(T.img(p)))}" alt=""></a><a href="${T.pUrl(p)}"><b>${esc(p.n)}</b><span>${money(p.p)}</span></a><button class="btn sm" data-add="${p.id}">Quick add</button></div></figure>`; }).join("");
    $$(".look .hsp").forEach((b) => b.addEventListener("click", () => { const f = b.closest(".look"); $$(".look.show").forEach((x) => x !== f && x.classList.remove("show")); f.classList.toggle("show"); }));
  }


  /* =============== [12] NIGHT MAP =============== */
  function nightMap() {
    const list = $("#storeMini");
    const mark = (id) => $$("[data-store]", list).forEach((x) => x.classList.toggle("on", x.dataset.store === id));
    const map = window.TLWMap ? TLWMap.mount($("#gmap"), { onSelect: mark }) : { select() { } };
    const dir = (s) => window.TLWMap ? TLWMap.directions(s) : "https://www.google.com/maps";
    const panel = $("#storePanel");
    // trading hours: Mon–Fri 8:30–17:00, Sat 9:00–15:00, Sunday per store; checked in Johannesburg time
    const status = (st) => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" })); const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
      const sun = st.sun === "Closed" ? null : st.sun.split("–").map((x) => { const [h, mm] = x.trim().split(":").map(Number); return h * 60 + (mm || 0); });
      const span = d === 0 ? sun : d === 6 ? [540, 900] : [510, 1020];
      const today = d === 0 ? (sun ? st.sun.replace(/:00/g, "h00").replace("–", " – ") : "Closed") : d === 6 ? "9h00 – 15h00" : "8h30 – 17h00";
      return { open: !!span && m >= span[0] && m < span[1], today };
    };
    const showPanel = (st) => {
      const s = status(st);
      panel.innerHTML = `<button class="icon-btn sp-x" aria-label="Close showroom details">${T.I.close}</button>
        <span class="eyebrow">Showroom${st.isNew ? " · New" : ""}</span>
        <h3>${esc(st.name)}</h3>
        <span class="sp-badge ${s.open ? "open" : ""}">${s.open ? "Open now" : "Closed now"} · today ${esc(s.today)}</span>
        <p class="sp-addr">${esc(st.addr)}</p>
        <dl class="sp-hours"><div><dt>Mon – Fri</dt><dd>8h30 – 17h00</dd></div><div><dt>Saturday</dt><dd>9h00 – 15h00</dd></div><div><dt>Sunday &amp; public holidays</dt><dd>${esc(st.sun === "Closed" ? "Closed" : st.sun.replace(/:00/g, "h00").replace("–", " – "))}</dd></div></dl>
        <div class="sp-contact"><a href="tel:${esc(st.phone.replace(/[^\d+]/g, ""))}">${esc(st.phone)}</a><a href="mailto:${esc(st.email)}">${esc(st.email)}</a><span>Manager: ${esc(st.manager)}</span></div>
        <div class="sp-acts"><a class="btn sm" href="${dir(st)}" target="_blank" rel="noopener" data-ev="store_directions">Get directions</a><a class="btn sm ghost" href="${D.waHref}?text=${encodeURIComponent("Hi TLW " + st.name + ", ")}" target="_blank" rel="noopener">WhatsApp</a><a class="link-u" href="stores.html#${st.id}">Book a consultation →</a></div>`;
      panel.classList.add("on"); panel.setAttribute("aria-hidden", "false");
      $(".sp-x", panel).addEventListener("click", () => { panel.classList.remove("on"); panel.setAttribute("aria-hidden", "true"); mark(null); });
    };
    const show = (st) => { mark(st.id); map.select(st.id); showPanel(st); };
    list.innerHTML = D.stores.map((s) => `<button data-store="${s.id}"><b>${esc(s.name)}${s.isNew ? ' <span class="tag" style="vertical-align:middle">New</span>' : ""}</b><span>${esc(s.addr)}</span><span class="dir"><a href="${dir(s)}" target="_blank" rel="noopener" data-ev="store_directions">Directions →</a> · ${esc(s.phone)}</span></button>`).join("");
    $$("[data-store]", list).forEach((b) => b.addEventListener("click", (e) => { if (e.target.closest("a")) return; show(D.stores.find((x) => x.id === b.dataset.store)); }));
    $("#locBtn").addEventListener("click", () => {
      if (!navigator.geolocation) return T.toast("Location isn't available in this browser.");
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: la, longitude: lo } = pos.coords; const d = (s) => Math.hypot(s.lat - la, (s.lng - lo) * Math.cos(la * Math.PI / 180));
        const near = D.stores.slice().sort((a, b) => d(a) - d(b))[0]; show(near); T.toast(`<span>Your nearest store is <b>${esc(near.name)}</b> · ${esc(near.phone)}</span>`);
      }, () => T.toast("We couldn't get your location. Pick a store from the list instead."));
    });
  }



  /* =============== boot =============== */
  initHero();
  T.ready((P) => {
    categories(P); bento(P); house(P); gallery(); fanEdit(); loadshedding(P); ranges(); story(); looks();
    T.reveal(); T.magnetic(); hasGSAP && ScrollTrigger.refresh();
  });
})();
