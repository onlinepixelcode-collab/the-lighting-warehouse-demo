/* ==========================================================================
   COMPARE (compare.html) — up to 4 products side by side, differences in gold
   ========================================================================== */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA, $ = T.$, $$ = T.$$, esc = T.esc;
  const board = $("#cpBoard"), tools = $("#cpTools");
  let onlyDiff = false;

  const KEYMAP = { "ip rating": "IP rating", "recommmended globes": "Recommended globes", "speedsettings": "Speed settings", "speed settings": "Speed settings", "lamp shade": "Lamp shade", "lampshade": "Lamp shade", "base type": "Base type", "base size": "Base size", "cable length": "Cable length", "chain length": "Chain length", "rod length": "Rod length", "motor wattage": "Motor wattage", "globe type": "Globe type", "blade span": "Blade span", "light kit wattage": "Light kit wattage" };
  const nk = (k) => KEYMAP[k.toLowerCase()] || k;
  const ORDER = ["Height", "Width", "Diameter", "Length", "Depth", "Blade span", "Globe type", "Base type", "Wattage", "Lumens", "Kelvin", "IP rating", "Material", "Colour", "Lamp shade", "Cable length", "Rod length", "Blades", "Speed settings", "Control", "Motor wattage", "Light kit wattage"];
  const SKIP = /^(Room|Extended description|Available)$/i;
  function specsOf(p) { const o = {}; Object.entries(p.sp).forEach(([k, v]) => { const n = nk(k); if (!SKIP.test(n) && v && !o[n]) o[n] = String(v); }); return o; }
  const norm = (v) => String(v == null ? "" : v).toLowerCase().replace(/\s+/g, "").replace(/ip/, "");

  function render() {
    const items = T.compare.ids.map(T.get).filter(Boolean);
    if (!items.length) return empty();
    $("#cpNum").textContent = `— Side by side / ${items.length} of 4`;
    const specs = items.map(specsOf);
    const keys = [...new Set(specs.flatMap((s) => Object.keys(s)))].sort((a, b) => ((ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99)) || a.localeCompare(b));
    const rows = [
      ["sect", "Overview"],
      ["Price", items.map((p) => `<span class="price">${T.money(p.p)}${T.isSale(p) ? `<s>${T.money(p.r)}</s>` : ""}</span>`), items.map((p) => p.p)],
      ["Range", items.map((p) => p.rg ? `<a class="gold" href="range.html?r=${encodeURIComponent(p.rg)}">${esc(p.rg)}</a>` : "—"), items.map((p) => p.rg || "")],
      ["Category", items.map((p) => esc(p.c.find((c) => !/^(indoor|outdoor|fans|globes)$/i.test(c)) || p.c[0])), items.map((p) => p.c[1] || p.c[0])],
      ["Ideal for", items.map((p) => esc((p.sp.Room || "—").split("|").join(", "))), items.map((p) => p.sp.Room || "")],
      ["Availability", items.map((p) => p.st ? "In stock online" : "Out of stock"), items.map((p) => p.st)],
      ["Dimmable", items.map((p) => /dimmable/i.test(p.n + JSON.stringify(p.sp)) ? "Yes" : "Not specified"), items.map((p) => /dimmable/i.test(p.n + JSON.stringify(p.sp)))],
      ["sect", "Specifications"]
    ].concat(keys.map((k) => [k, specs.map((s) => s[k] ? esc(s[k]) : `<span class="na">—</span>`), specs.map((s) => s[k] || "")]));
    const cheapest = Math.min(...items.map((p) => p.p));
    board.className = "wrap" + (onlyDiff ? " cp-only" : "");
    board.innerHTML = `<div class="cp-scroll" tabindex="0" role="region" aria-label="Comparison table, scroll sideways for more"><table class="cp-table" style="--n:${items.length + (items.length < 4 ? 1 : 0)}">
      <caption class="sr-only">Comparison of ${items.length} products. Rows marked different have values that differ between products.</caption>
      <thead><tr><th scope="col"><span class="sr-only">Specification</span></th>${items.map((p) => `<th scope="col"><div class="cp-card">
        <div class="cp-stage"><img src="${esc(p.i[0])}" alt="${esc(p.n)}" loading="lazy"><button class="cp-rm" data-rm-cp="${p.id}" aria-label="Remove ${esc(p.n)} from compare">${T.I.close}</button></div>
        <span class="sub">${esc(T.rangeOf(p))}</span><h2><a href="${T.pUrl(p)}">${esc(p.n)}</a></h2>
        <button class="btn sm" data-add="${p.id}">Add to bag</button></div></th>`).join("")}
        ${items.length < 4 ? `<th scope="col"><a class="cp-add" href="shop.html"><b>+</b>Add a light<br><small>${4 - items.length} slot${4 - items.length > 1 ? "s" : ""} left</small></a></th>` : ""}</tr></thead>
      <tbody>${rows.map((r) => {
        if (r[0] === "sect") return `<tr class="cp-sect"><th scope="row" colspan="${items.length + 2}">${r[1]}</th></tr>`;
        const [label, cells, raw] = r; const vals = raw.map(norm); const differs = items.length > 1 && new Set(vals).size > 1;
        return `<tr class="${differs ? "differs" : "same"}"><th scope="row">${esc(label)}${differs ? '<span class="sr-only"> (different)</span>' : ""}</th>${cells.map((c, i) => `<td class="${differs ? "diff" : ""} ${raw[i] === "" ? "na" : ""}">${c}${label === "Price" && items.length > 1 && items[i].p === cheapest && differs ? '<span class="tick">Best price</span>' : ""}</td>`).join("")}${items.length < 4 ? "<td></td>" : ""}</tr>`;
      }).join("")}</tbody></table></div>`;
    tools.innerHTML = items.length > 1 ? `<label class="g-tog"><input type="checkbox" id="cpOnly" ${onlyDiff ? "checked" : ""}><span class="g-tog-sw" aria-hidden="true"></span><span>Show differences only</span></label><button class="link-u" id="cpClear">Clear all</button>` : `<button class="link-u" id="cpClear">Clear all</button>`;
    const o = $("#cpOnly"); o && o.addEventListener("change", () => { onlyDiff = o.checked; board.classList.toggle("cp-only", onlyDiff); });
    $("#cpClear").addEventListener("click", () => { T.compare.ids.slice().forEach((id) => T.compare.toggle(id)); render(); });
    $("#cpLegend").hidden = items.length < 2;
    T.reveal(board); T.magnetic(board);
    T.track("view_compare", { ids: items.map((p) => p.id) });
  }

  function empty() {
    $("#cpNum").textContent = "— Side by side / 0 of 4"; tools.innerHTML = ""; $("#cpLegend").hidden = true;
    const seed = T.recent.ids.map(T.get).filter(Boolean);
    const sugg = (seed.length ? seed : T.products.filter((p) => p.i.length > 1 && p.p > 1000)).slice(0, 8);
    board.className = "wrap";
    board.innerHTML = `<div class="cp-empty">
      <div class="cp-empty-art" aria-hidden="true">${["01", "02", "03", "04"].map((n) => `<span class="cp-slot">${n}</span>`).join("")}</div>
      <div><span class="num">— Nothing to compare yet</span><h2 class="h2">Four empty <em>plinths</em>.</h2>
        <p class="lead">Tap the compare icon on any light (it looks like two crossing lines) and it will wait here, ready to be measured against the others.</p>
        <div class="flex mt-m"><a class="btn" href="shop.html">Browse the gallery</a><button class="btn ghost" data-open="chat">Ask the AI Assistant</button></div></div>
    </div>
    ${sugg.length ? `<div class="cp-sugg"><span class="eyebrow">${seed.length ? "Recently viewed" : "Popular to compare"}</span><div class="hscroll mt-s">${sugg.map((p) => `<div>${T.card(p)}</div>`).join("")}</div></div>` : ""}`;
    T.reveal(board); T.magnetic(board);
  }

  board.addEventListener("click", (e) => { const b = e.target.closest("[data-rm-cp]"); if (!b) return; T.compare.toggle(b.dataset.rmCp); render(); const f = $("[data-rm-cp]", board); f && f.focus(); });
  // a compare icon clicked inside the empty-state suggestions should update the board
  document.addEventListener("click", (e) => { if (e.target.closest("[data-compare]")) setTimeout(render, 30); });
  T.ready(render);
})();
