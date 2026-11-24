/* ==========================================================================
   THE SHOWROOM — range index + single range (range.html?r=Fabrica)
   ========================================================================== */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA, $ = T.$, $$ = T.$$, esc = T.esc;
  const view = $("#shView");
  const pad = (n) => String(n).padStart(2, "0");
  const COLOUR_RE = /\b(black|white|gold|brass|chrome|natural|grey|gray|silver|bronze|copper|satin|matt|matte|antique|smoked?|clear|amber|champagne|nickel|brown|red|latte|mocha|graphite|rose|polished|brushed|light wood|dark wood|wood|and|&)\b/g;
  const baseName = (n) => n.toLowerCase().replace(COLOUR_RE, " ").replace(/\s+/g, " ").trim();
  const shortName = (p, rg) => p.n.replace(new RegExp("^" + rg + "\\s*", "i"), "").replace(/\s+(ceiling|pendant|wall|floor|table)?\s*(light|lamp|fan)?$/i, (m) => m) || p.n;
  const heroOf = (list) => list.slice().sort((a, b) => (b.i.length > 1) - (a.i.length > 1) || b.p - a.p)[0];

  T.ready((products) => {
    const byRange = {};
    products.forEach((p) => { if (p.rg) (byRange[p.rg] = byRange[p.rg] || []).push(p); });
    const names = Object.keys(byRange).sort((a, b) => byRange[b].length - byRange[a].length || a.localeCompare(b));
    const want = T.qs("r");
    const r = want && names.find((n) => n.toLowerCase() === want.toLowerCase());
    if (r) showroom(r, byRange[r].slice().sort((a, b) => a.p - b.p), names, byRange);
    else index(names, byRange, want);
  });

  /* =====================================================================
     INDEX — every range as a lit line of type
     ===================================================================== */
  function index(names, byRange, missing) {
    document.title = "The Showroom · Lighting Ranges | The Lighting Warehouse";
    const total = names.reduce((a, n) => a + byRange[n].length, 0);
    view.innerHTML = `
    <section class="sh-ix" aria-labelledby="shIxH">
      <div class="wrap sh-ix-head">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span aria-current="page" style="opacity:1">Ranges</span></nav>
        <span class="num">— The Showroom / ${pad(names.length)} ranges · ${total} pieces</span>
        <h1 class="sh-ix-title" id="shIxH" data-lines>Walk the<br><em>showroom</em>.</h1>
        <p class="lead">Each range is a family of pieces designed to live together: the pendant over the island, the wall light in the passage, the fan in the bedroom. Hover a name to light it.</p>
        ${missing ? `<p class="sh-miss">We couldn't find a range called “${esc(missing)}”. Here is everything we stock.</p>` : ""}
      </div>
      <ol class="sh-ix-list wrap" id="shIxList">
        ${names.map((n, i) => {
          const list = byRange[n], h = heroOf(list), story = D.ranges.find((x) => x.id === n), from = Math.min(...list.map((p) => p.p));
          const kinds = [...new Set(list.map((p) => p.t))].map((t) => ({ indoor: "Indoor", outdoor: "Outdoor", fans: "Fans", globes: "Globes", switches: "Switches" }[t]));
          return `<li><a class="sh-ix-row" href="range.html?r=${encodeURIComponent(n)}" data-img="${esc(h.i[0])}" data-cursor="ENTER">
            <span class="sh-ix-no">${pad(i + 1)}</span>
            <span class="sh-ix-thumb" aria-hidden="true"><img src="${esc(T.thumb(h.i[0]))}" alt="" loading="lazy"></span>
            <span class="sh-ix-name">${esc(n)}</span>
            <span class="sh-ix-meta"><span>${(story ? story.mood : kinds).slice(0, 3).map(esc).join(" · ")}</span><b>${list.length} ${list.length === 1 ? "piece" : "pieces"} · from ${T.money(from)}</b></span>
            <span class="sh-ix-arr" aria-hidden="true">→</span>
          </a></li>`;
        }).join("")}
      </ol>
      <div class="sh-ix-float" id="shFloat" aria-hidden="true"><span class="sh-ix-fpool"><img alt=""></span><span class="sh-ix-fglow"></span></div>
    </section>`;
    T.reveal(view); T.magnetic(view);
    // floating lit preview that follows the cursor (fine pointers only)
    const fl = $("#shFloat"), fim = $("img", fl), list = $("#shIxList");
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, on = false, raf = 0;
    const loop = () => { cx += (x - cx) * 0.14; cy += (y - cy) * 0.14; fl.style.transform = `translate(${cx}px, ${cy}px) rotate(${(x - cx) * 0.03}deg)`; raf = on || Math.abs(x - cx) > 0.5 ? requestAnimationFrame(loop) : 0; };
    list.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    $$(".sh-ix-row", list).forEach((a) => {
      const enter = () => { if (fim.getAttribute("src") !== a.dataset.img) fim.src = a.dataset.img; on = true; fl.classList.add("on"); list.classList.add("hovering"); };
      a.addEventListener("pointerenter", (e) => { if (!cx) { cx = x = e.clientX; cy = y = e.clientY; } enter(); });
      a.addEventListener("focus", () => { const r = a.getBoundingClientRect(); x = r.right - 260; y = r.top + r.height / 2; enter(); if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener("blur", () => { on = false; fl.classList.remove("on"); list.classList.remove("hovering"); });
    });
    list.addEventListener("pointerleave", () => { on = false; fl.classList.remove("on"); list.classList.remove("hovering"); });
  }

  /* =====================================================================
     SHOWROOM — dark three-column room for one range
     ===================================================================== */
  function showroom(rg, items, names, byRange) {
    const story = D.ranges.find((x) => x.id === rg);
    const ri = names.indexOf(rg);
    const wantP = +T.qs("p");
    let sel = Math.max(0, items.findIndex((p) => p.id === wantP)), view_i = 0;
    let lit = T.store.get("tlw-sh-lit", true);
    document.title = `${rg} Range · The Showroom | The Lighting Warehouse`;
    const mood = story ? story.mood : [...new Set(items.map((p) => (p.c[1] || p.c[0])))].slice(0, 3);

    view.innerHTML = `
    <section class="sh-room" aria-labelledby="shName">
      <div class="sh-grid">
        <aside class="sh-list" aria-label="Pieces in the ${esc(rg)} range">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="range.html">Ranges</a><span>/</span><span aria-current="page" style="opacity:1">${esc(rg)}</span></nav>
          <span class="num">— The Showroom / ${pad(ri + 1)}</span>
          <h1 class="sh-name" id="shName" data-lines><em>${esc(rg)}</em></h1>
          <p class="sh-mood">${mood.map(esc).join(" · ")}</p>
          <ol class="sh-items" id="shItems" role="listbox" aria-label="Choose a piece" aria-activedescendant="">
            ${items.map((p, i) => `<li role="option" id="shOpt${i}" aria-selected="false"><button type="button" class="sh-item" data-i="${i}" tabindex="${i === sel ? 0 : -1}">
              <span class="sh-no">${pad(i + 1)}</span><span class="sh-iname">${esc(shortName(p, rg))}</span><span class="sh-iprice">${T.money(p.p)}</span>
            </button></li>`).join("")}
          </ol>
        </aside>

        <div class="sh-stage" id="shStage" aria-live="polite">
          <div class="sh-ambient" aria-hidden="true"></div>
          <div class="sh-beam" aria-hidden="true"></div>
          <figure class="sh-piece">
            <div class="sh-pool"><img id="shImg" alt="" draggable="false"></div>
            <div class="sh-glow" aria-hidden="true"></div>
            <div class="sh-plinth" aria-hidden="true"><i class="sh-pl-top"></i><i class="sh-pl-body"></i><i class="sh-pl-cast"></i></div>
            <figcaption class="sr-only" id="shCap"></figcaption>
          </figure>
          <div class="sh-stage-ui">
            <span class="sh-count"><b id="shCur">01</b> / ${pad(items.length)}</span>
            <div class="sh-views" id="shViews" role="group" aria-label="Photo angles"></div>
            <button type="button" class="sh-switch" id="shSwitch" aria-pressed="${lit}"><span class="sh-sw-track" aria-hidden="true"><i></i></span><span class="sh-sw-l">Light ${lit ? "on" : "off"}</span></button>
          </div>
          <div class="sh-arrows"><button type="button" class="icon-btn" id="shPrev" aria-label="Previous piece">←</button><button type="button" class="icon-btn" id="shNext" aria-label="Next piece">→</button></div>
        </div>

        <div class="sh-info" id="shInfo"></div>
      </div>
    </section>

    <section class="sh-story" aria-label="About the ${esc(rg)} range">
      <div class="wrap sh-story-in">
        <span class="num">— The story</span>
        <p class="sh-quote" data-lines>${story ? esc(story.story) : `${esc(rg)} is one of our house ranges: ${items.length} ${items.length === 1 ? "piece" : "pieces"} designed to work together, so the light in one room carries into the next.`}</p>
        <div class="sh-story-acts"><a class="btn ghost" href="shop.html?q=${encodeURIComponent(rg)}">See all ${items.length} as a grid</a><button class="link-u" data-ask="Help me choose from the ${esc(rg)} range">Ask the AI Assistant <span aria-hidden="true">→</span></button></div>
      </div>
      <div class="sh-others">
        <div class="wrap"><span class="eyebrow">More ranges</span></div>
        <div class="sh-others-track hscroll">
          ${names.filter((n) => n !== rg).map((n) => { const h = heroOf(byRange[n]); return `<a class="sh-other" href="range.html?r=${encodeURIComponent(n)}"><span class="sh-other-pool"><img src="${esc(T.thumb(h.i[0]))}" alt="" loading="lazy"></span><b>${esc(n)}</b><small>${byRange[n].length} ${byRange[n].length === 1 ? "piece" : "pieces"}</small></a>`; }).join("")}
        </div>
      </div>
    </section>`;

    const stage = $("#shStage"), img = $("#shImg"), itemsBox = $("#shItems"), info = $("#shInfo"), sw = $("#shSwitch");
    const btns = $$(".sh-item", itemsBox);

    function paintLight() {
      stage.classList.toggle("lit", lit); sw.setAttribute("aria-pressed", lit); $(".sh-sw-l", sw).textContent = `Light ${lit ? "on" : "off"}`;
    }
    let swapT = 0;
    function setImg(src, alt) {
      if (img.getAttribute("src") === src) return;
      clearTimeout(swapT); img.classList.add("out");
      swapT = setTimeout(() => { img.onload = () => img.classList.remove("out"); img.onerror = () => img.classList.remove("out"); img.src = src; img.alt = alt; }, T.reduced() ? 0 : 220);
    }
    function preview(i) { const p = items[i]; setImg(p.i[0], p.n); stage.classList.add("previewing"); }
    function select(i, focus) {
      sel = (i + items.length) % items.length; view_i = 0;
      const p = items[sel];
      btns.forEach((b, k) => { const on = k === sel; b.classList.toggle("on", on); b.tabIndex = on ? 0 : -1; b.parentNode.setAttribute("aria-selected", on); });
      itemsBox.setAttribute("aria-activedescendant", "shOpt" + sel);
      if (focus) btns[sel].focus();
      stage.classList.remove("previewing");
      setImg(p.i[0], p.n); $("#shCap").textContent = p.n; $("#shCur").textContent = pad(sel + 1);
      $("#shViews").innerHTML = p.i.length > 1 ? p.i.map((u, k) => `<button type="button" class="sh-view ${k === 0 ? "on" : ""}" data-v="${k}" aria-label="Angle ${k + 1}" aria-pressed="${k === 0}"><img src="${esc(T.thumb(u))}" alt=""></button>`).join("") : "";
      paintInfo(p);
      // keep selected item visible in a scrolling list / mobile tabs
      const b = btns[sel], box = itemsBox;
      if (innerWidth <= 900) box.scrollTo({ left: b.parentNode.offsetLeft - 20, behavior: T.reduced() ? "auto" : "smooth" });
      else { const top = b.parentNode.offsetTop - box.clientHeight / 2 + 30; box.scrollTo({ top, behavior: T.reduced() ? "auto" : "smooth" }); }
      try { const u = new URL(location.href); u.searchParams.set("p", p.id); history.replaceState(null, "", u.pathname.split("/").pop() + u.search); } catch (e) { }
      T.track("view_item", { id: p.id, name: p.n, price: p.p, list: "range:" + rg });
    }
    function paintInfo(p) {
      const variants = T.products.filter((x) => x.id !== p.id && baseName(x.n) === baseName(p.n));
      const siblings = items.filter((x) => x.id !== p.id && !variants.includes(x)).slice(0, 6);
      const sp = p.sp, rows = [["Height", sp.Height], ["Width", sp.Width || sp.Diameter || sp["Blade Span"]], ["Material", sp.Material], ["Globe", sp["Globe Type"]], ["Finish", sp.Colour]].filter((r) => r[1]);
      const cat = (p.c.find((c) => !/^(indoor|outdoor|fans|globes)$/i.test(c)) || p.c[0] || "");
      info.innerHTML = `
        <span class="sh-cat">${esc(cat)}</span>
        <h2 class="sh-pname">${esc(p.n)}</h2>
        <p class="sh-price price">${T.money(p.p)}${T.isSale(p) ? `<s>${T.money(p.r)}</s>` : ""}</p>
        <p class="sh-desc">${esc(p.d)}</p>
        ${rows.length ? `<dl class="sh-specs">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${variants.length ? `<div class="sh-sib"><span class="sh-sib-l">Also in</span><div class="sh-chips">${variants.slice(0, 6).map((v) => `<a class="sh-vchip" href="${items.includes(v) ? "#" : T.pUrl(v)}" data-goto="${items.indexOf(v)}" title="${esc(v.n)}"><span><img src="${esc(T.thumb(v.i[0]))}" alt=""></span>${esc((v.sp.Colour || v.n.replace(new RegExp(rg, "i"), "")).trim())}</a>`).join("")}</div></div>` : ""}
        ${siblings.length ? `<div class="sh-sib"><span class="sh-sib-l">Pairs with</span><div class="sh-chips">${siblings.map((s) => `<button type="button" class="chip" data-goto="${items.indexOf(s)}">${esc(shortName(s, rg))}</button>`).join("")}</div></div>` : ""}
        <div class="sh-buy">
          <button class="btn" data-add="${p.id}" data-cursor="ADD">Add to bag <span class="arr">→</span></button>
          <button class="icon-btn sh-ic ${T.wish.has(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Save ${esc(p.n)} to wishlist" aria-pressed="${T.wish.has(p.id)}">${T.I.heart}</button>
          <button class="icon-btn sh-ic" data-compare="${p.id}" aria-label="Compare ${esc(p.n)}">${T.I.compare}</button>
        </div>
        <a class="link-u" href="${T.pUrl(p)}">Full details &amp; specifications <span aria-hidden="true">→</span></a>
        <p class="sh-stock"><i aria-hidden="true"></i>${p.st ? "In stock · free delivery over " + T.moneyShort(D.freeShip) : "Out of stock online · check your nearest store"}</p>`;
      T.magnetic(info);
    }

    // list interactions
    btns.forEach((b) => {
      const i = +b.dataset.i;
      b.addEventListener("click", () => select(i));
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && i !== sel) preview(i); });
    });
    itemsBox.addEventListener("pointerleave", () => { if (stage.classList.contains("previewing")) { const p = items[sel]; stage.classList.remove("previewing"); setImg(p.i[view_i] || p.i[0], p.n); } });
    itemsBox.addEventListener("keydown", (e) => {
      const k = e.key; const horiz = innerWidth <= 900;
      if (k === "ArrowDown" || (horiz && k === "ArrowRight")) { e.preventDefault(); select(sel + 1, true); }
      else if (k === "ArrowUp" || (horiz && k === "ArrowLeft")) { e.preventDefault(); select(sel - 1, true); }
      else if (k === "Home") { e.preventDefault(); select(0, true); } else if (k === "End") { e.preventDefault(); select(items.length - 1, true); }
    });
    $("#shPrev").addEventListener("click", () => select(sel - 1));
    $("#shNext").addEventListener("click", () => select(sel + 1));
    $("#shViews").addEventListener("click", (e) => { const v = e.target.closest("[data-v]"); if (!v) return; view_i = +v.dataset.v; const p = items[sel]; setImg(p.i[view_i], p.n + " — angle " + (view_i + 1)); $$(".sh-view", $("#shViews")).forEach((x) => { const on = x === v; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); }); });
    info.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (!g || +g.dataset.goto < 0) return; e.preventDefault(); select(+g.dataset.goto); });
    sw.addEventListener("click", () => { lit = !lit; T.store.set("tlw-sh-lit", lit); paintLight(); T.sound.click(); T.track("light_toggle", { range: rg, on: lit }); });
    document.addEventListener("click", (e) => { const a = e.target.closest("[data-ask]"); if (!a) return; e.preventDefault(); window.TLWChat && TLWChat.send ? TLWChat.send(a.dataset.ask) : T.openOv("chat"); });
    // swipe on the stage (touch)
    let sx = null; stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) select(sel + (dx < 0 ? 1 : -1)); sx = null; });
    // gentle parallax tilt of the lit piece toward the cursor
    if (matchMedia("(hover: hover) and (pointer: fine)").matches && !T.reduced()) {
      const piece = $(".sh-piece", stage);
      stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5; piece.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`; stage.style.setProperty("--gx", (50 + dx * 30) + "%"); stage.style.setProperty("--gy", (40 + dy * 20) + "%"); });
      stage.addEventListener("pointerleave", () => { piece.style.transform = ""; });
    }

    // first light: start dark, then switch on
    const wasLit = lit; lit = false; paintLight(); select(sel);
    T.reveal(view); T.magnetic(view);
    setTimeout(() => { lit = wasLit; paintLight(); }, T.reduced() ? 0 : 700);
  }
})();
