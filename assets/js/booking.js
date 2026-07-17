/* ZURI HOTELS — booking engine
   Client-side booking flow: dates → property → room → guests → confirm.
   Requests are handed off to reservations via WhatsApp / email with a
   pre-filled itinerary; a copy is kept locally under "My stays". */
(function () {
  "use strict";

  const WHATSAPP = "254720351045";
  const EMAIL = "info@zuriplaceresort.com";

  const LOCATIONS = [
    { id: "kanduyi", name: "Zuri Place Sports Lounge & Restaurant — Kanduyi", short: "Kanduyi, Bungoma" },
    { id: "resort", name: "Zuri Resort — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "poa", name: "Zuri Poa — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "poa-airbnb", name: "Zuri Poa Airbnb — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "annex", name: "Zuri Annex — Malaba, Uganda", short: "Malaba, Uganda" },
    { id: "eden", name: "Zuri Eden Safari Hotel — Uganda", short: "Malaba, Uganda" },
  ];

  const ROOMS = [
    { id: "whitehouse", name: "Executive Whitehouse Suite", price: 6000, beds: "1 king bed", guests: 2, loc: "kanduyi", img: "room-whitehouse.jpeg" },
    { id: "presidential", name: "Presidential Suite", price: 6000, beds: "2 king beds", guests: 4, loc: "kanduyi", img: "room-presidential.jpeg" },
    { id: "diplomat", name: "Diplomat Suite", price: 5000, beds: "1 king bed", guests: 2, loc: "resort", img: "room-diplomat.jpeg" },
    { id: "runda", name: "Runda Category", price: 4000, beds: "2 king beds", guests: 4, loc: "resort", img: "room-runda.jpeg" },
    { id: "airbnb", name: "Zuri Airbnb", price: 3500, beds: "1 king bed", guests: 2, loc: "poa-airbnb", img: "room-airbnb.jpeg" },
    { id: "junior", name: "Junior Suite", price: 3000, beds: "1 bed", guests: 2, loc: "poa", img: "room-junior.jpeg" },
    { id: "poa-airbnb-room", name: "Zuri Poa Airbnb", price: 3000, beds: "1 king bed", guests: 2, loc: "poa-airbnb", img: "room-poa-airbnb.jpeg" },
    { id: "art", name: "Art Room", price: 3000, beds: "1 king bed", guests: 2, loc: "eden", img: "room-art.jpeg" },
    { id: "executive", name: "Executive Suite", price: 2500, beds: "1 bed", guests: 1, loc: "kanduyi", img: "room-executive.jpeg" },
  ];

  const fmt = (n) => "KES " + n.toLocaleString("en-KE");
  const locById = (id) => LOCATIONS.find((l) => l.id === id);
  const roomById = (id) => ROOMS.find((r) => r.id === id);

  // Path prefix so pages in subfolders could work too (all flat here).
  const IMG = "assets/img/";

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const plusDays = (iso, d) => {
    const dt = new Date(iso + "T12:00:00");
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };
  const nightsBetween = (a, b) =>
    Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
  const prettyDate = (iso) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });

  /* ---------- State ---------- */
  const state = {
    step: 0,
    checkin: todayISO(),
    checkout: plusDays(todayISO(), 1),
    locId: "",
    roomId: "",
    adults: 2,
    children: 0,
    name: "",
    phone: "",
  };

  /* ---------- Modal scaffold ---------- */
  const overlay = document.createElement("div");
  overlay.className = "bk-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Book your stay");
  overlay.innerHTML = `
    <div class="bk-modal">
      <button class="bk-close" aria-label="Close booking">×</button>
      <div class="bk-steps" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </div>
      <div class="bk-content"></div>
    </div>`;
  document.body.appendChild(overlay);

  const content = overlay.querySelector(".bk-content");
  const stepBars = overlay.querySelectorAll(".bk-steps i");

  const close = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  overlay.querySelector(".bk-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  function open(opts = {}) {
    Object.assign(state, opts);
    if (opts.roomId) {
      const r = roomById(opts.roomId);
      if (r) state.locId = r.loc;
    }
    state.step = opts.step ?? 0;
    render();
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* ---------- Steps ---------- */
  function render() {
    stepBars.forEach((b, i) => b.classList.toggle("on", i <= state.step));
    const steps = [renderStay, renderRoom, renderGuests, renderConfirm];
    content.innerHTML = "";
    steps[state.step]();
    content.querySelector("input, select, button")?.focus({ preventScroll: true });
  }

  const nav = (back, nextLabel, canNext, onNext) => `
    <div class="bk-actions">
      ${back ? '<button class="btn btn-ghost" data-back>← Back</button>' : ""}
      <button class="btn btn-mint" data-next ${canNext ? "" : "disabled"}>${nextLabel}</button>
    </div>`;

  function wireNav(onNext) {
    content.querySelector("[data-back]")?.addEventListener("click", () => {
      state.step--;
      render();
    });
    content.querySelector("[data-next]")?.addEventListener("click", onNext);
  }

  /* Step 1 — dates + property */
  function renderStay() {
    content.innerHTML = `
      <h2>Plan your <span class="serif-i">stay</span></h2>
      <p class="sub">Pick your dates and the Zuri property you'd like to stay at.</p>
      <div class="bk-body">
        <div class="field">
          <label for="bk-in">Check in</label>
          <input type="date" id="bk-in" min="${todayISO()}" value="${state.checkin}">
        </div>
        <div class="field">
          <label for="bk-out">Check out</label>
          <input type="date" id="bk-out" min="${plusDays(state.checkin, 1)}" value="${state.checkout}">
        </div>
        <div class="field">
          <label for="bk-loc">Property</label>
          <select id="bk-loc">
            <option value="">Any property</option>
            ${LOCATIONS.map((l) => `<option value="${l.id}" ${state.locId === l.id ? "selected" : ""}>${l.name}</option>`).join("")}
          </select>
        </div>
      </div>
      ${nav(false, "Choose a room →", true)}`;

    const inEl = content.querySelector("#bk-in");
    const outEl = content.querySelector("#bk-out");
    inEl.addEventListener("change", () => {
      state.checkin = inEl.value || todayISO();
      if (state.checkout <= state.checkin) state.checkout = plusDays(state.checkin, 1);
      outEl.min = plusDays(state.checkin, 1);
      outEl.value = state.checkout;
    });
    outEl.addEventListener("change", () => {
      state.checkout = outEl.value;
      if (state.checkout <= state.checkin) {
        state.checkout = plusDays(state.checkin, 1);
        outEl.value = state.checkout;
      }
    });
    content.querySelector("#bk-loc").addEventListener("change", (e) => {
      state.locId = e.target.value;
      if (state.roomId && roomById(state.roomId).loc !== state.locId && state.locId) state.roomId = "";
    });
    wireNav(() => {
      state.step = 1;
      render();
    });
  }

  /* Step 2 — room */
  function renderRoom() {
    const pool = state.locId ? ROOMS.filter((r) => r.loc === state.locId) : ROOMS;
    const list = pool.length ? pool : ROOMS;
    content.innerHTML = `
      <h2>Choose your <span class="serif-i">room</span></h2>
      <p class="sub">${state.locId ? locById(state.locId).name : "All properties"} · ${prettyDate(state.checkin)} → ${prettyDate(state.checkout)}</p>
      <div class="bk-body">
        ${list.map((r) => `
          <button class="bk-room-pick ${state.roomId === r.id ? "sel" : ""}" data-room="${r.id}">
            <img src="${IMG}${r.img}" alt="" loading="lazy">
            <span>
              <span class="t">${r.name}</span><br>
              <span class="d">${r.beds} · sleeps ${r.guests} · ${locById(r.loc).short}</span>
            </span>
            <span class="p">${fmt(r.price)}<small>/n</small></span>
          </button>`).join("")}
      </div>
      ${nav(true, "Guests →", !!state.roomId)}`;

    content.querySelectorAll("[data-room]").forEach((b) =>
      b.addEventListener("click", () => {
        state.roomId = b.dataset.room;
        state.locId = roomById(state.roomId).loc;
        render();
      })
    );
    wireNav(() => {
      if (!state.roomId) return;
      state.step = 2;
      render();
    });
  }

  /* Step 3 — guests + contact */
  function renderGuests() {
    content.innerHTML = `
      <h2>Who's <span class="serif-i">coming?</span></h2>
      <p class="sub">Tell us about your party so we can have everything ready.</p>
      <div class="bk-body">
        <div class="counter-row">
          <span class="lbl">Adults <small>13 years +</small></span>
          <div class="counter">
            <button data-c="adults" data-d="-1" aria-label="Fewer adults">−</button>
            <output id="c-adults">${state.adults}</output>
            <button data-c="adults" data-d="1" aria-label="More adults">+</button>
          </div>
        </div>
        <div class="counter-row">
          <span class="lbl">Children <small>2 – 12 years</small></span>
          <div class="counter">
            <button data-c="children" data-d="-1" aria-label="Fewer children">−</button>
            <output id="c-children">${state.children}</output>
            <button data-c="children" data-d="1" aria-label="More children">+</button>
          </div>
        </div>
        <div class="field">
          <label for="bk-name">Full name</label>
          <input type="text" id="bk-name" autocomplete="name" placeholder="Jane Wanjala" value="${state.name}">
        </div>
        <div class="field">
          <label for="bk-phone">Phone / WhatsApp</label>
          <input type="tel" id="bk-phone" autocomplete="tel" placeholder="+254 7…" value="${state.phone}">
        </div>
      </div>
      ${nav(true, "Review booking →", true)}`;

    content.querySelectorAll("[data-c]").forEach((b) =>
      b.addEventListener("click", () => {
        const k = b.dataset.c;
        const min = k === "adults" ? 1 : 0;
        state[k] = Math.min(9, Math.max(min, state[k] + Number(b.dataset.d)));
        content.querySelector("#c-" + k).textContent = state[k];
      })
    );
    content.querySelector("#bk-name").addEventListener("input", (e) => (state.name = e.target.value));
    content.querySelector("#bk-phone").addEventListener("input", (e) => (state.phone = e.target.value));
    wireNav(() => {
      state.step = 3;
      render();
    });
  }

  /* Step 4 — summary + hand-off */
  function renderConfirm() {
    const room = roomById(state.roomId);
    const nights = nightsBetween(state.checkin, state.checkout);
    const total = nights * room.price;

    content.innerHTML = `
      <h2>Review &amp; <span class="serif-i">confirm</span></h2>
      <p class="sub">Send your request — our reservations desk confirms within minutes, 24/7.</p>
      <div class="bk-body">
        <div class="bk-summary">
          <div class="row"><span>Property</span><strong>${locById(room.loc).name}</strong></div>
          <div class="row"><span>Room</span><strong>${room.name}</strong></div>
          <div class="row"><span>Check in</span><strong>${prettyDate(state.checkin)}</strong></div>
          <div class="row"><span>Check out</span><strong>${prettyDate(state.checkout)}</strong></div>
          <div class="row"><span>Guests</span><strong>${state.adults} adult${state.adults > 1 ? "s" : ""}${state.children ? `, ${state.children} child${state.children > 1 ? "ren" : ""}` : ""}</strong></div>
          <div class="row"><span>${nights} night${nights > 1 ? "s" : ""} × ${fmt(room.price)}</span><strong>${fmt(total)}</strong></div>
          <div class="row total"><span>Total</span><strong>${fmt(total)}</strong></div>
        </div>
      </div>
      <div class="bk-actions">
        <button class="btn btn-ghost" data-back>← Back</button>
        <button class="btn btn-mint" data-send-wa>Book via WhatsApp</button>
      </div>
      <div class="bk-actions">
        <button class="btn btn-ghost" data-send-mail>✉ Book via email instead</button>
      </div>
      <p class="bk-note">No prepayment needed to request — pay on confirmation. Free cancellation up to 24 h before check-in.</p>`;

    const message = [
      "Hello Zuri Hotels 👋 I'd like to book:",
      "",
      `🏨 ${locById(room.loc).name}`,
      `🛏 ${room.name} (${room.beds})`,
      `📅 ${prettyDate(state.checkin)} → ${prettyDate(state.checkout)} (${nights} night${nights > 1 ? "s" : ""})`,
      `👥 ${state.adults} adult(s)${state.children ? ", " + state.children + " child(ren)" : ""}`,
      `💰 Total: ${fmt(total)}`,
      state.name ? `🙋 Name: ${state.name}` : "",
      state.phone ? `📞 Phone: ${state.phone}` : "",
    ].filter(Boolean).join("\n");

    const save = (via) => {
      try {
        const stays = JSON.parse(localStorage.getItem("zuri-stays") || "[]");
        stays.push({
          room: room.name, loc: locById(room.loc).name,
          checkin: state.checkin, checkout: state.checkout,
          adults: state.adults, children: state.children,
          total, via, at: new Date().toISOString(),
        });
        localStorage.setItem("zuri-stays", JSON.stringify(stays));
      } catch (_) { /* private mode — fine */ }
    };

    content.querySelector("[data-back]").addEventListener("click", () => {
      state.step = 2;
      render();
    });
    content.querySelector("[data-send-wa]").addEventListener("click", () => {
      save("whatsapp");
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      renderSuccess();
    });
    content.querySelector("[data-send-mail]").addEventListener("click", () => {
      save("email");
      const subject = `Booking request — ${room.name}, ${prettyDate(state.checkin)}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      renderSuccess();
    });
  }

  function renderSuccess() {
    stepBars.forEach((b) => b.classList.add("on"));
    content.innerHTML = `
      <div class="bk-success">
        <div class="mark">✓</div>
        <h2>Request <span class="serif-i">sent</span></h2>
        <p class="sub mt-1">Asante sana! Our reservations desk is on it — you'll hear from us shortly to confirm your stay.</p>
        <div class="bk-actions mt-2">
          <button class="btn btn-mint" data-done>Done</button>
        </div>
      </div>`;
    content.querySelector("[data-done]").addEventListener("click", close);
  }

  /* ---------- Public wiring ---------- */

  // Any [data-book] button opens the flow; optional data-room preselects.
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault();
    open(t.dataset.room ? { roomId: t.dataset.room, step: 1 } : {});
  });

  // Booking bar (homepage) feeds straight into step 2.
  const bar = document.querySelector("[data-booking-bar]");
  if (bar) {
    const inEl = bar.querySelector("[name=checkin]");
    const outEl = bar.querySelector("[name=checkout]");
    if (inEl) {
      inEl.min = todayISO();
      inEl.value = state.checkin;
      outEl.min = plusDays(state.checkin, 1);
      outEl.value = state.checkout;
      inEl.addEventListener("change", () => {
        outEl.min = plusDays(inEl.value || todayISO(), 1);
        if (outEl.value <= inEl.value) outEl.value = plusDays(inEl.value, 1);
      });
    }
    bar.addEventListener("submit", (ev) => {
      ev.preventDefault();
      open({
        checkin: inEl.value || todayISO(),
        checkout: outEl.value || plusDays(inEl.value || todayISO(), 1),
        locId: bar.querySelector("[name=location]").value,
        adults: Number(bar.querySelector("[name=guests]").value || 2),
        step: 1,
      });
    });
  }

  // Render room cards into any [data-rooms-grid] (limit / filters supported).
  document.querySelectorAll("[data-rooms-grid]").forEach((grid) => {
    const limit = Number(grid.dataset.limit || 0);
    const locFilter = grid.dataset.loc || "";

    const draw = (filterLoc, sort) => {
      let pool = ROOMS.slice();
      if (filterLoc) pool = pool.filter((r) => r.loc === filterLoc);
      if (sort === "low") pool.sort((a, b) => a.price - b.price);
      if (sort === "high") pool.sort((a, b) => b.price - a.price);
      if (limit) pool = pool.slice(0, limit);
      grid.innerHTML = pool.map((r, i) => `
        <article class="room-card reveal in" style="--rd:${(i % 3) * 0.08}s">
          <div class="room-media">
            <img src="${IMG}${r.img}" alt="${r.name}" loading="lazy" width="700" height="450">
            <span class="room-price">from <strong>${fmt(r.price)}</strong>/night</span>
            <span class="room-loc">${locById(r.loc).short}</span>
          </div>
          <div class="room-body">
            <h3>${r.name}</h3>
            <div class="room-specs">
              <span>🛏 ${r.beds}</span>
              <span>👤 Sleeps ${r.guests}</span>
            </div>
            <div class="room-foot">
              <span class="from">per night<strong>${fmt(r.price)}</strong></span>
              <button class="btn btn-mint" data-book data-room="${r.id}">Book now</button>
            </div>
          </div>
        </article>`).join("");
    };

    draw(locFilter, "");

    // Optional filter chips bound to this grid.
    const chips = document.querySelectorAll(`[data-filter-for="${grid.id}"]`);
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        draw(chip.dataset.loc || "", chip.dataset.sort || "");
      })
    );
  });

  window.ZuriBooking = { open };
})();
