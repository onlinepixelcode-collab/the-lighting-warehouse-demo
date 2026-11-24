/* Explore pages: stores, story, inspiration (planner.js and tools.js are separate) */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA;
  if (!T || !D) return;
  const { $, $$, esc, money } = T;
  const page = document.body.dataset.page;
  const LS = D.lifestyle;
  const onScroll = (fn) => { let raf = 0; const run = () => { raf = 0; fn(); }; const req = () => { if (!raf) raf = requestAnimationFrame(run); }; addEventListener("scroll", req, { passive: true }); addEventListener("resize", req); fn(); return req; };
  const scrollToEl = (el, off) => { const o = off == null ? -90 : off; if (T.lenis) T.lenis.scrollTo(el, { offset: o, duration: 1.2 }); else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + o, behavior: T.reduced() ? "auto" : "smooth" }); };

  /* =====================================================================
     STORES
     ===================================================================== */
  function stores() {
    const S = D.stores, list = $("#stList"), DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const U = "https://lightingwarehouse.co.za/wp-content/uploads/";
    const PHOTOS = [["2026/03/Gemini_Generated_Image_naas.jpg"], ["2025/12/Tris.jpg"], ["2025/12/1-1.jpg"], ["2026/06/Shop-Dublin.jpg", 1.42], ["2025/12/03-ShopWoven.jpg", 1.42], ["2025/12/04-ShopGlass.jpg", 1.42], ["2025/12/shop-industrial.jpg", 1.42], ["2025/12/Shop-fabrica.jpg", 1.14], ["2025/12/shop-wood.jpg", 1.14], ["2025/12/shop-fans.jpg", 1.14], ["2025/12/shop-modern.jpg", 1.42]];
    const photo = (s, i) => s.img ? `src="${esc(s.img)}"` : ((p) => `src="${U + p[0]}"${p[1] ? ` class="cb" style="--cb:${p[1]}"` : ""}`)(PHOTOS[(i - 1 + PHOTOS.length) % PHOTOS.length]);
    const kzn = (s) => /kwazulu/i.test(s.region);
    const tel = (p) => "+27" + p.replace(/\D/g, "").replace(/^0/, "");
    const fm = (m) => Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
    const sunH = (s) => { const m = /(\d+):(\d+)\s*[–-]\s*(\d+):(\d+)/.exec(s.sun || ""); return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : null; };
    const hoursFor = (s, d) => d === 0 ? sunH(s) : d === 6 ? [540, 900] : [510, 1020];
    function now() {
      const o = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).forEach((p) => o[p.type] = p.value);
      return { d: DAYS.indexOf(o.weekday), m: (+o.hour % 24) * 60 + +o.minute, label: o.hour + ":" + o.minute };
    }
    function status(s, n) {
      const h = hoursFor(s, n.d);
      if (h && n.m >= h[0] && n.m < h[1]) { const left = h[1] - n.m; return { open: true, cls: left <= 60 ? "open soon" : "open", txt: left <= 60 ? `Closing soon · ${fm(h[1])}` : `Open now · until ${fm(h[1])}` }; }
      if (h && n.m < h[0]) return { open: false, cls: "", txt: `Closed · opens ${fm(h[0])}` };
      for (let i = 1; i <= 7; i++) { const d = (n.d + i) % 7, hh = hoursFor(s, d); if (hh) return { open: false, cls: "", txt: `Closed · opens ${i === 1 ? "tomorrow" : DAYS[d]} ${fm(hh[0])}` }; }
      return { open: false, cls: "", txt: "Closed" };
    }
    const wa = (s) => `${D.waHref}?text=${encodeURIComponent(`Hi The Lighting Warehouse ${s.name}, I have a question about `)}`;
    const gm = (s) => window.TLWMap ? TLWMap.directions(s) : `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
    const wz = (s) => `https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`;

    list.innerHTML = S.map((s, i) => `<article class="st-card" id="${s.id}" role="listitem" data-id="${s.id}" aria-labelledby="n-${s.id}">
      <figure class="st-ph"><img ${photo(s, i)} alt="Lighting styled by The Lighting Warehouse" loading="${i < 3 ? "eager" : "lazy"}">${s.isNew ? '<span class="tag">New store</span>' : ""}<span class="st-no">${String(i + 1).padStart(2, "0")}</span></figure>
      <div class="st-body">
        <div class="st-top"><span class="st-reg">${esc(s.region)}</span><span class="st-badge" data-status><i></i><span></span></span></div>
        <h2 class="st-name" id="n-${s.id}"><button type="button" class="st-sel" data-sel="${s.id}">${esc(s.name)}<span class="sr-only">: show on map</span></button> <span class="st-dist" data-dist></span></h2>
        <address>${esc(s.addr)}</address>
        <dl class="st-meta">
          <div><dt>Phone</dt><dd><a href="tel:${tel(s.phone)}" data-ev="store_call">${esc(s.phone)}</a></dd></div>
          <div><dt>Store manager</dt><dd>${esc(s.manager)}</dd></div>
          <div style="grid-column:1/-1"><dt>Email</dt><dd><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></dd></div>
        </dl>
        <table class="st-hours"><caption class="sr-only">Opening hours, ${esc(s.name)}</caption><tbody>
          <tr data-day="wk"><th scope="row">Mon – Fri</th><td>8:30 – 17:00</td></tr>
          <tr data-day="6"><th scope="row">Saturday</th><td>9:00 – 15:00</td></tr>
          <tr data-day="0"><th scope="row">Sunday &amp; public holidays</th><td>${esc(s.sun)}</td></tr></tbody></table>
        <div class="st-acts">
          <a class="btn sm" href="${gm(s)}" target="_blank" rel="noopener" data-ev="store_directions">Directions <span class="arr">→</span></a>
          <a class="btn ghost sm" href="${wz(s)}" target="_blank" rel="noopener" data-ev="store_waze">Waze</a>
          <a class="btn ghost sm" href="${wa(s)}" target="_blank" rel="noopener" data-ev="store_whatsapp">${T.I.wa} WhatsApp</a>
          <button class="btn ghost sm" type="button" data-book="${s.id}">Book a consultation</button>
        </div>
      </div></article>`).join("");

    /* live open/closed */
    function refreshStatus() {
      const n = now(); let open = 0;
      $("#stClock").textContent = n.label;
      S.forEach((s) => {
        const st = status(s, n); s._open = st.open; if (st.open) open++;
        const b = $(`#${s.id} [data-status]`); b.className = "st-badge " + st.cls; b.lastElementChild.textContent = st.txt;
        $$(`#${s.id} .st-hours tr`).forEach((tr) => tr.classList.toggle("today", tr.dataset.day === "wk" ? n.d >= 1 && n.d <= 5 : +tr.dataset.day === n.d));
      });
      $("#stOpenN").textContent = open;
      const nxt = open ? "" : (status(S[1], n).txt.split("opens ")[1] || "");
      $("#stOpenTxt").textContent = open === 0 ? `showrooms open right now · doors open again ${nxt}` : open === 1 ? "showroom open right now" : `of ${S.length} showrooms open right now`;
      if (active) mapCard(active);
    }

    /* map: shared TLWMap module (live Google Map with bulb markers when a key is set, keyless embed otherwise) */
    let active = null, gmap = null;
    const mapEl = $("#stMap");
    const mountMap = () => window.TLWMap ? TLWMap.mount(mapEl, { onSelect: (id) => { if (!active || active.id !== id) select(id, { scrollCard: true, fromMap: true }); } }) : null;
    gmap = mountMap();
    $$("[data-jump]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.jump === "kzn") select("umhlanga", { scrollCard: true });
      else { active = null; $$(".st-card").forEach((c) => c.classList.toggle("on", false)); $("#stMapCard").classList.toggle("show", false); gmap = mountMap(); }
    }));
    function mapCard(s) {
      const c = $("#stMapCard"); const st = status(s, now());
      c.innerHTML = `<span class="st-reg">${esc(s.region)}${s.isNew ? ' · <span style="color:var(--amber)">New</span>' : ""}</span><h3>${esc(s.name)}</h3><p>${esc(s.addr)}</p>
        <div class="flex"><span class="st-badge ${st.cls}"><i></i><span>${st.txt}</span></span><a class="btn sm" href="${gm(s)}" target="_blank" rel="noopener" data-ev="store_directions">Directions</a><a class="btn ghost sm" href="tel:${tel(s.phone)}">${esc(s.phone)}</a></div>`;
      c.classList.add("show");
    }
    function select(id, opts) {
      opts = opts || {}; const s = S.find((x) => x.id === id); if (!s) return; active = s;
      $$(".st-card").forEach((c) => c.classList.toggle("on", c.id === id));
      if (gmap && !opts.fromMap) gmap.select(id);
      mapCard(s);
      try { history.replaceState(null, "", "#" + id); } catch (e) { }
      const card = $("#" + id);
      if (opts.scrollCard && card && !card.hidden) scrollToEl(card, -96);
      if (opts.toMap && matchMedia("(max-width: 960px)").matches) scrollToEl($(".st-mapcol"), -70);
      T.track("store_select", { store: id });
    }
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-book]"); if (b) { openConsult(b.dataset.book); return; }
      if (e.target.closest("a, button:not([data-sel])")) return;
      const c = e.target.closest(".st-card"); if (c) select(c.id, { toMap: true });
    });

    /* search, filters, distance */
    const PLACES = { sandton: [-26.107, 28.056], rosebank: [-26.146, 28.042], bryanston: [-26.06, 28.02], rivonia: [-26.055, 28.06], midrand: [-25.99, 28.13], "lone hill": [-26.01, 28.02], lonehill: [-26.01, 28.02], fourways: [-26.017, 28.007], sunninghill: [-26.035, 28.065], randburg: [-26.094, 28.0], northcliff: [-26.14, 27.97], cresta: [-26.13, 27.97], honeydew: [-26.08, 27.93], roodepoort: [-26.162, 27.872], krugersdorp: [-26.1, 27.77], soweto: [-26.267, 27.858], johannesburg: [-26.204, 28.047], joburg: [-26.204, 28.047], jozi: [-26.204, 28.047], jhb: [-26.204, 28.047], melville: [-26.176, 28.008], parktown: [-26.177, 28.04], "kempton park": [-26.1, 28.23], kempton: [-26.1, 28.23], benoni: [-26.19, 28.32], brakpan: [-26.24, 28.37], germiston: [-26.22, 28.17], bedfordview: [-26.18, 28.13], boksburg: [-26.212, 28.26], alberton: [-26.267, 28.122], edenvale: [-26.14, 28.15], springs: [-26.25, 28.44], vereeniging: [-26.67, 27.93], vanderbijlpark: [-26.71, 27.84], pretoria: [-25.747, 28.229], tshwane: [-25.747, 28.229], menlyn: [-25.785, 28.277], hatfield: [-25.75, 28.24], brooklyn: [-25.77, 28.24], garsfontein: [-25.79, 28.3], "moreleta park": [-25.82, 28.3], centurion: [-25.86, 28.19], irene: [-25.88, 28.22], montana: [-25.68, 28.26], wonderboom: [-25.68, 28.2], akasia: [-25.67, 28.12], "silver lakes": [-25.78, 28.35], durban: [-29.858, 31.029], umhlanga: [-29.726, 31.085], ballito: [-29.539, 31.214], westville: [-29.83, 30.93], pinetown: [-29.81, 30.86], hillcrest: [-29.78, 30.76], pietermaritzburg: [-29.6, 30.38], "cape town": [-33.92, 18.42], gqeberha: [-33.96, 25.6], "port elizabeth": [-33.96, 25.6], bloemfontein: [-29.12, 26.21], polokwane: [-23.9, 29.45], mbombela: [-25.47, 30.97], nelspruit: [-25.47, 30.97], rustenburg: [-25.67, 27.24], "east london": [-33.02, 27.9], kimberley: [-28.74, 24.77], witbank: [-25.87, 29.23], emalahleni: [-25.87, 29.23] };
    const POSTAL = [[[1, 199], [-25.75, 28.22, "Pretoria"]], [[200, 299], [-25.6, 27.9, "North West"]], [[300, 999], [-24.5, 29.3, "Limpopo"]], [[1000, 1399], [-25.6, 29.8, "Mpumalanga"]], [[1400, 1499], [-26.23, 28.2, "East Rand"]], [[1500, 1599], [-26.2, 28.35, "Benoni area"]], [[1600, 1699], [-26.13, 28.18, "Edenvale area"]], [[1700, 1799], [-26.13, 27.85, "West Rand"]], [[1800, 1999], [-26.6, 27.9, "the Vaal"]], [[2000, 2099], [-26.2, 28.04, "Johannesburg"]], [[2100, 2199], [-26.09, 28.03, "Johannesburg North"]], [[2500, 2999], [-26.7, 26.5, "North West"]], [[3000, 4999], [-29.8, 30.95, "KwaZulu-Natal"]], [[5000, 6499], [-33.5, 26.0, "Eastern Cape"]], [[6500, 8299], [-33.9, 18.6, "Western Cape"]], [[8300, 8999], [-28.7, 24.8, "Northern Cape"]], [[9300, 9999], [-29.1, 26.2, "Free State"]]];
    const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
    let origin = null, originName = "", area = "all", query = "";
    function apply() {
      const q = query.trim().toLowerCase();
      let match = S.slice(), msg = "";
      if (q) {
        const direct = S.filter((s) => (s.name + " " + s.addr + " " + s.region).toLowerCase().includes(q));
        const pc = /^\d{4}$/.test(q) ? POSTAL.find(([r]) => +q >= r[0] && +q <= r[1]) : null;
        const place = Object.keys(PLACES).find((k) => k === q || (q.length > 3 && k.startsWith(q)));
        if (direct.length && !place) { match = direct; origin = null; msg = `<b>${direct.length}</b> showroom${direct.length > 1 ? "s" : ""} matching “${esc(query.trim())}”`; }
        else if (place || pc) { origin = place ? PLACES[place] : pc[1].slice(0, 2); originName = place ? place.replace(/\b\w/g, (c) => c.toUpperCase()) : `postal code ${q} (${pc[1][2]})`; msg = ""; }
        else { match = []; msg = `No showroom matches “${esc(query.trim())}”. Try a suburb or city, or use your location.`; }
      }
      if (area === "gp") match = match.filter((s) => !kzn(s));
      if (area === "kzn") match = match.filter(kzn);
      if (area === "open") match = match.filter((s) => s._open);
      if (origin) {
        match.forEach((s) => s._km = km(origin, [s.lat, s.lng])); match.sort((a, b) => a._km - b._km);
        if (match[0]) msg = `Nearest to <b>${esc(originName)}</b>: ${esc(match[0].name)}, about ${Math.round(match[0]._km)} km away${match[0]._km > 120 ? ". We deliver nationwide, free over R500" : ""}`;
      }
      const ids = new Set(match.map((s) => s.id));
      match.forEach((s) => list.appendChild($("#" + s.id)));
      S.forEach((s) => {
        const c = $("#" + s.id); c.hidden = !ids.has(s.id);
        const d = $("[data-dist]", c); d.textContent = origin && ids.has(s.id) ? `· ${Math.round(s._km)} km` : "";
      });
      let empty = $(".st-empty", list); if (!match.length) { if (!empty) { empty = document.createElement("p"); empty.className = "st-empty"; list.appendChild(empty); } empty.innerHTML = `No showrooms to show. <button class="link-u" type="button" id="stReset">Show all stores</button>`; $("#stReset").onclick = reset; } else if (empty) empty.remove();
      $("#stResult").innerHTML = msg || (match.length === S.length ? `Showing all <b>${S.length}</b> showrooms` : `Showing <b>${match.length}</b> of ${S.length} showrooms`);
      return match;
    }
    function reset() { query = ""; $("#stQ").value = ""; origin = null; area = "all"; $$("#stArea button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.area === "all")); apply(); }
    let tmr; $("#stQ").addEventListener("input", (e) => { clearTimeout(tmr); tmr = setTimeout(() => { query = e.target.value; apply(); }, 180); });
    $("#stSearch").addEventListener("submit", (e) => { e.preventDefault(); query = $("#stQ").value; const m = apply(); if (m[0]) select(m[0].id, { toMap: true }); T.track("store_search", { q: query }); });
    $$("#stArea button").forEach((b) => b.addEventListener("click", () => {
      area = b.dataset.area; $$("#stArea button").forEach((x) => x.setAttribute("aria-pressed", x === b)); const m = apply();
      if (m.length && area === "kzn") select("umhlanga");
    }));
    $("#stLoc").addEventListener("click", () => {
      if (!navigator.geolocation) { T.toast("Location isn't available in this browser. Type your suburb instead."); return; }
      const b = $("#stLoc"); b.setAttribute("aria-busy", "true"); $(".lbl", b).textContent = "Finding you…";
      navigator.geolocation.getCurrentPosition((pos) => {
        b.removeAttribute("aria-busy"); $(".lbl", b).textContent = "Use my location";
        origin = [pos.coords.latitude, pos.coords.longitude]; originName = "you"; query = ""; $("#stQ").value = "";
        const m = apply(); if (m[0]) { select(m[0].id, { scrollCard: true }); T.toast(`<span>Your nearest showroom is <b>${esc(m[0].name)}</b>, about ${Math.round(m[0]._km)} km away</span>`); }
      }, () => { b.removeAttribute("aria-busy"); $(".lbl", b).textContent = "Use my location"; T.toast("We couldn't get your location. Type your suburb or postal code instead."); }, { timeout: 10000, maximumAge: 600000 });
    });

    /* consultation modal */
    const modal = $("#consult"); let lastFocus = null;
    $("#cStore").innerHTML = S.map((s) => `<option value="${s.id}">${esc(s.name)}${s.isNew ? " (new)" : ""}</option>`).join("");
    function openConsult(id) {
      lastFocus = document.activeElement;
      $("#consultForm").hidden = false; $("#consultDone").hidden = true;
      const t = new Date(Date.now() + 864e5); const iso = t.toISOString().slice(0, 10); const dt = $("#cDate"); dt.min = iso; if (!dt.value) dt.value = iso;
      if (id) $("#cStore").value = id;
      modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); T.lenis && T.lenis.stop();
      setTimeout(() => $("#cName").focus(), 60); T.track("consult_open", { store: id });
    }
    function closeConsult() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); T.lenis && T.lenis.start(); lastFocus && lastFocus.focus && lastFocus.focus(); }
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-cclose]")) closeConsult(); });
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") closeConsult();
      if (e.key === "Tab") { const f = $$("button, input, select, textarea, a[href]", modal).filter((x) => x.offsetParent !== null); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    $("#cForm").addEventListener("submit", (e) => {
      e.preventDefault(); const f = e.target; if (!f.checkValidity()) { f.reportValidity(); return; }
      const s = S.find((x) => x.id === f.store.value); const d = new Date(f.date.value + "T12:00:00");
      $("#consultDoneTxt").textContent = `Thanks, ${f.name.value.split(" ")[0]}. The ${s.name} team will call you on ${f.tel.value} to confirm your consultation on ${d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })} (${f.time.value.split(" (")[0].toLowerCase()}).`;
      $("#consultForm").hidden = true; $("#consultDone").hidden = false; $("#consultDoneH").focus();
      T.track("consult_booked", { store: s.id, project: f.project.value }); f.reset();
    });

    /* boot */
    refreshStatus(); setInterval(refreshStatus, 60000); apply();
    const h = location.hash.slice(1);
    if (h && S.some((s) => s.id === h)) setTimeout(() => select(h, { scrollCard: true, instant: true }), 400);
    if (T.qs("book")) openConsult(T.qs("book"));
    addEventListener("hashchange", () => { const k = location.hash.slice(1); if (S.some((s) => s.id === k) && (!active || active.id !== k)) select(k, { scrollCard: true }); });
    T.reveal(); T.magnetic();
  }

  /* =====================================================================
     STORY
     ===================================================================== */
  function story() {
    const tl = $("#tl"); if (!tl) return;
    const fill = $(".sy-fill", tl), chs = $$(".sy-ch", tl), bleeds = $$(".sy-bleed img");
    const red = T.reduced();
    onScroll(() => {
      const vh = innerHeight, r = tl.getBoundingClientRect(), line = vh * 0.55;
      const p = red ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height));
      fill.style.setProperty("--p", (p * 100).toFixed(2) + "%");
      chs.forEach((c) => { const n = $(".sy-node", c).getBoundingClientRect(); c.classList.toggle("on", red || n.top + n.height / 2 < line); });
      if (!red) bleeds.forEach((im) => { const b = im.parentElement.getBoundingClientRect(); if (b.bottom < -100 || b.top > vh + 100) return; const k = (b.top + b.height / 2 - vh / 2) / vh; im.style.transform = `translate3d(0, ${(k * -7).toFixed(2)}%, 0)`; });
    });
    /* values */
    const vals = $$(".sy-val"), figs = $$(".sy-vfig img"), cap = $(".sy-vfig figcaption");
    const setV = (i) => { vals.forEach((v, k) => { v.classList.toggle("on", k === i); $("button", v).setAttribute("aria-expanded", k === i); }); figs.forEach((f, k) => f.classList.toggle("on", k === i)); if (cap) cap.textContent = vals[i].dataset.cap || ""; };
    vals.forEach((v, i) => { const b = $("button", v); b.addEventListener("click", () => setV(i)); b.addEventListener("mouseenter", () => setV(i)); b.addEventListener("focus", () => setV(i)); });
    if ("IntersectionObserver" in window && matchMedia("(hover: none)").matches) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setV(vals.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" });
      vals.forEach((v) => io.observe(v));
    }
    setV(0);
    const run = $("#syRun"); if (run) run.innerHTML = D.stores.map((s) => `<a href="stores.html#${s.id}">${esc(s.name)}${s.isNew ? "<sup>New</sup>" : ""}</a>`).join('<i aria-hidden="true">·</i> ');
    T.reveal(); T.magnetic();
  }

  /* =====================================================================
     INSPIRATION — The Light Journal
     ===================================================================== */
  const G = {
    "ceiling-fan": {
      dek: "Blade span, mounting height, DC or AC motor, light or no light. Everything we ask customers in store before they choose a fan for a South African summer.",
      body: [
        ["Start with the room, not the fan", [
          "The single biggest mistake we see is a fan that is too small for the room. It spins flat out, makes a noise and still leaves the corners stuffy. Measure the room first, then pick the blade span (the full diameter from blade tip to blade tip).",
          "<strong>Up to 9 m²</strong> (a small bedroom or study, around 3 m × 3 m): 760 mm to 1066 mm. <strong>9–16 m²</strong> (a main bedroom, 4 m × 4 m): about 1320 mm. <strong>16–25 m²</strong> (a lounge, 5 m × 5 m): 1520 mm. <strong>Bigger than 25 m²</strong> or open-plan: 1820 mm, or two fans spaced evenly along the length of the room."
        ]],
        ["Height and clearance", [
          "For safety and comfort the blades should sit at least 2.1 m above the floor, ideally 2.3 to 2.5 m, and at least 450 mm from any wall or cupboard. On a standard 2.4 m South African ceiling, choose a flush or short-rod mount. With a 3 m or double-volume ceiling, use a longer downrod so the air actually reaches you.",
          "Never mount a fan where a door can swing into it, and keep it clear of pendants and downlights so the blades don't cause flicker as they pass under the light."
        ]],
        ["DC or AC motor?", [
          "DC motors cost more up front but use roughly a third of the electricity of an AC motor, run almost silently, and usually come with a remote, more speeds and a timer. Because they draw so little power, a DC fan will also run happily off an inverter or backup battery during load-shedding.",
          "AC fans are the budget-friendly, proven choice for rooms where you only need the fan now and then."
        ]],
        ["With a light, or without?", [
          "In a bedroom, a fan with an integrated LED light replaces the ceiling light so you're not left with two fittings fighting for the centre of the ceiling. Choose a warm white (3000K) light that dims, so the room isn't lit like an office at night. In a lounge with good layered lighting, a fan without a light often looks cleaner."
        ]],
        ["Blades and finish", [
          "Three blades look sleek and move plenty of air; five and eight-blade fans are quieter at the same speed and suit bigger rooms. On the coast, choose sealed motors and finishes that cope with humidity and salt air, and wipe the blades every few weeks: dust on the leading edge makes a fan wobble."
        ]]
      ],
      quote: "Measure the room <em>first</em>. A fan that is too small spins flat out and still leaves the corners stuffy.",
      rules: ["Blade span follows floor area: about 1320 mm for a 4 m × 4 m room.", "Blades at least 2.1 m off the floor and 450 mm from walls.", "DC motors are quieter, cheaper to run and inverter-friendly.", "In bedrooms, pick a dimmable warm white light kit.", "Have a qualified electrician install it on a fan-rated box and issue a CoC."]
    },
    kitchen: {
      dek: "The kitchen is the hardest-working room in the house. Light it in three layers and you'll never chop onions in your own shadow again.",
      body: [
        ["Layer one: ambient", [
          "A single ceiling light in the middle of the kitchen puts you in your own shadow whenever you face the counter. Instead, spread the general light evenly with LED downlights or surface panels set about 60 cm in from the cupboards, so the light lands on the front edge of the counter rather than behind your back.",
          "Aim for 300–400 lumens per square metre in a kitchen, roughly three times what a bedroom needs. A 12 m² kitchen needs around 4,000 lumens in total."
        ]],
        ["Layer two: task", [
          "Pendants over an island or breakfast counter do double duty as task light and the kitchen's jewellery. Hang them so the bottom of the shade is <strong>65–75 cm above the counter</strong>: low enough to light the surface, high enough not to block the view across the room.",
          "As a rule, one pendant per 60–80 cm of island, with the outer pendants about 30 cm in from each end. Odd numbers (one, three) usually look best. LED strip lights under the wall cupboards light the worktop where you actually work."
        ]],
        ["Layer three: accent", [
          "A strip of warm light above the cupboards or inside glass-fronted cabinets adds depth in the evening, when the kitchen becomes part of the lounge. Put this layer on its own switch."
        ]],
        ["Colour temperature", [
          "Warm white (3000K) keeps an open-plan kitchen in harmony with the lounge and dining area. If your kitchen is a separate room and you want a crisper look for cooking, cool white (4000K) is fine, but avoid mixing different temperatures in one view."
        ]]
      ],
      quote: "Light the counter, not the back of your head. Downlights go <em>60 cm</em> in from the cupboards.",
      rules: ["300–400 lumens per m² for kitchens.", "Pendants 65–75 cm above the counter.", "One pendant per 60–80 cm of island.", "Under-cabinet LED strips for the worktop.", "Separate switches for each layer, and dimmers where you can."]
    },
    dining: {
      dek: "The most common question at our counters: how high should it hang? Here's the answer, and how to choose the right size and number of pendants.",
      body: [
        ["The magic number", [
          "Hang a dining pendant so the bottom of the shade sits <strong>75–85 cm above the table top</strong>. Any higher and the light floods the room and glares in your eyes; any lower and you'll be peering around it to talk. If your ceiling is higher than 2.7 m, stay at the upper end and let the cable or chain take up the extra height."
        ]],
        ["Size it to the table", [
          "A single pendant should be roughly half to two-thirds the width of the table. For a 90 cm wide table, that's a 45–60 cm shade. Keep at least 15 cm between the edge of the shade and the edge of the table so nobody knocks their head standing up.",
          "For a long rectangular table, use two or three smaller pendants, or a linear bar pendant, spaced evenly along the length. Round tables suit one generous pendant or a cluster."
        ]],
        ["Glass, metal or woven?", [
          "Clear and smoked glass pendants show off a decorative filament globe and throw a soft, sparkling light. Metal domes push light down onto the table for a dramatic, restaurant feel. Woven and rattan shades cast beautiful patterns on the walls and ceiling. Think about where you want the light to go, not just how the shade looks switched off."
        ]],
        ["Dim it", [
          "Dining rooms move from homework and Sunday lunch to candlelit dinners. A dimmer is the best R300 you'll spend on this room. Choose dimmable LED globes in 2700K for that warm, flattering glow."
        ]]
      ],
      quote: "Bottom of the shade, <em>75 to 85 cm</em> above the table. Write it on the back of your hand.",
      rules: ["75–85 cm from table top to the bottom of the shade.", "Shade width: half to two-thirds of the table width.", "Long tables: two or three pendants, or a bar pendant.", "Use dimmable 2700K globes.", "Centre on the table, not on the room."]
    },
    garden: {
      dek: "Light the paths for safety, the trees for drama and the walls for architecture. A garden lighting plan for Highveld storms and coastal air.",
      body: [
        ["Think in zones", [
          "Walk the garden at night and note where you actually go: the path from the car, the stoep, the braai, the pool. Light those first. Then pick two or three things worth looking at from inside, a tree, a textured wall, a water feature, and light those softly. Leave the rest dark; darkness is what makes the lit parts beautiful."
        ]],
        ["Paths and steps", [
          "Low bollards or spike lights placed every 2–3 m, alternating sides, light a path without blinding anyone. Light steps from the side or from step lights in the riser so each tread is clear. Avoid lights that shine straight into your eyes as you walk towards the house."
        ]],
        ["Walls and trees", [
          "Up-and-down wall lights turn a plain facade into architecture, and a single spike light at the base of a tree, angled up into the canopy, gives you a sculpture for free. Warm white (2700–3000K) looks natural on plants and stone; cool white makes gardens look flat and cold."
        ]],
        ["Built for our weather", [
          "Anything exposed to rain needs at least <strong>IP44</strong>; lights in the ground, near sprinklers or facing Highveld storms should be <strong>IP65</strong> or higher. On the coast, choose powder-coated aluminium or stainless steel and rinse fittings with fresh water now and then to wash off the salt."
        ]],
        ["Solar and sensors", [
          "Solar spike, bollard and wall lights need no trenching or wiring, keep working during load-shedding, and charge well in our sunshine. Motion-sensor floodlights on the driveway and side passages add security without lighting the neighbours' bedrooms all night."
        ]]
      ],
      quote: "Leave most of the garden dark. Darkness is what makes the lit parts <em>beautiful.</em>",
      rules: ["Light where you walk first, then two or three features.", "IP44 minimum outdoors; IP65+ for exposed and in-ground.", "Warm white 2700–3000K for plants and stone.", "Solar for spots that are hard to wire.", "Aim light away from neighbours and the street."]
    },
    "load-shedding": {
      dek: "You can't control the schedule, but you can stop sitting in the dark. Practical, affordable ways to keep the lights on, from R50 globes to solar.",
      body: [
        ["Start with emergency globes", [
          "The quickest win. Emergency LED globes fit any normal E27 screw or B22 bayonet fitting and behave like ordinary globes when the power is on, while charging a small built-in battery. When the power goes, they keep shining from the battery at a lower brightness for up to about six hours.",
          "The catch: the light switch must be left <strong>on</strong> for the globe to know the power has gone. Put one in the kitchen, the passage and each main living area, and you'll never hunt for a torch again."
        ]],
        ["Go solar outside", [
          "Solar motion-sensor lights, spike lights and floodlights are completely independent of Eskom. They charge during the day and switch on at dusk, which matters for security during evening load-shedding slots. Mount panels where they get at least five or six hours of direct sun, facing north if you can."
        ]],
        ["Make your inverter go further", [
          "If you have an inverter or backup battery, LED is your best friend: ten 9 W LED globes use about 90 W, less than a single old 100 W incandescent globe. Swap every halogen downlight for a GU10 LED and your battery lasts dramatically longer. A DC ceiling fan uses a fraction of an AC fan's power, so you can stay cool on backup too."
        ]],
        ["Protect your electronics", [
          "Power surges when the grid comes back are hard on TVs, routers and chargers. A surge-protected multi plug is cheap insurance. Switch heavy appliances off at the wall before the scheduled slot and back on a few minutes after power returns."
        ]]
      ],
      quote: "Leave the switch <em>on</em>. That's how an emergency globe knows the power has gone.",
      rules: ["Emergency globes in kitchen, passage and living areas.", "Leave those switches on so the globes can sense an outage.", "Solar motion sensors for gates, driveways and side passages.", "All-LED and DC fans if you run on an inverter.", "Surge-protected multi plugs for electronics."]
    },
    trends: {
      dek: "What we're seeing on the showroom floor and in the containers arriving for next year: natural texture, smoked glass, warm brass and globes as sculpture.",
      body: [
        ["Woven and natural", [
          "Rattan, seagrass, bamboo and timber shades aren't going anywhere. They soften hard modern interiors, suit our climate and throw lovely patterned light across walls and ceilings. The newest pieces are bigger and more sculptural: one oversized woven pendant over a dining table instead of three small ones."
        ]],
        ["Smoked and amber glass", [
          "Clear glass is giving way to smoky grey, amber and bronze tones. Tinted glass hides the globe a little and gives a warmer, moodier glow, perfect for bars, dining rooms and bedside pendants. Pair it with a decorative filament globe for the full effect."
        ]],
        ["Warm brass and soft gold", [
          "Satin brass and champagne finishes bring warmth back after years of matte black. They work beautifully with natural timber, green walls and terrazzo. Mix one brass statement piece with black or wood elsewhere rather than going all-gold."
        ]],
        ["The globe as the light fitting", [
          "Large decorative filament globes, the big G200 spheres and long ST164 shapes, are now hung bare on a simple cord set as the light itself. Choose dimmable, extra-warm (2200K) versions for a candle-like glow."
        ]],
        ["Warmer, lower, layered", [
          "The biggest shift isn't a product, it's how people light rooms: fewer bright ceiling lights, more lamps, wall lights and pools of warm light at eye level. Think hotel lobby, not office."
        ]]
      ],
      quote: "Fewer bright ceiling lights, more pools of warm light at eye level. Think <em>hotel lobby</em>, not office.",
      rules: ["One oversized natural pendant beats three small ones.", "Smoked or amber glass with a filament globe.", "Brass as an accent, mixed with wood or black.", "Bare decorative globes in 2200K as statement pieces.", "Layer lamps and wall lights; dim the ceiling."]
    },
    "dark-room": {
      dek: "South-facing rooms, small windows, deep verandas: plenty of South African homes have a room that never feels bright. Here's how to fix it with light.",
      body: [
        ["Why it feels dark", [
          "In the southern hemisphere, south-facing rooms get little direct sun, and deep roof overhangs and verandas keep many rooms dim even at midday. The answer isn't one brighter ceiling light, it's light from more directions, so there are no gloomy corners."
        ]],
        ["Light the walls and ceiling", [
          "We judge brightness by what we see on walls and ceilings, not on the floor. Wall lights that wash light up and down, uplighters that bounce off the ceiling, and downlights placed close to walls make a room feel far bigger and brighter than the lumen count suggests."
        ]],
        ["Get the numbers right", [
          "Most dark rooms are simply under-lit. A lounge or bedroom needs roughly 100–150 lumens per square metre, so a 16 m² room needs 1,600–2,400 lumens in total, the equivalent of three or four 806 lm LED globes. Use our lumen calculator to check your room."
        ]],
        ["Choose the right white", [
          "For rooms where you work, read or study in the day, a neutral or cool white (4000K) can feel more like daylight. For lounges and bedrooms used mostly at night, stick to warm white and simply add more of it."
        ]],
        ["Help the light along", [
          "Light paint colours, a large mirror opposite the window and glossy or glass surfaces all bounce light deeper into the room. Clear or white glass shades let more light out than dark metal domes."
        ]]
      ],
      quote: "We judge brightness by the <em>walls and ceiling</em>, not the floor. Light those first.",
      rules: ["Add light sources, don't just brighten one.", "100–150 lm per m² for lounges and bedrooms.", "Wash walls and bounce light off the ceiling.", "4000K for daytime work rooms, warm white elsewhere.", "Light shades, mirrors and pale walls multiply the effect."]
    },
    "picture-lights": {
      dek: "A single well-aimed light turns a painting, a bookshelf or a textured wall into the focal point of the room. Accent lighting, explained simply.",
      body: [
        ["The three-times rule", [
          "For something to stand out, it needs about three times more light on it than the room around it. That's why a dim room with one lit painting looks so dramatic: the contrast does the work, not the wattage."
        ]],
        ["Aim at 30 degrees", [
          "Angle spotlights at roughly 30° from vertical onto the artwork. Steeper and the frame casts a shadow across the top of the picture; shallower and you'll get glare off the glass, and light in people's eyes. For a large piece, use two spots crossing from either side."
        ]],
        ["Colour and quality", [
          "Choose warm white (2700–3000K) for most art and family photos, and look for a high colour rendering (CRI 90 or above) so colours look true. LED is kind to artwork: unlike halogen, it gives off almost no UV or heat."
        ]],
        ["Which fitting?", [
          "Adjustable ceiling spotlights or track spots give you the most flexibility and can be re-aimed when you rehang. Wall lights either side of a mirror or artwork frame it symmetrically. LED strips tucked into shelves turn a bookcase into a lantern. GU10 spots are easy to replace and come in narrow beams for precise accents."
        ]]
      ],
      quote: "An accent needs about <em>three times</em> the light of the room around it. Contrast does the work.",
      rules: ["Three times the surrounding light for a focal point.", "Spots angled about 30° to avoid glare and shadow.", "2700–3000K with CRI 90+ for artwork.", "Track or adjustable spots so you can re-aim later.", "Put accents on their own switch or dimmer."]
    }
  };

  const UP = "https://lightingwarehouse.co.za/wp-content/uploads/";
  const BANNER = { "Shop-Dublin.jpg": 1.42, "03-ShopWoven.jpg": 1.42, "04-ShopGlass.jpg": 1.42, "shop-modern.jpg": 1.42, "shop-industrial.jpg": 1.42, "Shop-fabrica.jpg": 1.14, "shop-wood.jpg": 1.14, "shop-solar.jpg": 1.14, "shop-outdoor.jpg": 1.14, "shop-fans.jpg": 1.14 };
  const imgAttr = (u) => { const k = BANNER[u.split("/").pop()]; return `src="${esc(u)}"${k ? ` class="cb" style="--cb:${k}"` : ""}`; };
  function inspiration() {
    /* issue order: summer cover story first; two guides get TLW's larger, cleaner room photos */
    const ORDER = ["garden", "ceiling-fan", "kitchen", "dining", "load-shedding", "trends", "dark-room", "picture-lights"];
    const OVR = { garden: UP + "2025/12/1-1.jpg", dining: UP + "2025/12/Tris.jpg" };
    const GU = ORDER.map((k) => D.guides.find((g) => g.slug === k)).filter(Boolean).map((g) => Object.assign({}, g, { img: OVR[g.slug] || g.img }));
    D.guides.forEach((g) => { if (!GU.some((x) => x.slug === g.slug) && G[g.slug]) GU.push(g); });
    const meta = (g, i) => `<div class="mg-kick"><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${esc(g.kicker)} · ${esc(g.read)} read</span></div>`;
    $("#mgToc").innerHTML = GU.map((g, i) => `<li><a href="#${g.slug}"><span class="num">${String(i + 1).padStart(2, "0")}</span><b>${esc(g.title)}</b><span>${esc(g.read)}</span></a></li>`).join("");
    const c = GU[0];
    $("#mgCover").innerHTML = `<a class="mg-item mg-fig" href="#${c.slug}" aria-label="Read: ${esc(c.title)}"><div class="frame"><img ${imgAttr(c.img)} alt="" loading="eager"></div></a>
      <div class="mg-cap"><span class="eyebrow">Cover story</span><div class="mt-s">${meta(c, 0)}</div><h2><a href="#${c.slug}">${esc(c.title)}</a></h2><p>${esc(G[c.slug].dek)}</p><a class="link-u" href="#${c.slug}">Read the guide →</a></div>`;
    const item = (g, i) => `<a class="mg-item mg-i${i + 1}" href="#${g.slug}"><figure class="mg-fig"><div class="frame"><img ${imgAttr(g.img)} alt="" loading="lazy"></div></figure><div class="mg-cap"><div>${meta(g, i)}<h3>${esc(g.title)}</h3></div><p>${esc(G[g.slug].dek)}</p></div></a>`;
    const rest = GU.slice(1).map((g, k) => item(g, k + 1));
    rest.splice(4, 0, `<div class="mg-quote" aria-hidden="false"><span class="num">— From the showroom floor</span><p>“Most rooms aren't badly designed. They're just <em>badly lit.</em> Fix the light and the room you already have suddenly makes sense.”</p></div>`);
    $("#mgSpread").innerHTML = rest.join("");
    $$(".mg-item").forEach((a) => a.addEventListener("pointermove", (e) => { const f = $(".frame", a); if (!f) return; const r = f.getBoundingClientRect(); f.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); f.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); }));

    /* reader */
    const rd = $("#reader"); let lastFocus = null, openSlug = null;
    function render(slug) {
      const i = GU.findIndex((g) => g.slug === slug), g = GU[i], a = G[slug];
      const prev = GU[(i - 1 + GU.length) % GU.length], next = GU[(i + 1) % GU.length];
      const sec = a.body.map(([h, ps], k) => `<h3><span class="num">${String(k + 1).padStart(2, "0")}</span>${esc(h)}</h3>${ps.map((p) => `<p>${p}</p>`).join("")}${k === 1 ? `<blockquote class="mg-pull">${a.quote}</blockquote>` : ""}`).join("");
      rd.innerHTML = `<div class="mg-rbar"><span class="lbl">The Light Journal · ${String(i + 1).padStart(2, "0")}</span><span class="t" aria-hidden="true">${esc(g.title)}</span><button class="icon-btn" type="button" data-rclose aria-label="Close article">${T.I.close}</button><i class="mg-prog"></i></div>
        <header class="mg-rhero"><div class="wrap"><div><div class="mg-kick"><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${esc(g.kicker)} · ${esc(g.read)} read</span></div><h1 id="rdH">${esc(g.title)}</h1><p class="dek">${esc(a.dek)}</p></div><figure class="mg-fig"><div class="frame"><img ${imgAttr(g.img)} alt=""></div></figure></div></header>
        <div class="wrap mg-rbody"><article class="mg-art" aria-labelledby="rdH">${sec}<aside class="mg-rules"><h4>Quick rules · save this</h4><ol>${a.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol></aside></article>
          <aside class="mg-aside" aria-label="Shop this guide"><div class="in"><span class="eyebrow">Shop this guide</span><div id="rdMini"><div class="skel" style="height:240px"></div></div><button class="btn ghost sm" type="button" id="rdAsk">${T.I.spark} Ask the assistant</button><a class="link-u" href="stores.html">Ask in a showroom →</a></div></aside></div>
        <section class="mg-shop" aria-labelledby="rdShopH"><div class="wrap"><div class="row-b" style="margin-bottom:22px;flex-wrap:wrap"><h2 class="h3" id="rdShopH">Shop the <em>guide</em></h2><a class="link-u" href="shop.html?q=${encodeURIComponent(g.q)}">See all →</a></div><div class="x-rail" id="rdShop"></div></div></section>
        <nav class="mg-next" aria-label="More guides"><a href="#${prev.slug}"><span class="eyebrow">Previous</span><b>${esc(prev.title)}</b></a><a href="#${next.slug}"><span class="eyebrow" style="justify-self:end">Next</span><b>${esc(next.title)}</b></a></nav>`;
      T.ready(() => {
        const items = T.search(g.q, 12).items.filter((p) => p.st !== false).slice(0, 8);
        const box = $("#rdShop", rd), mini = $("#rdMini", rd); if (!box) return;
        box.innerHTML = items.length ? items.map((p) => T.card(p)).join("") : '<p class="mute">Browse the full range in the shop.</p>';
        mini.innerHTML = items.slice(0, 4).map((p) => `<a class="mg-mini" href="${T.pUrl(p)}"><span class="x-pool"><img src="${esc(T.thumb(T.img(p)))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(T.img(p))}'"></span><span><b>${esc(p.n)}</b><span>${money(p.p)}</span></span></a>`).join("");
        T.magnetic(rd);
      });
      $("#rdAsk", rd).addEventListener("click", () => { close(true); window.TLWChat && window.TLWChat.send(`I've just read your guide "${g.title}". Can you help me choose the right products for my home?`); });
      rd.scrollTop = 0;
    }
    function open(slug, fromHash) {
      if (!G[slug]) return;
      if (openSlug !== slug) render(slug);
      if (!rd.classList.contains("open")) { lastFocus = document.activeElement; rd.classList.add("open"); rd.removeAttribute("hidden"); rd.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden"; T.lenis && T.lenis.stop(); }
      openSlug = slug; document.title = GU.find((g) => g.slug === slug).title + " | The Light Journal · The Lighting Warehouse";
      setTimeout(() => { const b = $("[data-rclose]", rd); b && b.focus({ preventScroll: true }); }, 80);
      T.track("guide_open", { slug });
    }
    const baseTitle = document.title;
    function close(silent) {
      if (!rd.classList.contains("open")) return;
      rd.classList.remove("open"); rd.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; T.lenis && T.lenis.start(); document.title = baseTitle;
      const prevSlug = openSlug; openSlug = null;
      if (location.hash) { try { history.pushState(null, "", location.pathname + location.search); } catch (e) { } }
      setTimeout(() => { rd.setAttribute("hidden", ""); }, 600);
      if (!silent) { const back = $(`.mg-spread a[href="#${prevSlug}"], #mgCover a[href="#${prevSlug}"]`); (back || lastFocus) && (back || lastFocus).focus({ preventScroll: false }); }
    }
    const route = () => { const s = location.hash.slice(1); if (G[s]) open(s, true); else close(true); };
    addEventListener("hashchange", route);
    rd.addEventListener("click", (e) => { if (e.target.closest("[data-rclose]")) close(); });
    rd.addEventListener("scroll", () => { const p = rd.scrollTop / Math.max(1, rd.scrollHeight - rd.clientHeight); rd.style.setProperty("--rp", (p * 100).toFixed(1) + "%"); const bar = $(".mg-prog", rd); bar && (bar.style.width = (p * 100).toFixed(1) + "%"); }, { passive: true });
    document.addEventListener("keydown", (e) => {
      if (!rd.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") { const f = $$("a[href], button", rd).filter((x) => x.offsetParent !== null); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    route();
    T.reveal(); T.magnetic();
  }

  if (page === "stores") stores();
  else if (page === "story") story();
  else if (page === "inspiration") inspiration();
})();
