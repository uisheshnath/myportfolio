(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeToggle = $("#themeToggle");
  const themeIcon = themeToggle ? $("i", themeToggle) : null;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeIcon) {
      themeIcon.className = theme === "light" ? "fa-solid fa-moon" : "fa-solid fa-sun";
    }
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    }
  }

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("portfolio-theme");
  } catch (e) {}
  applyTheme(savedTheme || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem("portfolio-theme", next);
      } catch (e) {}
    });
  }

  /* ---------- Mobile menu ---------- */
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");

  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    $("i", menuToggle).className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
    $$("a", navLinks).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        setMenu(false);
      }
    });
  }

  /* ---------- Header, progress bar, back-to-top, active links ---------- */
  const header = $("#header");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const sections = $$("main section[id]");
  const linkMap = new Map($$(".nav-links a").map((a) => [a.getAttribute("href").slice(1), a]));

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 20);
    backToTop.classList.toggle("show", y > 600);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    let current = sections[0] ? sections[0].id : "";
    sections.forEach((sec) => {
      if (y >= sec.offsetTop - window.innerHeight * 0.35) current = sec.id;
    });
    linkMap.forEach((a, id) => {
      const active = id === current;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));

  /* ---------- Typing effect ---------- */
  const typedEl = $("#typed");
  const roles = ["Frontend Developer","Software Developer" ,"UI Engineer", "JavaScript Specialist", "Responsive Web Expert"];

  if (typedEl) {
    if (prefersReducedMotion) {
      typedEl.textContent = roles[0];
    } else {
      let roleIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const type = () => {
        const word = roles[roleIndex];
        charIndex += deleting ? -1 : 1;
        typedEl.textContent = word.slice(0, charIndex);

        let delay = deleting ? 45 : 85;
        if (!deleting && charIndex === word.length) {
          delay = 1800;
          deleting = true;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          delay = 400;
        }
        setTimeout(type, delay);
      };
      type();
    }
  }

  /* ---------- Reveal on scroll, skill bars, counters ---------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("visible");
          $$(".progress-bar", el).forEach((bar) => (bar.style.width = bar.dataset.width + "%"));
          $$("[data-count]", el).forEach(animateCounter);
          obs.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    $$(".reveal").forEach((el) => revealObserver.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("visible"));
    $$(".progress-bar").forEach((bar) => (bar.style.width = bar.dataset.width + "%"));
    $$("[data-count]").forEach((el) => (el.textContent = el.dataset.count));
  }

  /* ---------- Spotlight hover on skill cards ---------- */
  $$(".skill-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Contact form validation ---------- */
  const form = $("#contactForm");
  if (form) {
    const status = $("#formStatus");
    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
      subject: (v) => (v.trim().length >= 3 ? "" : "Please add a short subject."),
      message: (v) => (v.trim().length >= 10 ? "" : "Message should be at least 10 characters."),
    };

    const validateField = (input) => {
      const rule = rules[input.name];
      if (!rule) return true;
      const msg = rule(input.value);
      const field = input.closest(".field");
      field.classList.toggle("invalid", Boolean(msg));
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      $(".error-msg", field).textContent = msg;
      return !msg;
    };

    $$("input, textarea", form).forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = $$("input, textarea", form);
      const results = inputs.map(validateField);
      if (results.includes(false)) {
        const firstInvalid = inputs[results.indexOf(false)];
        firstInvalid.focus();
        return;
      }

      const btn = $("button[type='submit']", form);
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';

      // Replace this timeout with a real request (e.g. Formspree, EmailJS, or your own API).
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = original;
        form.reset();
        status.classList.add("show");
        setTimeout(() => status.classList.remove("show"), 6000);
      }, 1200);
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
