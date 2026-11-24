/* Static site data: stores, ranges, rooms, guides. Store details from lightingwarehouse.co.za/stores (Nov 2026).
   Coordinates are approximate and should be checked before launch. */
window.TLW_DATA = {
  phone: "011 201 2600",
  phoneHref: "tel:+27112012600",
  whatsapp: "082 338 0490",
  waHref: "https://wa.me/27823380490",
  email: "info@lightingwarehouse.co.za",
  freeShip: 500,
  // Google Maps JavaScript API key (restrict it to your domain). Empty = keyless embed without bulb markers.
  googleMapsKey: "",
  blackFriday: "2026-11-27T00:00:00+02:00",
  stores: [
    { id: "umhlanga", name: "uMhlanga", isNew: true, addr: "9 Tetford Circle, Millenium Bridge Business Park, uMhlanga", region: "KwaZulu-Natal", manager: "Zanele Dlamini", phone: "(031) 940 0068", email: "umhlanga@lightingwarehouse.co.za", sun: "9:00 – 14:00", lat: -29.7268, lng: 31.0705, img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/Website-BedroomLighting-03.jpg" },
    { id: "menlyn", name: "Menlyn", addr: "Cnr Garsfontein & January Masilela Drive, Waterkloof Glen, Menlyn", region: "Pretoria", manager: "Graeme Bezuidenhout", phone: "(012) 348 7974", email: "menlyn@lightingwarehouse.co.za", sun: "9:00 – 14:00", lat: -25.7876, lng: 28.2842 },
    { id: "randburg", name: "Randburg", addr: "Randview Business Park, Malibongwe Drive, Randburg (opp. Home Affairs)", region: "Johannesburg", manager: "Ceejay Baloyi", phone: "(011) 792 9344", email: "randburg@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -26.0873, lng: 27.9805 },
    { id: "wilgeheuwel", name: "Wilgeheuwel", addr: "Cnr Hendrik Potgieter & Nic Diederichs Blvd, Lifestyle Crossing, Wilgeheuwel", region: "Johannesburg West", manager: "Jeffrey Managa", phone: "(011) 679 2820", email: "strubens@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -26.1046, lng: 27.8968 },
    { id: "fourways", name: "Fourways", addr: "Fourways Blvd (opposite Fourways Mall), Fourways, Sandton", region: "Johannesburg North", manager: "Lucky Mthethwa", phone: "(011) 467 8005", email: "fourways@lightingwarehouse.co.za", sun: "9:00 – 14:00", lat: -26.0165, lng: 28.0072 },
    { id: "centurion", name: "Centurion", addr: "Cnr John Vorster Drive & Heuwel Str, Centurion", region: "Centurion", manager: "Norman Makhubela", phone: "(012) 663 2527", email: "centurion@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -25.8561, lng: 28.1834 },
    { id: "boksburg", name: "Boksburg", addr: "145 North Rand Rd, Cnr Goodman, Beyers Park, Boksburg", region: "East Rand", manager: "Nyree Snyman", phone: "(011) 918 7803", email: "boksburg@lightingwarehouse.co.za", sun: "9:00 – 14:00", lat: -26.1925, lng: 28.2689 },
    { id: "edenvale", name: "Edenvale", addr: "Cnr Herman & Van Riebeeck Ave, Edenvale", region: "East Rand", manager: "Lufuno Netshidzivhani", phone: "(011) 454 6520", email: "edenvale@lightingwarehouse.co.za", sun: "9:00 – 14:00", lat: -26.1452, lng: 28.1529 },
    { id: "sandton", name: "Sandton", addr: "214 Katherine Street, Sandton", region: "Johannesburg North", manager: "Saiesh Ramsaroop", phone: "(011) 444 6949", email: "sandton@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -26.0957, lng: 28.0748 },
    { id: "zambezi", name: "Zambezi", addr: "Cnr Veronica & Sefako Makgatho Roads, Metro Lifestyle Centre, Montana", region: "Pretoria North", manager: "Jennifer Van Niekerk", phone: "(012) 543 1612", email: "zambezi@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -25.6862, lng: 28.2618 },
    { id: "alberton", name: "Alberton", addr: "Cnr Swartkoppies & Heidelberg Roads, Lemon Tree Centre, Newmarket, Alberton", region: "South", manager: "Richard Mthembu", phone: "(011) 436 0279", email: "alberton@lightingwarehouse.co.za", sun: "9:00 – 13:00", lat: -26.2806, lng: 28.1297 },
    { id: "roodepoort", name: "Roodepoort", addr: "Princess Crossing, Ontdekkers Road, Roodepoort", region: "Johannesburg West", manager: "Gary Brown", phone: "(011) 768 4121", email: "roodepoort@lightingwarehouse.co.za", sun: "Closed", lat: -26.1478, lng: 27.8652 }
  ],
  // Mon–Fri 8:30–17:00, Sat 9:00–15:00 at every store; Sunday varies (sun field)
  cats: {
    indoor: { name: "Indoor", intro: "Pendants, chandeliers and lamps chosen to make a room feel finished the moment you switch them on.", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/04-ShopGlass.jpg",
      subs: ["Glass Pendants", "Modern Pendants", "Industrial Pendants", "Natural Pendants", "Luxe Pendants", "Ceiling Lighting", "Indoor Wall Lighting", "Spotlights", "Floor Lamps", "Table Lamps", "Bathroom Lighting", "LED Panels and Down Lights", "LED Linear Lighting"] },
    outdoor: { name: "Outdoor", intro: "Wall lights, lanterns and solar pieces built for Highveld storms and coastal air.", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-outdoor.jpg",
      subs: ["Outdoor Modern Wall Lights", "Solar Lighting", "Solar Motion Sensors", "LED Flood Lights", "Outdoor Pole Lighting", "Baskets &amp; Sphere Lighting"] },
    fans: { name: "Fans", intro: "Quiet DC motors, warm LED lights and blades in wood, black and white. Summer, handled.", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-fans.jpg",
      subs: ["Fans with Lights", "Fans without Lights", "Wall and Standing Fans"] },
    globes: { name: "Globes", intro: "Filament, LED, GU10 and load-shedding globes. The right fitting, the right warmth.", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/1-1.jpg",
      subs: ["LED Decorative Filament Globes", "LED Globes", "Globe Packs", "Loadshedding Globes", "GU10", "LED Strip Lights"] },
    switches: { name: "Switches & Plugs", intro: "Veti, Legrand, Lesco and Qwikswitch. The small details you touch every day.", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/Tris.jpg",
      subs: ["Veti 3", "Legrand Ysalis", "Legrand Arteor", "Lesco", "Qwikswitch", "Multi Plugs"] }
  },
  ranges: [
    { id: "Fabrica", mood: ["Industrial", "Warm metal", "Wood"], story: "Black steel bars and timber caps. Fabrica brings a workshop honesty to kitchens and dining tables, with light that falls exactly where you work and eat." },
    { id: "Trax", mood: ["Architectural", "Linear", "Outdoor"], story: "A single line of light along a wall. Trax washes facades up and down in warm white and turns a plain entrance into architecture." },
    { id: "Marzio", mood: ["Soft", "Sculptural", "Living room"], story: "Rounded shades on slender stems. Marzio table and floor lamps throw a low, generous glow, the kind of light you read and talk under." },
    { id: "Riviera", mood: ["Natural", "Coastal", "Timber"], story: "Turned timber and soft fabric for homes that open onto the garden or the sea. Riviera feels like a long summer evening." },
    { id: "Trinity", mood: ["Quiet", "Wood blades", "LED"], story: "Three light-wood blades on a silent DC motor with an integrated LED. Trinity moves air without making a sound about it." },
    { id: "Sussurro", mood: ["Whisper-quiet", "Three blades", "Dimmable LED"], story: "Sussurro means whisper. A 3-blade LED ceiling fan in black, white, dark or light wood, with a warm light ring that dims for the evening." }
  ],
  rooms: [
    { id: "lounge", name: "Lounge", match: ["Lounge", "Living"] },
    { id: "kitchen", name: "Kitchen", match: ["Kitchen"] },
    { id: "dining", name: "Dining", match: ["Dining"] },
    { id: "bedroom", name: "Bedroom", match: ["Bedroom"] },
    { id: "bathroom", name: "Bathroom", match: ["Bathroom"] },
    { id: "office", name: "Home Office", match: ["Study", "Office"] },
    { id: "patio", name: "Patio", match: ["Patio", "Outdoor"] },
    { id: "garden", name: "Garden", match: ["Garden"] },
    { id: "garage", name: "Garage", match: ["Garage", "Passage", "Entrance"] }
  ],
  guides: [
    { slug: "ceiling-fan", title: "How to choose a ceiling fan", kicker: "Fans", read: "6 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-fans.jpg", q: "fan" },
    { slug: "kitchen", title: "Kitchen lighting that works as hard as you do", kicker: "Kitchen", read: "5 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-industrial.jpg", q: "kitchen pendant" },
    { slug: "dining", title: "Hanging dining room pendants at the right height", kicker: "Dining", read: "4 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/04-ShopGlass.jpg", q: "glass pendant" },
    { slug: "garden", title: "Garden lighting ideas for long summer evenings", kicker: "Outdoor", read: "7 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-outdoor.jpg", q: "outdoor" },
    { slug: "load-shedding", title: "The load-shedding survival guide", kicker: "Power", read: "8 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-solar.jpg", q: "loadshedding" },
    { slug: "trends", title: "Lighting trends for 2027: woven, smoked glass and warm brass", kicker: "Trends", read: "5 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/03-ShopWoven.jpg", q: "woven" },
    { slug: "dark-room", title: "How to brighten a dark room", kicker: "Advice", read: "4 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/Website-BedroomLighting-03.jpg", q: "led ceiling" },
    { slug: "picture-lights", title: "Picture lights and accent lighting", kicker: "Accent", read: "3 min", img: "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-modern.jpg", q: "wall light" }
  ],
  lifestyle: [
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/Website-BedroomLighting-03.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2026/03/Gemini_Generated_Image_naas.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2026/06/Shop-Dublin.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/03-ShopWoven.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/04-ShopGlass.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-modern.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-industrial.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/Shop-fabrica.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-wood.jpg",
    "https://lightingwarehouse.co.za/wp-content/uploads/2025/12/shop-solar.jpg"
  ]
};
