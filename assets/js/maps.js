/* TLW store map: a real Google Map with a glowing light bulb marking every store.
   Needs a Google Maps JavaScript API key in TLW_DATA.googleMapsKey (assets/js/data-static.js).
   Without a key it falls back to the keyless Google Maps embed (no custom markers possible there). */
(function () {
  "use strict";
  const D = window.TLW_DATA;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const q = (s) => encodeURIComponent("The Lighting Warehouse " + s.name + ", " + s.addr);
  const dirUrl = (s) => `https://www.google.com/maps/dir/?api=1&destination=${q(s)}`;

  // glowing bulb marker (amber light, brass cap)
  function bulbIcon(active) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs><radialGradient id="g"><stop offset="0" stop-color="#fff3d6"/><stop offset=".35" stop-color="#ffc46e" stop-opacity=".9"/><stop offset="1" stop-color="#f2a93b" stop-opacity="0"/></radialGradient>
      <linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#7a5a26"/><stop offset=".5" stop-color="#e3c385"/><stop offset="1" stop-color="#6b4f22"/></linearGradient></defs>
      <circle cx="32" cy="27" r="${active ? 30 : 24}" fill="url(#g)"/>
      <path d="M32 11c-7.7 0-13 5.6-13 12.6 0 4.6 2.6 7.6 4.7 10.2 1.4 1.7 2.3 3.4 2.3 5.2h12c0-1.8.9-3.5 2.3-5.2 2.1-2.6 4.7-5.6 4.7-10.2C45 16.6 39.7 11 32 11Z" fill="#fff8e8" stroke="#f2a93b" stroke-width="1.4"/>
      <path d="M28 33l2-6 2 4 2-4 2 6" fill="none" stroke="#f2a93b" stroke-width="1.3"/>
      <rect x="26" y="40" width="12" height="9" rx="2" fill="url(#b)"/><path d="M26 43.5h12M26 46h12" stroke="#5a421d" stroke-width=".8"/>
    </svg>`;
    const s = active ? 58 : 46;
    return { url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg), scaledSize: new google.maps.Size(s, s), anchor: new google.maps.Point(s / 2, s * .78) };
  }
  // warm night style that matches the site
  const NIGHT = [
    { elementType: "geometry", stylers: [{ color: "#141416" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9a8f7c" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0b" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3a3326" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#24221f" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b3427" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#17171a" }] }
  ];

  let apiPromise = null;
  function loadApi() {
    if (window.google && google.maps) return Promise.resolve();
    if (!apiPromise) apiPromise = new Promise((res, rej) => {
      window.__tlwMapsReady = res;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(D.googleMapsKey)}&callback=__tlwMapsReady&loading=async`;
      s.async = true; s.onerror = rej; document.head.appendChild(s);
    });
    return apiPromise;
  }

  function mount(el, opts) {
    opts = opts || {}; const stores = D.stores; let api = { select() { }, nearest() { } };
    if (!D.googleMapsKey) { // keyless fallback: Google embed of the selected store
      el.innerHTML = `<iframe title="Google Map of The Lighting Warehouse stores" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="https://maps.google.com/maps?q=The%20Lighting%20Warehouse&ll=-26.1,28.05&z=10&output=embed"></iframe>`;
      const fr = el.querySelector("iframe");
      api.select = (id) => { const s = stores.find((x) => x.id === id); if (!s) return; fr.style.opacity = 0; setTimeout(() => { fr.src = `https://maps.google.com/maps?q=${q(s)}&z=15&output=embed`; }, 200); fr.onload = () => fr.style.opacity = 1; };
      return api;
    }
    el.innerHTML = ""; el.classList.add("gm-live");
    let pending = null; api.select = (id) => { pending = id; }; // queue a selection until the map is ready
    loadApi().then(() => {
      const light = document.documentElement.dataset.theme === "light";
      const map = new google.maps.Map(el, { center: { lat: -26.1, lng: 28.05 }, zoom: 9, styles: [], disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", backgroundColor: "#141416" });
      const info = new google.maps.InfoWindow();
      const markers = {};
      stores.forEach((s) => {
        const m = new google.maps.Marker({ position: { lat: s.lat, lng: s.lng }, map, title: "The Lighting Warehouse " + s.name, icon: bulbIcon(false), optimized: false });
        m.addListener("click", () => api.select(s.id));
        markers[s.id] = m;
      });
      const b = new google.maps.LatLngBounds(); stores.filter((s) => s.id !== "umhlanga").forEach((s) => b.extend({ lat: s.lat, lng: s.lng })); map.fitBounds(b, 40);
      
      let active = null;
      api.select = (id) => {
        const s = stores.find((x) => x.id === id); if (!s) return;
        if (active) markers[active].setIcon(bulbIcon(false)); active = id; markers[id].setIcon(bulbIcon(true));
        map.panTo({ lat: s.lat, lng: s.lng }); map.setZoom(14);
        info.setContent(`<div style="font:14px Manrope,sans-serif;color:#1b1712;max-width:240px"><b style="font:500 20px 'Cormorant Garamond',serif;display:block">${esc(s.name)}${s.isNew ? " · New" : ""}</b>${esc(s.addr)}<br>${esc(s.phone)}<br>Mon–Fri 8:30–17:00 · Sat 9:00–15:00 · Sun ${esc(s.sun)}<br><a href="${dirUrl(s)}" target="_blank" rel="noopener" style="color:#b06a10;font-weight:600">Get directions →</a></div>`);
        info.open({ map, anchor: markers[id] });
        opts.onSelect && opts.onSelect(id);
      };
      if (pending) api.select(pending);
    }).catch(() => { el.classList.remove("gm-live"); D.googleMapsKey = ""; Object.assign(api, mount(el, opts)); if (pending) api.select(pending); });
    return api;
  }

  window.TLWMap = { mount, directions: dirUrl };
})();
