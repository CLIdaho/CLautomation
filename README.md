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
| **Nav** | Transparent at the top, frosted once you scroll. A gradient scroll-progress rail on the very top edge, a link underline that follows whichever section you're reading, and the theme picker. |
| **Hero** | A flow field — a few hundred particles following a slowly morphing noise field, each leaving a faint additive stroke that accumulates into drifting ribbons of light. Nothing repeats and nothing is drawn on a grid. Headline, two CTAs, and a live "currently booking *[month]*" badge that updates itself. On the way down the copy climbs and dissolves while the field stays put, so the two layers separate. |
| **Stats strip** | Four animated counters over a slowly drifting telemetry grid, with a light bar sweeping the strip on a long loop. Each stat's accent rule draws itself in when the strip arrives. |
| **Services** | Five priced cards — Custom Website $500 · Automated Texting $500 · Rewards & POS from $2,000 · Growth Support $200/mo · DIY Training $300 — plus a sixth "not sure which you need?" card that routes to the quote form rather than inventing a service. The cards tilt toward the cursor and carry a spotlight that tracks it; two blurred accent orbs drift against the scroll behind them. |
| **How it works** | Four steps built around the actual differentiator — a free working demo before any money changes hands. A progress track above the steps fills with scroll position rather than on a timer, lighting each node as you reach it, over a circuit-board backdrop (see below). |
| **Work** | Two portfolio cards. No visible link: each card opens a modal with a live preview of the site running in a frame, plus an "Open in a new tab" button. Preview is look-and-scroll only — see below. Cards tilt, and the bloom behind each mockup parallaxes. |
| **About** | Photo and the personal pitch. Ownership terms called out explicitly. The portrait parallaxes against its own glow and takes a scan pass every few seconds. |
| **Get a quote** | Working email form — see below. |
| **Everywhere** | Section headings are split into words that climb out of a mask as the block arrives; primary and ghost buttons lean a few pixels toward the cursor. |
| **Mobile** | Sticky bottom action bar, full-screen preview modal, 44px+ tap targets, no horizontal scroll at 375px. Tilt, spotlight, and the magnetic buttons are all gated on `(pointer: fine)` — a tilt that fires on a tap reads as a glitch, not as depth. |

## The theme picker

Four palettes, in the nav on every width: **Signal** (cyan and amber on navy, the
default), **Ember** (hi-vis orange and gold), **Aurora** (mint and sky on deep green),
**Nebula** (magenta and ice). The choice is stored in `localStorage` and restored by a
tiny inline script in `<head>` — applying it from `main.js` would land after the
stylesheet had already painted the default, and every reload would flash cyan on the way
to the colour the visitor picked.

**This is the sales argument, not decoration.** Every colour on the page comes out of one
token block — including both canvas animations, which read the custom properties back out
of the stylesheet at runtime and retint their particles mid-flight. When an owner says
"I don't love the blue," the answer is a toggle instead of a rebuild, and the picker is
the proof sitting in the nav.

Adding a fifth theme is a new `[data-theme="name"]` block in `css/style.css` overriding
the fourteen raw tokens, one `<button data-theme-set="name">` in the picker, the name
added to the regex in the head script, and the same palette mirrored into
`tools/hero-preview.py`. The smoke test checks the first three agree with each other.

### The token names

The accents are named by **role**, not by hue, because a token called `--cyan` holding
orange under the Ember theme is a lie the next person has to decode:

| Token | Role | Signal value |
|---|---|---|
| `--acc` | the build — primary accent | cyan `#2DD4E8` |
| `--acc2` | the town — secondary accent | amber `#FFA53A` |
| `--acc3` | the far end of the gradient | indigo `#5B7CFA` |
| `--acc-mid` | a step between `--acc` and `--acc3`, for text gradients | `#49A8F5` |
| `--ink` | type that sits on top of an accent fill | `#04121a` |

Each has an `-rgb` triplet alongside it so a glow can be written `rgba(var(--acc-rgb), .35)`
without a second variable per opacity. Backgrounds carry `--bg-rgb` for the same reason —
every scrim on the page is a translucent wash of the base colour, so the scrims re-tint too.

## The lower page's ambient layer

The hero's flow field is liquid and organic. The process section gets a deliberately
different one: **etched traces** on a grid with the occasional 45° dogleg, junction pads
where they end, and data pulses running along them. Two ideas, not one idea twice.

The traces never change once generated, so they're rendered once to an offscreen canvas
and blitted each frame; only the pulses are redrawn. Both canvases are gated on an
`IntersectionObserver`, so scrolling past the hero stops the flow field before the circuit
starts — never two animations at once.

Diagonal legs are capped at one grid cell. Letting them run three produced long crossing
lines and the whole thing read as a star chart rather than as a board.

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

Whether the gate is still up is decided from computed style — `display`, `visibility`,
`opacity`, `pointer-events`, and the element's box. **Don't reach for `offsetParent` here:**
it is `null` for anything `position: fixed`, which every overlay of this kind is, so it reads
as "already dismissed" the moment the gate appears and relocks the preview against a gate the
visitor can't answer. That exact bug made the Cloud Hub preview a dead end. `tools/fixtures/age-gate.html`
reproduces the shape of the trap and the smoke test drives it.

## Files

```
index.html                     the whole page
css/style.css                  design tokens in :root, everything derives from them
js/main.js                     nav, theme picker, reveals, counters, parallax,
                               tilt, modal, form, and the two canvases
tools/smoke-test.js            drives the real page in a browser (see Testing)
tools/fixtures/age-gate.html   stand-in blocking overlay the smoke test clicks through
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
the frame is non-interactive while locked, the form intercepts submit, the theme button is
on top and meets 44px at both widths, picking a theme retints and survives a reload, section
headings still read as their own text after being split into words, no horizontal scroll,
no console errors. Plus static checks — every `getElementById` resolves, CSS braces balance,
no undefined custom properties, no missing assets, **no brand colour written literally past
the token block**, every theme overrides the full raw token set, and the head script and the
picker list the same themes.

That literal-colour check is the one that protects the theme picker. The moment a glow or a
canvas constant is written as a hex somewhere further down the sheet, one theme stops being a
full retheme and starts being three quarters of one — and it will be a detail nobody catches
by eye. The clients' own brand colours in the two portfolio mockups are allowlisted in
`MOCK_COLORS`; that list is the only place a literal belongs.

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
python3 tools/hero-preview.py --theme ember   # signal · ember · aurora · nebula
```

The script has no stylesheet to read, so the four palettes are mirrored in a `THEMES` dict
at the top of it. Change a theme in `css/style.css`, change it there too.

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
- **Colors** live in `:root` in `css/style.css`, named by role — `--acc` is the build,
  `--acc2` is the town. Nothing past that block writes a brand colour literally, including
  the two canvas animations, which read the tokens at runtime. That is what makes the theme
  picker work, and the smoke test fails if a literal creeps back in.
- **The transform variables** (`--lift`, `--rx`, `--ry`, `--mgx`, `--mgy`, `--sc`) are the
  contract between the stylesheet and `main.js`, declared together near the top of `:root`.
  Several elements compose more than one effect — a hover lift, a pointer tilt, a magnetic
  pull — and CSS and JS each own some of them. Write to a variable, never to `transform`
  itself, or the last one to run wipes out the others.
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
- All ambient animation is disabled under `prefers-reduced-motion` — both canvases, the
  parallax, the tilt, the orbs, the scan passes, the word reveal. The theme picker still
  works; it's a preference, not motion. The process track renders full rather than sitting
  half-lit against a rail JS is no longer allowed to fill.
