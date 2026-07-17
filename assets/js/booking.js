/* ZURI HOTELS — room preview + booking engine
   Flow: click a room → preview its photos & details → Book this room →
         dates → guests → confirm → WhatsApp/email hand-off.
   Generic "Book a stay" buttons open the full flow (dates → room → guests). */
(function () {
  "use strict";

  const WHATSAPP = "254720351045";
  const EMAIL = "info@zuriplaceresort.com";
  const IMG = "assets/img/";

  const LOCATIONS = [
    { id: "kanduyi", name: "Zuri Place Sports Lounge & Restaurant — Kanduyi", short: "Kanduyi, Bungoma" },
    { id: "resort", name: "Zuri Resort — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "poa", name: "Zuri Poa — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "poa-airbnb", name: "Zuri Poa Airbnb — Makutano, Bungoma-Chwele Road", short: "Makutano" },
    { id: "annex", name: "Zuri Annex — Malaba, Uganda", short: "Malaba, Uganda" },
    { id: "eden", name: "Zuri Eden Safari Hotel — Uganda", short: "Malaba, Uganda" },
  ];

  // Each room carries its own photo set (first is the card thumbnail) plus a
  // short description, so the preview reads richly before booking.
  const ROOMS = [
    {
      id: "whitehouse", name: "Executive Whitehouse Suite", price: 6000, beds: "1 king bed", guests: 2, loc: "kanduyi",
      img: "room-whitehouse.jpeg",
      gallery: ["room-whitehouse-large.jpeg", "tuti.jpeg", "interior-warm.jpg", "gallery-1.jpeg"],
      desc: "Our most-requested key. A king bed, a private lounge with tufted chesterfields and room to spread out — the suite that made Zuri Place famous.",
    },
    {
      id: "presidential", name: "Presidential Suite", price: 6000, beds: "2 king beds", guests: 4, loc: "kanduyi",
      img: "room-presidential.jpeg",
      gallery: ["room-presidential.jpeg", "interior-styled.jpg", "gallery-2.jpeg", "ed.jpeg"],
      desc: "Two king beds and space for the whole party. The top of the house at Zuri Place Kanduyi — for when the occasion calls for it.",
    },
    {
      id: "diplomat", name: "Diplomat Suite", price: 5000, beds: "1 king bed", guests: 2, loc: "resort",
      img: "room-diplomat.jpeg",
      gallery: ["room-diplomat.jpeg", "zuri-resort.jpeg", "zuri-day.jpeg", "interior-warm.jpg"],
      desc: "Poised and private at Zuri Resort, Makutano. A king bed, warm finishes and a quiet corner of the grounds to call your own.",
    },
    {
      id: "runda", name: "Runda Category", price: 4000, beds: "2 king beds", guests: 4, loc: "resort",
      img: "room-runda.jpeg",
      gallery: ["room-runda.jpeg", "zuri-resort-2.jpeg", "zuri-day-2.jpeg"],
      desc: "Two king beds for families and groups, steps from the gardens at Zuri Resort, Makutano.",
    },
    {
      id: "airbnb", name: "Zuri Airbnb", price: 3500, beds: "1 king bed", guests: 2, loc: "poa-airbnb",
      img: "room-airbnb.jpeg",
      gallery: ["room-airbnb.jpeg", "interior-warm.jpg", "tuti.jpeg"],
      desc: "A self-contained Zuri apartment for longer stays — your own space, kitted out for comfort.",
    },
    {
      id: "junior", name: "Junior Suite", price: 3000, beds: "1 bed", guests: 2, loc: "poa",
      img: "room-junior.jpeg",
      gallery: ["room-junior.jpeg", "interior-styled.jpg", "gallery-3.jpeg"],
      desc: "Compact, comfortable and easy on the wallet — a restful night at Zuri Poa, Makutano.",
    },
    {
      id: "poa-airbnb-room", name: "Zuri Poa Airbnb", price: 3000, beds: "1 king bed", guests: 2, loc: "poa-airbnb",
      img: "room-poa-airbnb.jpeg",
      gallery: ["room-poa-airbnb.jpeg", "interior-warm.jpg", "zuri-day.jpeg"],
      desc: "Apartment-style living at Zuri Poa Airbnb — a king bed and a place to settle in.",
    },
    {
      id: "art", name: "Art Room", price: 3000, beds: "1 king bed", guests: 2, loc: "eden",
      img: "room-art.jpeg",
      gallery: ["room-art.jpeg", "cottage-1.jpeg", "cottage-3.jpeg"],
      desc: "Characterful and creative, set among the cottages at Zuri Eden Safari, Malaba.",
    },
    {
      id: "executive", name: "Executive Suite", price: 2500, beds: "1 bed", guests: 1, loc: "kanduyi",
      img: "room-executive.jpeg",
      gallery: ["room-executive.jpeg", "interior-styled.jpg", "gallery-4.jpeg"],
      desc: "Smart and simple — the easy choice at Zuri Place Kanduyi, from KES 2,500 a night.",
    },
  ];

  const AMENITIES = ["24/7 room service", "Daily housekeeping", "Ensuite bathroom", "Secure parking"];

  const fmt = (n) => "KES " + n.toLocaleString("en-KE");
  const locById = (id) => LOCATIONS.find((l) => l.id === id);
  const roomById = (id) => ROOMS.find((r) => r.id === id);

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const plusDays = (iso, d) => {
    const dt = new Date(iso + "T12:00:00");
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };
  const nightsBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
  const prettyDate = (iso) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });

  /* ============================================================
     ROOM DETAIL / PREVIEW
     ============================================================ */
  const rdOverlay = document.createElement("div");
  rdOverlay.className = "rd-overlay";
  rdOverlay.setAttribute("role", "dialog");
  rdOverlay.setAttribute("aria-modal", "true");
  rdOverlay.setAttribute("aria-label", "Room preview");
  rdOverlay.innerHTML = '<div class="rd-modal"></div>';
  document.body.appendChild(rdOverlay);
  const rdModal = rdOverlay.querySelector(".rd-modal");

  const closeDetail = () => {
    rdOverlay.classList.remove("open");
    if (!bkOverlay.classList.contains("open")) document.body.style.overflow = "";
  };
  rdOverlay.addEventListener("click", (e) => {
    if (e.target === rdOverlay) closeDetail();
  });

  function openRoomDetail(roomId) {
    const room = roomById(roomId);
    if (!room) return;
    const photos = room.gallery && room.gallery.length ? room.gallery : [room.img];

    rdModal.innerHTML = `
      <button class="rd-close" aria-label="Close preview">×</button>
      <div class="rd-gallery">
        <figure class="rd-main">
          <img src="${IMG}${photos[0]}" alt="${room.name}" id="rd-main-img">
          ${photos.length > 1 ? '<button class="rd-nav rd-prev" aria-label="Previous photo">‹</button><button class="rd-nav rd-next" aria-label="Next photo">›</button>' : ""}
          <span class="rd-count">1 / ${photos.length}</span>
        </figure>
        ${photos.length > 1 ? `<div class="rd-thumbs">${photos
          .map((p, i) => `<button class="rd-thumb ${i === 0 ? "sel" : ""}" data-i="${i}" aria-label="Photo ${i + 1}"><img src="${IMG}${p}" alt=""></button>`)
          .join("")}</div>` : ""}
      </div>
      <div class="rd-info">
        <p class="eyebrow">${locById(room.loc).name}</p>
        <h2 class="display-m">${room.name}</h2>
        <div class="rd-price"><strong>${fmt(room.price)}</strong> <span>/ night</span></div>
        <div class="room-specs rd-specs">
          <span>🛏 ${room.beds}</span>
          <span>👤 Sleeps ${room.guests}</span>
        </div>
        <p class="rd-desc">${room.desc}</p>
        <ul class="rd-amenities">${AMENITIES.map((a) => `<li>${a}</li>`).join("")}</ul>
        <div class="rd-actions">
          <button class="btn btn-mint" data-book-fixed="${room.id}">Book this room <span class="arr">→</span></button>
          <a class="btn btn-ghost" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Zuri Hotels, I'd like to ask about the " + room.name + ".")}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        </div>
      </div>`;

    // Gallery interactions
    let idx = 0;
    const mainImg = rdModal.querySelector("#rd-main-img");
    const countEl = rdModal.querySelector(".rd-count");
    const thumbs = [...rdModal.querySelectorAll(".rd-thumb")];
    const show = (i) => {
      idx = (i + photos.length) % photos.length;
      mainImg.src = IMG + photos[idx];
      if (countEl) countEl.textContent = `${idx + 1} / ${photos.length}`;
      thumbs.forEach((t, ti) => t.classList.toggle("sel", ti === idx));
    };
    thumbs.forEach((t) => t.addEventListener("click", () => show(Number(t.dataset.i))));
    rdModal.querySelector(".rd-prev")?.addEventListener("click", () => show(idx - 1));
    rdModal.querySelector(".rd-next")?.addEventListener("click", () => show(idx + 1));
    rdModal.querySelector(".rd-close").addEventListener("click", closeDetail);
    rdModal.querySelector("[data-book-fixed]").addEventListener("click", () => {
      closeDetail();
      openBooking({ roomId: room.id, fixedRoom: true, step: 0 });
    });

    rdModal.scrollTop = 0;
    rdOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    rdModal.querySelector(".rd-close").focus({ preventScroll: true });
  }

  /* ============================================================
     BOOKING FLOW
     ============================================================ */
  const state = {
    step: 0,
    fixedRoom: false,
    checkin: todayISO(),
    checkout: plusDays(todayISO(), 1),
    locId: "",
    roomId: "",
    adults: 2,
    children: 0,
    name: "",
    phone: "",
  };

  const bkOverlay = document.createElement("div");
  bkOverlay.className = "bk-overlay";
  bkOverlay.setAttribute("role", "dialog");
  bkOverlay.setAttribute("aria-modal", "true");
  bkOverlay.setAttribute("aria-label", "Book your stay");
  bkOverlay.innerHTML = `
    <div class="bk-modal">
      <button class="bk-close" aria-label="Close booking">×</button>
      <div class="bk-steps" aria-hidden="true"></div>
      <div class="bk-content"></div>
    </div>`;
  document.body.appendChild(bkOverlay);

  const content = bkOverlay.querySelector(".bk-content");
  const stepsWrap = bkOverlay.querySelector(".bk-steps");

  const closeBooking = () => {
    bkOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };
  bkOverlay.querySelector(".bk-close").addEventListener("click", closeBooking);
  bkOverlay.addEventListener("click", (e) => {
    if (e.target === bkOverlay) closeBooking();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (rdOverlay.classList.contains("open")) closeDetail();
    else if (bkOverlay.classList.contains("open")) closeBooking();
  });

  function openBooking(opts = {}) {
    Object.assign(state, opts);
    state.fixedRoom = !!opts.fixedRoom;
    if (opts.roomId) {
      const r = roomById(opts.roomId);
      if (r) state.locId = r.loc;
    }
    state.step = opts.step ?? 0;
    render();
    bkOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // Which steps are in play depends on whether the room is already chosen.
  const stepFns = () =>
    state.fixedRoom
      ? [renderStay, renderGuests, renderConfirm]
      : [renderStay, renderRoom, renderGuests, renderConfirm];

  function render() {
    const steps = stepFns();
    state.step = Math.max(0, Math.min(state.step, steps.length - 1));
    stepsWrap.innerHTML = steps.map((_, i) => `<i class="${i <= state.step ? "on" : ""}"></i>`).join("");
    content.innerHTML = "";
    steps[state.step]();
    content.querySelector("input, select, button")?.focus({ preventScroll: true });
  }

  const navButtons = (back, nextLabel, canNext) => `
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

  /* Step — dates + property */
  function renderStay() {
    const fixed = state.fixedRoom ? roomById(state.roomId) : null;
    content.innerHTML = `
      <h2>Plan your <span class="serif-i">stay</span></h2>
      <p class="sub">${fixed ? `${fixed.name} · ${locById(fixed.loc).name}` : "Pick your dates and the Zuri property you'd like to stay at."}</p>
      <div class="bk-body">
        <div class="field">
          <label for="bk-in">Check in</label>
          <input type="date" id="bk-in" min="${todayISO()}" value="${state.checkin}">
        </div>
        <div class="field">
          <label for="bk-out">Check out</label>
          <input type="date" id="bk-out" min="${plusDays(state.checkin, 1)}" value="${state.checkout}">
        </div>
        ${fixed ? "" : `
        <div class="field">
          <label for="bk-loc">Property</label>
          <select id="bk-loc">
            <option value="">Any property</option>
            ${LOCATIONS.map((l) => `<option value="${l.id}" ${state.locId === l.id ? "selected" : ""}>${l.name}</option>`).join("")}
          </select>
        </div>`}
      </div>
      ${navButtons(false, fixed ? "Guests →" : "Choose a room →", true)}`;

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
    content.querySelector("#bk-loc")?.addEventListener("change", (e) => {
      state.locId = e.target.value;
      if (state.roomId && roomById(state.roomId).loc !== state.locId && state.locId) state.roomId = "";
    });
    wireNav(() => {
      state.step++;
      render();
    });
  }

  /* Step — room (skipped when a room is already fixed) */
  function renderRoom() {
    const pool = state.locId ? ROOMS.filter((r) => r.loc === state.locId) : ROOMS;
    const list = pool.length ? pool : ROOMS;
    content.innerHTML = `
      <h2>Choose your <span class="serif-i">room</span></h2>
      <p class="sub">${state.locId ? locById(state.locId).name : "All properties"} · ${prettyDate(state.checkin)} → ${prettyDate(state.checkout)}</p>
      <div class="bk-body">
        ${list.map((r) => `
          <div class="bk-room-pick ${state.roomId === r.id ? "sel" : ""}" data-room="${r.id}" role="button" tabindex="0">
            <img src="${IMG}${r.img}" alt="" loading="lazy">
            <span>
              <span class="t">${r.name}</span><br>
              <span class="d">${r.beds} · sleeps ${r.guests} · ${locById(r.loc).short}</span>
            </span>
            <span class="p">${fmt(r.price)}<small>/n</small></span>
          </div>`).join("")}
      </div>
      ${navButtons(true, "Guests →", !!state.roomId)}`;

    content.querySelectorAll("[data-room]").forEach((b) => {
      const pick = () => {
        state.roomId = b.dataset.room;
        state.locId = roomById(state.roomId).loc;
        render();
      };
      b.addEventListener("click", pick);
      b.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
      });
    });
    wireNav(() => {
      if (!state.roomId) return;
      state.step++;
      render();
    });
  }

  /* Step — guests + contact */
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
      ${navButtons(true, "Review booking →", true)}`;

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
      state.step++;
      render();
    });
  }

  /* Step — summary + hand-off */
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
      state.step--;
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
    stepsWrap.querySelectorAll("i").forEach((b) => b.classList.add("on"));
    content.innerHTML = `
      <div class="bk-success">
        <div class="mark">✓</div>
        <h2>Request <span class="serif-i">sent</span></h2>
        <p class="sub mt-1">Asante sana! Our reservations desk is on it — you'll hear from us shortly to confirm your stay.</p>
        <div class="bk-actions mt-2">
          <button class="btn btn-mint" data-done>Done</button>
        </div>
      </div>`;
    content.querySelector("[data-done]").addEventListener("click", closeBooking);
  }

  /* ============================================================
     WIRING
     ============================================================ */

  // Room preview: any [data-room-detail] opens the photo/detail modal.
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-room-detail]");
    if (!t) return;
    e.preventDefault();
    openRoomDetail(t.dataset.room || t.dataset.roomDetail);
  });

  // Generic booking: [data-book] opens the full flow (dates → room → guests).
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault();
    openBooking(t.dataset.room ? { roomId: t.dataset.room, fixedRoom: true, step: 0 } : {});
  });

  // Booking bar (homepage) → full flow starting at room selection.
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
      openBooking({
        checkin: inEl.value || todayISO(),
        checkout: outEl.value || plusDays(inEl.value || todayISO(), 1),
        locId: bar.querySelector("[name=location]").value,
        adults: Number(bar.querySelector("[name=guests]").value || 2),
        fixedRoom: false,
        step: 1,
      });
    });
  }

  // Render room cards into any [data-rooms-grid]. Cards open the preview.
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
          <div class="room-media" data-room-detail="${r.id}" role="button" tabindex="0" aria-label="Preview ${r.name}">
            <img src="${IMG}${r.img}" alt="${r.name}" loading="lazy" width="700" height="450">
            <span class="room-price">from <strong>${fmt(r.price)}</strong>/night</span>
            <span class="room-loc">${locById(r.loc).short}</span>
            <span class="room-peek">View photos</span>
          </div>
          <div class="room-body">
            <h3>${r.name}</h3>
            <div class="room-specs">
              <span>🛏 ${r.beds}</span>
              <span>👤 Sleeps ${r.guests}</span>
            </div>
            <div class="room-foot">
              <span class="from">per night<strong>${fmt(r.price)}</strong></span>
              <button class="btn btn-mint" data-room-detail="${r.id}">View &amp; book</button>
            </div>
          </div>
        </article>`).join("");

      // Keyboard access for the clickable media area.
      grid.querySelectorAll(".room-media[data-room-detail]").forEach((m) =>
        m.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRoomDetail(m.dataset.roomDetail); }
        })
      );
    };

    draw(locFilter, "");

    const chips = document.querySelectorAll(`[data-filter-for="${grid.id}"]`);
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        draw(chip.dataset.loc || "", chip.dataset.sort || "");
      })
    );
  });

  window.ZuriBooking = { open: openBooking, preview: openRoomDetail };
})();
