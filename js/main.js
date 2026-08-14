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
    if (!reduced) current();
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

    var stage = document.getElementById("modalStage");
    var hint = document.getElementById("modalHint");
    var track = modal.querySelector(".modal__scroll");
    var thumb = document.getElementById("modalScrollThumb");

    var current = "";
    var lastFocused = null;
    var gateSel = "";          // selector for a blocking overlay in the previewed site
    var gateTimer = null;
    var scrollable = true;     // false once same-origin access is known to fail

    function decode(v) {
      try { return atob(v); } catch (e) { return ""; }
    }

    /* The demos live on the same origin as this page, so the frame's document
       is reachable. Everything that depends on that goes through here and
       fails soft — a custom domain later would make these cross-origin. */
    function frameWin() {
      try {
        var w = frame.contentWindow;
        void w.document.body;      // throws cross-origin
        return w;
      } catch (e) {
        return null;
      }
    }

    function lock(on) {
      stage.classList.toggle("is-static", on);
      stage.classList.toggle("is-interactive", !on);
    }

    /* An age gate (Cloud Hub is 21+) has to stay clickable or the visitor
       hits a wall they can't dismiss. Don't answer it for them — that gate
       is the client's compliance requirement, and watching a prospect meet
       it is half the point of showing the demo. Unlock, wait it out, relock. */
    function watchGate() {
      var win = frameWin();
      if (!gateSel || !win) return lock(scrollable);

      var gate = win.document.querySelector(gateSel);
      if (!gate) return lock(true);

      lock(false);
      hint.textContent = "Answer the age check to continue — it's part of the build.";
      clearTimeout(gateTimer);
      (function poll() {
        var w = frameWin();
        var el = w && w.document.querySelector(gateSel);
        var gone = !el || !el.offsetParent || w.getComputedStyle(el).display === "none";
        if (gone) {
          lock(true);
          hint.textContent = defaultHint;
          return;
        }
        gateTimer = setTimeout(poll, 250);
      })();
    }

    var defaultHint = hint ? hint.textContent : "";

    function open(card) {
      current = decode(card.getAttribute("data-site"));
      if (!current) return;
      lastFocused = card;
      gateSel = card.getAttribute("data-preview-gate") || "";

      title.textContent = card.getAttribute("data-name") || "Live preview";
      hint.textContent = defaultHint;
      loading.hidden = false;
      frame.classList.remove("is-ready");
      lock(true);
      setThumb(0);
      frame.src = current;

      modal.hidden = false;
      document.body.classList.add("is-locked");
      requestAnimationFrame(function () { modal.querySelector(".modal__close").focus(); });
    }

    function close() {
      clearTimeout(gateTimer);
      modal.hidden = true;
      frame.src = "about:blank";
      frame.classList.remove("is-ready");
      track.classList.remove("is-active");
      document.body.classList.remove("is-locked");
      if (lastFocused) lastFocused.focus();
    }

    frame.addEventListener("load", function () {
      if (frame.src === "about:blank" || !frame.src) return;
      loading.hidden = true;
      frame.classList.add("is-ready");

      // no same-origin access means no scroll forwarding; a dead preview is
      // worse than an interactive one, so hand control back
      if (!frameWin()) {
        scrollable = false;
        lock(false);
        hint.textContent = "Live build, running right now. Scroll inside the frame.";
        return;
      }
      scrollable = true;
      watchGate();
      setThumb(0);
    });

    /* --- scroll forwarding: the frame ignores pointers, so the stage
           translates wheel and drag into scroll position for it --- */
    function setThumb(ratio) {
      if (!thumb || !track) return;
      var win = frameWin();
      if (!win) return track.classList.remove("is-active");
      var doc = win.document.documentElement;
      var range = doc.scrollHeight - win.innerHeight;
      if (range <= 40) return track.classList.remove("is-active");
      track.classList.add("is-active");
      var pct = ratio !== null ? ratio : win.scrollY / range;
      thumb.style.transform = "translateY(" + (Math.min(Math.max(pct, 0), 1) * (100 / 0.22 - 100)) + "%)";
    }

    function scrollFrame(dy) {
      var win = frameWin();
      if (!win) return;
      win.scrollBy(0, dy);
      setThumb(null);
    }

    stage.addEventListener("wheel", function (e) {
      if (!stage.classList.contains("is-static")) return;
      e.preventDefault();
      scrollFrame(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    }, { passive: false });

    var touchY = 0;
    stage.addEventListener("touchstart", function (e) {
      touchY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchmove", function (e) {
      if (!stage.classList.contains("is-static")) return;
      e.preventDefault();
      var y = e.touches[0].clientY;
      scrollFrame(touchY - y);
      touchY = y;
    }, { passive: false });

    var KEYS = { ArrowDown: 60, ArrowUp: -60, PageDown: 520, PageUp: -520, " ": 520 };
    stage.addEventListener("keydown", function (e) {
      if (!stage.classList.contains("is-static")) return;
      if (!(e.key in KEYS)) return;
      e.preventDefault();
      scrollFrame(KEYS[e.key]);
    });

    // Tab can otherwise walk into the frame and reach links pointer-events hid
    frame.addEventListener("focus", function () {
      if (stage.classList.contains("is-static")) stage.focus();
    });

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("click", function () { open(card); });
    });

    modal.addEventListener("click", function (e) {
      // closest(), not hasAttribute() — clicking the X lands on the <svg>
      // inside the button, which carries no data-close of its own
      if (e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    // keep focus inside the dialog while it is open
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = modal.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])");
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
      btn.disabled = true;

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (body) {
          // FormSubmit answers 200 with success:"false" on a rejected send.
          // Trusting res.ok alone would show the success card and quietly
          // drop the lead.
          var ok = body && (body.success === true || body.success === "true");
          if (!ok) throw new Error((body && body.message) || "rejected");
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
          btn.disabled = false;
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
      // so hitting reply in the inbox goes to the prospect, not to FormSubmit
      if (out.Email) out._replyto = out.Email;
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


  /* ---------- ambient signature: "Current" ----------
     A flow field of fine light filaments — thousands of short strokes
     following a slowly morphing noise field, accumulating into ribbons
     of liquid light. No grid, no dots, no lines drawn on purpose: the
     shapes are emergent and never repeat.

     Cheap value noise (two octaves) drives the angles. Strokes are
     drawn additively at very low alpha over a translucent wash, so the
     canvas itself holds the trail rather than a particle history. */
  function current() {
    var canvas = document.getElementById("heroCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1;
    var parts = [];
    var raf = null, running = false;
    var t = 0;                      // field evolution
    var px = 0, py = 0;             // pointer drift (parallax)
    var tx = 0, ty = 0;

    var BG = "#080B14";
    var PALETTE = [
      [45, 212, 232],   // cyan   — the build
      [45, 212, 232],
      [73, 168, 245],
      [91, 124, 250],   // indigo
      [255, 165, 58]    // amber  — the town
    ];

    /* --- value noise, 2 octaves, no dependencies --- */
    var perm = new Uint8Array(512);
    (function seed() {
      var p = [];
      for (var i = 0; i < 256; i++) p[i] = i;
      for (var j = 255; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = p[j]; p[j] = p[k]; p[k] = tmp;
      }
      for (var m = 0; m < 512; m++) perm[m] = p[m & 255];
    })();

    function hash(x, y) { return perm[(perm[x & 255] + (y & 255)) & 255] / 255; }
    function smooth(a) { return a * a * (3 - 2 * a); }

    function noise2(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = smooth(x - xi), yf = smooth(y - yi);
      var a = hash(xi, yi), b = hash(xi + 1, yi);
      var c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
    }

    function field(x, y) {
      var n = noise2(x, y) * 0.68 + noise2(x * 2.3, y * 2.3) * 0.32;
      return n * Math.PI * 3.2;     // angle in radians
    }

    /* Every constant below was tuned against an offline render of this
       exact algorithm — see the note in the README. Alpha in particular
       is load-bearing: much under 0.15 and the filaments never surface
       above the background. */
    var SCALE = 0.0024;             // field zoom — governs ribbon size
    var WASH  = 0.014;              // per-frame fade; lower = longer trails
    var DRIFT = 0.00042;            // how fast the field itself morphs
    var HALO_W = 5.5, HALO_A = 0.30;// the bloom pass

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      seedParts();
    }

    function spawn(p) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.life = 0;
      p.max = 140 + Math.random() * 460;
      p.speed = 0.5 + Math.random() * 1.1;
      p.width = 0.5 + Math.random() * 0.8;
      var c = PALETTE[(Math.random() * PALETTE.length) | 0];
      p.color = c[0] + "," + c[1] + "," + c[2];
      p.alpha = 0.17 + Math.random() * 0.21;
      return p;
    }

    function seedParts() {
      var target = W < 700 ? 240 : Math.min(460, Math.round(W * 0.29));
      parts = [];
      for (var i = 0; i < target; i++) {
        var p = spawn({});
        p.life = Math.random() * p.max;   // desynchronise the first cycle
        parts.push(p);
      }
    }

    function frame() {
      if (!running) return;

      // pointer parallax, heavily damped
      px += (tx - px) * 0.035;
      py += (ty - py) * 0.035;

      // translucent wash — this is what leaves the silk trail
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(8,11,20," + WASH + ")";
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var a = field((p.x + px) * SCALE, (p.y + py) * SCALE + t);
        var nx = p.x + Math.cos(a) * p.speed;
        var ny = p.y + Math.sin(a) * p.speed;

        // fade in and out across the particle's life so nothing pops
        var envelope = Math.sin((p.life / p.max) * Math.PI);
        var alpha = p.alpha * envelope;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);

        // bloom pass first: wide and faint, so the core sits inside a halo
        ctx.strokeStyle = "rgba(" + p.color + "," + (alpha * HALO_A).toFixed(4) + ")";
        ctx.lineWidth = p.width * HALO_W;
        ctx.stroke();

        // then the filament itself
        ctx.strokeStyle = "rgba(" + p.color + "," + alpha.toFixed(4) + ")";
        ctx.lineWidth = p.width;
        ctx.stroke();

        p.x = nx; p.y = ny; p.life++;

        if (p.life > p.max || nx < -60 || nx > W + 60 || ny < -60 || ny > H + 60) spawn(p);
      }

      t += DRIFT;                    // the field itself drifts, slowly
      raf = requestAnimationFrame(frame);
    }

    function start() { if (raf) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    resize();
    start();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 240);
    });

    // parallax only where there's a real pointer
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", function (e) {
        tx = (e.clientX / window.innerWidth - 0.5) * 220;
        ty = (e.clientY / window.innerHeight - 0.5) * 220;
      }, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(canvas);
    }
  }
})();
