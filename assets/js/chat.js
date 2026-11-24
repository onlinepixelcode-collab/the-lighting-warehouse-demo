/* TLW Light Assistant — chat panel.
   Live mode: streams from /api/chat (Claude, grounded in the real catalogue).
   Quick-answer mode: if the API is unavailable, a built-in rules engine answers from the same catalogue. */
(function () {
  "use strict";
  const T = window.TLW, D = window.TLW_DATA; if (!T) return;
  const { $, esc, money, I } = T;
  const ENDPOINT = window.TLW_CHAT_ENDPOINT || "api/chat";
  let mode = "checking"; // live | quick
  const history = []; // {role, content}
  let busy = false, built = false;

  const css = `
  .chat{position:fixed;right:clamp(12px,2vw,28px);bottom:clamp(12px,2vw,28px);z-index:99;width:min(430px,calc(100vw - 24px));height:min(680px,calc(100vh - 40px));display:flex;flex-direction:column;border-radius:26px;overflow:hidden;
    background:rgba(14,14,15,.86);backdrop-filter:blur(26px) saturate(1.3);-webkit-backdrop-filter:blur(26px) saturate(1.3);border:1px solid rgba(168, 140, 94,.35);box-shadow:0 40px 120px -30px rgba(0,0,0,.9),0 0 80px -30px rgba(200, 164, 106,.45);
    transform:translateY(24px) scale(.96);opacity:0;visibility:hidden;transition:transform .6s var(--ease),opacity .5s,visibility .5s;color:#d9d3c7}
  [data-theme="light"] .chat{background:rgba(246, 244, 240,.92);color:#3d3428;border-color:rgba(120, 104, 78,.35)}
  .chat.open{transform:none;opacity:1;visibility:visible}
  @media (max-width:640px){.chat{inset:0;width:100%;height:100%;border-radius:0;right:0;bottom:0}}
  .chat-h{display:flex;align-items:center;gap:12px;padding:16px 16px 14px 18px;border-bottom:1px solid rgba(168, 140, 94,.22)}
  .chat-h .orb{width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fff1cf,#c8a46a 50%,#9b5a10);box-shadow:0 0 22px rgba(200, 164, 106,.6);display:grid;place-items:center;color:#1a1206;flex:none}
  .chat-h .orb svg{width:20px;height:20px}
  .chat-h b{display:block;font-family:var(--f-display);font-size:22px;font-weight:500;color:var(--head);line-height:1}
  .chat-h small{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
  .chat-h small i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#58c27d;margin-right:6px;box-shadow:0 0 8px #58c27d}
  .chat-h small.quick i{background:var(--amber);box-shadow:0 0 8px var(--amber)}
  .chat-b{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;scroll-behavior:smooth}
  .msg{max-width:88%;padding:12px 15px;border-radius:18px;font-size:15px;line-height:1.55;animation:tin .5s var(--ease) both;word-wrap:break-word}
  .msg.bot{align-self:flex-start;background:rgba(168, 140, 94,.09);border:1px solid rgba(168, 140, 94,.18);border-bottom-left-radius:6px;color:var(--head)}
  .msg.me{align-self:flex-end;background:linear-gradient(135deg,#c8a46a,#d98d1f);color:#1a1206;border-bottom-right-radius:6px;font-weight:500}
  .msg.me img{max-width:160px;border-radius:12px;margin-bottom:6px}
  .msg p{margin:0 0 .6em}.msg p:last-child{margin:0}.msg ul{margin:.3em 0 .6em;padding-left:1.1em}.msg li{margin:.2em 0}
  .msg strong{color:var(--amber);font-weight:600}.msg.me strong{color:#1a1206}
  .msg a{color:var(--amber);text-decoration:underline}
  .typing{display:inline-flex;gap:5px;padding:4px 2px}.typing i{width:7px;height:7px;border-radius:50%;background:var(--amber);animation:blink 1.2s infinite}.typing i:nth-child(2){animation-delay:.2s}.typing i:nth-child(3){animation-delay:.4s}
  @keyframes blink{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1);box-shadow:0 0 8px var(--amber)}}
  .cprods{display:grid;gap:8px;align-self:stretch}
  .cprod{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;padding:8px;border-radius:16px;border:1px solid rgba(168, 140, 94,.22);background:rgba(10,10,11,.35);animation:tin .5s var(--ease) both}
  [data-theme="light"] .cprod{background:rgba(255,255,255,.6)}
  .cprod .th{width:62px;height:62px;border-radius:12px;background:#fff;display:grid;place-items:center;overflow:hidden}.cprod .th img{width:88%;height:88%;object-fit:contain}
  .cprod b{display:block;font-size:13.5px;font-weight:600;color:var(--head);line-height:1.3}.cprod span{font-size:13px;color:var(--gold)}
  .cprod button{min-height:40px;padding:0 14px;border-radius:999px;background:var(--amber);color: var(--accent-ink);font-size:12px;font-weight:700;letter-spacing:.06em}
  .cprod button:hover{box-shadow:0 0 18px rgba(200, 164, 106,.6)}
  .cact{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(168, 140, 94,.4);color:var(--head);font-size:14px}
  .cact.wa{background:#1f8f4e;border-color:#1f8f4e;color:#fff}
  .cact svg{width:18px;height:18px}
  .chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
  .chips button{min-height:36px;padding:0 13px;border-radius:999px;border:1px solid rgba(168, 140, 94,.35);font-size:13px;color:var(--head);transition:all .3s}
  .chips button:hover{border-color:var(--amber);color:var(--amber);background:rgba(200, 164, 106,.1)}
  .chat-f{padding:10px 12px 14px;border-top:1px solid rgba(168, 140, 94,.22)}
  .chat-f form{display:flex;gap:6px;align-items:flex-end;background:rgba(168, 140, 94,.07);border:1px solid rgba(168, 140, 94,.25);border-radius:20px;padding:6px}
  .chat-f textarea{flex:1;min-width:0;resize:none;border:0;background:none;outline:0;color:var(--head);font-size:16px;padding:9px 8px;max-height:120px;line-height:1.4}
  .chat-f .send{width:42px;height:42px;border-radius:50%;background:var(--amber);color: var(--accent-ink);display:grid;place-items:center;flex:none}
  .chat-f .send:disabled{opacity:.4}
  .chat-f .up{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--gold);cursor:pointer;flex:none}
  .chat-f .up svg,.chat-f .send svg{width:20px;height:20px}
  .chat-f .mic{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--gold);flex:none;transition:all .3s}
  .chat-f .mic svg{width:20px;height:20px}
  .chat-f .mic:hover{color:var(--head)}
  .chat-f .mic.on{color:var(--accent-ink);background:var(--amber);animation:micp 1.2s ease-in-out infinite}
  @keyframes micp{50%{box-shadow:0 0 0 8px rgba(255,255,255,.15)}}
  .chat-f .prev{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:12px;color:var(--gold)}.chat-f .prev img{width:44px;height:44px;object-fit:cover;border-radius:10px}`;

  function build() {
    if (built) return; built = true;
    document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
    document.body.insertAdjacentHTML("beforeend", `<section class="chat" id="chat" role="dialog" aria-modal="false" aria-label="TLW Light Assistant">
      <div class="chat-h"><span class="orb">${I.spark}</span><div style="flex:1"><b>TLW Light Assistant</b></div>
        <a class="icon-btn" href="${D.waHref}" target="_blank" rel="noopener" aria-label="Chat to a TLW expert on WhatsApp" title="Chat to a TLW expert">${I.wa}</a>
        <button class="icon-btn" id="crestart" aria-label="Restart chat" title="Restart chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg></button><button class="icon-btn" id="cclose" aria-label="Close assistant">${I.close}</button></div>
      <div class="chat-b" id="cbody" aria-live="polite"></div>
      <div class="chips" id="cchips"></div>
      <div class="chat-f"><div id="cprev"></div><form id="cform"><label class="up" aria-label="Upload a photo of a globe or light">${I.camera}<input type="file" accept="image/*" id="cfile" hidden></label>
        <label for="cin" class="sr-only">Message</label><textarea id="cin" rows="1" placeholder="Ask about lights, globes, fans…"></textarea>
        <button class="mic" type="button" id="cmic" aria-label="Speak your question" aria-pressed="false">${I.mic}</button><button class="send" type="submit" aria-label="Send">${I.arrow}</button></form></div></section>`);
    $("#cclose").addEventListener("click", close);
    $("#crestart").addEventListener("click", restart);
    $("#cform").addEventListener("submit", (e) => { e.preventDefault(); submit(); });
    const ta = $("#cin");
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } });
    ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; });
    $("#cfile").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) attach(f); e.target.value = ""; });
    // voice input (Web Speech API, South African English)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $("#cmic"); let rec = null;
    mic.addEventListener("click", () => {
      if (!SR) { T.toast("<span>Voice input isn't supported in this browser. Try Chrome or Safari.</span>"); return; }
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = "en-ZA"; rec.interimResults = true; rec.maxAlternatives = 1;
      mic.classList.add("on"); mic.setAttribute("aria-pressed", "true"); let finalText = "";
      rec.onresult = (e) => { let t = ""; for (const r of e.results) { t += r[0].transcript; if (r.isFinal) finalText = t; } ta.value = t; ta.dispatchEvent(new Event("input")); };
      rec.onerror = () => {};
      rec.onend = () => { mic.classList.remove("on"); mic.setAttribute("aria-pressed", "false"); rec = null; if ((finalText || ta.value).trim()) submit(); T.track("ai_chat_voice", {}); };
      rec.start();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#chat").classList.contains("open")) close(); });
    bot("Hi! I'm your TLW lighting expert. What room are we lighting today?");
    chips(["Help me choose a light", "Find the right globe", "Pick a ceiling fan", "Load-shedding options", "Track my order", "Find a store"]);
    fetch("api/status").then((r) => r.ok ? r.json() : { live: false }).then((s) => setMode(s.live ? "live" : "quick")).catch(() => setMode("quick"));
  }
  function restart() {
    if (busy) return; history.length = 0; pendingImage = null; $("#cprev").innerHTML = ""; $("#cin").value = ""; body().innerHTML = "";
    bot("Hi! I'm your TLW lighting expert. What room are we lighting today?");
    chips(["Help me choose a light", "Find the right globe", "Pick a ceiling fan", "Load-shedding options", "Track my order", "Find a store"]);
    T.track("ai_chat_restart", {}); $("#cin").focus();
  }
  function setMode(m) { mode = m; const el = $("#cmode"); if (!el) return; el.className = m === "quick" ? "quick" : "";  }
  function open() { build(); $("#chat").classList.add("open"); setTimeout(() => $("#cin").focus(), 200); T.track("ai_chat_open", {}); T.lenis && T.lenis.stop(); }
  function close() { $("#chat").classList.remove("open"); T.lenis && T.lenis.start(); }

  /* ---------- rendering ---------- */
  function md(s) {
    const lines = esc(s).split("\n"); let out = "", inList = false;
    lines.forEach((l) => {
      const li = l.match(/^\s*[-*•]\s+(.*)/);
      if (li) { if (!inList) { out += "<ul>"; inList = true; } out += `<li>${inline(li[1])}</li>`; return; }
      if (inList) { out += "</ul>"; inList = false; }
      if (l.trim()) out += `<p>${inline(l)}</p>`;
    });
    if (inList) out += "</ul>"; return out;
  }
  function inline(s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(((?:https?:\/\/|[a-z]+\.html)[^)\s]*)\)/g, '<a href="$2">$1</a>'); }
  const body = () => $("#cbody");
  const scroll = () => { const b = body(); b.scrollTop = b.scrollHeight; };
  function bot(text) { const d = document.createElement("div"); d.className = "msg bot"; d.innerHTML = md(text); body().appendChild(d); scroll(); return d; }
  function me(text, imgUrl) { const d = document.createElement("div"); d.className = "msg me"; d.innerHTML = (imgUrl ? `<img src="${imgUrl}" alt="Uploaded photo">` : "") + esc(text); body().appendChild(d); scroll(); }
  function chips(list) { const c = $("#cchips"); c.innerHTML = list.map((x) => `<button type="button">${esc(x)}</button>`).join(""); c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => send(b.textContent))); }
  function prods(ids) {
    const ps = ids.map((id) => T.get(+id)).filter(Boolean).slice(0, 4); if (!ps.length) return;
    const w = document.createElement("div"); w.className = "cprods";
    w.innerHTML = ps.map((p) => `<div class="cprod"><a class="th" href="${T.pUrl(p)}"><img src="${esc(T.thumb(T.img(p)))}" alt=""></a><a href="${T.pUrl(p)}"><b>${esc(p.n)}</b><span>${money(p.p)}</span></a><button data-add="${p.id}">Add</button></div>`).join("");
    body().appendChild(w); scroll();
  }
  function action(kind, arg) {
    const a = document.createElement("a"); a.className = "cact";
    if (kind === "whatsapp") { a.className += " wa"; a.href = D.waHref; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = `${I.wa} Chat to a TLW expert`; }
    else if (kind === "planner") { a.href = "planner.html"; a.innerHTML = `${I.spark} Plan my whole room`; }
    else if (kind === "store") { const s = D.stores.find((x) => x.id === arg); if (!s) return; a.href = `stores.html#${s.id}`; a.innerHTML = `${I.pin} ${esc(s.name)} · ${esc(s.phone)}`; }
    else if (kind === "track") { a.href = "track.html"; a.innerHTML = `${I.bag} Track my order`; }
    body().appendChild(a); scroll();
  }
  // Split model output into text + [[tags]]
  function renderReply(el, full, final) {
    const tags = []; const text = full.replace(/\[\[(product|store|whatsapp|planner|track)(?::([\w-]+))?\]\]/g, (m, k, v) => { tags.push([k, v]); return ""; })
      .replace(/\[\[[^\]]*$/, ""); // hide a half-streamed tag
    el.innerHTML = md(text.trim()) || '<span class="typing"><i></i><i></i><i></i></span>';
    if (final) { const pids = tags.filter((t) => t[0] === "product").map((t) => t[1]); prods(pids); tags.filter((t) => t[0] !== "product").forEach((t) => action(t[0], t[1])); }
    scroll();
  }

  /* ---------- image attach (resized client-side) ---------- */
  let pendingImage = null;
  function attach(file) {
    const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => {
      const s = Math.min(1, 1024 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      pendingImage = c.toDataURL("image/jpeg", 0.85); $("#cprev").innerHTML = `<div class="prev"><img src="${pendingImage}" alt=""> Photo attached · <button type="button" id="cprevx" style="text-decoration:underline">remove</button></div>`; $("#cprevx").onclick = () => { pendingImage = null; $("#cprev").innerHTML = ""; };
    }; im.src = r.result; }; r.readAsDataURL(file);
  }

  /* ---------- send ---------- */
  function submit() { const ta = $("#cin"); const v = ta.value.trim(); if (!v && !pendingImage) return; ta.value = ""; ta.style.height = "auto"; send(v || "What is this and what should I buy to replace it?"); }
  async function send(text) {
    if (busy) return; busy = true; $("#cchips").innerHTML = "";
    const image = pendingImage; pendingImage = null; $("#cprev").innerHTML = "";
    me(text, image); history.push({ role: "user", content: text }); T.track("ai_chat_message", { mode });
    const el = bot(""); el.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    await new Promise((r) => T.ready(r));
    const context = history.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join(" ");
    const candidates = T.search(text, 12).items.concat(T.search(context, 8).items).map((p) => p.id).filter((v, i, a) => a.indexOf(v) === i).slice(0, 18);
    let reply = "";
    if (mode !== "quick") {
      try {
        const res = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, candidates, image }) });
        if (res.status === 503) throw new Error("offline");
        if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "http " + res.status); }
        const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true }); const parts = buf.split("\n\n"); buf = parts.pop();
          for (const part of parts) { const line = part.replace(/^data: /, ""); if (!line) continue; const ev = JSON.parse(line);
            if (ev.t) { reply += ev.t; renderReply(el, reply, false); }
            if (ev.error) throw new Error(ev.error); }
        }
        renderReply(el, reply, true);
      } catch (err) {
        if (err.message === "offline" || err instanceof TypeError) { setMode("quick"); reply = quick(text, !!image); renderReply(el, reply, true); }
        else { reply = err.message || "Sorry, something went wrong."; renderReply(el, reply + "\n[[whatsapp]]", true); }
      }
    } else { await new Promise((r) => setTimeout(r, 450)); reply = quick(text, !!image); renderReply(el, reply, true); }
    history.push({ role: "assistant", content: reply.slice(0, 2000) }); busy = false;
  }

  /* ---------- quick-answer mode (no API) ---------- */
  const tags = (ps) => ps.filter((p, i, a) => p && a.findIndex((x) => x && x.n === p.n) === i).slice(0, 3).map((p) => `[[product:${p.id}]]`).join("\n");
  let awaiting = null;
  function quick(q, hasImage) {
    const s = q.toLowerCase();
    if (hasImage) return "Thanks for the photo! I can't analyse images in quick-answer mode, but here's how to match a globe yourself:\n- **Cap**: big screw = E27, small screw = E14, push-and-twist pins = B22, two short pins = GU10\n- **Shape**: pear (A60), golf ball (G45), long filament (ST64)\n- Check the old wattage and pick an LED with similar lumens.\nTell me the cap and shape and I'll find it, or send the photo to a TLW expert:\n[[whatsapp]]";
    if (awaiting === "fan") { const m = s.match(/(\d+(?:[.,]\d+)?)/); if (m) { awaiting = null; return fanAdvice(parseFloat(m[1].replace(",", "."))); } }
    if (/track|order|deliver(y|ed)? status|where is my/.test(s)) return "You can track any order with your order number and email, no login needed. You'll also get email and WhatsApp updates at every step. If something arrived damaged, use Report a problem on the same page.\n[[track]]\n[[whatsapp]]";
    if (/store|branch|near|hours|open|directions/.test(s)) { const st = D.stores.find((x) => s.includes(x.name.toLowerCase())); if (st) return `Our **${st.name}** store is at ${st.addr}. Open Mon–Fri 8:30–17:00, Sat 9:00–15:00, Sun ${st.sun}. Call ${st.phone}.\n[[store:${st.id}]]`; return `We have ${D.stores.length} stores across Gauteng and KwaZulu-Natal, including our new uMhlanga store. All open Mon–Fri 8:30–17:00 and Sat 9:00–15:00. Which area are you in?\n[[store:umhlanga]]\n[[store:fourways]]`; }
    if (/fan/.test(s)) { awaiting = "fan"; const fans = T.inCat("Fans with Lights").sort((a, b) => b.p - a.p); return "Great choice for summer. How big is the room in m²? (Length × width, e.g. 4 × 5 = 20 m².) Meanwhile, these are our quietest DC fans with dimmable LED lights:\n" + tags([T.find("Sussurro Led 3 Blade Black"), T.find("Trinity Led"), T.find("Svolta Led 3 Blade")].filter(Boolean).concat(fans)); }
    if (/load ?shed|power|solar|emergency|recharge|backup/.test(s)) { const spec = T.search(q, 6).items; const r = spec.length ? spec : T.search("loadshedding emergency", 6).items; const so = spec.length ? spec.slice(1) : T.search("solar", 4).items; return "Stay lit when the grid goes dark:\n- **Emergency globes** fit a normal E27/B22 socket, charge while the power is on and run for up to 6 hours when it's off.\n- **Solar lights** charge in the sun all day, no wiring needed.\n- **Solar motion sensors** keep entrances lit and safe.\n" + tags([r[0], r[1], so[0]].filter(Boolean)); }
    if (/globe|bulb|e27|e14|b22|gu10|filament|fitting|lumen|watt|kelvin|warm white|daylight/.test(s)) {
      if (/lumen|watt/.test(s) && !/e27|e14|b22|gu10/.test(s)) return "**Watts** measure power used, **lumens** measure light. LEDs give about 80–100 lumens per watt, so a 9W LED gives roughly the light of an old 60W globe. A lounge needs about 100–150 lumens per m², a kitchen 300–400. Want me to work out a room?\n[[planner]]";
      if (/warm|kelvin|daylight|cool/.test(s)) return "**Warm white (2700–3000K)** is soft and golden, best for lounges and bedrooms. **Cool white (4000K)** suits kitchens and garages. **Daylight (6500K)** is crisp and blue-ish, good for work areas. Most homes feel best in warm white.";
      const r = T.search(q, 3).items; return "Let's find your globe. Check the old one:\n- **Cap**: E27 (big screw), E14 (small screw), B22 (bayonet), GU10 (two pins)\n- **Shape**: A60 pear, G45 golf ball, ST64 filament\n- **Colour**: warm white for living areas, daylight for task areas\nTell me those three, or upload a photo with the camera button. Popular picks:\n" + tags(r.length ? r : T.inCat("LED Decorative Filament Globes", 3));
    }
    if (/ip ?\d\d|bathroom|outdoor|garden|patio/.test(s) && /ip|rating|wet|rain/.test(s)) return "**IP ratings** tell you how sealed a light is. The first digit is dust, the second is water. **IP44** handles splashes (bathrooms, covered patios). **IP65** handles rain from any angle (exposed walls, gardens). **IP67/68** can sit in puddles or water.";
    if (/choose|help|recommend|light for|lighting for|room|lounge|kitchen|dining|bedroom|bathroom|office|patio|garden|pendant|chandelier|lamp|wall light|ceiling/.test(s)) {
      const r = T.search(q, 6).items; if (r.length && !/^help me choose a light$/.test(s.trim())) return `Here are a few I'd look at for that. Tell me your budget or style (modern, industrial, natural, luxe) and I'll narrow it down.\n${tags(r)}\n[[planner]]`;
      return "Lovely, let's light it up. Which room is it (lounge, kitchen, dining, bedroom, bathroom, patio), and what style do you like: modern, industrial, natural or luxe? A rough budget helps too.";
    }
    const r = T.search(q, 3).items; if (r.length) return `Here's what I found in our range:\n${tags(r)}\nWant me to narrow it down by room or budget?`;
    return "I'm best with lighting questions: choosing lights, globes, fans, load-shedding and stores. For anything else, a TLW expert is a message away.\n[[whatsapp]]";
  }
  function fanAdvice(m2) {
    const size = m2 <= 10 ? "about 90–107 cm" : m2 <= 20 ? "about 110–132 cm" : "132 cm or larger (or two fans in long rooms)";
    const fans = T.inCat("Fans with Lights").sort((a, b) => a.p - b.p);
    const pick = m2 <= 10 ? fans.slice(0, 3) : m2 <= 20 ? [T.find("Sussurro Led 3 Blade Black"), T.find("Svolta Led 3 Blade"), T.find("Trinity Led")].filter(Boolean) : [T.find("Phantom Led 8 Blade"), T.find("Sussurro Led 3 Blade Dark Wood"), fans[fans.length - 1]].filter(Boolean);
    return `For **${m2} m²** you want a blade span of **${size}**. Hang it so the blades sit at least 2.1 m above the floor and 30 cm from the ceiling. These suit that room:\n${tags(pick)}`;
  }

  window.TLWChat = { open, close, send: (t) => { open(); send(t); }, sendImage: (f, t) => { open(); attach(f); setTimeout(() => send(t), 300); } };
})();
