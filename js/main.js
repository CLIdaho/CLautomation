/* =========================================================
   CL Automation — interaction layer
   Vanilla, no dependencies, one DOMContentLoaded block.
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    year();
    bookingMonth();
    stickyNav();
    mobileNav();
    themePicker();
    splitHeadings();
    revealAndCounters();
    activeSection();
    scrollFX();
    pointerFX();
    actionBar();
    workPreview();
    quoteForm();
    if (!reduced) {
      current();
      circuit();
    }
  });

  /* ---------- token readers ----------
     Every colour on the page lives in :root in css/style.css, including
     the ones the two canvases paint with. Reading them back out here is
     what lets the theme picker retint the animations along with the
     markup instead of leaving them stranded on the old palette. */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function rgbVar(name, fallback) {
    var parts = cssVar(name).split(",");
    if (parts.length !== 3) return fallback;
    var out = [];
    for (var i = 0; i < 3; i++) {
      var n = parseInt(parts[i], 10);
      if (!isFinite(n)) return fallback;
      out.push(n);
    }
    return out;
  }

  /* Anything that caches a colour listens for this. */
  var THEME_EVENT = "cla:theme";
  function onTheme(fn) { document.addEventListener(THEME_EVENT, fn); }

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

  /* ---------- theme picker ----------
     Four palettes, each one a swap of the token block at the top of
     style.css. "signal" is the stylesheet's own :root, so it is stored
     as the absence of a data-theme attribute rather than as a fifth
     block that would have to be kept in sync with the default. */
  var THEMES = ["signal", "ember", "aurora", "nebula"];

  function themePicker() {
    var picker = document.getElementById("themePicker");
    var btn = document.getElementById("themeBtn");
    var panel = document.getElementById("themePanel");
    if (!picker || !btn || !panel) return;

    var opts = Array.prototype.slice.call(panel.querySelectorAll("[data-theme-set]"));
    var meta = document.querySelector('meta[name="theme-color"]');
    var root = document.documentElement;
    var settle = null;

    function active() {
      var t = root.getAttribute("data-theme");
      return THEMES.indexOf(t) > 0 ? t : "signal";
    }

    function apply(name, animate) {
      if (THEMES.indexOf(name) < 0) name = "signal";

      /* Crossfade the swap. The class carries a transition for every
         colour-ish property and is taken off again as soon as the swap
         lands — leaving it on would put a 450ms lag on every ordinary
         hover for the rest of the visit. */
      if (animate && !reduced) {
        root.classList.add("is-theming");
        clearTimeout(settle);
        settle = setTimeout(function () { root.classList.remove("is-theming"); }, 520);
      }

      if (name === "signal") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", name);

      try { localStorage.setItem("cla-theme", name); } catch (e) { /* private mode */ }

      opts.forEach(function (o) {
        o.setAttribute("aria-checked", o.getAttribute("data-theme-set") === name ? "true" : "false");
      });
      if (meta) meta.setAttribute("content", cssVar("--bg") || "#080B14");

      document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: name } }));
    }

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function isOpen() { return btn.getAttribute("aria-expanded") === "true"; }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!isOpen());
      if (isOpen()) {
        var checked = panel.querySelector('[aria-checked="true"]');
        if (checked) checked.focus();
      }
    });

    opts.forEach(function (o, i) {
      o.addEventListener("click", function () {
        apply(o.getAttribute("data-theme-set"), true);
        setOpen(false);
        btn.focus();
      });
      // a radiogroup is expected to move between options with the arrows
      o.addEventListener("keydown", function (e) {
        var step = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1
                 : (e.key === "ArrowUp" || e.key === "ArrowLeft") ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = opts[(i + step + opts.length) % opts.length];
        next.focus();
        apply(next.getAttribute("data-theme-set"), true);
      });
    });

    document.addEventListener("click", function (e) {
      if (isOpen() && !picker.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { setOpen(false); btn.focus(); }
    });

    // sync the panel and the meta tag with whatever the head script restored
    apply(active(), false);
  }

  /* ---------- word reveal on section headings ----------
     Wraps each word of a section <h2> in a masked span so the words can
     climb out on the same observer hit that fades the block in. Only
     text nodes are touched: the <br> in the quote heading and the
     gradient <span> stay exactly where the markup put them. */
  function splitHeadings() {
    if (reduced) return;
    Array.prototype.forEach.call(document.querySelectorAll(".reveal h2"), function (h) {
      var i = 0;
      Array.prototype.slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(chunk)); return; }
          var mask = document.createElement("span");
          mask.className = "w";
          mask.style.setProperty("--i", String(i++));
          var word = document.createElement("i");
          word.textContent = chunk;
          mask.appendChild(word);
          frag.appendChild(mask);
        });
        h.replaceChild(frag, node);
      });
    });
  }

  /* ---------- nav link follows the section you're reading ---------- */
  function activeSection() {
    if (!("IntersectionObserver" in window)) return;

    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll('.nav__links a[href^="#"]'), function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var ids = Object.keys(links);
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length) return;

    // a band across the middle of the viewport, so the highlight changes
    // when a section is actually being read rather than when it peeks in
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var a = links[entry.target.id];
        if (!a) return;
        ids.forEach(function (id) { links[id].classList.remove("is-current"); });
        a.classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- scroll-linked effects ----------
     One rAF-throttled handler for everything that reads scroll position:
     the progress rail, the hero's parallax, every [data-par] layer, and
     the process track. Separate listeners per effect would each schedule
     their own frame and do their own layout reads. */
  function scrollFX() {
    var bar = document.getElementById("progressBar");
    var heroInner = document.querySelector(".hero__inner");
    var cue = document.querySelector(".hero__scroll");
    var track = document.getElementById("stepTrack");
    var steps = document.getElementById("steps");
    var nodes = track ? Array.prototype.slice.call(track.querySelectorAll(".track__nodes b")) : [];
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-par]")).map(function (el) {
      return { el: el, amt: parseFloat(el.getAttribute("data-par")) || 0 };
    });
    var queued = false;

    function update() {
      queued = false;
      var vh = window.innerHeight;
      var y = window.scrollY || window.pageYOffset || 0;

      if (bar) {
        var max = document.documentElement.scrollHeight - vh;
        bar.style.setProperty("--p", max > 0 ? Math.min(y / max, 1).toFixed(4) : "0");
      }

      if (reduced) return;

      // the hero copy climbs and dissolves while the flow field stays put
      if (heroInner && y < vh * 1.3) {
        heroInner.style.setProperty("--hy", (y * 0.3).toFixed(1) + "px");
        heroInner.style.setProperty("--ho", Math.max(0, 1 - y / (vh * 0.62)).toFixed(3));
      }
      if (cue) cue.style.opacity = String(Math.max(0, 1 - y / 200));

      for (var i = 0; i < layers.length; i++) {
        var r = layers[i].el.getBoundingClientRect();
        if (r.bottom < -320 || r.top > vh + 320) continue;   // offscreen, don't bother
        var p = (r.top + r.height / 2 - vh / 2) / vh;        // 0 when centred
        layers[i].el.style.transform =
          "translate3d(0," + (p * layers[i].amt).toFixed(1) + "px,0)";
      }

      if (track && steps && nodes.length > 1) {
        var sr = steps.getBoundingClientRect();
        var span = sr.height + vh * 0.5;
        var prog = Math.min(Math.max((vh * 0.82 - sr.top) / span, 0), 1);
        track.style.setProperty("--p", prog.toFixed(4));
        for (var n = 0; n < nodes.length; n++) {
          var at = Math.max(0.02, n / (nodes.length - 1) - 0.02);
          nodes[n].classList.toggle("is-on", prog >= at);
        }
      }
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();   // a mid-page refresh has to render correctly too
  }

  /* ---------- pointer-driven card tilt, spotlight, magnetic buttons ----------
     All three write custom properties rather than the transform itself,
     because the CSS hover states write to that same transform. See the
     .tilt and .btn rules in style.css. Fine pointers only: a tilt that
     fires on a tap reads as a glitch, not as depth. */
  function pointerFX() {
    if (reduced || !finePointer) return;

    function track(el, maxTilt) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (maxTilt) {
          el.style.setProperty("--ry", ((x - 0.5) * 2 * maxTilt).toFixed(2) + "deg");
          el.style.setProperty("--rx", ((0.5 - y) * 2 * maxTilt).toFixed(2) + "deg");
        }
      }, { passive: true });

      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".card.tilt"), function (el) { track(el, 4); });
    Array.prototype.forEach.call(document.querySelectorAll(".work__card.tilt"), function (el) { track(el, 5); });
    Array.prototype.forEach.call(document.querySelectorAll(".step"), function (el) { track(el, 0); });

    Array.prototype.forEach.call(document.querySelectorAll(".btn"), function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        if (!r.width || !r.height) return;
        b.style.setProperty("--mgx", (((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(1) + "px");
        b.style.setProperty("--mgy", (((e.clientY - r.top) / r.height - 0.5) * 5).toFixed(1) + "px");
      }, { passive: true });
      b.addEventListener("pointerleave", function () {
        b.style.setProperty("--mgx", "0px");
        b.style.setProperty("--mgy", "0px");
      });
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
    /* Is the overlay actually covering the view right now? offsetParent is no
       help — it reads null for anything position:fixed, which is every overlay
       of this kind, so testing it locked the gate the instant it appeared. And
       sites dismiss these by fading opacity or dropping pointer-events at least
       as often as by display:none. Ask the browser what it computed instead. */
    function gateUp(win, el) {
      if (!el) return false;
      var cs = win.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (cs.pointerEvents === "none") return false;
      if (parseFloat(cs.opacity) < 0.05) return false;
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function watchGate() {
      var win = frameWin();
      if (!gateSel || !win) return lock(scrollable);
      if (!gateUp(win, win.document.querySelector(gateSel))) return lock(true);

      lock(false);
      hint.textContent = "Answer the age check to continue — it's part of the build.";
      clearTimeout(gateTimer);
      (function poll() {
        var w = frameWin();
        if (!w) return lock(scrollable);
        if (!gateUp(w, w.document.querySelector(gateSel))) {
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
      // an unlocked gate invites a real click, which moves focus into the frame
      // and puts keystrokes out of reach of the listener on this document
      frameWin().document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });
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

    /* The palette is read out of the stylesheet rather than written here,
       so picking a theme retints the filaments along with the markup.
       --acc appears twice on purpose: it is the lead colour and wants
       roughly double the share of strokes. */
    var BGRGB = [8, 11, 20];
    var BG = "#080B14";
    var PALETTE = [];
    var washBoost = 0;

    function readPalette() {
      BGRGB = rgbVar("--bg-rgb", [8, 11, 20]);
      BG = "rgb(" + BGRGB.join(",") + ")";
      var lead = rgbVar("--acc-rgb", [45, 212, 232]);
      PALETTE = [
        lead,                                       // the build
        lead,
        rgbVar("--acc-mid-rgb", [73, 168, 245]),
        rgbVar("--acc3-rgb", [91, 124, 250]),
        rgbVar("--acc2-rgb", [255, 165, 58])        // the town
      ];
      for (var i = 0; i < parts.length; i++) paint(parts[i]);
    }

    function paint(p) {
      var c = PALETTE[p.ci % PALETTE.length];
      p.color = c[0] + "," + c[1] + "," + c[2];
    }

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
      p.ci = (Math.random() * PALETTE.length) | 0;
      paint(p);
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

      // translucent wash — this is what leaves the silk trail. Right after
      // a theme change it runs several times heavier for a moment so the
      // old palette's trails clear in about a third of a second instead of
      // hanging around in the wrong colour for over a second.
      var wash = washBoost > 0 ? (washBoost--, WASH * 7) : WASH;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(" + BGRGB.join(",") + "," + wash + ")";
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

    readPalette();
    resize();
    start();

    onTheme(function () {
      readPalette();
      washBoost = 26;
    });

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


  /* ---------- second signature: "Circuit" ----------
     The lower page gets its own ambient layer, deliberately unlike the
     hero's. The flow field is liquid and organic; this one is etched and
     deliberate — axis-aligned traces with the occasional 45° dogleg,
     junction pads where they end, and data pulses running along them.

     Two canvases, one at a time: each is gated on an IntersectionObserver,
     so scrolling past the hero stops the flow field before this starts.

     The traces never change once generated, so they are rendered once to
     an offscreen canvas and blitted each frame. Only the pulses are
     redrawn — a couple of dozen short gradient strokes, which is what
     keeps this cheap enough to run behind live content. */
  function circuit() {
    var canvas = document.getElementById("circuitCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var still = document.createElement("canvas");
    var sctx = still.getContext("2d");
    if (!sctx) return;

    var W = 0, H = 0, dpr = 1;
    var traces = [], pulses = [];
    var raf = null, running = false;
    var COL = { line: "45,212,232", pad: "45,212,232", pulse: [[45, 212, 232]] };

    var CELL = 56;          // trace grid pitch
    var MAX_TRACES = 44;

    function readColours() {
      var a = rgbVar("--acc-rgb", [45, 212, 232]);
      COL.line = a.join(",");
      COL.pad = a.join(",");
      COL.pulse = [
        a,
        a,
        rgbVar("--acc2-rgb", [255, 165, 58]),
        rgbVar("--acc3-rgb", [91, 124, 250])
      ];
    }

    /* Walk a random path across the grid. Axis-aligned by default with an
       occasional diagonal, never doubling straight back on itself, and
       clamped so a trace can't wander off the canvas and vanish. */
    function build() {
      traces = [];
      var cols = Math.max(2, Math.floor(W / CELL));
      var rows = Math.max(2, Math.floor(H / CELL));
      var want = Math.min(MAX_TRACES, Math.max(8, Math.round((cols * rows) / 7)));

      var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

      for (var n = 0; n < want; n++) {
        var cx = 1 + ((Math.random() * (cols - 1)) | 0);
        var cy = 1 + ((Math.random() * (rows - 1)) | 0);
        var pts = [[cx * CELL, cy * CELL]];
        var last = -1;

        var legs = 3 + ((Math.random() * 4) | 0);
        for (var s = 0; s < legs; s++) {
          // 4 axis directions most of the time, a diagonal now and then
          var diag = Math.random() < 0.28;
          var d = (diag ? 4 : 0) + ((Math.random() * 4) | 0);
          if (d === last) d = (d + 1) % DIRS.length;
          last = d;

          // A diagonal is a corner, not a leg. Letting one run three cells
          // produced long crossing lines and the whole thing read as a star
          // chart rather than as a board.
          var run = diag ? 1 : 1 + ((Math.random() * 3) | 0);
          cx = Math.min(Math.max(cx + DIRS[d][0] * run, 0), cols);
          cy = Math.min(Math.max(cy + DIRS[d][1] * run, 0), rows);
          var pt = [cx * CELL, cy * CELL];
          var prev = pts[pts.length - 1];
          if (pt[0] !== prev[0] || pt[1] !== prev[1]) pts.push(pt);
        }
        if (pts.length < 2) continue;

        // cumulative segment lengths, so a pulse can be placed by distance
        var seg = [], len = 0;
        for (var i = 0; i < pts.length - 1; i++) {
          var dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
          var L = Math.sqrt(dx * dx + dy * dy);
          seg.push(L);
          len += L;
        }
        if (len > 0) traces.push({ pts: pts, seg: seg, len: len });
      }

      seedPulses();
      drawStill();
    }

    function seedPulses() {
      pulses = [];
      if (!traces.length) return;
      var count = Math.min(26, Math.max(6, Math.round(traces.length * 0.6)));
      for (var i = 0; i < count; i++) pulses.push(spawnPulse({}, true));
    }

    function spawnPulse(p, scatter) {
      var t = (Math.random() * traces.length) | 0;
      p.t = t;
      p.tail = 30 + Math.random() * 55;
      p.speed = 0.7 + Math.random() * 1.9;
      p.d = scatter ? Math.random() * traces[t].len : -p.tail;
      var c = COL.pulse[(Math.random() * COL.pulse.length) | 0];
      p.color = c[0] + "," + c[1] + "," + c[2];
      return p;
    }

    /* The stretch of a trace between two distances along it, as points. */
    function subPath(tr, d0, d1) {
      var out = [], run = 0;
      d0 = Math.max(0, d0);
      d1 = Math.min(tr.len, d1);
      if (d1 <= d0) return out;

      for (var i = 0; i < tr.seg.length; i++) {
        var L = tr.seg[i], a = run, b = run + L;
        run = b;
        if (b < d0 || a > d1) continue;
        var p0 = tr.pts[i], p1 = tr.pts[i + 1];
        var t0 = Math.max(0, (d0 - a) / L);
        var t1 = Math.min(1, (d1 - a) / L);
        if (!out.length) out.push([p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0]);
        out.push([p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1]);
      }
      return out;
    }

    function drawStill() {
      still.width = canvas.width;
      still.height = canvas.height;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, W, H);
      sctx.lineJoin = "round";
      sctx.lineCap = "round";

      for (var i = 0; i < traces.length; i++) {
        var pts = traces[i].pts;
        sctx.beginPath();
        sctx.moveTo(pts[0][0], pts[0][1]);
        for (var j = 1; j < pts.length; j++) sctx.lineTo(pts[j][0], pts[j][1]);
        sctx.strokeStyle = "rgba(" + COL.line + ",0.11)";
        sctx.lineWidth = 1;
        sctx.stroke();

        // junction pads at both ends — the detail that reads as "board"
        for (var e = 0; e < 2; e++) {
          var pt = e ? pts[pts.length - 1] : pts[0];
          sctx.beginPath();
          sctx.arc(pt[0], pt[1], 2.6, 0, Math.PI * 2);
          sctx.fillStyle = "rgba(" + COL.pad + ",0.20)";
          sctx.fill();
        }
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(Math.round(rect.width), 1);
      var h = Math.max(Math.round(rect.height), 1);
      // The section grows when the webfonts land and again on any reflow;
      // rebuilding the whole trace layout each time would reshuffle the
      // board under the visitor, so only a real size change counts.
      if (w === W && h === H) return;
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      canvas.classList.add("is-live");
    }

    function frame() {
      if (!running) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (var i = 0; i < pulses.length; i++) {
        var p = pulses[i];
        var tr = traces[p.t];
        if (!tr) { spawnPulse(p, false); continue; }

        p.d += p.speed;
        if (p.d - p.tail > tr.len) { spawnPulse(p, false); continue; }

        var pts = subPath(tr, p.d - p.tail, p.d);
        if (pts.length > 1) {
          var head = pts[pts.length - 1], tail = pts[0];
          var g = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
          g.addColorStop(0, "rgba(" + p.color + ",0)");
          g.addColorStop(1, "rgba(" + p.color + ",0.85)");

          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // a soft bloom right at the head so the pulse reads as a light
          var glow = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 7);
          glow.addColorStop(0, "rgba(" + p.color + ",0.55)");
          glow.addColorStop(1, "rgba(" + p.color + ",0)");
          ctx.beginPath();
          ctx.arc(head[0], head[1], 7, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }

    function start() { if (raf) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    readColours();
    resize();

    onTheme(function () {
      readColours();
      for (var i = 0; i < pulses.length; i++) {
        var c = COL.pulse[(Math.random() * COL.pulse.length) | 0];
        pulses[i].color = c[0] + "," + c[1] + "," + c[2];
      }
      drawStill();
    });

    var resizeTimer;
    function scheduleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 240);
    }
    window.addEventListener("resize", scheduleResize);

    // the section's height also changes without the window changing —
    // webfonts swapping in, the steps grid rewrapping
    if ("ResizeObserver" in window) new ResizeObserver(scheduleResize).observe(canvas);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (canvas.dataset.seen === "1") start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          canvas.dataset.seen = e.isIntersecting ? "1" : "0";
          e.isIntersecting ? start() : stop();
        });
      }, { threshold: 0 }).observe(canvas);
    } else {
      canvas.dataset.seen = "1";
      start();
    }
  }
})();
