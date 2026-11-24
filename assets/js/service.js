/* ==========================================================================
   TLW service pages — checkout, track, account, contact, trade,
   promotions, privacy, 404. One file, switched on body[data-page].
   Everything here is demo-only: no payments, no data leaves the browser.
   ========================================================================== */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA;
  if (!T) return;
  const { $, $$, esc, money, store } = T;
  const page = document.body.dataset.page;

  /* ---------------- shared helpers ---------------- */
  const STEPS = ["Placed", "Packed", "Dispatched", "Out for delivery", "Delivered"];
  const STEPS_COLLECT = ["Placed", "Packed", "At the store", "Ready to collect", "Collected"];
  const HOURS = [0, 3, 18, 30, 40];
  const SHIP_FEE = 150;
  const getOrders = () => store.get("tlw-orders", []);
  const setOrders = (o) => store.set("tlw-orders", o);
  const rnd5 = () => String(Math.floor(10000 + Math.random() * 90000));
  const makeNo = () => "TLW-" + new Date().getFullYear() + "-" + rnd5();
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  const fmtLong = (d) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  function addBiz(d, n) { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) n--; } return x; }
  const etaDays = (prov) => prov === "Gauteng" ? [1, 2] : prov === "Northern Cape" ? [3, 5] : [2, 4];
  const isCollect = (o) => /collect/i.test(o.delivery || "");
  const itemsTotal = (items) => items.reduce((a, it) => { const p = T.get(it.id); return a + (p ? p.p * it.q : 0); }, 0);
  const pool = (p, cls) => `<span class="sv-pool ${cls || ""}"><img src="${esc(T.thumb(T.img(p)))}" alt="${esc(p.n)}" loading="lazy"></span>`;

  /* status of an order: stored orders progress with time; unknown numbers are simulated */
  function statusOf(o) {
    const placed = new Date(o.date).getTime();
    let step = 0;
    if (typeof o.sim === "number") step = o.sim;
    else { const h = (Date.now() - placed) / 36e5; HOURS.forEach((t, i) => { if (h >= t) step = i; }); }
    const labels = isCollect(o) ? STEPS_COLLECT : STEPS;
    // future steps are spread towards the courier estimate so the dates always run forwards
    const eta = Math.max(placed + HOURS[4] * 36e5, addBiz(placed, etaDays(o.prov || "Gauteng")[isCollect(o) ? 0 : 1]).setHours(14, 0, 0, 0));
    const times = HOURS.map((t, i) => {
      const at = i <= step ? placed + t * 36e5 : placed + (eta - placed) * (t / HOURS[4]);
      return { t: new Date(at), exp: i > step };
    });
    return { step, label: labels[step], labels, times };
  }

  /* an order we "know" from just the number: deterministic, so the same number always shows the same story */
  function simulate(no, email) {
    const digits = no.replace(/\D/g, "").slice(-5);
    const seed = +digits || 48213;
    const step = digits.split("").reduce((a, b) => a + +b, 0) % 5;
    const cand = T.products.filter((p) => p.st && p.i.length && p.t !== "switches");
    const items = [];
    if (cand.length) {
      const n = 1 + (seed % 3);
      for (let i = 0; i < n; i++) { const p = cand[(seed * (i + 7) * 31) % cand.length]; if (!items.find((x) => x.id === p.id)) items.push({ id: p.id, q: 1 + ((seed >> i) % 2) }); }
    }
    const sub = itemsTotal(items);
    return { no: no.toUpperCase(), email: email || "", date: new Date(Date.now() - (HOURS[step] + 2) * 36e5).toISOString(), items, total: sub + (sub >= D.freeShip ? 0 : SHIP_FEE), delivery: "Courier · Gauteng", prov: "Gauteng", sim: step };
  }

  function lineHTML(p, q, extra) {
    return `<div class="co-line">${pool(p, "th")}<div><b>${esc(p.n)}</b><small>${q} × ${money(p.p)}${extra || ""}</small></div><span class="price">${money(p.p * q)}</span></div>`;
  }

  /* add many items to the bag in one go (one toast, not ten) */
  function addAll(items, msg, stay) {
    let n = 0;
    items.forEach((it) => { const p = T.get(it.id); if (!p) return; const ex = T.bag.items.find((x) => x.id === p.id); ex ? (ex.q += it.q) : T.bag.items.push({ id: p.id, q: it.q }); n += it.q; });
    if (!n) return;
    T.bag.save();
    T.track("add_to_cart", { bulk: true, qty: n, value: itemsTotal(items) });
    T.toast(`<span>✨ <b>${n} item${n > 1 ? "s" : ""}</b> ${esc(msg || "added to your bag")}</span>`);
    if (!stay) setTimeout(() => T.openOv("bag"), 500);
  }

  function validate(fields) {
    for (const el of fields) {
      if (el.closest("[hidden]") || el.disabled) continue;
      if (!el.checkValidity()) { el.reportValidity(); el.focus(); return false; }
    }
    return true;
  }

  /* smooth in-page anchors with header offset */
  function scrollToEl(el) {
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - 90;
    T.lenis ? T.lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: T.reduced() ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('main a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1); const el = id && document.getElementById(id); if (!el) return;
    e.preventDefault(); scrollToEl(el); history.replaceState(null, "", "#" + id);
    if (a.dataset.focus) setTimeout(() => { const f = document.getElementById(a.dataset.focus); f && f.focus({ preventScroll: true }); }, 700);
    document.dispatchEvent(new CustomEvent("sv:anchor", { detail: id }));
  });

  /* keyboard-accessible tablist: arrows move, Home/End jump */
  function tablist(list, onSelect) {
    const tabs = $$('[role="tab"]', list);
    const select = (t, focus) => {
      tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = !on; });
      focus && t.focus(); onSelect && onSelect(t);
    };
    tabs.forEach((t) => t.addEventListener("click", () => select(t)));
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement); if (i < 0) return;
      let j = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0; else if (e.key === "End") j = tabs.length - 1;
      if (j != null) { e.preventDefault(); select(tabs[j], true); }
    });
    return select;
  }

  const sampleBag = () => ["Fabrica 4 Light", "Sussurro Led 3 Blade Black", "St64 Led Decorative Filament"].map((n, i) => { const p = T.find(n); return p && { id: p.id, q: i === 2 ? 4 : 1 }; }).filter(Boolean);

  /* ======================================================================
     CHECKOUT
     ====================================================================== */
  function checkout() {
    const form = $("#coForm"), steps = $$(".co-step", form), meter = $$("#coMeter li");
    let cur = 0; const done = new Set();
    const acct = store.get("tlw-account", null);
    if (acct) { acct.email && ($("#cEmail").value = acct.email); acct.name && ($("#cFirst").value = acct.name); }

    // stores for click & collect
    $("#cStore").innerHTML = D.stores.map((s) => `<option value="${s.id}">${esc(s.name)}${s.isNew ? " (new)" : ""} · ${esc(s.region)}</option>`).join("");
    const storeInfo = () => { const s = D.stores.find((x) => x.id === $("#cStore").value); $("#storeInfo").innerHTML = s ? `<b style="color:var(--head)">${esc(s.addr)}</b><br>${esc(s.phone)} · Mon–Fri 8:30–17:00 · Sat 9:00–15:00 · Sun ${esc(s.sun)}` : ""; };
    $("#cStore").addEventListener("change", storeInfo); storeInfo();

    $("#cAcc").addEventListener("change", (e) => $("#cAccNote").hidden = !e.target.checked);

    const method = () => form.method.value;
    const pay = () => form.pay.value;
    const sub = () => T.bag.subtotal();
    const fee = () => method() === "collect" || !sub() || sub() >= D.freeShip ? 0 : SHIP_FEE;
    const total = () => sub() + fee();
    const eta = () => { const [a, b] = etaDays(form.prov.value); return `${fmtDate(addBiz(new Date(), a))} – ${fmtDate(addBiz(new Date(), b))}`; };

    function syncDelivery() {
      const c = method() === "collect";
      $("#subCourier").hidden = c; $("#subCollect").hidden = !c;
      $("#feeTag").textContent = sub() >= D.freeShip ? "Free" : money(SHIP_FEE);
      $("#coEta").textContent = form.prov.value ? `Estimated arrival: ${eta()}` : "Choose your province to see an estimated delivery date.";
      receipt();
    }
    function syncPay() {
      const t = total();
      $("#payflexTxt").textContent = `Four interest-free payments of ${money(t / 4)}, every two weeks.`;
      const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
      const notes = {
        card: `<div class="co-paynote">${lock}<span>After you place the order you'd continue to our payment partner's secure page to enter your card. We never see or store your card number.<div class="co-brands"><span>VISA</span><span>MASTERCARD</span><span>3D SECURE</span></div></span></div>`,
        eft: `<div class="co-paynote">${lock}<span>Our banking details and your order number as reference appear on the confirmation and in your email. We pack your order as soon as the payment reflects, usually within 1–2 working days.</span></div>`,
        payflex: `<div class="co-paynote">${lock}<span>You'd continue to Payflex to approve the plan: ${money(t / 4)} today, then three more payments of ${money(t / 4)} every two weeks. No interest, no fees when you pay on time.</span></div>`
      };
      $("#payNote").innerHTML = notes[pay()] + `<p class="demo-note" style="margin:14px 0 0">Demo checkout: no payment is taken</p>`;
    }
    form.addEventListener("change", (e) => { if (e.target.name === "method" || e.target.name === "prov") syncDelivery(); if (e.target.name === "pay") syncPay(); });

    function summary(i) {
      if (i === 0) return `${esc(form.first.value)} ${esc(form.last.value)} · ${esc(form.email.value)}`;
      if (i === 1) { if (method() === "collect") { const s = D.stores.find((x) => x.id === form.store.value); return `Click &amp; collect at ${esc(s ? s.name : "")} · Free`; } return `Courier to ${esc(form.suburb.value)}, ${esc(form.city.value)} · ${fee() ? money(fee()) : "Free"} · ${eta()}`; }
      if (i === 2) return { card: "Card (Visa / Mastercard)", eft: "EFT", payflex: `Payflex · 4 × ${money(total() / 4)}` }[pay()];
      return "";
    }
    function review() {
      const s = D.stores.find((x) => x.id === form.store.value);
      const del = method() === "collect" ? `Click &amp; collect<br>${esc(s.name)} · ${esc(s.addr)}` : `${esc(form.addr.value)}<br>${esc(form.suburb.value)}, ${esc(form.city.value)}, ${esc(form.prov.value)} ${esc(form.post.value)}<br><span class="mute">Estimated ${eta()}</span>`;
      $("#coReview").innerHTML = `<div><dt>Contact</dt><dd>${esc(form.first.value)} ${esc(form.last.value)}<br>${esc(form.email.value)}<br>${esc(form.phone.value)}</dd></div>
        <div><dt>Delivery</dt><dd>${del}</dd></div>
        <div><dt>Payment</dt><dd>${summary(2)}</dd></div>
        <div><dt>Total</dt><dd style="font-family:var(--f-display);font-size:30px;color:var(--amber)">${money(total())}</dd></div>`;
    }
    function open(i, focus) {
      cur = i;
      steps.forEach((s, j) => {
        s.classList.toggle("open", j === i); s.classList.toggle("done", done.has(j));
        s.classList.toggle("locked", j > i && !done.has(j) && !done.has(j - 1));
        $(".co-step-h", s).setAttribute("aria-expanded", j === i);
        $("[data-sum]", s).innerHTML = done.has(j) && j !== i ? summary(j) : "";
      });
      meter.forEach((m, j) => { m.classList.toggle("done", done.has(j) && j !== i); m.classList.toggle("on", j === i); });
      if (i === 3) review();
      if (i === 2) syncPay();
      if (focus) { const s = steps[i]; scrollToEl(s); setTimeout(() => { const f = $("input:not([type=hidden]):not([type=checkbox]), select", $(".co-step-b", s)); f && f.focus({ preventScroll: true }); }, 500); }
    }
    steps.forEach((s, i) => {
      $(".co-step-h", s).addEventListener("click", () => { if (i === cur) return; if (done.has(i) || done.has(i - 1) || i < cur) open(i, true); });
      $$("[data-next]", s).forEach((b) => b.addEventListener("click", () => {
        if (!validate($$("input, select, textarea", $(".co-step-b", s)))) return;
        done.add(i); T.sound.click();
        if (i === 0) T.track("begin_checkout", { value: total() });
        if (i === 1) T.track("add_shipping_info", { method: method() });
        if (i === 2) T.track("add_payment_info", { method: pay() });
        open(Math.min(i + 1, 3), true);
      }));
      $$("[data-back]", s).forEach((b) => b.addEventListener("click", () => open(Math.max(0, i - 1), true)));
    });

    function receipt() {
      const items = T.bag.items, s = sub();
      const left = Math.max(0, D.freeShip - s);
      $("#coShip").innerHTML = items.length ? `${left > 0 ? `You're <b style="color:var(--amber)">${money(left)}</b> away from FREE delivery 🚚` : `<b style="color:var(--amber)">You've unlocked FREE delivery</b> 🚚`}<div class="ship-bar"><i style="width:${Math.min(100, s / D.freeShip * 100)}%"></i></div>` : "";
      $("#coLines").innerHTML = items.length ? items.map((it) => { const p = T.get(it.id); return p ? lineHTML(p, it.q) : ""; }).join("")
        : `<div class="sv-empty" style="padding:20px 0"><h3>Your bag is in the dark.</h3><p style="margin:0">Let's light it up.</p><div class="flex"><a class="btn sm" href="shop.html">Shop lights</a><button type="button" class="btn sm ghost" id="coSample">Load a sample bag</button></div></div>`;
      const f = fee();
      $("#coTot").innerHTML = `<div class="row-b"><span>Subtotal</span><span>${money(s)}</span></div>
        <div class="row-b"><span>${method() === "collect" ? "Click &amp; collect" : "Courier delivery"}</span><span>${f ? money(f) : "Free"}</span></div>
        <div class="row-b"><span>Includes VAT (15%)</span><span>${money((s + f) * 15 / 115)}</span></div>
        <div class="row-b grand"><span>Total</span><span>${money(s + f)}</span></div>`;
      $("#coPlace").textContent = items.length ? `Place order · ${money(s + f)}` : "Your bag is empty";
      $("#coPlace").disabled = !items.length;
      const sm = $("#coSample"); sm && sm.addEventListener("click", () => { addAll(sampleBag(), "added: a sample bag to try the checkout", true); });
      $("#feeTag").textContent = s >= D.freeShip ? "Free" : money(SHIP_FEE);
    }
    // keep the receipt live while the bag drawer is edited
    const save = T.bag.save.bind(T.bag);
    T.bag.save = function () { save(); receipt(); if (cur === 3) review(); if (cur === 2) syncPay(); };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $("#coErr"); err.textContent = "";
      if (!T.bag.items.length) { err.textContent = "Your bag is empty."; return; }
      if (![0, 1, 2].every((i) => done.has(i))) { err.textContent = "Please complete each step first."; return; }
      if (!$("#cTerms").checked) { err.textContent = "Please accept the terms to place your order."; $("#cTerms").focus(); return; }
      const s = D.stores.find((x) => x.id === form.store.value);
      const order = {
        no: makeNo(), email: form.email.value.trim().toLowerCase(), date: new Date().toISOString(),
        items: T.bag.items.map((it) => ({ id: it.id, q: it.q })), total: Math.round(total() * 100) / 100,
        delivery: method() === "collect" ? `Click & collect · ${s.name}` : `Courier · ${form.prov.value}`,
        prov: form.prov.value || null, name: form.first.value.trim(), pay: pay()
      };
      const all = getOrders(); all.unshift(order); setOrders(all);
      if ($("#cAcc").checked) store.set("tlw-account", { email: order.email, name: order.name });
      T.track("purchase", { transaction_id: order.no, value: order.total, currency: "ZAR", payment: order.pay, delivery: order.delivery, items: order.items });
      T.bag.clear();
      done.add(3);
      confirmView(order, form.phone.value);
    });

    function confirmView(o, phone) {
      const box = $("#coDone");
      const thumbs = o.items.map((it) => { const p = T.get(it.id); return p ? pool(p) : ""; }).join("");
      const eft = o.pay === "eft" ? `<p class="mt-s" style="font-size:15px">EFT reference: <b style="color:var(--head)">${o.no}</b>. Banking details are in your confirmation email.</p>` : "";
      box.innerHTML = `<div class="halo" aria-hidden="true"></div><div class="wrap">
        <span class="eyebrow">Order confirmed · ${fmtLong(o.date)}</span>
        <h1 tabindex="-1" id="doneH" data-lines>Thank you,<br><em>${esc(o.name)}.</em></h1>
        <div class="co-no" aria-label="Order number ${o.no}">${o.no}</div>
        <p class="lead">We've sent your confirmation to <b style="color:var(--head)">${esc(o.email)}</b>${phone ? ` and we'll WhatsApp every update to <b style="color:var(--head)">${esc(phone)}</b>` : ""}. Order total ${money(o.total)} · ${esc(o.delivery)}.</p>${eft}
        <div class="flex"><a class="btn" href="track.html?order=${encodeURIComponent(o.no)}">Track this order <span class="arr">→</span></a><button type="button" class="btn ghost" id="doneCopy">Copy order number</button><a class="link-u" href="shop.html">Keep shopping</a></div>
        <div class="co-done-items" aria-label="Items in this order">${thumbs}</div>
        <p class="demo-note mt-m">Demo checkout: no payment was taken and no email was sent</p></div>`;
      $("#coFlow").hidden = true; box.hidden = false;
      T.reveal(box); T.magnetic(box);
      scrollTo({ top: 0 }); T.lenis && T.lenis.scrollTo(0, { immediate: true });
      setTimeout(() => $("#doneH").focus({ preventScroll: true }), 300);
      $("#doneCopy").addEventListener("click", (e) => { try { navigator.clipboard.writeText(o.no); } catch (er) { } e.target.textContent = "Copied ✓"; });
    }

    T.ready(() => { receipt(); syncDelivery(); open(0); });
  }

  /* ======================================================================
     TRACK
     ====================================================================== */
  function track() {
    const f = $("#tkForm"), err = $("#tErr");
    let globe = "";
    $("#tkWa").href = D.waHref; $("#tkWaIc").innerHTML = T.I.wa;
    const qNo = T.qs("order");
    if (qNo) f.no.value = qNo.toUpperCase();
    $("#tDemo").addEventListener("click", () => { f.no.value = "TLW-2026-48213"; f.email.value = "demo@example.co.za"; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit")); });

    f.addEventListener("submit", (e) => {
      e.preventDefault(); err.textContent = "";
      const no = f.no.value.trim().toUpperCase().replace(/\s/g, ""); const email = f.email.value.trim().toLowerCase();
      if (!/^TLW-\d{4}-\d{5}$/.test(no)) { err.textContent = "Order numbers look like TLW-2026-48213. Check your confirmation email."; f.no.focus(); return; }
      if (!validate([f.email])) return;
      const known = getOrders().find((o) => o.no === no);
      if (known && known.email && known.email !== email) { err.textContent = "That email doesn't match this order. Use the email you checked out with."; f.email.focus(); return; }
      T.ready(() => { show(known || simulate(no, email)); T.track("track_order", { order: no, known: !!known }); });
    });

    function show(o) {
      const st = statusOf(o), res = $("#tkResult");
      const last = st.times[4];
      $("#tkSum").innerHTML = `<div><dt>Order</dt><dd>${esc(o.no)}</dd></div><div><dt>Placed</dt><dd>${fmtDate(o.date)}</dd></div>
        <div><dt>Delivery</dt><dd>${esc(o.delivery || "Courier")}</dd></div>
        <div><dt>${st.step === 4 ? (isCollect(o) ? "Collected" : "Delivered") : isCollect(o) ? "Ready by" : "Estimated arrival"}</dt><dd>${fmtDate(last.t)}</dd></div>`;
      const H = { 0: "Order <em>placed.</em>", 1: "Packed and <em>double-boxed.</em>", 2: isCollect(o) ? "Waiting at the <em>store.</em>" : "On its <em>way.</em>", 3: isCollect(o) ? "Ready to <em>collect.</em>" : "Out for <em>delivery.</em>", 4: isCollect(o) ? "<em>Collected.</em> Enjoy the glow." : "<em>Delivered.</em> Enjoy the glow." };
      $("#tkStatus").innerHTML = H[st.step];
      $("#tkCable").innerHTML = st.labels.map((l, i) => `<li class="tk-st" aria-current="${i === st.step ? "step" : "false"}"><span class="drop" aria-hidden="true"></span>
          <span class="glb" aria-hidden="true"><span class="pool"><img src="${esc(globe)}" alt=""></span></span>
          <h3>${l}</h3><time datetime="${st.times[i].t.toISOString()}">${i <= st.step ? `${fmtDate(st.times[i].t)} · ${fmtTime(st.times[i].t)}` : `Expected ${fmtDate(st.times[i].t)}`}</time>
          ${i === st.step ? '<span class="tag now">Now</span>' : ""}<span class="sr-only">${i <= st.step ? "Complete" : "Not yet"}</span></li>`).join("");
      const fill = $("#tkFill"); fill.style.setProperty("--p", "0%");
      res.classList.add("show");
      const lis = $$(".tk-st", res);
      const go = () => {
        fill.style.setProperty("--p", ((st.step + 0.5) / 5 * 100) + "%");
        lis.forEach((li, i) => { if (i <= st.step) setTimeout(() => { li.classList.add("lit"); if (i === st.step) li.classList.add("cur"); if (i === st.step) T.sound.click(); }, T.reduced() ? 0 : 300 + i * 420); });
      };
      requestAnimationFrame(() => requestAnimationFrame(go));
      // items
      const items = o.items.map((it) => ({ p: T.get(it.id), q: it.q })).filter((x) => x.p);
      $("#tkItems").innerHTML = items.map((x) => lineHTML(x.p, x.q)).join("") + `<div class="co-tot"><div class="row-b grand"><span>Total</span><span>${money(o.total)}</span></div></div>`;
      $("#tkCount").textContent = items.reduce((a, x) => a + x.q, 0) + " items";
      $("#tkMail").textContent = o.email ? `Sent to ${o.email}` : "Sent to the address on your order";
      $("#rpItem").innerHTML = items.map((x) => `<option>${esc(x.p.n)}</option>`).join("") + "<option>The whole parcel</option>";
      $("#rpForm").hidden = false; $("#rpOk").classList.remove("show");
      res.dataset.no = o.no;
      T.reveal(res);
      setTimeout(() => scrollToEl(res), 120);
    }

    // report a problem
    const files = $("#rpFiles"), prev = $("#rpPrev"), drop = $("#rpDrop");
    const showFiles = (list) => { prev.innerHTML = ""; [...list].slice(0, 6).forEach((fl) => { if (!/^image\//.test(fl.type)) return; const im = new Image(); im.alt = "Photo to attach: " + fl.name; im.src = URL.createObjectURL(fl); prev.appendChild(im); }); };
    files.addEventListener("change", () => showFiles(files.files));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files.length) showFiles(e.dataTransfer.files); });
    $("#rpForm").addEventListener("submit", (e) => {
      e.preventDefault(); const fm = e.target; $("#rpErr").textContent = "";
      if (!validate([fm.msg])) return;
      const ref = "RTN-" + rnd5(); const want = fm.want.value; const n = prev.children.length;
      const ok = $("#rpOk");
      ok.innerHTML = `<span class="eyebrow">Report received · ${ref}</span><h3 class="mt-s">We're on it.</h3>
        <p>${esc(fm.issue.value)}: <b style="color:var(--head)">${esc(fm.item.value)}</b>${n ? ` · ${n} photo${n > 1 ? "s" : ""} attached` : ""}.</p>
        <p>${/call/i.test(want) ? "Someone from our team will call you within one working day." : `We'll WhatsApp you within one working day to book a <b style="color:var(--head)">courier collection</b> from your door, then send your ${/refund/i.test(want) ? "refund" : "replacement"}. No need to visit a store.`}</p>
        <p class="demo-note" style="margin:0">Demo: nothing was sent</p>`;
      fm.hidden = true; ok.classList.add("show"); ok.focus();
      T.track("report_problem", { order: $("#tkResult").dataset.no, issue: fm.issue.value });
    });

    T.ready(() => {
      const g = T.find("St64 Led Decorative Filament") || T.products.find((p) => p.t === "globes");
      globe = g ? g.i[0] : "";
      if (qNo) { const known = getOrders().find((o) => o.no === qNo.toUpperCase()); if (known) { f.email.value = known.email || ""; show(known); } }
    });
  }

  /* ======================================================================
     ACCOUNT
     ====================================================================== */
  function account() {
    let acct = store.get("tlw-account", null);
    const gate = $("#acGate"), dash = $("#acDash");
    const TABS = ["orders", "wishlist", "addresses", "plans", "reviews", "newsletter"];
    let select;

    function hello() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
    function counts() {
      const c = { orders: getOrders().length, wishlist: T.wish.ids.size, addresses: store.get("tlw-addresses", []).length, plans: store.get("tlw-plans", []).length, reviews: store.get("tlw-reviews", []).length };
      $$("[data-c]").forEach((el) => el.textContent = c[el.dataset.c] || "");
      $("#acStats").innerHTML = `<div><b>${c.orders}</b><span>Orders</span></div><div><b>${c.wishlist}</b><span>Saved</span></div><div><b>${c.plans}</b><span>Room plans</span></div>`;
    }
    function enter(a, tab) {
      acct = a; gate.hidden = true; dash.hidden = false;
      $("#acHi").innerHTML = `${hello()},<br><em>${esc(a.name || (a.guest ? "guest" : a.email.split("@")[0]))}.</em>`;
      $("#acHi").removeAttribute("data-done"); $("#acHi").setAttribute("data-lines", "");
      T.reveal(dash); counts();
      if (!select) select = tablist($("#acRail"), (t) => { render(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); });
      select($(`[data-tab="${TABS.includes(tab) ? tab : "orders"}"]`));
    }
    $("#acSign").addEventListener("submit", (e) => {
      e.preventDefault(); const f = e.target;
      if (!validate([f.email])) return;
      const a = { email: f.email.value.trim().toLowerCase(), name: f.name.value.trim() };
      store.set("tlw-account", a); T.track("login", { method: "demo" }); enter(a, location.hash.slice(1));
      scrollTo({ top: 0 });
    });
    $("#acGuest").addEventListener("click", () => enter({ guest: true, email: "", name: "" }, location.hash.slice(1)));
    $("#acOut").addEventListener("click", () => { store.set("tlw-account", null); try { localStorage.removeItem("tlw-account"); } catch (e) { } acct = null; dash.hidden = true; gate.hidden = false; history.replaceState(null, "", location.pathname); $("#aEmail").focus(); });
    addEventListener("hashchange", () => { const h = location.hash.slice(1); if (TABS.includes(h)) { if (dash.hidden) enter(acct || { guest: true, email: "", name: "" }, h); else select($(`[data-tab="${h}"]`)); } });

    const P = (id) => $("#p-" + id);
    function render(tab) {
      ({ orders, wishlist, addresses, plans, reviews, newsletter })[tab]();
      T.magnetic(P(tab));
    }

    function orders() {
      const list = getOrders(), el = P("orders");
      el.innerHTML = `<h2>Orders &amp; <em>tracking.</em></h2><p class="lead">Every order, its live status, and one tap to order the same again.</p>` +
        (list.length ? list.map((o) => {
          const st = statusOf(o); const ps = o.items.map((it) => T.get(it.id)).filter(Boolean);
          return `<article class="ac-order"><div><div class="no">${esc(o.no)}</div><div class="meta">${fmtLong(o.date)} · ${esc(o.delivery || "Courier")} · ${money(o.total)}</div><span class="ac-pill">${st.label}</span></div>
            <div class="ac-thumbs">${ps.slice(0, 4).map((p) => pool(p)).join("")}${ps.length > 4 ? `<span class="more">+${ps.length - 4}</span>` : ""}</div>
            <div class="acts"><a class="btn sm ghost" href="track.html?order=${encodeURIComponent(o.no)}">Track</a><button class="btn sm" data-reorder="${esc(o.no)}">Quick reorder</button></div></article>`;
        }).join("") : `<div class="sv-empty"><h3>No orders yet.</h3><p>When you check out, your orders and their tracking appear here.</p><div class="flex"><a class="btn sm" href="shop.html">Start shopping</a><button class="btn sm ghost" id="acDemoOrder">Add a demo order</button></div></div>`);
      $$("[data-reorder]", el).forEach((b) => b.addEventListener("click", () => { const o = getOrders().find((x) => x.no === b.dataset.reorder); o && addAll(o.items, "from " + o.no + " added to your bag"); }));
      const d = $("#acDemoOrder", el); d && d.addEventListener("click", () => { const o = simulate(makeNo(), acct && acct.email); delete o.sim; o.date = new Date(Date.now() - 30 * 36e5).toISOString(); setOrders([o, ...getOrders()]); counts(); orders(); });
    }

    function wishlist() {
      const el = P("wishlist"); const ps = [...T.wish.ids].map(T.get).filter(Boolean);
      if (ps.length) {
        el.innerHTML = `<div class="row-b" style="flex-wrap:wrap;align-items:flex-end"><div><h2>Your <em>wishlist.</em></h2><p class="lead">The lights you've saved, ready when you are.</p></div><button class="btn sm ghost" id="wAll">Add all to bag</button></div><div class="ac-wish mt-m">${ps.map((p) => T.card(p)).join("")}</div>`;
        $("#wAll").addEventListener("click", () => addAll(ps.filter((p) => p.st).map((p) => ({ id: p.id, q: 1 }))));
      } else {
        const sug = T.products.filter((p) => p.st && p.rc && p.t !== "switches").sort((a, b) => b.rc - a.rc).slice(0, 4);
        el.innerHTML = `<h2>Your <em>wishlist.</em></h2><div class="sv-empty" style="padding-top:10px"><h3>Nothing saved yet.</h3><p>Tap the heart on any light to keep it here. A few customer favourites to start:</p></div><div class="ac-wish">${sug.map((p) => T.card(p)).join("")}</div>`;
      }
      el.onclick = (e) => { if (e.target.closest("[data-wish]")) setTimeout(counts, 50); };
    }

    function addresses() {
      const el = P("addresses"); const list = store.get("tlw-addresses", []);
      el.innerHTML = `<h2>Saved <em>addresses.</em></h2><p class="lead">For faster checkout. Stored only in this browser in the demo.</p>
        <div class="ac-addr">${list.map((a, i) => `<article><span class="eyebrow">${i === 0 ? "Default" : "Address " + (i + 1)}</span><b>${esc(a.label)}</b><span>${esc(a.addr)}<br>${esc(a.suburb)}, ${esc(a.city)}<br>${esc(a.prov)} ${esc(a.post)}</span>
          <div class="flex">${i ? `<button class="link-u" data-def="${i}" style="min-height:44px">Make default</button>` : ""}<button class="link-u" data-rm-a="${i}" style="min-height:44px">Remove</button></div></article>`).join("") || '<p class="mute">No saved addresses yet.</p>'}</div>
        <form class="ac-form panel" id="addrF" novalidate><h3 class="full" style="font-size:28px">Add an address</h3>
          <div class="field"><label for="adL">Label</label><input id="adL" name="label" required placeholder="Home"></div>
          <div class="field"><label for="adA">Street address</label><input id="adA" name="addr" required autocomplete="address-line1"></div>
          <div class="field"><label for="adS">Suburb</label><input id="adS" name="suburb" required></div>
          <div class="field"><label for="adC">City / town</label><input id="adC" name="city" required></div>
          <div class="field"><label for="adP">Province</label><select id="adP" name="prov" required><option value="">Choose…</option>${["Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape", "Free State", "Mpumalanga", "Limpopo", "North West", "Northern Cape"].map((p) => `<option>${p}</option>`).join("")}</select></div>
          <div class="field"><label for="adZ">Postal code</label><input id="adZ" name="post" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4"></div>
          <div class="full"><button class="btn sm" type="submit">Save address</button></div></form>`;
      $("#addrF").addEventListener("submit", (e) => { e.preventDefault(); const f = e.target; if (!validate($$("input,select", f))) return; list.push({ label: f.label.value, addr: f.addr.value, suburb: f.suburb.value, city: f.city.value, prov: f.prov.value, post: f.post.value }); store.set("tlw-addresses", list); T.toast("<span>📍 Address saved</span>"); counts(); addresses(); });
      $$("[data-rm-a]", el).forEach((b) => b.addEventListener("click", () => { list.splice(+b.dataset.rmA, 1); store.set("tlw-addresses", list); counts(); addresses(); }));
      $$("[data-def]", el).forEach((b) => b.addEventListener("click", () => { const [a] = list.splice(+b.dataset.def, 1); list.unshift(a); store.set("tlw-addresses", list); addresses(); }));
    }

    function plans() {
      const el = P("plans"); const list = store.get("tlw-plans", []);
      el.innerHTML = `<div class="row-b" style="flex-wrap:wrap;align-items:flex-end"><div><h2>Saved room <em>plans.</em></h2><p class="lead">Lighting schemes you've designed with our AI planner, priced and ready to order.</p></div><a class="btn sm ghost" href="planner.html">Plan a new room</a></div>` +
        (list.length ? list.map((pl) => {
          const ps = pl.items.map((it) => ({ p: T.get(it.id), q: it.q })).filter((x) => x.p);
          return `<article class="ac-plan"><div><span class="eyebrow">${fmtLong(pl.date)}</span><h3 class="mt-s">${esc(pl.name)}</h3><div class="strip">${ps.map((x) => `<a href="${T.pUrl(x.p)}" title="${esc(x.p.n)} × ${x.q}">${pool(x.p)}</a>`).join("")}</div></div>
            <div class="side"><span class="price">${money(pl.total || itemsTotal(pl.items))}</span><div class="flex" style="justify-content:flex-end"><button class="btn sm" data-plan="${esc(pl.id)}">Add plan to bag</button><button class="link-u" data-rm-p="${esc(pl.id)}">Delete</button></div></div></article>`;
        }).join("") : `<div class="sv-empty"><h3>No room plans yet.</h3><p>Tell our planner about a room and it suggests a full lighting scheme from TLW's range. Save it and it lives here.</p><div class="flex"><a class="btn sm" href="planner.html">Open the AI planner</a><button class="btn sm ghost" id="acDemoPlan">Add a demo plan</button></div></div>`);
      $$("[data-plan]", el).forEach((b) => b.addEventListener("click", () => { const pl = list.find((x) => String(x.id) === b.dataset.plan); pl && addAll(pl.items, `from “${pl.name}” added to your bag`); }));
      $$("[data-rm-p]", el).forEach((b) => b.addEventListener("click", () => { store.set("tlw-plans", list.filter((x) => String(x.id) !== b.dataset.rmP)); counts(); plans(); }));
      const d = $("#acDemoPlan", el);
      d && d.addEventListener("click", () => {
        const items = [["Fabrica 4 Light", 1], ["Marzio", 1], ["St64 Led Decorative Filament", 4]].map(([n, q]) => { const p = T.find(n); return p && { id: p.id, q }; }).filter(Boolean);
        store.set("tlw-plans", [{ id: "plan-" + Date.now(), name: "Lounge, evening glow (demo)", date: new Date().toISOString(), items, total: itemsTotal(items) }, ...list]); counts(); plans();
      });
    }

    function reviews() {
      const el = P("reviews"); const done = store.get("tlw-reviews", []);
      const ids = [...new Set(getOrders().flatMap((o) => o.items.map((i) => i.id)))].filter((id) => T.get(id));
      el.innerHTML = `<h2>Your <em>reviews.</em></h2><p class="lead">Tell other South Africans how your lights look at home. Reviews appear after a quick check by our team.</p>` +
        (ids.length ? ids.map((id) => {
          const p = T.get(id), r = done.find((x) => x.id === id);
          return `<article class="ac-rev">${pool(p)}<div><h3>${esc(p.n)}</h3>${r ? `<p class="stars" style="font-size:18px;margin:6px 0">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</p><p style="margin:0">${esc(r.text)}</p><p class="demo-note mt-s">Pending moderation · demo</p>` :
            `<form data-rev="${id}" novalidate><fieldset style="border:0;padding:0;margin:8px 0 0"><legend class="sr-only">Rating for ${esc(p.n)}</legend><div class="stars-in">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="r" value="${n}" id="r${id}-${n}" ${n === 5 ? "required" : ""}><label for="r${id}-${n}" title="${n} star${n > 1 ? "s" : ""}"><span class="sr-only">${n} star${n > 1 ? "s" : ""}</span>★</label>`).join("")}</div></fieldset>
              <div class="field"><label for="rt${id}" class="sr-only">Your review</label><textarea id="rt${id}" name="t" required placeholder="How does it look in your room?"></textarea></div><button class="btn sm mt-s" type="submit">Post review</button></form>`}</div></article>`;
        }).join("") : `<div class="sv-empty"><h3>Nothing to review yet.</h3><p>Products from your orders appear here so you can rate them once they're up.</p></div>`);
      $$("[data-rev]", el).forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault(); const r = f.r.value; if (!r) { T.toast("<span>Choose a star rating first</span>"); return; } if (!validate([f.t])) return;
        done.push({ id: +f.dataset.rev, rating: +r, text: f.t.value.trim(), date: new Date().toISOString() }); store.set("tlw-reviews", done);
        T.track("review_submit", { id: +f.dataset.rev, rating: +r }); T.toast("<span>★ Thank you. Your review is with our team.</span>"); counts(); reviews();
      }));
    }

    function newsletter() {
      const el = P("newsletter"); const pr = store.get("tlw-prefs", { bf: true, ranges: true, fans: false, trade: false, email: true, wa: false });
      const row = (k, t, d) => `<label class="check"><input type="checkbox" name="${k}" ${pr[k] ? "checked" : ""}><span><b>${t}</b>${d}</span></label>`;
      el.innerHTML = `<h2>Newsletter <em>preferences.</em></h2><p class="lead">Only what you want, only where you want it. Order updates are always sent, whatever you choose here.</p>
        <form class="ac-prefs" id="prefF"><h3>Tell me about</h3>
          ${row("bf", "Black Friday early access", "Deals before the doors open")}${row("ranges", "New ranges", "Fresh pendants, fans and finishes as they land")}${row("fans", "Summer fan offers", "Ceiling fan sales before the heat arrives")}${row("trade", "Trade offers", "For contractors, electricians and designers")}
          <h3>Send it by</h3>${row("email", "Email", acct && acct.email ? esc(acct.email) : "Your account email")}${row("wa", "WhatsApp", "Short messages, easy to opt out")}
          <div class="flex mt-m"><button class="btn sm" type="submit">Save preferences</button><span class="demo-note">Saved in this browser only</span></div></form>`;
      $("#prefF").addEventListener("submit", (e) => { e.preventDefault(); const f = e.target; const o = {}; ["bf", "ranges", "fans", "trade", "email", "wa"].forEach((k) => o[k] = f[k].checked); store.set("tlw-prefs", o); T.track("newsletter_prefs", o); T.toast("<span>✨ Preferences saved</span>"); });
    }

    // initial state
    const h = location.hash.slice(1);
    T.ready(() => {
      if (acct && acct.email) enter(acct, h);
      else if (TABS.includes(h)) enter({ guest: true, email: "", name: "" }, h);
    });
  }

  /* ======================================================================
     CONTACT
     ====================================================================== */
  function contact() {
    const f = $("#ctForm"), sel = $("#ctTopic");
    const t = T.qs("topic"); if (t) { const o = [...sel.options].find((x) => x.value.toLowerCase() === t.toLowerCase()); if (o) sel.value = o.value; }
    const sync = () => { $("#ctOrderF").hidden = !/order|returns/i.test(sel.value); };
    sel.addEventListener("change", sync); sync();
    $$("#ctBoard a").forEach((a) => a.addEventListener("mousemove", (e) => { const r = a.getBoundingClientRect(); a.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); }));
    f.addEventListener("submit", (e) => {
      e.preventDefault(); $("#ctErr").textContent = "";
      if (!validate($$("input, select, textarea", f))) return;
      const ref = "MSG-" + rnd5(), topic = sel.value, name = f.name.value.trim().split(" ")[0];
      const who = { Order: "our orders team", "Product advice": "one of our lighting advisers", Returns: "our returns team, who'll arrange the courier collection", Trade: "our trade desk", Other: "the right person" }[topic];
      const ok = $("#ctOkBox");
      ok.innerHTML = `<span class="eyebrow">Message received · ${ref}</span><h3 class="mt-s">Thanks, ${esc(name)}.</h3><p>Your message is with ${who}. We reply to <b style="color:var(--head)">${esc(f.email.value)}</b>, usually within the working day.</p><p>Need it sooner? <a href="${D.waHref}" target="_blank" rel="noopener" style="color:var(--amber)">WhatsApp ${D.whatsapp}</a></p><p class="demo-note" style="margin:0">Demo form: nothing was sent</p>`;
      f.hidden = true; ok.classList.add("show"); ok.focus();
      T.track("contact_form", { topic });
    });
    // FAQ: open the matching group when arriving on #delivery etc.
    const groups = $$(".ct-group");
    const openGroup = (id) => { const g = document.getElementById(id); if (!g || !g.classList.contains("ct-group")) return; const d = $("details", g); d && (d.open = true); };
    document.addEventListener("sv:anchor", (e) => openGroup(e.detail));
    addEventListener("hashchange", () => openGroup(location.hash.slice(1)));
    const h = location.hash.slice(1);
    if (h) { openGroup(h); setTimeout(() => scrollToEl(document.getElementById(h)), 350); }
    if ("IntersectionObserver" in window) {
      const links = $$("#ctIndex a");
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-30% 0px -60% 0px" });
      groups.forEach((g) => io.observe(g));
    }
  }

  /* ======================================================================
     TRADE
     ====================================================================== */
  function trade() {
    tablist($("#tdTabs"), (t) => T.track("trade_tool", { tool: t.id }));
    let matched = [];

    // bulk order
    const out = $("#bulkOut");
    function parse(txt) {
      const want = new Map(), miss = [];
      txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((l) => {
        const m = l.match(/^([A-Za-z0-9][A-Za-z0-9-]*)(?:[\s,;:x×]+(\d+))?/); if (!m) { miss.push(l); return; }
        const sku = m[1].toUpperCase(), q = Math.max(1, Math.min(999, +(m[2] || 1)));
        const p = T.products.find((x) => String(x.sku).toUpperCase() === sku);
        if (!p) { miss.push(m[1]); return; }
        want.set(p.id, (want.get(p.id) || 0) + q);
      });
      return { items: [...want].map(([id, q]) => ({ id, q })), miss };
    }
    function bulk() {
      const { items, miss } = parse($("#bulkIn").value); matched = items;
      if (!items.length && !miss.length) { out.innerHTML = '<p class="sv-err">Paste at least one line, like “28520 2”.</p>'; return; }
      const tot = itemsTotal(items);
      const folders = store.get("tlw-trade-projects", null) || seedProjects();
      out.innerHTML = (items.length ? `<div class="td-tablewrap"><table class="td-table"><caption class="sr-only">Matched products</caption><thead><tr><th scope="col"><span class="sr-only">Image</span></th><th scope="col">Product</th><th scope="col" class="hide-s">Stock</th><th scope="col" class="r">Qty</th><th scope="col" class="r hide-s">Unit</th><th scope="col" class="r">Line</th></tr></thead><tbody>
        ${items.map((it) => { const p = T.get(it.id); return `<tr><td>${pool(p)}</td><td><div class="nm">${esc(p.n)}</div><div class="sku">SKU ${esc(p.sku)}</div></td><td class="hide-s">${p.st ? (p.ls && p.ls < it.q ? `<span style="color:var(--amber)">Only ${p.ls} left</span>` : "In stock") : '<span class="mute">Out of stock</span>'}</td><td class="r">${it.q}</td><td class="r hide-s">${money(p.p)}</td><td class="r">${money(p.p * it.q)}</td></tr>`; }).join("")}
        </tbody><tfoot><tr><td></td><td colspan="2">${items.length} product${items.length > 1 ? "s" : ""} · retail prices</td><td class="r hide-s"></td><td class="r hide-s"></td><td class="r">${money(tot)}</td></tr></tfoot></table></div>` : "") +
        (miss.length ? `<p class="td-miss">Not found: ${miss.map(esc).join(", ")}. Check the code, or <a href="contact.html?topic=Trade" style="color:inherit;text-decoration:underline">ask the trade desk</a>.</p>` : "") +
        (items.length ? `<div class="flex mt-s"><button class="btn sm" type="button" id="bulkAdd">Add all to bag</button><label class="sr-only" for="bulkFolder">Project folder</label><select class="input" id="bulkFolder" style="width:auto;min-height:44px;padding:0 14px">${folders.map((f, i) => `<option value="${i}">${esc(f.name)}</option>`).join("")}</select><button class="btn sm ghost" type="button" id="bulkSave">Save to folder</button></div>` : "");
      const a = $("#bulkAdd"); a && a.addEventListener("click", () => addAll(matched.filter((it) => T.get(it.id).st), "from your schedule added to your bag"));
      const s = $("#bulkSave"); s && s.addEventListener("click", () => { const fs = store.get("tlw-trade-projects", null) || seedProjects(); const f = fs[+$("#bulkFolder").value]; matched.forEach((it) => { const ex = f.items.find((x) => x.id === it.id); ex ? (ex.q += it.q) : f.items.push({ ...it }); }); store.set("tlw-trade-projects", fs); T.toast(`<span>📁 Saved to <b>${esc(f.name)}</b></span>`); projects(); });
      T.track("bulk_match", { matched: items.length, missing: miss.length });
    }
    $("#bulkGo").addEventListener("click", bulk);
    $("#bulkEx").addEventListener("click", () => { $("#bulkIn").value = "28520 2\n31433 1\n26882, 12\n15340\t3\n99999 4"; bulk(); });

    // quote
    const qn = () => { const n = T.bag.count(); $("#qBagN").textContent = n ? `(${n} item${n > 1 ? "s" : ""}, ${money(T.bag.subtotal())})` : "(your bag is empty)"; };
    $("#tt-quote").addEventListener("click", qn);
    $("#qtForm").addEventListener("submit", (e) => {
      e.preventDefault(); const f = e.target; if (!validate($$("input,select,textarea", f))) return;
      const ref = "QTE-" + rnd5(); const n = $("#qBag").checked ? T.bag.count() : 0;
      $("#qtOk").innerHTML = `<span class="eyebrow">Quote requested · ${ref}</span><h3 class="mt-s">${esc($("#qProj").value)}</h3><p>${n ? `${n} item${n > 1 ? "s" : ""} from your bag included. ` : ""}We'll email a formal quote to <b style="color:var(--head)">${esc($("#qEmail").value)}</b>, with stock checked across all 12 stores.</p><p class="demo-note" style="margin:0">Demo: nothing was sent</p>`;
      f.hidden = true; $("#qtOk").classList.add("show"); $("#qtOk").focus(); T.track("quote_request", { items: n });
    });

    // spec sheets
    let sheetP = null; const res = $("#specRes");
    function sheet(p) {
      sheetP = p;
      const sp = Object.entries(p.sp || {}).filter(([k, v]) => v && String(v).length < 80);
      $("#specSheet").innerHTML = `<div class="top">${pool(p)}<div><span class="brand">The Lighting Warehouse · Spec sheet</span><h4>${esc(p.n)}</h4><div class="sku" style="font-family:ui-monospace,Menlo,monospace;color:var(--muted)">SKU ${esc(p.sku)}${p.rg ? ` · ${esc(p.rg)} range` : ""}</div><p class="price mt-s" style="margin-bottom:0">${money(p.p)} <span class="mute" style="font-weight:400;font-size:13px">retail incl. VAT · trade price on approval</span></p></div></div>
        <dl>${sp.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v).replace(/\|/g, ", "))}</dd>`).join("")}<dt>Category</dt><dd>${esc(p.c.slice(0, 2).join(", "))}</dd><dt>Availability</dt><dd>${p.st ? "In stock" : "Out of stock"}</dd></dl>
        ${p.d ? `<p class="desc">${esc(p.d.slice(0, 420))}${p.d.length > 420 ? "…" : ""}</p>` : ""}<p class="demo-note" style="margin:10px 0 0">lightingwarehouse.co.za · 011 201 2600</p>`;
      $$("button", res).forEach((b) => b.classList.toggle("on", +b.dataset.id === p.id));
    }
    let tmr;
    $("#specQ").addEventListener("input", (e) => { clearTimeout(tmr); tmr = setTimeout(() => specList(e.target.value), 160); });
    function specList(q) {
      q = q.trim().toLowerCase();
      const list = (q ? T.products.filter((p) => p.n.toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q)) : T.products.filter((p) => p.rg)).slice(0, 8);
      res.innerHTML = list.map((p) => `<button type="button" role="option" data-id="${p.id}" aria-selected="${sheetP && sheetP.id === p.id}">${pool(p)}<span><b>${esc(p.n)}</b><small>SKU ${esc(p.sku)}</small></span></button>`).join("") || '<p class="mute" style="font-size:15px">No match. Try a range name like Fabrica, or a 5-digit SKU.</p>';
    }
    res.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) { sheet(T.get(+b.dataset.id)); $$("button", res).forEach((x) => x.setAttribute("aria-selected", x === b)); } });
    $("#specPrint").addEventListener("click", () => { document.body.classList.add("print-spec"); T.track("spec_sheet_print", { sku: sheetP && sheetP.sku }); setTimeout(() => { print(); }, 50); });
    addEventListener("afterprint", () => document.body.classList.remove("print-spec"));
    $("#specAdd").addEventListener("click", (e) => sheetP && T.bag.add(sheetP.id, 1, e.currentTarget));

    // project folders
    function seedProjects() {
      const it = (n, q) => { const p = T.find(n); return p ? { id: p.id, q } : null; };
      const fs = [
        { name: "Demo: Sandton apartment fit-out", date: new Date().toISOString(), items: [it("Fabrica 4 Light", 6), it("St64 Led Decorative Filament", 24)].filter(Boolean) },
        { name: "Demo: Umhlanga patio upgrade", date: new Date().toISOString(), items: [it("Belmont Black Outdoor Wall Lantern", 8)].filter(Boolean) }
      ];
      store.set("tlw-trade-projects", fs); return fs;
    }
    function projects() {
      const fs = store.get("tlw-trade-projects", null) || seedProjects();
      $("#pjList").innerHTML = fs.map((f, i) => { const n = f.items.reduce((a, b) => a + b.q, 0); return `<article class="td-folder"><b>${esc(f.name)}</b><small>${f.items.length} products · ${n} units · ${money(itemsTotal(f.items))}</small>
        <div class="ac-thumbs mt-s">${f.items.slice(0, 4).map((x) => T.get(x.id)).filter(Boolean).map((p) => pool(p)).join("")}</div>
        <div class="flex"><button class="btn sm" data-pj-add="${i}" ${f.items.length ? "" : "disabled"}>Reorder all</button><button class="link-u" data-pj-rm="${i}">Delete</button></div></article>`; }).join("") || '<p class="mute">No folders yet.</p>';
    }
    $("#pjList").addEventListener("click", (e) => {
      const fs = store.get("tlw-trade-projects", []);
      const a = e.target.closest("[data-pj-add]"), r = e.target.closest("[data-pj-rm]");
      if (a) addAll(fs[+a.dataset.pjAdd].items, `from ${fs[+a.dataset.pjAdd].name} added to your bag`);
      if (r) { fs.splice(+r.dataset.pjRm, 1); store.set("tlw-trade-projects", fs); projects(); }
    });
    $("#pjForm").addEventListener("submit", (e) => { e.preventDefault(); const nm = $("#pjName").value.trim(); if (!nm) return; const fs = store.get("tlw-trade-projects", null) || seedProjects(); fs.unshift({ name: nm, date: new Date().toISOString(), items: [] }); store.set("tlw-trade-projects", fs); $("#pjName").value = ""; T.toast(`<span>📁 Folder <b>${esc(nm)}</b> created</span>`); projects(); });

    // application
    $("#apForm").addEventListener("submit", (e) => {
      e.preventDefault(); const f = e.target; $("#apErr").textContent = "";
      if (!validate($$("input,select,textarea", f))) return;
      const ref = "TRD-" + rnd5();
      $("#apOkBox").innerHTML = `<span class="eyebrow">Application received · ${ref}</span><h3 class="mt-s">Welcome to the trade, ${esc($("#apName").value.split(" ")[0])}.</h3><p>We'll review <b style="color:var(--head)">${esc($("#apCo").value)}</b> and email <b style="color:var(--head)">${esc($("#apEmail").value)}</b>, usually within two working days. Once approved, your dedicated rep will call to set up your account.</p><p class="demo-note" style="margin:0">Demo form: nothing was sent</p>`;
      f.hidden = true; $("#apOkBox").classList.add("show"); $("#apOkBox").focus(); T.track("trade_application", { type: $("#apType").value, volume: $("#apVol").value });
    });

    T.ready(() => {
      const hero = T.find("Fabrica 4 Light");
      if (hero) { $("#tdImg").src = hero.i[0]; $("#tdImg").alt = hero.n; $("#tdSku").textContent = "SKU " + hero.sku; }
      specList(""); sheet(hero || T.products[0]); projects();
    });
  }

  /* ======================================================================
     PROMOTIONS
     ====================================================================== */
  function promotions() {
    const end = new Date(D.blackFriday).getTime();
    const u = {}; $$("[data-u]").forEach((b) => u[b.dataset.u] = b);
    const pad = (n) => String(n).padStart(2, "0");
    function tick() {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      u.d.textContent = pad(Math.floor(s / 86400)); u.h.textContent = pad(Math.floor(s % 86400 / 3600)); u.m.textContent = pad(Math.floor(s % 3600 / 60)); u.s.textContent = pad(s % 60);
      if (!s) { $("#pmEye").textContent = "Black Friday is live"; $("#pmWhen").textContent = "The doors are open. Shop the deals below."; return false; }
      return true;
    }
    if (tick()) { const iv = setInterval(() => { if (!tick()) clearInterval(iv); }, 1000); }
    $("#pmCount").setAttribute("aria-label", `Black Friday starts ${new Date(end).toLocaleString("en-ZA", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`);

    const OFF = [15, 20, 25, 30, 40];
    const off = (p) => T.isSale(p) ? Math.round((1 - p.p / p.r) * 100) : OFF[p.id % 5];
    const KEYS = ["indoor", "outdoor", "fans", "globes", "switches"];

    T.ready((all) => {
      const glass = all.filter((p) => p.c.includes("Glass Pendants") && p.i.length);
      const fa = glass[0] || all[0], fb = T.find("Belmont Black Outdoor Wall Lantern") || glass[1] || all[1];
      if (fa) { $("#pmFloatA").src = fa.i[0]; } if (fb) { $("#pmFloatB").src = fb.i[0]; }

      $("#pmNav").innerHTML = KEYS.map((k) => `<a class="chip" href="#deal-${k}">${esc(D.cats[k].name)}</a>`).join("") + `<a class="chip" href="#fans">Summer Fan Sale</a><span class="demo-note">Preview — final prices on the day</span>`;
      $("#pmRows").innerHTML = KEYS.map((k, i) => {
        const list = all.filter((p) => p.t === k && p.st && p.i.length).sort((a, b) => (b.rc - a.rc) || (T.isSale(b) - T.isSale(a)) || (b.p - a.p)).slice(0, 4);
        const max = Math.max(...list.map(off));
        return `<div class="pm-row" id="deal-${k}"><div class="lbl"><span class="idx" aria-hidden="true">0${i + 1}</span><h2 data-lines>${esc(D.cats[k].name.replace("&", "&amp;"))}</h2><p>${D.cats[k].intro}</p><span class="upto">Up to ${max}% off</span><a class="link-u" href="shop.html?cat=${k}">See all ${esc(D.cats[k].name)} →</a></div>
          <div class="pm-deals" data-stagger>${list.map((p) => { const o = off(p); return `<article class="pm-deal">
            <a href="${T.pUrl(p)}" class="sv-pool" aria-label="${esc(p.n)}"><img src="${esc(p.i[0])}" alt="${esc(p.n)}" loading="lazy"></a>
            <span class="pm-off" aria-label="${o}% off on Black Friday, indicative">${o}%<small>OFF</small></span>
            <h3><a href="${T.pUrl(p)}">${esc(p.n)}</a></h3>
            <div class="row-b"><span class="price">${money(p.p)}${T.isSale(p) ? `<s>${money(p.r)}</s>` : ""}</span><button class="icon-btn" data-wish="${p.id}" aria-pressed="${T.wish.has(p.id)}" aria-label="Save ${esc(p.n)} for Friday">${T.I.heart}</button></div>
            <span class="pre">${T.isSale(p) ? "On sale now" : "Today's price · indicative discount"}</span>
            <button class="btn sm ghost" data-add="${p.id}">Add to bag</button></article>`; }).join("")}</div></div>`;
      }).join("");

      const fans = all.filter((p) => p.t === "fans" && p.i.length);
      const hero = T.find("Sussurro Led 3 Blade Black") || fans[0];
      const rest = fans.filter((p) => p !== hero && p.st).slice(0, 9);
      $("#pmFans").innerHTML = hero ? `<div class="pm-hero-fan"><a href="${T.pUrl(hero)}" class="sv-pool"><img src="${esc(hero.i[0])}" alt="${esc(hero.n)}"></a><span class="pm-off" style="top:4%;right:4%" aria-label="${off(hero)}% off on the day, indicative">${off(hero)}%<small>OFF</small></span>
          <span class="eyebrow mt-m" style="display:inline-flex">Fan of the summer</span><h3>${esc(hero.n)}</h3><p>${esc((D.ranges.find((r) => r.id === hero.rg) || {}).story || hero.d.slice(0, 160))}</p>
          <div class="flex"><span class="price">${money(hero.p)}</span><button class="btn" data-add="${hero.id}">Add to bag</button><a class="btn ghost" href="${T.pUrl(hero)}">View</a></div></div>
        <ol class="pm-flist" data-stagger>${rest.map((p, i) => `<li><span class="i">${String(i + 1).padStart(2, "0")}</span>${pool(p)}<span><b><a href="${T.pUrl(p)}">${esc(p.n)}</a></b><small>${esc(p.sp && p.sp.Colour ? p.sp.Colour : (p.rg || "Ceiling fan"))} · up to ${off(p)}% off on the day</small></span>
          <span class="end"><span class="price">${money(p.p)}</span><button class="btn sm ghost" data-add="${p.id}">Add</button></span></li>`).join("")}</ol>` : "";
      T.reveal(document.body); T.magnetic(document.body);

      if ("IntersectionObserver" in window) {
        const chips = $$("#pmNav a");
        const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) chips.forEach((c) => c.classList.toggle("on", c.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
        $$(".pm-row, #fans").forEach((r) => io.observe(r));
      }
    });
  }

  /* ======================================================================
     PRIVACY
     ====================================================================== */
  function privacy() {
    $("#pvCookie").addEventListener("click", () => { try { localStorage.removeItem("tlw-cookie"); } catch (e) { } const c = $("#cookie"); c && c.classList.add("show"); c && $("button", c).focus(); });
    if ("IntersectionObserver" in window) {
      const links = $$("#pvToc a");
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-25% 0px -65% 0px" });
      $$(".pv-art section").forEach((s) => io.observe(s));
    }
    const h = location.hash.slice(1); if (h) setTimeout(() => scrollToEl(document.getElementById(h)), 300);
  }

  /* ======================================================================
     404
     ====================================================================== */
  function notFound() {
    T.track("page_not_found", { path: location.pathname + location.search });
    const g = $("#nfGlobe"), hint = $("#nfHint");
    g.addEventListener("click", () => {
      const fixed = g.classList.toggle("fixed"); T.sound.click();
      hint.textContent = fixed ? "Fixed. If only every globe was this easy." : "Tap the globe to fix it";
      g.setAttribute("aria-label", fixed ? "Filament globe, glowing steadily. Press to let it flicker" : "Flickering filament globe. Press to fix it");
    });
    T.ready(() => {
      const p = T.find("St64 Led Decorative Filament");
      if (!p) return;
      $("#nfImg").src = p.i[0];
      $("#nfGlobeName").innerHTML = `Pictured: the <a href="${T.pUrl(p)}" style="color:var(--amber)">${esc(p.n)}</a>, ${money(p.p)}. A new globe costs less than you'd think.`;
    });
  }

  ({ checkout, track, account, contact, trade, promotions, privacy, 404: notFound })[page]?.();
})();
