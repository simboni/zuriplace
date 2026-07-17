/* ZURI HOTELS — shared interactions (no jQuery, no WordPress) */
(function () {
  "use strict";

  /* ----- Theme toggle (dark default, persisted) ----- */
  const root = document.documentElement;
  const saved = localStorage.getItem("zuri-theme");
  if (saved) root.dataset.theme = saved;

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    const sync = () => {
      const light = root.dataset.theme === "light";
      btn.textContent = light ? "☾" : "☀";
      btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    };
    sync();
    btn.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "" : "light";
      localStorage.setItem("zuri-theme", root.dataset.theme);
      document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
        const light = root.dataset.theme === "light";
        b.textContent = light ? "☾" : "☀";
      });
      sync();
    });
  });

  /* ----- Sticky header ----- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ----- Mobile nav ----- */
  const burger = document.querySelector(".nav-burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("nav-open"))
    );
  }

  /* ----- Scroll reveals ----- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ----- Animated counters ----- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          const el = e.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || "";
          const t0 = performance.now();
          const dur = 1400;
          const tick = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ----- Gallery lightbox ----- */
  const lbFigures = document.querySelectorAll(".gallery-grid figure");
  if (lbFigures.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      '<button class="lightbox-close" aria-label="Close viewer">×</button><img alt="">';
    document.body.appendChild(lb);
    const lbImg = lb.querySelector("img");
    const close = () => lb.classList.remove("open");
    lb.addEventListener("click", (e) => {
      if (e.target !== lbImg) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    lbFigures.forEach((fig) => {
      fig.addEventListener("click", () => {
        const img = fig.querySelector("img");
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lb.classList.add("open");
      });
    });
  }

  /* ----- Footer year ----- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
