/* Lighting tools: fan size, lumens, kelvin, load-shedding, globe finder, IP ratings */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA;
  if (!T || !D || document.body.dataset.page !== "tools") return;
  const { $, $$, esc } = T;
  const UP = "https://lightingwarehouse.co.za/wp-content/uploads/";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const n0 = (n) => Math.round(n).toLocaleString("en-ZA").replace(/\s/g, ",");
  const seg = {};
  const rail = (el, list, empty) => { el.innerHTML = list.length ? list.slice(0, 10).map((p) => T.card(p)).join("") : `<p class="mute">${empty || "Ask in store and we'll find the right product for you."}</p>`; T.magnetic(el); };
  const setV = (r) => r.style.setProperty("--v", ((r.value - r.min) / (r.max - r.min) * 100) + "%");
  const lumensOf = (p) => { const m = Object.values(p.sp).join(" | ").match(/(\d[\d,.]*)\s*(?:lm|lumen)/i); return m ? parseFloat(m[1].replace(/,/g, "")) : 0; };
  const fitOf = (p) => (((p.sp["Base type"] || p.sp["Base Type"] || "") + " " + p.n).match(/\b(E27|E14|B22|GU10|G9|G4|GU5\.3)\b/i) || [])[1];
  const kOf = (p) => { const s = p.n + " " + (p.sp.Kelvin || ""); const m = s.match(/(\d{4})\s*k/i); if (m) return +m[1]; if (/warm/i.test(s)) return 3000; if (/cool/i.test(s)) return 4000; if (/daylight/i.test(s)) return 6500; return 0; };

  /* segmented controls */
  $$("[data-seg]").forEach((g) => {
    const key = g.dataset.seg; seg[key] = $("[aria-pressed=true]", g).dataset.v;
    g.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", g).forEach((x) => x.setAttribute("aria-pressed", x === b)); seg[key] = b.dataset.v; g.dispatchEvent(new CustomEvent("seg", { bubbles: true })); });
  });
  const on = (ids, fn) => { ids.forEach((id) => { const el = $("#" + id) || $(`[data-seg="${id}"]`); if (!el) return; el.addEventListener(el.matches("[data-seg]") ? "seg" : el.tagName === "SELECT" ? "change" : "input", fn); }); };

  /* ================= 01 FAN ================= */
  function fan() {
    const L = +$("#fanL").value, W = +$("#fanW").value, a = L * W; setV($("#fanL")); setV($("#fanW"));
    $("#fanLo").textContent = L + " m"; $("#fanWo").textContent = W + " m";
    const two = a > 40, rec = two ? (a / 2 > 20 ? 1520 : 1320) : a <= 6 ? 760 : a <= 10 ? 1066 : a <= 16 ? 1320 : a <= 25 ? 1520 : 1820;
    $("#fanOut").innerHTML = `${two ? "2 × " : ""}${rec}<small>mm</small>`;
    $("#fanTxt").textContent = `For a ${L} × ${W} m room (${n0(a)} m²) choose a ${rec} mm (${Math.round(rec / 25.4)}") fan${two ? ". The room is long or large enough that two fans, evenly spaced, will cool it far better than one" : ""}.`;
    const c = +seg.fanC; $("#fanTip").textContent = c >= 3.2 ? "With a 3 m+ ceiling, use a downrod of 600–900 mm so the blades sit about 2.4–2.7 m above the floor, where the air reaches you." : c >= 2.7 ? "On a 2.7 m ceiling, a short downrod (150–300 mm) brings the blades to the ideal 2.3–2.5 m." : "On a standard 2.4 m ceiling, use a flush or close-mount fan so the blades stay at least 2.1 m above the floor.";
    // diagram
    const S = Math.min(460 / L, 240 / W), w = L * S, h = W * S, x = (520 - w) / 2, y = (300 - h) / 2 + 6, r = rec / 1000 / 2 * S;
    const cx = two ? [x + w / 4, x + 3 * w / 4] : [x + w / 2];
    $("#fanSvg").innerHTML = `<rect class="ln" x="${x}" y="${y}" width="${w}" height="${h}"/>
      <text class="tx" x="${x + w / 2}" y="${y - 8}" text-anchor="middle">${L} M</text><text class="tx" x="${x - 8}" y="${y + h / 2}" text-anchor="end" dominant-baseline="middle">${W} M</text>
      ${cx.map((X) => `<circle class="dim" cx="${X}" cy="${y + h / 2}" r="${r + 0.45 * S}"/><circle class="hl" cx="${X}" cy="${y + h / 2}" r="${r}"/><line class="ln" x1="${X - r}" y1="${y + h / 2}" x2="${X + r}" y2="${y + h / 2}"/><circle class="ln" cx="${X}" cy="${y + h / 2}" r="4"/>`).join("")}
      <text class="tx" x="${cx[0]}" y="${y + h / 2 - 8}" text-anchor="middle">${rec} MM</text>`;
    // products
    const span = (p) => +((p.sp["Blade Span"] || "").match(/(\d{3,4})\s*mm/) || [])[1] || 0;
    let fans = T.products.filter((p) => p.t === "fans" && span(p));
    if (seg.fanK === "with") fans = fans.filter((p) => /with lights/i.test(p.c.join(" ")));
    if (seg.fanK === "without") fans = fans.filter((p) => /without lights/i.test(p.c.join(" ")));
    fans.sort((p, q) => Math.abs(span(p) - rec) - Math.abs(span(q) - rec) || (q.st - p.st) || p.p - q.p);
    rail($("#fanProds"), fans.filter((p) => Math.abs(span(p) - rec) <= 260));
  }

  /* ================= 02 LUMEN ================= */
  function lumen() {
    const L = +$("#lumL").value, W = +$("#lumW").value, a = L * W, [lo, hi] = $("#lumRoom").value.split(",").map(Number), g = +seg.lumG;
    setV($("#lumL")); setV($("#lumW")); $("#lumLo").textContent = L + " m"; $("#lumWo").textContent = W + " m";
    const mn = a * lo, mx = a * hi, n1 = Math.max(1, Math.ceil(mn / g)), n2 = Math.max(1, Math.ceil(mx / g));
    const room = $("#lumRoom").selectedOptions[0].textContent.split(" ·")[0];
    $("#lumOut").innerHTML = `${n0(mn)}–${n0(mx)}<small>lm</small>`;
    const name = g === 806 ? "A60 LED globes (806 lm, about 9 W)" : g === 480 ? "GU10 LED downlights (480 lm, about 5 W)" : "LED candle globes (470 lm, about 5 W)";
    $("#lumTxt").innerHTML = `A ${n0(a)} m² ${esc(room.toLowerCase())} needs <b>${n0(mn)}–${n0(mx)} lumens</b>: that's <b>${n1 === n2 ? n1 : n1 + "–" + n2}</b> ${name}. In LED that's only about ${n0(n2 * (g === 806 ? 9 : 5))} W in total.`;
    $("#lumDots").innerHTML = Array.from({ length: Math.min(n2, 40) }, (_, i) => `<i style="animation-delay:${i * 30}ms${i >= n1 ? ";opacity:.4" : ""}"></i>`).join("");
    $("#lumTip").textContent = n2 > 8 && g === 806 ? "That's a lot of globes in one fitting. Spread the light: downlights or panels for the general light, plus pendants and lamps for character." : "Spread the light over several fittings rather than one bright one: the room looks bigger and you avoid harsh shadows.";
    const re = g === 806 ? /\b(a60|a65|st64)\b/i : g === 480 ? /gu10/i : /candle/i;
    const list = T.products.filter((p) => p.t === "globes" && re.test(p.n) && !/emergency/i.test(p.n)).sort((p, q) => (lumensOf(q) >= g * .9) - (lumensOf(p) >= g * .9) || p.p - q.p);
    rail($("#lumProds"), list);
  }

  /* ================= 03 KELVIN ================= */
  const KROOMS = {
    lounge: { name: "Lounge", img: ["2025/12/shop-fans.jpg", 1.14], best: [2700, 3000], adv: "Lounges are for winding down. Warm white (2700–3000K) makes skin, wood and fabric look their best. Cooler light here feels like a waiting room." },
    dining: { name: "Kitchen & dining", img: ["2025/12/Tris.jpg"], best: [3000, 4000], adv: "Open-plan kitchens work best at 3000K so they blend with the lounge. A separate kitchen can go to 4000K for crisp task light. Keep the dining table warm." },
    bedroom: { name: "Bedroom", img: ["2025/12/Website-BedroomLighting-03.jpg"], best: [2700, 2700], adv: "Keep bedrooms at 2700K or warmer. Cool, blue-rich light late at night tells your body it's still daytime." },
    patio: { name: "Patio", img: ["2025/12/1-1.jpg"], best: [2700, 3000], adv: "Warm white looks natural on stone, timber and plants and attracts fewer insects than cool light. Save 6500K for security floodlights only." }
  };
  const KBANDS = [[2700, 2900, "Warm white", "Lounges, bedrooms, dining"], [3000, 3400, "Soft warm white", "Open-plan kitchens, patios"], [3500, 4900, "Cool white", "Kitchens, bathrooms, offices, garages"], [5000, 6500, "Daylight", "Workshops, security and task lighting"]];
  function k2rgb(k) { const t = k / 100; let r, g, b; if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; } else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; } return [r, g, b].map((v) => Math.round(clamp(v, 0, 255))); }
  let kRoomCur = "";
  function kelvin() {
    const k = +$("#kRange").value, R = KROOMS[seg.kRoom]; setV($("#kRange"));
    if (kRoomCur !== seg.kRoom) { kRoomCur = seg.kRoom; const im = $("#kImg"); im.src = UP + R.img[0]; im.className = R.img[1] ? "cb" : ""; im.style.setProperty("--cb", R.img[1] || 1); }
    const [r, g, b] = k2rgb(k), warmth = clamp((5500 - k) / 2800, -0.45, 1);
    $("#kTint").style.backgroundColor = `rgb(${r},${g},${b})`;
    $("#kTint2").style.backgroundColor = `rgba(${r},${g},${b},${(0.06 + Math.abs(warmth) * 0.14).toFixed(2)})`; $("#kTint").style.opacity = (0.35 + Math.abs(warmth) * 0.3).toFixed(2);
    $("#kImg").style.filter = `brightness(${(0.9 + (1 - warmth) * 0.08).toFixed(2)}) saturate(${(1 + warmth * 0.15).toFixed(2)})`;
    const band = KBANDS.find((x) => k >= x[0] && k <= x[1]) || KBANDS[3];
    $("#kRead").textContent = k + "K"; $("#kName").textContent = band[2];
    $("#kRoomLbl").textContent = R.name;
    const ok = k >= R.best[0] - 100 && k <= R.best[1] + 200;
    $("#kVerdict").innerHTML = ok ? `${k}K is <em>right</em> for this room.` : k < R.best[0] ? `A touch <em>warm</em> for here.` : `Too <em>cool</em> for this room.`;
    $("#kAdvice").textContent = R.adv + ` We'd choose ${R.best[0] === R.best[1] ? R.best[0] + "K" : R.best[0] + "–" + R.best[1] + "K"}.`;
    $("#kTable").innerHTML = KBANDS.map((x) => `<tr class="${x === band ? "on" : ""}"><th scope="row">${x[0]}${x[1] !== x[0] ? "–" + x[1] : ""}K · ${x[2]}</th><td>${x[3]}</td></tr>`).join("");
    const want = band[2].includes("Daylight") ? [5000, 7000] : band[2].includes("Cool") ? [3500, 4900] : [2000, 3400];
    rail($("#kProds"), T.products.filter((p) => p.t === "globes" && kOf(p) >= want[0] && kOf(p) <= want[1] && !/strip/i.test(p.n)).sort((p, q) => p.p - q.p));
  }

  /* ================= 04 LOAD-SHEDDING ================= */
  function ls() {
    const where = seg.lsW, h = +$("#lsH2").value, n = +$("#lsN").value; setV($("#lsH2")); setV($("#lsN"));
    $("#lsHo").textContent = h + " h"; $("#lsNo").textContent = n;
    $$("[data-for]", $("#loadshedding")).forEach((el) => el.hidden = el.dataset.for !== where);
    const P = T.products; let list = [], txt = "", tip = "", big = "", bars = [];
    if (where === "in") {
      const eg = P.filter((p) => /emergency/i.test(p.n) && new RegExp(seg.lsF, "i").test(fitOf(p) || ""));
      const solar = P.filter((p) => /solar/i.test(p.n) && /strip/i.test(p.n));
      big = `${n}<small>emergency globe${n > 1 ? "s" : ""}</small>`;
      txt = `Swap one globe in each of your ${n} room${n > 1 ? "s" : ""} for an ${seg.lsF} emergency LED globe. It works like a normal globe and keeps shining from its own battery for up to about 6 hours (at a lower 150 lm) when the power goes.`;
      bars = [["Emergency globes", 0, Math.min(h, 6)]];
      if (h > 6) { txt += ` For ${h}-hour outages, add solar LED strip lights: they charge in the sun by day and light the kitchen or lounge all evening.`; bars.push(["Solar strip lights", 0, h]); }
      tip = "Leave the wall switch on. That's how an emergency globe knows the power has gone. If you run an inverter, all-LED lighting makes the battery last far longer.";
      list = eg.concat(h > 6 ? solar : [], h <= 6 ? solar.slice(0, 2) : []);
    } else {
      const o = seg.lsO, s = P.filter((p) => p.t === "outdoor" && /solar/i.test(p.n + " " + p.c.join(" ")));
      const pick = o === "sec" ? s.filter((p) => /motion|sensor/i.test(p.n)) : o === "path" ? s.filter((p) => /spike|bollard|lantern|pedestal/i.test(p.n)) : s.filter((p) => /flood|pole/i.test(p.n));
      big = `${pick.length}<small>solar options</small>`;
      txt = { sec: "Solar motion-sensor lights for gates, side passages and doors. They charge by day and switch on at full brightness only when someone moves, so the battery lasts the whole night.", path: "Solar spike, bollard and pedestal lights along paths and beds. No trenching, no wiring, and they keep glowing through evening load-shedding.", drive: "Solar floodlights and pole lights for driveways and yards. Mount the panel where it gets 5–6 hours of direct sun, facing north if you can." }[o];
      bars = [["Solar (full charge)", 0, 12]];
      tip = "Solar lights don't care about the schedule: they run from dusk on a day's charge. Expect shorter run times in winter or after cloudy days, and wipe the panels every few weeks.";
      list = pick.concat(s.filter((p) => !pick.includes(p)));
    }
    $("#lsOut").innerHTML = big; $("#lsTxt").textContent = txt; $("#lsTip").textContent = tip;
    const X = (v) => 20 + v / 12 * 480;
    $("#lsSvg").innerHTML = `<line class="ln" x1="20" y1="86" x2="500" y2="86"/>${[0, 2, 4, 6, 8, 10, 12].map((v) => `<line class="ln" x1="${X(v)}" y1="82" x2="${X(v)}" y2="90"/><text class="tx" x="${X(v)}" y="104" text-anchor="middle">${v}H</text>`).join("")}
      <rect class="dim" x="${X(0)}" y="8" width="${X(h) - X(0)}" height="66"/><text class="tx" x="${X(h) - 6}" y="22" text-anchor="end">OUTAGE ${h}H</text>
      ${bars.map((b, i) => `<rect class="hl" x="${X(b[1])}" y="${32 + i * 22}" width="${X(b[2]) - X(b[1])}" height="14" rx="7"/><text class="tx" x="${X(b[1]) + 8}" y="${43 + i * 22}">${esc(b[0].toUpperCase())}</text>`).join("")}`;
    rail($("#lsProds"), list);
  }

  /* ================= 05 GLOBE ================= */
  const CAPS = {
    E27: { name: "Edison screw", note: "Large screw · 27 mm", svg: '<path class="ln" d="M17 6h30v10H17z"/><path class="ln" d="M19 16h26v46l-3 6H22l-3-6z"/><path class="th" d="M19 22l26 5M19 31l26 5M19 40l26 5M19 49l26 5"/><path class="ln" d="M26 68h12v8H26zM29 76h6v6h-6z"/>', txt: "The big screw cap. Most pendants, table and floor lamps in South Africa use E27." },
    E14: { name: "Small Edison screw", note: "Small screw · 14 mm", svg: '<path class="ln" d="M22 10h20v9H22z"/><path class="ln" d="M25 19h14v40l-2 5H27l-2-5z"/><path class="th" d="M25 25l14 4M25 33l14 4M25 41l14 4M25 49l14 4"/><path class="ln" d="M28 64h8v8h-8z"/>', txt: "The slim screw cap. Common in chandeliers, wall lights, bedside lamps and candle globes." },
    B22: { name: "Bayonet", note: "Push & twist · 22 mm", svg: '<path class="ln" d="M17 6h30v10H17z"/><path class="ln" d="M20 16h24v50H20z"/><path class="ln" d="M12 40h8v6h-8zM44 40h8v6h-8z"/><path class="ln" d="M24 66h16v6H24z"/><circle class="ln" cx="27" cy="76" r="3"/><circle class="ln" cx="37" cy="76" r="3"/>', txt: "Two little pins on the side: push in and twist. Still found in many older South African homes and ceiling fittings." },
    GU10: { name: "GU10 twist-lock", note: "Two thick pins · downlights", svg: '<path class="ln" d="M8 10h48l-6 30H14z"/><path class="ln" d="M18 40h28v8H18z"/><path class="ln" d="M24 48v16M40 48v16"/><circle class="ln" cx="24" cy="68" r="4.5"/><circle class="ln" cx="40" cy="68" r="4.5"/>', txt: "Two short, thick pins with knobbly ends: push in and twist. Used in most downlights and spotlights, 230 V with no transformer." },
    G9: { name: "G9 loop pin", note: "Two looped pins · small", svg: '<rect class="ln" x="22" y="8" width="20" height="38" rx="9"/><path class="ln" d="M24 46h16v8H24z"/><path class="ln" d="M27 54v10c0 6 6 6 6 0V54" transform="translate(-4 0)"/><path class="ln" d="M37 54v10c0 6 6 6 6 0V54" transform="translate(-6 0)"/>', txt: "A tiny capsule with two looped wire pins. Used in modern multi-light pendants, glass wall lights and bathroom fittings." }
  };
  let cap = "E27";
  function capsUI() {
    $("#glCaps").innerHTML = Object.entries(CAPS).map(([k, c]) => `<button type="button" class="tl-cap" aria-pressed="${k === cap}" data-cap="${k}"><svg viewBox="0 0 64 92" aria-hidden="true">${c.svg}</svg><b>${k}</b><small>${esc(c.note)}</small></button>`).join("");
    $("#glCaps").addEventListener("click", (e) => { const b = e.target.closest("[data-cap]"); if (!b) return; cap = b.dataset.cap; $$("[data-cap]").forEach((x) => x.setAttribute("aria-pressed", x === b)); globe(); T.track("globe_finder", { fit: cap }); });
  }
  function globe() {
    let L = T.products.filter((p) => p.t === "globes" && (fitOf(p) || "").toUpperCase() === cap);
    const kk = seg.glK, st = seg.glS;
    if (kk !== "all") L = L.filter((p) => { const k = kOf(p); return kk === "warm" ? k && k <= 3400 : kk === "cool" ? k >= 3500 && k < 5000 : k >= 5000; });
    if (st === "std") L = L.filter((p) => !/filament/i.test(p.n)); if (st === "fil") L = L.filter((p) => /filament/i.test(p.n)); if (st === "dim") L = L.filter((p) => /dimmable/i.test(p.n));
    L.sort((p, q) => (q.st - p.st) || p.p - q.p);
    const c = CAPS[cap];
    $("#glLbl").textContent = `${cap} · ${c.name}`; $("#glOut").innerHTML = `${L.length}<small>globe${L.length === 1 ? "" : "s"} fit</small>`;
    $("#glTxt").textContent = c.txt + (L.length ? "" : " Nothing matches these filters right now; try 'All'.");
    rail($("#glProds"), L, "No globes match these filters. Try another colour or type.");
  }

  /* ================= 06 IP ================= */
  const D1 = { 2: "Solids: keeps out fingers and objects over 12.5 mm. Indoor only.", 4: "Solids: keeps out objects over 1 mm, like wires and insects.", 5: "Solids: dust protected. Some dust may enter but won't harm it.", 6: "Solids: completely dust tight." };
  const D2 = { 0: "Water: no protection. Keep it dry.", 4: "Water: protected against splashes from any direction.", 5: "Water: protected against low-pressure jets, like a hosepipe or driving rain.", 6: "Water: protected against powerful jets and heavy seas.", 7: "Water: survives temporary immersion up to 1 m.", 8: "Water: built for continuous immersion." };
  const ZONES = {
    b0: { lbl: "Zone 0 · inside the bath or shower", ip: 67, txt: "Inside the bath or shower tray itself. Only special 12 V (SELV) fittings rated IP67 or higher belong here.", f: "bath" },
    b1: { lbl: "Zone 1 · above the bath, up to 2.25 m", ip: 65, txt: "Directly above the bath or shower up to 2.25 m. Use IP65: water jets from the shower head won't get in.", f: "bath" },
    b2: { lbl: "Zone 2 · within 0.6 m of the bath", ip: 44, txt: "The 0.6 m band around the bath or shower, and around the basin. IP44 minimum, which covers splashes from any direction.", f: "bath" },
    bx: { lbl: "Outside the zones", ip: 20, txt: "Away from the bath, shower and basin, a standard indoor light (IP20) is allowed, but IP44 is the wiser choice in a steamy bathroom.", f: "bath" },
    o1: { lbl: "Covered patio under the roof", ip: 44, txt: "Under a solid roof or deep eave, out of direct rain. IP44 handles splashes and wind-blown drizzle.", f: "out" },
    o2: { lbl: "Exposed outside wall", ip: 65, txt: "Walls that take the full force of a Highveld storm or coastal wind need IP65. IP54 is the bare minimum.", f: "out" },
    o3: { lbl: "Garden, paths and in-ground", ip: 65, txt: "Spike lights, bollards and anything near sprinklers: IP65. Lights set into the ground should be IP67.", f: "out" },
    o4: { lbl: "Pool and pond", ip: 68, txt: "Underwater lights must be IP68. Lights right on the edge of a pool or pond should be at least IP67.", f: "out" },
    o5: { lbl: "Driveway and security floods", ip: 65, txt: "Floodlights and sensor lights mounted high on the wall face the weather head-on: IP65.", f: "out" }
  };
  let zone = "b1";
  const ipOf = (p) => +((p.sp["IP Rating"] || p.sp["Ip Rating"] || p.sp["IP rating"] || "").match(/(\d{2})/) || [])[1] || 0;
  function ip() {
    const area = seg.ipA; $("#ipBath").hidden = area !== "bath"; $("#ipOut").hidden = area !== "out";
    if (ZONES[zone].f !== area) zone = area === "bath" ? "b1" : "o2";
    const Z = ZONES[zone]; $$(".zone").forEach((g) => { g.classList.toggle("on", g.dataset.z === zone); g.setAttribute("aria-pressed", g.dataset.z === zone); });
    const d = String(Z.ip);
    $("#ipZone").textContent = Z.lbl; $("#ipCode").textContent = "IP" + d + (Z.ip < 44 ? " +" : ""); $("#ipTxt").textContent = Z.txt;
    $("#ipD1").textContent = d[0]; $("#ipD1t").textContent = D1[d[0]] || ""; $("#ipD2").textContent = d[1]; $("#ipD2t").textContent = D2[d[1]] || "";
    let L;
    if (area === "bath") L = T.products.filter((p) => p.t === "indoor" && (/bathroom/i.test(p.c.join(" ") + " " + (p.sp.Room || ""))) && ipOf(p) >= Math.max(Z.ip, zone === "bx" ? 20 : Z.ip)).filter((p) => !/exhaust/i.test(p.n));
    else L = T.products.filter((p) => p.t === "outdoor" && ipOf(p) >= Z.ip);
    L.sort((p, q) => ipOf(p) - ipOf(q) || (q.st - p.st) || p.p - q.p);
    $("#ipProdH").innerHTML = `Rated IP${Z.ip}+ for <em>${area === "bath" ? "this zone" : "this spot"}</em>`;
    $("#ipAll").href = area === "bath" ? "shop.html?cat=indoor&sub=Bathroom%20Lighting" : "shop.html?cat=outdoor";
    rail($("#ipProds"), L, zone === "b0" ? "Zone 0 needs specialist 12 V IP67 fittings. Speak to a TLW expert or your electrician." : "Ask in store for fittings rated for this zone.");
  }
  $$(".zone").forEach((g) => { const act = () => { zone = g.dataset.z; ip(); T.track("ip_zone", { zone }); }; g.addEventListener("click", act); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } }); });

  /* index highlight */
  const links = $$(".tl-index a");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => { const onA = a.getAttribute("href") === "#" + e.target.id; a.classList.toggle("on", onA); if (onA) { a.setAttribute("aria-current", "true"); const ol = a.closest("ol"); if (ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - 20, behavior: "smooth" }); } else a.removeAttribute("aria-current"); }); }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".tl-tool").forEach((s) => io.observe(s));
  }
  links.forEach((a) => a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (!t) return; e.preventDefault(); const off = matchMedia("(max-width: 1100px)").matches ? -120 : -70; T.lenis ? T.lenis.scrollTo(t, { offset: off }) : scrollTo({ top: t.getBoundingClientRect().top + scrollY + off, behavior: "smooth" }); history.replaceState(null, "", a.getAttribute("href")); }));

  /* boot */
  capsUI();
  on(["fanL", "fanW", "fanC", "fanK"], fan); on(["lumL", "lumW", "lumRoom", "lumG"], lumen); on(["kRange", "kRoom"], kelvin); on(["lsH2", "lsN", "lsW", "lsF", "lsO"], ls); on(["glK", "glS"], globe); on(["ipA"], ip);
  kelvin(); fan(); lumen(); ls(); globe(); ip();
  T.ready(() => {
    fan(); lumen(); kelvin(); ls(); globe(); ip();
    const h = location.hash.slice(1); const t = h && document.getElementById(h);
    if (t && t.classList.contains("tl-tool")) setTimeout(() => { T.lenis ? T.lenis.scrollTo(t, { offset: -70, immediate: true }) : t.scrollIntoView(); }, 300);
  });
  T.reveal(); T.magnetic();
})();
