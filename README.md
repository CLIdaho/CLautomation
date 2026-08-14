# CL Automation

Marketing site for **CL Automation** — Charles Lewis's website and business-automation
practice in Boise, Idaho. One page: services, process, portfolio, about, and a working
quote form.

> **Placeholder build.** The copy, pricing, and positioning are a first pass meant to be
> edited. The stats strip ("3 weeks", "24 hr reply") and the About section describe how
> the business is intended to run — read them before sending the link to anyone and change
> anything you wouldn't want to be held to.

**Live:** https://clidaho.github.io/CLautomation/ *(enable in Settings → Pages → Deploy
from branch → `main` / root)*

## Before you send this link to anyone

1. **Activate the quote form** — it delivers nothing until you do. Steps below. Until then
   every submission is silently discarded.
2. **Read the copy.** Pricing, the stats strip, and the About section are promises with your
   name on them.
3. **Open it on your phone**, including a portfolio preview, and answer the Cloud Hub age gate.

---

## What's on the page

| Section | What it does |
|---|---|
| **Hero** | A flow field — a few hundred particles following a slowly morphing noise field, each leaving a faint additive stroke that accumulates into drifting ribbons of light. Cyan for the build, amber for the town. Nothing repeats and nothing is drawn on a grid. Headline, two CTAs, and a live "currently booking *[month]*" badge that updates itself. |
| **Stats strip** | Four animated counters: 3 weeks to launch, $500 starting price, 100% accounts in your name, 24 hr reply time. |
| **Services** | Five priced cards — Custom Website $500 · Automated Texting $500 · Rewards & POS from $2,000 · Growth Support $200/mo · DIY Training $300 — plus a sixth "not sure which you need?" card that routes to the quote form rather than inventing a service. |
| **How it works** | Four steps built around the actual differentiator — a free working demo before any money changes hands. |
| **Work** | Two portfolio cards. No visible link: each card opens a modal with a live preview of the site running in a frame, plus an "Open in a new tab" button. Preview is look-and-scroll only — see below. |
| **About** | Photo and the personal pitch. Ownership terms called out explicitly. |
| **Get a quote** | Working email form — see below. |
| **Mobile** | Sticky bottom action bar, full-screen preview modal, 44px+ tap targets, no horizontal scroll at 375px. |

## The quote form (this is the part to finish)

The form posts to **[FormSubmit](https://formsubmit.co)** — free, no account, no server, and
it works on GitHub Pages. Submissions land in `clewisidaho@gmail.com`.

**One-time activation, required before it delivers anything:**

1. Push this repo and open the live site.
2. Submit the form once yourself.
3. FormSubmit emails `clewisidaho@gmail.com` a confirmation link. Click it.
4. Every submission after that arrives in the inbox automatically.

**Recommended second step — hide the email address.** Right now the address sits in the
form's `action` attribute in `index.html`, where scrapers can read it. After activating,
FormSubmit gives you a random alias like `a1b2c3d4e5...`. Swap it in:

```html
<!-- index.html -->
<form ... action="https://formsubmit.co/ajax/YOUR_ALIAS_HERE" ...>
```

Nothing else needs to change.

If the request ever fails, the form doesn't dead-end — it shows the email address with a
prefilled `mailto:` link so the lead still reaches you.

**Free tier caveat:** FormSubmit is free and unmetered but it's a third party with no
uptime guarantee. If volume ever justifies it, [Web3Forms](https://web3forms.com) and
[Formspree](https://formspree.io) are drop-in replacements — same pattern, one URL change.

## Portfolio links

Both portfolio URLs are base64-encoded in `data-site` attributes and decoded by JS, so no
live link is printed on the page or shown in the browser's hover status bar. This hides
them from a visitor casually looking around — it is **not** security. Anyone who opens
devtools can read them. If a project ever needs to be genuinely private, pull it from the
page.

Currently featured:
- **Cloud Hub Vape & Smoke** — Boise retail demo (age gate, rewards, order-ahead, themes)
- **Traffic Flow Solutions** — B2B traffic control plans demo

### The preview is look-and-scroll only

The embedded demo ignores clicks entirely: `pointer-events: none` on the iframe, plus a
`sandbox` attribute that blocks form submission, popups, downloads, and top-level navigation
from inside it. Tab focus is bounced back out so a keyboard can't reach in either. Wheel,
drag, and arrow keys are translated into scroll position for the frame, and a slim indicator
on the right edge stands in for the scrollbar the visitor can't reach.

This works because the demos and this site share the `clidaho.github.io` origin, so the
page can script the frame directly. **If this ever moves to a custom domain, the frames
become cross-origin and the scroll forwarding stops working** — the code detects that and
falls back to a fully interactive preview rather than a dead one.

**Cloud Hub's 21+ age gate is deliberately left clickable.** The preview stays interactive
while the gate is up, watches for it to be dismissed, then locks to scroll-only. The visitor
answers it themselves — that gate is the client's compliance requirement, not decoration, and
a prospect seeing it is a feature. Any future portfolio entry with a blocking overlay can opt
in the same way with `data-preview-gate="<selector>"` on its card.

## Files

```
index.html                     the whole page
css/style.css                  design tokens in :root, everything derives from them
js/main.js                     nav, reveals, counters, modal, form, hero canvas
tools/smoke-test.js            drives the real page in a browser (see Testing)
tools/hero-preview.py          renders a still of the hero animation (see below)
assets/
  icon.svg                     CLA monogram — favicon and the nav mark
  icon-cl.svg                  CL-only variant, denser tabs (see Branding)
  favicon-32.png               raster fallback
  apple-touch-icon.png         180×180 for iOS home screens
  charles-lewis.jpg            About photo (cropped from the original)
  charles-lewis-original.jpeg  untouched original upload
  og.png                       1200×630 link-preview card
  fonts/                       Space Grotesk, Inter, JetBrains Mono (self-hosted woff2)
```

## Testing

```bash
node tools/smoke-test.js        # starts its own server if one isn't running
```

Drives the page in a real browser at desktop and mobile widths and asserts the things that
have actually broken here: the preview opens and closes via the X and Escape, the close
button is on screen and meets 44px, a click at its centre reaches a `[data-close]` element,
the frame is non-interactive while locked, the form intercepts submit, no horizontal scroll,
no console errors. Plus static checks — every `getElementById` resolves, CSS braces balance,
no undefined custom properties, no missing assets.

Needs Chromium and playwright (`npm i -g playwright`); point at a specific binary with
`CHROMIUM_PATH=`. **Run it before pushing.** Two rounds of fixes shipped on reasoning alone
before this existed, and one of them was wrong.

## Branding

The mark is a **CLA monogram** — geometric letterforms knocked out of the cyan → indigo →
amber gradient on a rounded tile. Drawn paths only: the previous favicon used SVG `<text>`
with `font-family: monospace`, which renders with whatever font the viewer's OS supplies and
is ignored outright by some browsers.

Three letters get dense at 16px. On a retina display the tab icon renders at 32px and reads
fine; on a 1× display it's tight. If you'd rather have a crisper tab, `assets/icon-cl.svg` is
the same tile with just **CL** at a larger cap height — swap the `rel="icon"` href, no other
change.

The nav mark is inlined in `index.html` so its gradient can reference the CSS tokens. It's
the same artwork as `assets/icon.svg` — **change one, change both.**

No build step, no framework, no dependencies. Open `index.html` or run
`python3 -m http.server` and go.

## Tuning the hero animation

The constants at the top of `current()` in `js/main.js` are twitchy — the stroke
alpha especially. Too low and the filaments never surface above the background; too
high and additive blending blows the overlaps out to white. `tools/hero-preview.py`
reimplements the identical algorithm on the CPU and writes a still frame, so values can
be changed and reviewed without guessing:

```bash
pip install numpy pillow
python3 tools/hero-preview.py                 # composed, as the page shows it
python3 tools/hero-preview.py --raw           # field only, no vignette or grain
python3 tools/hero-preview.py --seed 12       # a different roll of the noise field
```

Change a constant in the script, look at the output, then mirror it in `js/main.js` —
the two blocks are labelled to be kept in sync. Remember the output is one frame of
something that moves; on the live page the ribbons sweep continuously and read stronger
than any still.

## Editing notes

- **Bump the cache-buster on every CSS or JS change.** `index.html` loads
  `css/style.css?v=2` and `js/main.js?v=2`; increment both. GitHub Pages serves these with
  `cache-control: max-age=600` and no version in the filename, so without the bump a visitor
  who loaded the site in the last ten minutes keeps running the old code — which already cost
  one round of chasing a bug that was fixed and deployed.
- **Colors** live in `:root` in `css/style.css`. Cyan is the build, amber is the town.
  Nothing hardcodes a color outside that block, so a retheme is one edit.
- **Prices** appear in the service cards in `index.html` and in the stats strip. Change
  both.
- **Photo:** the original upload has a green `#OPENTOWORK` LinkedIn banner sweeping across
  the bottom-left. `assets/charles-lewis.jpg` is cropped from `charles-lewis-original.jpeg`
  at `(150, 0) → (768, 612)` — wide enough for the full hat, face, beard and collar. That
  crop clips a corner of the banner, so the affected rows are filled by replicating the
  blurred background pixel to their right and softening the seam. It's a corner of
  out-of-focus background, nothing structural.
  Note the source has **no headroom above the hat** — the crown sits at y≈20 of 800 — so no
  crop can put space above his head. A photo with room above the subject would frame better;
  drop any replacement at the same path and update the `width`/`height` on the `<img>`.
- All ambient animation is disabled under `prefers-reduced-motion`.
