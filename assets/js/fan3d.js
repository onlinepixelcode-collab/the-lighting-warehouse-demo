// Procedural 3D ceiling fan (Three.js) — Sussurro-style 3-blade LED fan.
// Mounts into any element with [data-fan3d] or #fanStage. Exposes window.TLWFan.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function woodTexture(base, dark) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 64; const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 70; i++) { g.strokeStyle = dark; g.globalAlpha = Math.random() * 0.25 + 0.05; g.lineWidth = Math.random() * 2 + 0.5; g.beginPath(); const y = Math.random() * 64; g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const FINISHES = {
  black: { blade: { color: 0x1c1c1e, roughness: 0.45, metalness: 0.2 }, body: 0x18181a },
  white: { blade: { color: 0xf1efe9, roughness: 0.55, metalness: 0.05 }, body: 0xeeece6 },
  dark: { blade: { map: () => woodTexture("#5b3b22", "#2a170a"), roughness: 0.6, metalness: 0 }, body: 0x1a1a1c },
  light: { blade: { map: () => woodTexture("#c9a376", "#8a6338"), roughness: 0.6, metalness: 0 }, body: 0xeeece6 }
};

function mount(host) {
  if (!host || host.dataset.fanMounted) return null; host.dataset.fanMounted = 1;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, -1.6, 6.4); camera.lookAt(0, 0.1, 0);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1a1410, 0.9));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2a93b, 0.8); rim.position.set(-4, -2, -3); scene.add(rim);

  const fan = new THREE.Group(); scene.add(fan); fan.rotation.x = 0.32;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.35, metalness: 0.5 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 24), bodyMat); rod.position.y = 1.05; fan.add(rod);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.14, 48), bodyMat); canopy.position.y = 1.72; fan.add(canopy);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.32, 64), bodyMat); motor.position.y = 0.3; fan.add(motor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.025, 12, 64), new THREE.MeshStandardMaterial({ color: 0xc9a96e, metalness: 0.9, roughness: 0.25 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.14; fan.add(ring);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffc46e, emissiveIntensity: 2.2, roughness: 0.3 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 64), lightMat); disc.position.y = 0.12; fan.add(disc);
  const bulb = new THREE.PointLight(0xffc46e, 6, 6, 1.6); bulb.position.y = -0.2; fan.add(bulb);
  // halo sprite
  const hc = document.createElement("canvas"); hc.width = hc.height = 128; const hg = hc.getContext("2d"); const grd = hg.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, "rgba(255,226,170,1)"); grd.addColorStop(0.3, "rgba(242,169,59,.45)"); grd.addColorStop(1, "rgba(242,169,59,0)"); hg.fillStyle = grd; hg.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(3.2, 3.2, 1); halo.position.y = -0.05; fan.add(halo);

  // blades
  const rotor = new THREE.Group(); rotor.position.y = 0.3; fan.add(rotor);
  const shape = new THREE.Shape(); shape.moveTo(0.45, -0.1); shape.bezierCurveTo(1.2, -0.22, 2.1, -0.28, 2.55, -0.08); shape.bezierCurveTo(2.7, 0.02, 2.6, 0.16, 2.4, 0.18); shape.bezierCurveTo(1.8, 0.2, 1.1, 0.18, 0.45, 0.1); shape.lineTo(0.45, -0.1);
  const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2, curveSegments: 24 });
  bladeGeo.rotateX(Math.PI / 2); bladeGeo.computeVertexNormals();
  let bladeMat = new THREE.MeshStandardMaterial(FINISHES.black.blade);
  const blades = [0, 1, 2].map((i) => { const b = new THREE.Mesh(bladeGeo, bladeMat); const piv = new THREE.Group(); b.rotation.x = 0.14; piv.rotation.y = i * Math.PI * 2 / 3; piv.add(b); rotor.add(piv); return b; });

  function setFinish(name) {
    const f = FINISHES[name] || FINISHES.black; const opts = Object.assign({}, f.blade); if (typeof opts.map === "function") opts.map = opts.map();
    bladeMat.dispose(); bladeMat = new THREE.MeshStandardMaterial(opts); blades.forEach((b) => b.material = bladeMat); bodyMat.color.setHex(f.body);
  }
  let lightOn = true, glow = 1;
  function setLight(on) { lightOn = on; }

  // drag to rotate
  let rx = 0, ry = 0, tx = 0, ty = 0, drag = null;
  host.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; drag = { x: e.clientX, y: e.clientY, ty, tx }; host.setPointerCapture(e.pointerId); });
  host.addEventListener("pointermove", (e) => { if (!drag) return; ty = drag.ty + (e.clientX - drag.x) * 0.008; tx = Math.max(-0.5, Math.min(0.6, drag.tx + (e.clientY - drag.y) * 0.004)); });
  host.addEventListener("pointerup", () => drag = null);

  function size() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.position.z = r.width < 600 ? 8 : 6.4; camera.updateProjectionMatrix(); }
  size(); addEventListener("resize", size);
  let visible = true; new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(host);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop); if (!visible) return; const dt = Math.min(0.05, clock.getDelta());
    rotor.rotation.y += dt * (reduced ? 0.3 : 1.6);
    if (!drag) ty += dt * 0.08; ry += (ty - ry) * 0.08; rx += (tx - rx) * 0.08; fan.rotation.y = ry; fan.rotation.x = 0.32 + rx;
    glow += ((lightOn ? 1 : 0) - glow) * 0.12; lightMat.emissiveIntensity = 0.05 + glow * 2.2; bulb.intensity = glow * 6; halo.material.opacity = glow;
    renderer.render(scene, camera);
  })();
  return { setFinish, setLight };
}

const host = document.querySelector("[data-fan3d], #fanStage");
const api = mount(host);
if (api) window.TLWFan = api;
