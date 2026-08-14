# CL Automation

Marketing site for **CL Automation** — Charles Lewis's website and business-automation
practice in Boise, Idaho. One page: services, process, portfolio, about, and a working
quote form.

> **Placeholder build.** The copy, pricing, and positioning are a first pass meant to be
> edited. The stats strip ("3 weeks", "24 hr reply") and the About section describe how
> the business is intended to run — read them before sending the link to anyone and change
> anything you wouldn't want to be held to.

**Live:** https://clewiidaho.github.io/CLautomation/ *(enable in Settings → Pages → Deploy
from branch → `main` / root)*

---

## What's on the page

| Section | What it does |
|---|---|
| **Hero** | Animated small-town street grid that routes pulses of light like a circuit board — the whole "big-city build, Main Street business" idea in one visual. Headline, two CTAs, and a live "currently booking *[month]*" badge that updates itself. |
| **Stats strip** | Four animated counters: 3 weeks to launch, $500 starting price, 100% accounts in your name, 24 hr reply time. |
| **Services** | Six cards, priced: Custom Website $500 · Automated Texting $500 · Rewards & POS from $2,000 · Growth Support $200/mo · AI Front Desk (monthly) · DIY Training $300. |
| **How it works** | Four steps built around the actual differentiator — a free working demo before any money changes hands. |
| **Work** | Two portfolio cards. No visible link: each card opens a modal with a live preview of the site running in a frame, plus an "Open in a new tab" button. |
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

## Files

```
index.html                     the whole page
css/style.css                  design tokens in :root, everything derives from them
js/main.js                     nav, reveals, counters, modal, form, hero canvas
assets/
  charles-lewis.jpg            About photo (cropped from the original)
  charles-lewis-original.jpeg  untouched original upload
  og.png                       1200×630 link-preview card
  fonts/                       Space Grotesk, Inter, JetBrains Mono (self-hosted woff2)
```

No build step, no framework, no dependencies. Open `index.html` or run
`python3 -m http.server` and go.

## Editing notes

- **Colors** live in `:root` in `css/style.css`. Cyan is the build, amber is the town.
  Nothing hardcodes a color outside that block, so a retheme is one edit.
- **Prices** appear in the service cards in `index.html` and in the stats strip. Change
  both.
- **Photo:** the original upload had a green `#OPENTOWORK` LinkedIn banner across the
  bottom-left corner. `assets/charles-lewis.jpg` is cropped to remove it. To swap in a new
  photo, drop in a square image at the same path.
- All ambient animation is disabled under `prefers-reduced-motion`.
