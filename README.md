# Zuri Hotels & Resorts — zuriplaceresort.com

Full revamp of the Zuri Place Resort website, migrated **off WordPress** onto a
fast, dependency-free static site with a post-modern editorial redesign and a
built-in booking flow.

## What changed

| Before (WordPress) | After (this repo) |
| --- | --- |
| WP + Hotale theme + TourMaster plugin, jQuery, ~40 render-blocking assets | Hand-written HTML/CSS/vanilla JS, 3 files of code, zero dependencies |
| Server, PHP, database, plugin updates required | Static files — host anywhere (GitHub Pages, Netlify, Cloudflare Pages, any web server) |
| Hacked blog full of casino spam posts | Clean journal content |
| Legacy booking plugin with account system | Lightweight 4-step booking flow that hands off to WhatsApp / email, with a local price summary |

## Design

- **Theme kept**: the mint-green Zuri brush logo, the gold accent from the old
  Hotale theme, and all original photography, copy, room names and KES pricing.
- **Post-modern editorial look**: oversized Fraunces serif display type with
  italic accents, Space Grotesk body, bento location grid, marquee tickers,
  rotating stamps, ghost typography, film-grain overlay, scroll-reveal
  micro-interactions.
- **Trending principles addressed**: dark-mode-first with a light theme toggle,
  glassmorphic sticky nav, `prefers-reduced-motion` support, semantic HTML +
  ARIA, lazy-loaded imagery, mobile-first responsive layout, skip links,
  system-native date pickers.

## Structure

```
index.html            Home — hero, booking bar, locations bento, rooms, dining, journal
rooms.html            All 9 room categories with filters + featured suite
restaurant.html       Zuri Place Restaurant & Sports Lounge, Kanduyi
resort.html           Zuri Poa / Zuri Resort, Makutano
safari.html           Zuri Eden Safari Hotel, Malaba Uganda
contact.html          Contacts (Kenya + Uganda) and message form
assets/css/main.css   Design system (tokens, components, themes)
assets/js/main.js     Nav, theme, reveals, counters, lightbox
assets/js/booking.js  Room data + 4-step booking engine (WhatsApp/email hand-off)
assets/img/           Curated photography from the original site
```

## Deployment

### Railway (primary — serves zuriplaceresort.com)

The site ships as a tiny [Caddy](https://caddyserver.com) container
(`Dockerfile` + `Caddyfile`) so Railway can build and serve it with no build
step and no runtime dependencies. Caddy binds to Railway's `$PORT`, serves the
static files from `/srv`, gzips/zstd-compresses responses, and resolves clean
URLs (`/rooms` → `rooms.html`).

**One-time setup on Railway:**

1. **New Project → Deploy from GitHub repo →** pick `simboni/zuriplace`.
   Railway reads `railway.json` and builds with the `Dockerfile` automatically.
2. Once the first deploy is green, open **Settings → Networking → Generate
   Domain** to get a `*.up.railway.app` URL (smoke-test it).
3. **Custom domain:** Settings → Networking → **Custom Domain** →
   `zuriplaceresort.com` (add `www` too). Railway shows a CNAME target —
   create that CNAME at your DNS provider (for an apex/root domain, use the
   provider's ALIAS/ANAME or flattened-CNAME record). TLS is issued
   automatically once DNS resolves.

Every push to the deployed branch triggers a fresh Railway build, so the live
site stays in sync with the repo.

Run the container locally the same way Railway does:

```bash
docker build -t zuri-site .
docker run --rm -e PORT=8080 -p 8080:8080 zuri-site
# → http://localhost:8080
```

### GitHub Pages (free fallback / staging)

`.github/workflows/deploy.yml` also publishes to a `gh-pages` branch on every
push. To use it, go to **Settings → Pages → Build and deployment**, set
*Source* to **Deploy from a branch** and pick **`gh-pages` / (root)**; the site
then serves at <https://simboni.github.io/zuriplace/>. Keep it as a free staging
mirror, or delete `.github/workflows/deploy.yml` if you only want Railway.

## Run locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Booking flow

Rooms and prices live in `assets/js/booking.js` (`ROOMS` / `LOCATIONS`).
Guests pick dates → property → room → guests, see a per-night price summary,
and confirm via WhatsApp (+254 720 351 045) or email
(info@zuriplaceresort.com) with a fully pre-filled itinerary. A copy of each
request is kept in the browser's localStorage.
