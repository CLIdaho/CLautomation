/* =========================================================
   CL Automation — interaction layer
   Vanilla, no dependencies, one DOMContentLoaded block.
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    year();
    bookingMonth();
    stickyNav();
    mobileNav();
    revealAndCounters();
    actionBar();
    workPreview();
    quoteForm();
    if (!reduced) townGrid();
  });

  /* ---------- footer year ---------- */
  function year() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- "currently booking <month>" ----------
     Past the 20th, point at next month so it never reads as
     a slot that has already gone. */
  function bookingMonth() {
    var el = document.getElementById("bookingMonth");
    if (!el) return;
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > 20 ? 1 : 0), 1);
    el.textContent = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  /* ---------- sticky nav ---------- */
  function stickyNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // mid-page refresh renders correctly
  }

  /* ---------- mobile nav ---------- */
  function mobileNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("is-locked", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setOpen(false);
    });
  }

  /* ---------- scroll reveal + animated counters ---------- */
  function revealAndCounters() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

    // Never let the reveal system be the reason content is invisible.
    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        if (el.classList.contains("reveal")) {
          var siblings = Array.prototype.slice.call(el.parentNode.children);
          el.style.transitionDelay = (siblings.indexOf(el) % 4) * 70 + "ms";
          el.classList.add("is-visible");
        }
        if (el.hasAttribute("data-count")) countUp(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var dur = 1400;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- mobile action bar ---------- */
  function actionBar() {
    var bar = document.getElementById("actionBar");
    var quote = document.getElementById("quote");
    if (!bar || !quote) return;

    function onScroll() {
      var past = window.scrollY > window.innerHeight * 0.55;
      var atQuote = quote.getBoundingClientRect().top < window.innerHeight * 0.75;
      bar.classList.toggle("is-visible", past && !atQuote);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- portfolio preview ----------
     Card URLs live base64-encoded in data-site so no live link is
     printed on the page or exposed in a hover status bar. */
  function workPreview() {
    var modal = document.getElementById("previewModal");
    var frame = document.getElementById("modalFrame");
    var title = document.getElementById("modalTitle");
    var loading = document.getElementById("modalLoading");
    var openLive = document.getElementById("openLive");
    var cards = document.querySelectorAll(".work__card");
    if (!modal || !frame || !cards.length) return;

    var current = "";
    var lastFocused = null;

    function decode(v) {
      try { return atob(v); } catch (e) { return ""; }
    }

    function open(card) {
      current = decode(card.getAttribute("data-site"));
      if (!current) return;
      lastFocused = card;

      title.textContent = card.getAttribute("data-name") || "Live preview";
      loading.hidden = false;
      frame.classList.remove("is-ready");
      frame.src = current;

      modal.hidden = false;
      document.body.classList.add("is-locked");
      requestAnimationFrame(function () { modal.querySelector(".modal__close").focus(); });
    }

    function close() {
      modal.hidden = true;
      frame.src = "about:blank";
      frame.classList.remove("is-ready");
      document.body.classList.remove("is-locked");
      if (lastFocused) lastFocused.focus();
    }

    frame.addEventListener("load", function () {
      if (frame.src === "about:blank" || !frame.src) return;
      loading.hidden = true;
      frame.classList.add("is-ready");
    });

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("click", function () { open(card); });
    });

    modal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    // keep focus inside the dialog while it is open
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = modal.querySelectorAll("button, iframe, [href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (openLive) {
      openLive.addEventListener("click", function () {
        if (current) window.open(current, "_blank", "noopener,noreferrer");
      });
    }
  }

  /* ---------- quote form ----------
     Posts to FormSubmit (free, no account, no server). The first
     submission from a new domain triggers a one-time confirmation
     email — see README. Falls back to a prefilled mail client. */
  function quoteForm() {
    var form = document.getElementById("quoteForm");
    if (!form) return;

    var btn = document.getElementById("submitBtn");
    var errorBox = document.getElementById("formError");
    var success = document.getElementById("formSuccess");
    var reset = document.getElementById("formReset");
    var INBOX = "clewisidaho@gmail.com";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.hidden = true;

      if (!form.reportValidity()) return;
      if (form.elements._honey && form.elements._honey.value) return; // bot

      var data = collect(form);
      btn.classList.add("is-sending");

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function () {
          form.hidden = true;
          success.hidden = false;
          success.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        })
        .catch(function () {
          errorBox.innerHTML =
            "That didn't go through — my end, not yours. Email me directly at " +
            '<a href="' + mailtoFallback(data, INBOX) + '">' + INBOX + "</a> " +
            "and I'll pick it up from there.";
          errorBox.hidden = false;
        })
        .finally(function () {
          btn.classList.remove("is-sending");
        });
    });

    if (reset) {
      reset.addEventListener("click", function () {
        form.reset();
        form.hidden = false;
        success.hidden = true;
        form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      });
    }

    function collect(f) {
      var out = {};
      var fd = new FormData(f);
      fd.forEach(function (value, key) {
        if (key === "_honey") return;
        out[key] = out[key] ? out[key] + ", " + value : value;
      });
      if (!out["Interested in"]) out["Interested in"] = "Not specified";
      return out;
    }

    function mailtoFallback(data, inbox) {
      var body = Object.keys(data)
        .filter(function (k) { return k.charAt(0) !== "_"; })
        .map(function (k) { return k + ": " + data[k]; })
        .join("\n");
      return "mailto:" + inbox +
        "?subject=" + encodeURIComponent("Quote request — " + (data.Business || "new project")) +
        "&body=" + encodeURIComponent(body);
    }
  }

  /* ---------- ambient signature ----------
     A small-town street grid that reads as a circuit board: blocks,
     intersections, and pulses of light routing through them.
     Amber = the town, cyan = the build. */
  function townGrid() {
    var canvas = document.getElementById("gridCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var xs = [], ys = [];
    var blocks = [];
    var pulses = [];
    var grid = null;      // pre-rendered static layer
    var running = true;
    var raf = null;

    var CYAN = "45,212,232";
    var AMBER = "255,165,58";

    function build() {
      var rect = canvas.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // irregular block sizes — a town plat, not graph paper
      var step = W < 700 ? 96 : 132;
      xs = []; ys = [];
      for (var x = -40; x < W + 120; x += step * (0.7 + Math.random() * 0.75)) xs.push(Math.round(x));
      for (var y = -40; y < H + 120; y += step * (0.62 + Math.random() * 0.7)) ys.push(Math.round(y));

      // a scatter of "buildings" filling some blocks
      blocks = [];
      for (var i = 0; i < xs.length - 1; i++) {
        for (var j = 0; j < ys.length - 1; j++) {
          if (Math.random() > 0.30) continue;
          var pad = 10 + Math.random() * 16;
          var bw = xs[i + 1] - xs[i] - pad * 2;
          var bh = ys[j + 1] - ys[j] - pad * 2;
          if (bw < 16 || bh < 16) continue;
          blocks.push({ x: xs[i] + pad, y: ys[j] + pad, w: bw, h: bh, warm: Math.random() < 0.34 });
        }
      }

      renderGrid();
      seedPulses();
    }

    function renderGrid() {
      grid = document.createElement("canvas");
      grid.width = canvas.width;
      grid.height = canvas.height;
      var g = grid.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      // streets
      g.lineWidth = 1;
      g.strokeStyle = "rgba(255,255,255,0.055)";
      g.beginPath();
      xs.forEach(function (x) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); });
      ys.forEach(function (y) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); });
      g.stroke();

      // blocks
      blocks.forEach(function (b) {
        g.fillStyle = b.warm ? "rgba(" + AMBER + ",0.030)" : "rgba(255,255,255,0.016)";
        g.strokeStyle = b.warm ? "rgba(" + AMBER + ",0.10)" : "rgba(255,255,255,0.045)";
        g.lineWidth = 1;
        g.beginPath();
        g.rect(b.x, b.y, b.w, b.h);
        g.fill();
        g.stroke();
      });

      // intersection nodes
      xs.forEach(function (x) {
        ys.forEach(function (y) {
          if (Math.random() > 0.22) return;
          g.fillStyle = "rgba(255,255,255,0.10)";
          g.beginPath();
          g.arc(x, y, 1.4, 0, Math.PI * 2);
          g.fill();
        });
      });
    }

    function seedPulses() {
      pulses = [];
      var count = W < 700 ? 7 : 13;
      for (var i = 0; i < count; i++) pulses.push(newPulse(true));
    }

    function newPulse(anywhere) {
      var horizontal = Math.random() < 0.5;
      var ix = Math.floor(Math.random() * xs.length);
      var iy = Math.floor(Math.random() * ys.length);
      return {
        ix: ix,
        iy: iy,
        dir: horizontal ? (Math.random() < 0.5 ? 1 : -1) : 0,
        vert: !horizontal,
        vdir: horizontal ? 0 : (Math.random() < 0.5 ? 1 : -1),
        t: anywhere ? Math.random() : 0,
        speed: 0.0022 + Math.random() * 0.0042,
        color: Math.random() < 0.30 ? AMBER : CYAN,
        life: 0,
        maxLife: 900 + Math.random() * 1400
      };
    }

    function pos(p) {
      var x0 = xs[p.ix], y0 = ys[p.iy];
      if (p.vert) {
        var iy2 = clamp(p.iy + p.vdir, 0, ys.length - 1);
        return { x: x0, y: y0 + (ys[iy2] - y0) * p.t, dx: 0, dy: p.vdir };
      }
      var ix2 = clamp(p.ix + p.dir, 0, xs.length - 1);
      return { x: x0 + (xs[ix2] - x0) * p.t, y: y0, dx: p.dir, dy: 0 };
    }

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    function advance(p, dt) {
      p.t += p.speed * dt;
      p.life += dt;
      if (p.t < 1) return;

      // arrived at the next intersection — pick a new street
      p.t = 0;
      if (p.vert) p.iy = clamp(p.iy + p.vdir, 0, ys.length - 1);
      else p.ix = clamp(p.ix + p.dir, 0, xs.length - 1);

      var offGrid = p.ix <= 0 || p.ix >= xs.length - 1 || p.iy <= 0 || p.iy >= ys.length - 1;
      if (offGrid || p.life > p.maxLife) {
        var fresh = newPulse(false);
        for (var k in fresh) p[k] = fresh[k];
        return;
      }

      if (Math.random() < 0.42) {           // turn
        if (p.vert) { p.vert = false; p.vdir = 0; p.dir = Math.random() < 0.5 ? 1 : -1; }
        else { p.vert = true; p.dir = 0; p.vdir = Math.random() < 0.5 ? 1 : -1; }
      }
    }

    var last = 0;
    function frame(ts) {
      if (!running) return;
      var dt = Math.min(ts - last || 16, 48);
      last = ts;

      ctx.clearRect(0, 0, W, H);
      if (grid) ctx.drawImage(grid, 0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";
      pulses.forEach(function (p) {
        advance(p, dt);
        var pt = pos(p);
        var tail = 58;
        var tx = pt.x - pt.dx * tail;
        var ty = pt.y - pt.dy * tail;

        var g = ctx.createLinearGradient(tx, ty, pt.x, pt.y);
        g.addColorStop(0, "rgba(" + p.color + ",0)");
        g.addColorStop(1, "rgba(" + p.color + ",0.85)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        ctx.fillStyle = "rgba(" + p.color + ",0.95)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(" + p.color + ",0.10)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    build();
    start();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 220);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    // don't burn frames once the hero has scrolled away
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(canvas);
    }
  }
})();
