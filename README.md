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
