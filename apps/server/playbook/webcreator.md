---
name: webcreator
description: "Build playbook (methodology only) for producing complete, production-ready multi-page static websites for local businesses and service companies. The client intake is performed by Foreman's Web Creator UI, NOT by this document — all answers arrive as a structured CLIENT BRIEF. This playbook defines the build: copywriting voice, fixed conversion-focused layout, sections, formatting, SEO/schema, lead-capture modal, image generation, bilingual delivery, and output. Produces a homepage, individual service pages, Privacy Policy, Terms & Conditions, and optional Spanish versions — all self-contained HTML/CSS/JS deployable to any static host. Lead capture via multi-step modal popup submitted to Pabbly Connect webhooks; appointment booking embedded via third-party widgets."
---

# WebCreator Build Playbook

> **This is a build playbook, not an interview script.** The client interview has already
> been completed through Foreman's Web Creator UI. You receive all answers as a structured
> **CLIENT BRIEF** alongside these instructions. Your job is to BUILD the site by following
> this methodology and filling in the brief's values — never to ask the client questions.
> Where an input is missing, use the documented default or a clearly-marked placeholder.

Produces complete, multi-page static websites for local businesses — homepage, individual service pages, Privacy Policy, Terms & Conditions, and Spanish versions when bilingual. All output is organized across `css/`, `js/`, `images/`, and HTML files deployable to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, Coolify, etc.).

---

## Copywriting Persona & Voice (Apply to ALL copy on every site)

You are a prolific direct-response copywriter who has written thousands of high-converting Google Ads, Facebook Ads campaigns, and landing pages. You think and write like a seasoned pro who has studied thousands of real consumer responses. Before writing a single word of copy, you mentally step into the shoes of the site visitor — their fears, frustrations, desires, and what they need to hear to take action.

### The Golden Rule: Visitor-First Language

**MANDATORY on every page, every section, every line of copy:**

- ✅ Use **"You" and "Your"** as the dominant pronouns — the reader is always the subject
- ❌ Avoid **"We", "Our", "Us", "Our company", "Our team"** — the business is NOT the hero, the visitor is

**Reframe every company-centric sentence into a visitor benefit:**

| ❌ Company-centric (never write this) | ✅ Visitor-focused (always write this) |
|---|---|
| "We've been serving Phoenix for 20 years" | "You get 20 years of proven local experience behind every job" |
| "Our team is licensed and insured" | "Your home is protected — fully licensed and insured technicians, every time" |
| "We offer same-day service" | "Get same-day service when you need it most" |
| "Our prices are competitive" | "You'll know the exact price before any work begins — no surprises" |
| "We use high-quality materials" | "Your repair lasts longer because only premium materials are used" |
| "Our customers love us" | "Join 2,400+ homeowners who finally found a plumber they can trust" |

### Copy Framework for Every Page

Every page has one job: get the reader to contact the business. Before writing any section, Claude defines the page's conversion goal and narrative using the **Page Conversion Strategy** (see end of Step 1). Then for each section, identify and address:

1. **Pain Point** — What problem is the visitor desperately trying to solve right now?
2. **Desire** — What does their ideal outcome look like? What does "fixed" feel like?
3. **Fear / Objection** — What's stopping them from calling? (Price? Getting ripped off? Unreliable contractors?)
4. **Proof** — What evidence removes that fear? (Years in business, reviews, guarantee, license)
5. **CTA** — What's the ONE action you want them to take? Make it urgent and easy.

### Section-by-Section Copywriting Rules

**Hero headline:** Lead with the visitor's desired outcome or biggest pain point — never the company name.
- ❌ "Sunrise Plumbing — Phoenix's Best" 
- ✅ "Stop the Leak Before It Costs You Thousands"
- ✅ "Get a Licensed Phoenix Plumber at Your Door Today"

**Hero sub-headline:** Reinforce the outcome + add a speed/ease/trust element.
- ✅ "Fast same-day service, upfront pricing, and a 100% satisfaction guarantee — so you can stop worrying and get back to your day."

**CTA buttons:** Action-oriented, outcome-focused. Avoid generic labels.
- ❌ "Submit" / "Contact Us" / "Learn More"
- ✅ "Get My Free Quote" / "Book Same-Day Service" / "Yes, Fix My Problem"

**Services section:** Each service card headline = the result the customer gets, not just the service name.
- ❌ "Drain Cleaning"
- ✅ "Drain Cleaning — Clear Clogs Fast, Today"

**About section:** Reframe the company story around the customer's benefit. Why does the owner's experience, passion, or background matter *to the visitor*?

**Testimonials:** Pull out the emotional, outcome-driven quotes. The best testimonials mention a specific fear that was resolved.

**FAQ:** Answer objections directly and confidently. "How much does it cost?" → Give a clear, reassuring answer that removes price anxiety.

**CTA sections:** Create urgency through scarcity, time, or consequence — never fake pressure.
- ✅ "Every hour a burst pipe goes unfixed, the damage grows. Call now and get a tech to your door today."

### Tone Calibration by Business Type

| Business type | Tone |
|---|---|
| Emergency home services (plumbing, HVAC, electrical) | Urgent, reassuring, authoritative |
| Luxury / high-end services | Sophisticated, exclusive, confident |
| Flower / gift delivery | Warm, joyful, emotionally resonant |
| Digital marketing / agency | Direct, results-focused, peer-to-peer |
| General contractor / remodeling | Trustworthy, quality-focused, no-nonsense |

---

## Step 1: Inputs (already collected — DO NOT interview)

**The client interview has already been completed through a separate intake UI. You will NOT ask the client any questions.** All answers are handed to you as a structured CLIENT BRIEF alongside these instructions. Read the brief, map each answer to the variables named below, and build the site. If any input is missing or empty, fall back to the documented default or a clearly-marked placeholder — never stop to ask.

The sections below define every input variable, its default/fallback, and the build rules that depend on it. Treat them as a data dictionary, not a conversation script.

---

### Inputs — Business Identity

Provided in the brief: `BUSINESS_NAME`, `INDUSTRY`, `CITY` (city name only), `STATE` (2-letter abbreviation), `BUSINESS_ADDRESS` (full street address), `PHONE`, `EMAIL`, `GOOGLE_MAPS_IFRAME` (raw iframe embed code, or `null` if not provided), `DOMAIN` (e.g. `sunriseplumbing.com`, or `null` if unknown — only used for og:image, og:url, canonical, and hreflang tags; all internal links use absolute paths like `/terms-and-conditions/`).

The combined `CITY_STATE` = "`CITY`, `STATE`" (e.g. "Phoenix, AZ") is used in copy, meta tags, and schema. `CITY` alone is used for SEO page titles and filenames (lowercase, no spaces, e.g. "phoenix").

**Google Maps placeholder:** If `GOOGLE_MAPS_IFRAME` is not provided, insert this in the footer:
```html
<!-- REPLACE: Paste your Google Maps embed code here -->
<!-- Get it from: Google Maps → Share → Embed a map → Copy HTML -->
<div class="maps-placeholder" style="background:#f2f2f2; height:300px; display:flex; align-items:center; justify-content:center; border-radius:8px;">
  <p style="color:#999; font-family:sans-serif;">Google Maps embed coming soon</p>
</div>
```

---

### Inputs — Services

Provided in the brief:
- `MAIN_SERVICE` — the umbrella service for the homepage (e.g. "Plumbing Services", "Roofing Services"). If empty, derive a sensible umbrella service from `INDUSTRY`.
- `SERVICES` — the list of sub-service pages to build. If empty, propose a reasonable set for the `INDUSTRY` (see `references/industry-services.md`) and proceed.

**Homepage theming rule:** The homepage (`index.html`) is themed around `MAIN_SERVICE`. The hero headline, meta title, h1, and overall copy focus on this umbrella service. The Services section on the homepage showcases all the individual `SERVICES` as sub-services, linking to their dedicated pages. This creates the hub-and-spoke SEO structure — the homepage targets the broad industry keyword while each service page targets a specific long-tail keyword.

---

## CRITICAL URL STRUCTURE RULE — READ CAREFULLY

**All URLs are extensionless (no `.html`).** Every page except the root `index.html` and `404.html` lives inside its own folder as `index.html`, producing clean folder URLs.

| Page | File location (on disk) | Public URL (in `href`, canonical, sitemap, hreflang) |
|---|---|---|
| English homepage | `index.html` | `/` |
| Service page | `[service-slug]/index.html` | `/[service-slug]/` |
| Spanish homepage | `[spanish-home-slug]/index.html` | `/[spanish-home-slug]/` |
| Spanish service page | `[servicio-slug]/index.html` | `/[servicio-slug]/` |
| Privacy Policy (EN) | `privacy-policy/index.html` | `/privacy-policy/` |
| Terms & Conditions (EN) | `terms-and-conditions/index.html` | `/terms-and-conditions/` |
| Privacy Policy (ES) | `politica-de-privacidad/index.html` | `/politica-de-privacidad/` |
| Terms & Conditions (ES) | `terminos-y-condiciones/index.html` | `/terminos-y-condiciones/` |
| 404 page | `404.html` (stays at root) | N/A — served by host on 404 |

**Every `href`, canonical, `og:url`, `hreflang`, and sitemap `<loc>` MUST use the folder URL with trailing slash.** Never link to `/privacy-policy.html` — always `/privacy-policy/`.

**When you see any example in this document showing a URL like `/drain-cleaning.html` or `/privacy-policy.html`, treat it as out-of-date shorthand and apply the clean URL convention instead.** Filenames on disk follow the `[slug]/index.html` pattern above.

Works natively on GitHub Pages, Netlify, Vercel, Cloudflare Pages, and any host that serves `index.html` for folder requests.

---

## CRITICAL NO-PRICING RULE — READ CAREFULLY

**No specific pricing appears ANYWHERE on the website.** Not in the hero, services, banner, FAQs, About, reviews, Privacy, T&C, or any other section. The client's pricing/offer info from the brief is used only to inform positioning — never to generate on-page copy that quotes numbers.

**Forbidden everywhere:**
- Dollar amounts: `$99`, `$199`, `$500+` ❌
- Price ranges: `$99–$299`, `starting at $149` ❌
- "Most customers pay around $200" ❌
- Any numeric reference to cost, fees, rates, charges, or deposits ❌

**Allowed (positioning language that sets expectations without quoting numbers):**
- "Upfront pricing" ✅
- "Free estimates / free consultations / free inspections" ✅
- "No hidden fees" / "No surprises" ✅
- "You'll know the exact price before any work begins" ✅
- "Transparent, flat-rate pricing" ✅
- "Competitive rates" (if true) ✅

Why: prices change, vary by job, and commit the business to something it may not want public. Positioning language reassures visitors without locking in numbers.

This rule applies to English AND Spanish copy, all pages, all sections, all languages.

---

## CRITICAL CONTACT DISPLAY RULE — READ CAREFULLY

**EMAIL is NEVER displayed on the homepage, service pages, hero, footer, navigation, or anywhere except the Privacy Policy and T&C contact sections.** Bots scrape plaintext emails and `mailto:` links and flood the inbox with spam.

**PHONE only appears inside `tel:` button links** (hero CTA, footer CTA) — never as plaintext in the hero body, footer body, nav, or other sections. Exception: Privacy Policy and T&C contact sections may display phone in plaintext (legal context, low spam risk).

Under NO circumstances should you render any of the following on the homepage, service pages, or in the footer:
- `<p>Call us: (555) 123-4567</p>` ❌
- `<p>Email: info@business.com</p>` ❌
- `<a href="mailto:info@business.com">info@business.com</a>` ❌
- `<div class="hero-contact">PHONE | EMAIL</div>` ❌
- Any "contact info" block below the hero buttons ❌
- Email or plaintext phone in the footer ❌

**Where contact info IS allowed:**
- `<a href="tel:PHONE" class="btn-primary">Call Now</a>` ✅ (inside CTA buttons only)
- Privacy Policy and Terms & Conditions contact sections — plaintext phone AND email are both fine here
- JSON-LD schema `telephone` field ✅ (structured data, not visible text)
- Modal popup form fields ✅ (only sent to webhook, not visible as page text)

The hero section has **exactly two CTA buttons and nothing else** after them — no contact info, no trust badges with phone numbers, no "or reach us at..." lines. The footer has logo + business name + two CTA buttons + map (if local). No plaintext phone, no email, anywhere in the footer.

---

## CRITICAL H1 RULE — READ CAREFULLY

**The `<h1>` on EVERY page is the SEO service name. It is NEVER the business name.**

| Page | H1 value |
|---|---|
| Homepage (`index.html`) | `MAIN_SERVICE` + optional location suffix (e.g. `Plumbing Services in Phoenix, AZ` or just `Plumbing Services`) |
| Service pages (`[service-slug]/index.html`) | That service's SEO name (e.g. `Drain Cleaning Phoenix, AZ` or just `Drain Cleaning`) |
| Privacy Policy | `Privacy Policy` |
| Terms & Conditions | `Terms and Conditions` |
| 404 page | `Page Not Found` (or equivalent) |

**WRONG:** `<h1 class="hero-label">Sunrise Plumbing</h1>` ← business name — DO NOT DO THIS
**RIGHT:** `<h1 class="hero-label">Plumbing Services in Phoenix, AZ</h1>` ← SEO service name

The business name appears in the **navigation logo area** (next to the logo image, 22px, uppercase, `--color-primary`) and in the **footer**. It does NOT appear as the H1 on any page.

If `BUSINESS_TYPE = national`, strip any location suffix from the H1 — clean service names only.

`LOCATION_IN_FILENAMES` (yes/no) is provided in the brief. It controls whether the location is appended to each service page's filename, title, and H1 for local SEO:
- Without location: title "Residential Roofing" → `residential-roofing/index.html` (served at `/residential-roofing/`)
- With location: title "Residential Roofing Phoenix, AZ" → `residential-roofing-phoenix-az/index.html` (served at `/residential-roofing-phoenix-az/`)

**Slug & folder derivation rule — MANDATORY:** The slug is always the SEO `<title>` converted to lowercase with spaces replaced by hyphens, commas and punctuation removed, `ñ` → `n`, and all accent marks stripped. That slug becomes a **folder name** containing an `index.html` file. The public URL is the folder path with a trailing slash (no `.html` extension anywhere). The title IS the slug — never derive them independently.

- If **yes**: `<title>Drain Cleaning Phoenix, AZ</title>` → file `drain-cleaning-phoenix-az/index.html`, URL `/drain-cleaning-phoenix-az/`, `<h1>Drain Cleaning Phoenix AZ</h1>`
- If **no**: `<title>Drain Cleaning</title>` → file `drain-cleaning/index.html`, URL `/drain-cleaning/`, `<h1>Drain Cleaning</h1>`

See `references/industry-services.md` for suggestions by vertical. If the industry isn't listed, generate suggestions dynamically.

---

### Inputs — Branding

Provided in the brief: `LOGO`, `FAVICON_LIGHT` (for light browser themes), `FAVICON_DARK` (for dark browser themes), `COLOR_PRIMARY`, `COLOR_HOVER`, `TAGLINE`, `FONT_HEADING`, `FONT_BODY`.

Notes on these inputs:
- A logo may be a URL, a filename already in the project, an uploaded data URL, or absent ("no logo yet" → use a styled text logo placeholder).
- Two favicons (PNG, transparent background): one for light browser tabs (ideally a dark logo), one for dark tabs (ideally a light logo). If only one is provided, use it for both (no theme adaptation). If neither, generate a simple one from `COLOR_PRIMARY`.
- `COLOR_PRIMARY` and `COLOR_HOVER` are HEX codes. If a color is missing, choose an appropriate one for the `INDUSTRY`.
- `TAGLINE` may be empty → write one from the business details.
- Default fonts are `FONT_HEADING` = **Montserrat** (headings, weight 800, capitalized) and `FONT_BODY` = **Open Sans** (body). Use whatever the brief specifies; load both from Google Fonts.

**Logo handling rules:**
- **⚠️ If the brief provides a logo (URL, filename, or uploaded file): use THAT EXACT file, unchanged, as the logo everywhere it appears (header + footer). NEVER generate, redraw, recreate, re-imagine, "clean up", or "improve" the client's logo, and NEVER call `generate_logo` — the client already gave you their brand mark and it is the only correct one. Inventing a different logo is a serious defect.**
- If a URL is provided: use it directly in `<img src="URL">`
- If a filename is provided: reference it as `images/FILENAME`
- If uploaded: treat as `images/FILENAME` using the uploaded file's name
- If none is provided: render a styled TEXT logo using `BUSINESS_NAME` in `FONT_HEADING` and `--color-primary`. Add HTML comment: `<!-- Replace with <img src="images/logo.png"> once logo is ready -->`. Do NOT generate a logo image — a text logo is the correct placeholder. Only ever use `generate_logo` if the brief has no logo AND explicitly asks you to create one.

**Favicon handling rules:**

Two PNGs are collected — `FAVICON_LIGHT` (shown on light browser tabs) and `FAVICON_DARK` (shown on dark browser tabs). Both should have transparent backgrounds.

Path resolution (same rules for both):
- If a URL is provided: use it directly
- If a filename is provided: reference as `images/FILENAME`
- If uploaded: treat as `images/FILENAME`
- If "no favicon yet" or only one was provided: generate/use a single default and point both slots to the same file (no theme adaptation in that case)

**Why a JS swap, not `prefers-color-scheme` media queries:** Chrome does NOT honor the `media` attribute on favicon `<link>` tags. Safari and Firefox do, but Chrome picks the first or last link regardless of the user's theme. Using a tiny JS listener is the only approach that works reliably across all modern browsers.

**Implementation in `<head>`:**
```html
<!-- Set a sensible initial favicon — JS will update it to match the user's theme on load -->
<link rel="icon" id="favicon" type="image/png" href="FAVICON_LIGHT_PATH">
```

**Add to `js/main.js`:**
```js
(function setAdaptiveFavicon() {
  var link = document.getElementById('favicon');
  if (!link) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var lightHref = 'FAVICON_LIGHT_PATH';
  var darkHref  = 'FAVICON_DARK_PATH';
  function update(e) { link.href = (e && e.matches) ? darkHref : (mq.matches ? darkHref : lightHref); }
  update();
  if (mq.addEventListener) mq.addEventListener('change', update);
  else if (mq.addListener) mq.addListener(update); // older Safari
})();
```

Substitute `FAVICON_LIGHT_PATH` and `FAVICON_DARK_PATH` with the actual paths at build time. If only one favicon is available, both paths point to the same file.

**Fallback (if no favicons provided):** generate a simple SVG favicon using the first letter of `BUSINESS_NAME` on a `--color-primary` background (shown the same on both themes):
```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='COLOR_PRIMARY'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='18' fill='white'>B</text></svg>">
```
Replace `COLOR_PRIMARY` with the actual hex value and `B` with the first letter of `BUSINESS_NAME`. No JS swap needed in this case.

- If client approves default fonts: `FONT_HEADING = Montserrat`, `FONT_BODY = Open Sans`
- If client provides changes: use exactly what they specify. Apply only to the stated role (heading or body or both). Keep the unchanged font as its default.

If the client doesn't know their HEX codes, suggest appropriate colors based on their industry and ask them to confirm.

---

### Page Layout — Fixed (No Client Input Needed)

The page layout is fixed and applied to all pages automatically. It is not configurable.

**MANDATORY section order for all pages except Privacy Policy and Terms & Conditions:**

1. Navigation (Header)
2. Hero
3. Why Us
4. About Us
5. Reviews
6. Banner
7. Services
8. Steps To Work With Us
9. FAQs
10. Footer

**This applies to every page** — homepage, every service page, Spanish homepage, and every Spanish service page. All pages use the same 10-section layout. The content of each section is tailored to the specific page's keyword and goal, but the structure never changes.

**This order is fixed and must not be changed, reordered, or have sections removed** unless the client explicitly requests a structural change after seeing the built site. The section alternation and conversion narrative are both calibrated to this exact order.

**Privacy Policy and Terms & Conditions pages** use a simplified layout: Navigation (Header) → full-width content block → Footer. No Hero, no sections, no CTAs beyond the nav. See **Step 7.5** for the full spec and generated content rules.

### Internal Linking — Hub and Spoke (MANDATORY on every service page)

The homepage is the hub. Every service page is a spoke. Every service page must link back to the homepage with a contextual sentence — not just a nav link. This passes SEO authority upward to the main keyword and gives visitors a clear path back.

**Rule:** Every service page must include at least one contextual in-body link back to the homepage (`/`) within the About Us or Why Us section copy. The anchor text should be the main industry keyword for the homepage.

```html
<!-- Example on a Drain Cleaning service page for a plumbing company -->
<p>Looking for a complete <a href="/">Phoenix plumber</a> who handles everything 
from drain cleaning to water heaters? Explore all our services on our homepage.</p>
```

- Anchor text = the homepage's primary SEO keyword (e.g. "Phoenix plumber", "Phoenix HVAC company")
- Link target = `/` (English) or `/SPANISH_HOME_SLUG/` (Spanish service pages)
- Place naturally in the About Us body copy or as a closing sentence in the Why Us section
- Do not force it — it must read naturally in context

---

### Inputs — Features

Provided in the brief:
- `BOOKING_EMBED` — an appointment-booking widget embed (Calendly, Acuity, TidyCal, etc.), or empty if booking is not used.
- `BILINGUAL` (yes/no) and `SPANISH_REGION` (e.g. "Mexican Spanish", "Colombian Spanish", "US Spanish (neutral)", or a specific city/region). When `BILINGUAL = yes`, deliver English `index.html` (at root, served at `/`) plus a Spanish `[spanish-home-slug]/index.html` (served at `/[spanish-home-slug]/`) with a language toggle in the nav.
- `MODAL_WEBHOOK_URL` — the Pabbly Connect webhook the multi-step lead-capture popup submits to. The popup asks the visitor 2–3 qualifying questions, then collects name, phone, and email, and appears in the Hero, Banner, and Footer sections.

---

### Inputs — Social Proof & Extras

Provided in the brief: a hero-image choice (a specific image, or none → use a bold color/gradient background), an FAQ list (or none → write industry-appropriate FAQs), plus the reviews and OG-image inputs handled below.

**OG image handling based on response:**
- If the brief provides an OG image (file or URL) → `OG_IMAGE_SOURCE = client`, use it as-is. Reference it as `images/og-image.webp` (convert to WebP and compress if a file is uploaded) or use the URL directly.
- If the brief says generate or provides nothing → `OG_IMAGE_SOURCE = generated`. Add to `images_manifest.json` (see Step 5 for prompt rules). Store as `OG_IMAGE = images/og-image.webp`.

**Reviews handling (`REVIEWS` array of `{name, city, text}`, and `REVIEWS_SOURCE` = `client` or `generated`, from the brief):**
- If the brief provides real reviews → use them exactly as given. Extract the most emotionally resonant phrase for the `h3` title. Format name as `— First Name Last Name, CITY`.
- If `REVIEWS_SOURCE = generated` or none are provided → write 3 realistic, industry-specific reviews that sound authentic for the business type and city. Each must reference a specific problem solved or fear removed. Add HTML comment on each card: `<!-- Placeholder review — replace with real customer testimonial -->`
- If the brief provides 1–2 real reviews → use those and fill remaining cards with generated placeholders, clearly commented.

---

### Inputs — Audience & Market Research

This is the most important input for copywriting quality. The brief contains the client's answers to the research questions below (grouped as shown). Use them to drive every headline, section, and CTA. Where an answer is thin or missing, infer the most reasonable value for the `INDUSTRY` and `CITY_STATE` and proceed — do not ask.

**Their ideal customer:**
- Who is your perfect customer? (homeowner, renter, business owner, age range, income level?)
- What does their situation look like the moment they realize they need you?

**Their pain & frustration:**
- What's the #1 problem they're desperately trying to solve?
- What words or phrases do they actually use when they call or message you?
- What's the worst-case scenario they're afraid of if they don't get help fast?
- What have they tried before that didn't work?

**Their fears & objections:**
- What's the #1 reason someone might hesitate to hire you?
- What do people in your industry get a bad reputation for? (hidden fees, no-shows, poor work?)
- What questions do you hear most before someone decides to book?

**Their dream outcome:**
- What does life look like for them after you've done the job perfectly?
- Beyond the immediate fix — what deeper need does your service fulfill? (peace of mind, safety, pride, impressing family?)

**Your proof:**
- How long have you been in business, and roughly how many jobs have you completed?
- Are you licensed, insured, or certified? Any memberships or affiliations?
- What's your single best customer story or testimonial?
- Do you offer any kind of guarantee?

**Your edge:**
- Who are your main local competitors?
- What do you do better or differently than them?
- Why do repeat customers keep coming back to you specifically?

**Your offer:**
- What's your typical price range or starting price? *(Note: this informs the positioning only — no specific dollar amounts or ranges will appear on the site. Used to gauge affordability cues and shape language like "upfront pricing" or "free estimates".)*
- Do you offer free estimates, consultations, or inspections?
- Any current promotions or special offers?
- What payment methods do you accept?

**Urgency:**
- Is there a reason to act TODAY vs. waiting? (limited availability, seasonal demand, risk of damage?)
- How fast do you typically respond or show up after contact?

---

### Research Synthesis (Before Writing Any Copy)

Using the research in the brief, synthesize the following internally before touching design or code (do not present it to the client or wait for approval — proceed straight to building):

1. **#1 Pain to lead with** — the most emotionally charged problem → drives the hero headline
2. **#1 Objection to neutralize** — the biggest fear → gets addressed in Trust Bar, FAQ, or About
3. **USP** — the one thing this business does better → woven throughout all copy
4. **Dominant emotion** — urgency / reassurance / trust / exclusivity / joy
5. **Hero headline** — pick the strongest option for the page goal (generate a few internally, choose the best)
6. **Objection map** — which section handles which objection

Then move to the Page Conversion Strategy below.

---

### Page Conversion Strategy (MANDATORY — Complete Before Design or Code)

**Every page has one job: get the reader to contact the business.** Before writing a single line of copy or HTML, Claude must define the conversion goal and narrative strategy for each page. This shapes every headline, every paragraph, every CTA, and every section on that page.

#### Step 1 — Define the Primary Conversion Action per Page

For each page being built, identify the single most important action the visitor should take:

| Page | Primary Conversion Action |
|---|---|
| Homepage (`index.html`) | Call PHONE or open the hero modal to request a quote |
| Service page | Call PHONE or open the modal to request a quote for that specific service |
| Spanish homepage | Same as homepage — call or modal, in Spanish |
| Spanish service page | Same as service page — in Spanish |

All CTAs, headlines, and section copy on a page must funnel toward that one action. If a page has multiple CTAs, they must all point to the same destination — never scatter attention across different goals.

#### Step 2 — Define the Conversion Narrative for Each Page

The conversion narrative is the invisible thread running through every section — it takes the visitor on a journey from "I have a problem" to "these are the right people to call." Map it out before writing:

```
AWARENESS    → Hero: Name the pain. Show you understand exactly what they're going through.
INTEREST     → Why Us: Prove you're different. Address the #1 objection immediately.
DESIRE       → Reviews + About: Social proof and credibility build confidence and desire.
URGENCY      → Banner: Create a reason to act NOW, not later.
ACTION       → Services + Steps: Make it feel easy and low-risk to get started.
COMMITMENT   → FAQs + Footer: Remove last doubts. Make contacting feel like the obvious move.
```

Every section must advance the visitor along this journey. A section that doesn't push the visitor closer to calling has no reason to exist.

#### Step 3 — Write a One-Sentence Page Goal Statement

Before writing any copy, state the goal of each page in one sentence using this format:

> *"The goal of [PAGE NAME] is to convince [IDEAL CUSTOMER] who is experiencing [SPECIFIC PAIN] to call [BUSINESS_NAME] by showing them [KEY PROOF/USP] and making the next step feel [EASY/SAFE/URGENT]."*

**Example:**
> *"The goal of the homepage is to convince Phoenix homeowners with a plumbing emergency to call Sunrise Plumbing by showing them they'll get a licensed tech at their door the same day — with upfront pricing and a satisfaction guarantee — making the call feel like the obvious, risk-free choice."*

This sentence is written internally by Claude before building each page. Every headline and CTA is checked against it. If a piece of copy doesn't serve this goal, it gets rewritten or cut.

#### Step 4 — CTA Hierarchy Rules

Every page must have a clear CTA hierarchy. Never place competing CTAs at the same visual weight:

- **Primary CTA** (one per page, highest visual prominence) — the main conversion action, e.g. "Call Now" or "Get My Free Quote"
- **Secondary CTA** (one per section where relevant) — supports the primary, e.g. "See How It Works" / modal trigger
- **Tertiary CTAs** (in-content links) — navigation aids, e.g. service page links in the Services section

Primary CTA button uses `--color-primary` background with `--color-cta-text`. It appears in: Navigation, Hero, Banner, and Footer — every time the visitor's eye lands at a natural resting point on the page.

#### Step 5 — Every Section Passes the "So What?" Test

Before finalizing any section, Claude asks: *"So what does this mean for the reader?"* If the copy describes what the business does or is, it fails the test. It must instead describe what the reader gets, feels, or avoids.

- ❌ "We've been in business for 15 years." — describes the company
- ✅ "You get 15 years of proven local experience on every job." — describes the reader's benefit

---

## Step 2: Design Direction & Color System

Before writing code, commit to an aesthetic that fits the business type. Reference `/mnt/skills/public/frontend-design/SKILL.md` for full design guidance.

### Business-type aesthetic defaults
| Business type | Suggested aesthetic |
|---|---|
| Home services (plumbing, HVAC, electrical) | Bold, trustworthy — navy/orange, strong typography |
| Luxury / high-end services | Refined minimalist — cream/gold, elegant serif fonts |
| Flower delivery / gifts | Warm editorial — soft colors, organic shapes |
| Digital marketing agency | Modern bold — dark bg, sharp accent colors |
| General contractor | Industrial utilitarian — concrete gray, bright CTA |

Always choose Google Fonts that match the aesthetic. **Default fonts are Montserrat (headings) and Open Sans (body) — client may override.**

### Color System

The client provides exactly two colors. Everything else is derived from them.

**Required client inputs:**
- `COLOR_PRIMARY` — main brand color used for buttons, highlights, and hero background
- `COLOR_HOVER` — hover state for buttons and interactive elements (client-specified, not auto-derived)

**Full CSS variable palette — always define all of these at `:root`:**
```css
:root {
  /* Client-provided */
  --color-primary: /* COLOR_PRIMARY */;
  --color-hover:   /* COLOR_HOVER */;

  /* Derived from primary */
  --color-primary-light: /* lighten COLOR_PRIMARY ~40% — used for tints, pill backgrounds */;
  --color-accent:        /* complementary color to primary — see accent guide below */;

  /* Text colors — chosen based on contrast against background */
  --color-text-dark:  #2d2d2d;   /* default body/heading text on white or gray backgrounds */
  --color-text-light: #ffffff;   /* text on dark/primary-colored backgrounds */
  --color-text-muted: #6b6b6b;   /* secondary text, captions, meta */
  --color-cta-text:   #ffffff;   /* text on primary-colored buttons — use #000000 if primary is very light */

  /* Backgrounds — fixed values, never change */
  --color-bg-white: #ffffff;
  --color-bg-gray:  #f2f2f2;

  /* Utility */
  --color-border: /* very light tint of primary, or #e0e0e0 if primary is very dark */;
}
```

**Accent color guide by primary hue:**
- Blue / navy → warm orange or gold
- Green → soft coral or amber
- Red / coral → deep navy or charcoal
- Orange → deep teal or navy
- Purple → gold or warm yellow
- Brown / earth → sky blue or sage green

**Logo handling:** Client logo lives at `images/LOGO`. Reference as `<img src="images/LOGO" alt="BUSINESS_NAME logo">`. If no logo provided, render business name as styled text using `--color-primary` and the heading font.

### Typography System

**Apply `FONT_HEADING` and `FONT_BODY` from the brief.** Defaults are Montserrat (headings) and Open Sans (body) unless the brief specifies otherwise. Always load both fonts from Google Fonts — construct the `@import` URL using the actual font names from the brief.

```css
/* Load Google Fonts — replace with FONT_HEADING and FONT_BODY as confirmed */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Open+Sans:wght@400;600&display=swap');

/* Heading tags: h1, h2, h3, h4 */
h1, h2, h3, h4 {
  font-family: 'FONT_HEADING', sans-serif;
  font-weight: 800;
  text-transform: capitalize;
  text-align: left;
  /* Color: set per-context — see rule below */
}

/* Body / paragraph text */
p, li, label, input, textarea, select, blockquote {
  font-family: 'FONT_BODY', sans-serif;
  /* Color: set per-context — see rule below */
}
```

**Heading and text color rule — apply based on section background:**
```css
/* On white (#ffffff) or gray (#f2f2f2) backgrounds */
h1, h2, h3, h4, p { color: var(--color-text-dark); }

/* On primary-colored or dark backgrounds (hero, footer, dark cards) */
h1, h2, h3, h4, p { color: var(--color-text-light); }
```
Never hardcode a color on a heading or paragraph — always use `--color-text-dark` or `--color-text-light` depending on the section background. This ensures every section is readable without manual overrides.

**Heading size scale — consistent across the ENTIRE page:**
```css
h1 { font-size: clamp(2rem, 5vw, 3.5rem); }   /* Hero only */
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); } /* ALL h2 tags — same size everywhere */
h3 { font-size: clamp(1.1rem, 2vw, 1.4rem); }  /* ALL h3 tags — same size everywhere */
h4 { font-size: 1.1rem; }
```

**MANDATORY: Do not override h2 or h3 sizes in individual sections.** Every `h2` on the page must render at the same size. Every `h3` must render at the same size. Set them once globally and never override them with section-specific CSS.

### Section Background Alternation

**MANDATORY: Sections MUST alternate between white and `#f2f2f2` gray. Never place two same-color sections back-to-back.**

| Section | Background |
|---|---|
| Navigation | `--color-bg-white` + subtle bottom shadow |
| Hero | `--color-primary` or branded gradient using primary |
| Why Us | `--color-bg-gray` (`#f2f2f2`) |
| About Us | `--color-bg-white` |
| Reviews | `--color-bg-gray` (`#f2f2f2`) |
| Banner | `--color-primary` (always — this is a CTA strip) |
| Services | `--color-bg-white` |
| Steps To Work With Us | `--color-bg-gray` (`#f2f2f2`) |
| FAQs | `--color-bg-white` |
| Footer | `--color-text` (dark) with light-colored text |

The Banner section always uses `--color-primary` regardless of position — skip it when calculating the white/gray alternation sequence for surrounding sections. The fixed layout produces this alternation pattern and must not change.

---

## Step 3: Site Structure

All pages use the fixed layout defined above. Build sections in this exact order:

### Section Copy Rules (Apply to Every Section)

**MANDATORY — every section title, subtitle, and body copy must follow these rules:**

- **Titles (`h2`) speak directly to the reader** — use "you/your", address a benefit or pain point, and make the reader feel understood. Never use generic labels.
  - ❌ "Our Services" / "About Us" / "FAQ"
  - ✅ "Everything You Need, Done Right the First Time"
  - ✅ "Why Hundreds of [CITY] Homeowners Trust Us"
  - ✅ "Got Questions? We've Got Straight Answers."

- **Subtitles (`p` below the h2) reinforce the benefit** — one or two sentences that expand on the title promise, using "you" language and connecting to the reader's desired outcome or fear.

- **Card/item headings (`h3`) are outcome-driven** — what the reader gets, not just what the service is called.
  - ❌ "Licensed & Insured"
  - ✅ "Your Home Is Protected — Every Tech Is Licensed & Fully Insured"

- **CTAs inside sections are action-specific** — tie the button text to the specific outcome of that section.
  - ❌ "Contact Us" / "Learn More"
  - ✅ "Claim Your Free Quote" / "See How It Works" / "Read More Reviews"

- **Every section must have a reason to exist on the page** — it either removes an objection, builds trust, demonstrates value, or drives the reader closer to calling. If a section doesn't do one of these, cut it.

---

### Section List

1. **Navigation (Header)**

   **Layout & Identity:**
   - White background, sticky (`position: sticky; top: 0; z-index: 100`), subtle bottom shadow (`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`)
   - Height kept as low as possible — minimal padding (`padding: 6px 0`), no unnecessary margins
   - Left side: logo image (`width: 50px; height: auto`) + company name as a text element side by side, both wrapped in an `<a href="/">` link
     - Company name styles: `font-size: 22px; font-weight: 800; text-transform: uppercase; color: var(--color-primary); text-decoration: none`
   - Right side: nav menu (desktop) or hamburger icon (mobile)
   - **No buttons anywhere in the nav bar or menu**

   **Menu items (desktop, right-aligned):**
   - All menu link text: `color: var(--color-primary); font-weight: 600; background: white`
   - On hover: `background-color: var(--color-hover); color: #ffffff` — applied to the entire clickable area of the item
   - All URLs lowercase with single hyphens instead of spaces and a trailing slash (e.g. `/drain-cleaning-phoenix-az/`)
   - All paths are **absolute from root** — always start with `/` and end with `/` (no `.html` extension)

   **Menu structure:**
   ```
   Home  |  Services ▾  |  About Us ▾
   ```

   - **Home** — links to `/`

   - **Services ▾** — dropdown with chevron icon (`▾` or SVG chevron) on the right of the label. Contains one link per service page:
     - Anchor text = service name only, no city/location (e.g. "Drain Cleaning")
     - href = absolute folder URL with trailing slash (e.g. `/drain-cleaning-phoenix-az/`)
     - This applies whether `LOCATION_IN_FILENAMES` is yes or no

   - **About Us ▾** — dropdown with chevron icon on the right. Contains:
     - "About Us" → anchor link to the `#about-us` section **of the correct home page** (see rules below)
     - "Privacy Policy" → `/privacy-policy/`
     - "Terms & Conditions" → `/terms-and-conditions/`

   **About Us anchor link — MANDATORY bilingual logic:**

   The "About Us" link must always point to the `#about-us` section of whichever home page matches the current page's language. Use absolute paths so the link works correctly from any page depth.

   **Home page locations:**
   - English homepage: always `index.html` at the project root → served at `/`
   - Spanish homepage: lives inside its own folder as `[spanish-home-slug]/index.html` → served at `/[spanish-home-slug]/`. The slug is derived from the Spanish translation of the business's main service, following the standard slug rule (SEO title → lowercase, hyphens, no accents, no ñ). Examples:
     - Roofing company → `compania-de-techos/index.html` → served at `/compania-de-techos/`
     - Plumbing company → `plomeria-en-phoenix-az/index.html` → served at `/plomeria-en-phoenix-az/`
     - HVAC company → `servicio-de-aire-acondicionado-phoenix-az/index.html` → served at `/servicio-de-aire-acondicionado-phoenix-az/`
   - Store the slug as `SPANISH_HOME_SLUG` (and the folder URL `/SPANISH_HOME_SLUG/` as `SPANISH_HOME_URL`) — derived when building the Spanish homepage

   | Current file | Language | About Us href |
   |---|---|---|
   | `index.html` or any English page | English | `/#about-us` |
   | Spanish homepage or any Spanish page | Spanish | `/SPANISH_HOME_SLUG/#about-us` |

   **Implementation:** Hardcode the correct href in each file's nav HTML at build time — do not use JavaScript to detect language at runtime. The English nav always contains `href="/#about-us"`. The Spanish nav always contains `href="/SPANISH_HOME_SLUG/#about-us"` with the actual slug substituted.

   The `#about-us` ID must be present on the About Us `<section>` in both the English and Spanish homepages:
   ```html
   <section class="about-us" id="about-us">
   ```

   **Anchor text localization:**
   - English nav: "About Us"
   - Spanish nav: "Quiénes Somos" (or locale-appropriate equivalent based on `SPANISH_REGION`)

   **Dropdown behavior:**
   - Dropdowns appear on hover (desktop) or tap (mobile)
   - Dropdown panel appears **directly below** the parent item, aligned to the **left edge** of the parent — never to the right, to prevent overflowing off-screen or overlapping page content
   - Dropdown panel: white background, `box-shadow: 0 4px 16px rgba(0,0,0,0.1)`, `border-radius: 4px`, `min-width: 200px`
   - Each dropdown item has the same hover rule: `background-color: var(--color-hover); color: #ffffff`
   - Chevron rotates 180° when dropdown is open (`transform: rotate(180deg); transition: transform 0.2s`)

   **Hamburger menu (breakpoints < 750px):**
   - Show hamburger icon (☰), hide desktop nav
   - Tapping hamburger opens a full-width dropdown panel below the header
   - Mobile menu shows all items vertically: Home, Services (expandable), About Us (expandable)
   - Sub-items indent under their parent when expanded
   - Same hover/active color rules apply
   - Tapping outside or tapping the × icon closes the menu

   **Service link rule (applies everywhere — nav, footer, in-page CTAs):**
   - Anchor text = service name only, never includes city or location
   - href = full SEO slug with city/location when `LOCATION_IN_FILENAMES = yes`
   ```html
   <!-- LOCATION_IN_FILENAMES = yes -->
   <a href="/drain-cleaning-phoenix-az/">Drain Cleaning</a>

   <!-- LOCATION_IN_FILENAMES = no -->
   <a href="/drain-cleaning/">Drain Cleaning</a>
   ```

2. **Hero Section**

   ### Background Image
   - Generated via the Google Gemini API (see Step 6.6) using a prompt specific to the page's service, industry, and city
   - Aspect ratio: `16:9`, resolution: `2K`, format: WebP compressed
   - Filename: `hero-bg.webp` (homepage) or `hero-[service-slug].webp` (service pages)
   - Applied as a CSS background image on the `<section class="hero">` element:
   ```css
   .hero {
     background-image: url('../images/hero-bg.webp');
     background-size: cover;
     background-position: center;
     background-repeat: no-repeat;
     position: relative;
   }
   ```

   ### HTML Structure
   ```html
   <section class="hero">
     <div class="container">
       <div class="hero-content">
         <!-- Language toggle — ABOVE the h1 (only present if BILINGUAL = yes) -->
         <!-- On English pages: links to /SPANISH_HOME_SLUG/ with label "ESPAÑOL" -->
         <!-- On Spanish pages: links to / with label "ENGLISH" -->
         <a href="/SPANISH_HOME_SLUG/" class="lang-toggle" aria-label="Ver en Español">
           <i class="fa-solid fa-language" aria-hidden="true"></i> ESPAÑOL
         </a>
         <h1 class="hero-label">SERVICE PAGE NAME</h1>
         <h2 class="hero-headline">SUBTITLE</h2>
         <p class="hero-body">BODY COPY</p>
         <div class="hero-ctas">
           <a href="tel:PHONE" class="btn-primary">CTA BUTTON 1</a>
           <button class="btn-secondary" data-modal="hero-modal">CTA BUTTON 2</button>
         </div>
       </div>
     </div>
   </section>
   ```

   ### hero-content Rules
   - `width: 100%` — takes the full width of its parent `.container`. **No max-width.**
   - **Padding: `20px` on all sides. Zero margin.**
   - Background: semi-transparent dark overlay applied directly on `.hero-content`:
   ```css
   .hero-content {
     width: 100%;
     background-color: rgba(0, 0, 0, 0.75);
     padding: 20px;
     margin: 0;
     text-align: left;
   }
   ```
   - All text inside `.hero-content` is left-aligned

   ### Typography Inside hero-content

   **`h1.hero-label` — Service page name:**
   ```css
   .hero-label {
     font-size: 18px;
     font-weight: 800;
     text-transform: uppercase;
     color: var(--color-primary);
     margin-bottom: var(--space-xs);
   }
   ```

   **`h2.hero-headline` — Subtitle:**
   ```css
   .hero-headline {
     font-size: 3rem;
     font-weight: 800;
     color: #ffffff;
     margin-bottom: var(--space-sm);
     line-height: 1.15;
   }
   ```

   **`p.hero-body` — Supporting copy:**
   ```css
   .hero-body {
     font-size: 1.5rem;
     font-weight: 600;
     color: #ffffff;
     margin-bottom: var(--space-lg);
     max-width: 100%;
   }
   ```

   ### Copy Rules for Hero Text
   - **`h1.hero-label`** — the exact name of the service page (e.g. "Drain Cleaning Phoenix AZ" or "Drain Cleaning") — pulled directly from the page title, uppercase
   - **`h2.hero-headline`** — a compelling headline that speaks directly to the reader's pain point or desired outcome. Visitor-focused, not company-focused. Examples:
     - ✅ "Stop the Leak Before It Destroys Your Home"
     - ✅ "Same-Day Service When You Need It Most"
     - ❌ "Welcome to Sunrise Plumbing"
   - **`p.hero-body`** — 1–2 sentences expanding on the headline. Addresses a fear or desire. Reinforces urgency or trust. Examples:
     - ✅ "A burst pipe won't wait — and neither will we. Get a licensed tech at your door today, with upfront pricing and zero surprises."
     - ✅ "You deserve flowers that arrive fresh, on time, and exactly as beautiful as you imagined."

   ### CTA Buttons
   - Two buttons displayed side by side, centered horizontally inside `.hero-content`:
     - **Primary**: links to `tel:PHONE` — label like "Call Now" or "Call (602) 555-1234"
     - **Secondary**: opens the hero modal (`data-modal="hero-modal"`) — label like "Get My Free Quote" or "See How It Works"
   - Button container:
   ```css
   .hero-ctas {
     display: flex;
     flex-wrap: wrap;
     gap: var(--space-sm);
     justify-content: center;
   }
   ```
   - When both buttons no longer fit side by side, they stack vertically (handled by `flex-wrap: wrap`)
   - **At breakpoints < 700px**: each button is `width: 100%`
   ```css
   @media (max-width: 700px) {
     .hero-ctas .btn-primary,
     .hero-ctas .btn-secondary {
       width: 100%;
     }
   }
   ```

3. **Why Us Section**

   ### Font Awesome 7 Setup (used across the site)

   Include once in `<head>` — use the latest available version on cdnjs. As of the current build, FA7 is available on cdnjs. Always verify the version is current before writing the link:
   ```html
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
   ```
   **Icon class syntax for FA7 Free:**
   - Solid icons: `<i class="fa-solid fa-[icon-name]"></i>`
   - Brand icons: `<i class="fa-brands fa-[icon-name]"></i>`
   - FA7 Free includes: Solid style + Brands. Regular/Light/Duotone are Pro only.

   **MANDATORY icon validation rule:** Before using any Font Awesome icon name, verify it exists in FA7 Free by checking `https://fontawesome.com/icons?s=solid&o=r&f=classic`. Only use icons confirmed available in the Solid free set. Never guess icon names — a wrong name renders as a blank square. Common safe FA7 Free solid icons include: `fa-check`, `fa-shield`, `fa-star`, `fa-clock`, `fa-phone`, `fa-wrench`, `fa-bolt`, `fa-house`, `fa-user`, `fa-thumbs-up`, `fa-award`, `fa-handshake`, `fa-tools`, `fa-leaf`, `fa-truck`, `fa-certificate`, `fa-dollar-sign`, `fa-heart`, `fa-circle-check`, `fa-triangle-exclamation`.

   ---

   ### HTML Structure

   ```html
   <section class="why-us">
     <div class="container">
       <h2 class="section-title">COMPELLING HEADLINE</h2>
       <p class="section-intro">INTRODUCTION PARAGRAPH</p>
       <div class="why-us-grid">
         <div class="why-us-card">
           <i class="fa-solid fa-[icon]"></i>
           <h3>CARD TITLE</h3>
           <p>CARD BODY</p>
         </div>
         <!-- repeat × 3 -->
       </div>
     </div>
   </section>
   ```

   ### Section Title (`h2.section-title`)
   - Left-aligned
   - Highly converting — speaks directly to the reader's needs or pain points
   - Uses "you/your" language — never "we" or "our"
   - Examples:
     - ✅ "Here's Why Phoenix Homeowners Choose Us Over Anyone Else"
     - ✅ "You Deserve a Contractor Who Actually Shows Up — Here's Our Promise"
     - ❌ "Why Choose Us"

   ### Introduction Paragraph (`p.section-intro`)
   - Left-aligned
   - **40–60 words** — no more, no less. Tight and scannable.
   - Bridges the headline to the cards below — summarizes the 3 reasons in a single natural sentence or two
   - Uses visitor-first language — "you get", "your home", "your time"
   - `width: 100%` of the container
   - Add bottom margin (`margin-bottom: var(--space-lg)`) to create breathing room before the cards
   ```css
   .section-intro {
     width: 100%;
     text-align: left;
     margin-bottom: var(--space-lg);
     font-size: 1rem;
     line-height: 1.7;
     color: var(--color-text-dark);
   }
   ```

   ### 3 Cards (`div.why-us-card`)
   - Exactly 3 cards — not 4, not 2
   - Content is **left-aligned** and **vertically stacked**: icon → h3 → p
   - Grid: 1 column mobile → 3 columns desktop
   ```css
   .why-us-grid {
     display: grid;
     grid-template-columns: 1fr;
     gap: var(--space-md);
   }
   @media (min-width: 768px) {
     .why-us-grid { grid-template-columns: repeat(3, 1fr); }
   }
   .why-us-card {
     background: var(--color-bg-white);
     border-radius: 8px;
     padding: var(--space-md);
     box-shadow: 0 2px 12px rgba(0,0,0,0.07);
     display: flex;
     flex-direction: column;
     align-items: flex-start;
     gap: var(--space-xs);
   }
   .why-us-card i {
     font-size: 2rem;
     color: var(--color-primary);
     margin-bottom: var(--space-xs);
   }
   .why-us-card h3 {
     margin: 0;
     color: var(--color-text-dark);
   }
   .why-us-card p {
     margin: 0;
     color: var(--color-text-muted);
   }
   ```

   ### Card Content Rules
   - Each card neutralizes one specific fear or objection from the Research Synthesis objection map
   - Icon: one relevant FA7 Free solid icon per card — validated before use
   - `h3` — outcome-driven, visitor-focused (not a feature label)
     - ❌ "Licensed & Insured"
     - ✅ "Your Home Is 100% Protected — Every Job Is Fully Licensed & Insured"
   - `p` — 1–2 sentences expanding on the h3. Explains the benefit in plain language, not marketing jargon. 20–40 words max.

   ### Card Topic Selection
   Pull the 3 topics directly from the Research Synthesis objection map. Default topics if research is sparse:
   - **Card 1** — Reliability / showing up on time
   - **Card 2** — Transparent / upfront pricing (no hidden fees)
   - **Card 3** — Quality guarantee / licensed & insured

4. **About Us Section**

   ### Layout — Two-Column Split

   Desktop: two equal columns side by side (50% / 50%). Mobile: stacked — text on top, image below.

   ```html
   <section class="about-us" id="about-us">
     <div class="container">
       <div class="about-us-grid">

         <!-- Left column: text -->
         <div class="about-us-text">
           <h2 class="section-title">COMPELLING HEADLINE</h2>
           <p>PARAGRAPH 1</p>
           <p>PARAGRAPH 2</p>
         </div>

         <!-- Right column: image -->
         <div class="about-us-image">
           <img src="/images/about-us.webp" alt="BUSINESS_NAME — ALT TEXT" loading="lazy">
         </div>

       </div>
     </div>
   </section>
   ```

   ```css
   .about-us-grid {
     display: grid;
     grid-template-columns: 1fr;
     gap: var(--space-lg);
     align-items: center;
   }
   @media (min-width: 768px) {
     .about-us-grid {
       grid-template-columns: 1fr 1fr;
     }
   }
   .about-us-text {
     display: flex;
     flex-direction: column;
     gap: var(--space-sm);
   }
   .about-us-image img {
     width: 100%;
     height: auto;
     border-radius: 8px;
     display: block;
   }
   ```

   ---

   ### Left Column — Text

   **`h2.section-title`** — left-aligned, highly converting, speaks directly to the reader's pain point or need. Uses "you/your" language.
   - ❌ "About Our Company"
   - ✅ "You Deserve a Plumber Who Treats Your Home Like Their Own"
   - ✅ "What Makes Us the Team Phoenix Families Call First"

   **Body copy — two paragraphs, 100–130 words total:**
   - Both paragraphs left-aligned
   - **Paragraph 1** — addresses the reader's pain, frustration, or desire directly. Connects emotionally. Acknowledges what they've been through or what they're worried about.
   - **Paragraph 2** — introduces the business as the answer. Reframes company history, credentials, and values entirely in terms of what the reader gains. Never lists features — only benefits.
   - Visitor-first language throughout: "you get", "your time", "your family", "your home"
   - No "we've been in business since..." unless immediately reframed as a benefit to the reader
   - Word count: **minimum 100 words, maximum 130 words** across both paragraphs combined

   ---

   ### Right Column — Image

   **Generated via Gemini API** (Step 6.6). Add to `images_manifest.json`:
   ```json
   {
     "filename": "about-us.webp",
     "section": "About Us",
     "aspect_ratio": "1:1",
     "resolution": "1K",
     "prompt": "..."
   }
   ```

   **Prompt rules for About Us image:**
   - Subject: a professional in the relevant trade or industry, presented warmly and confidently in a real working environment
   - Setting: on-site or in context — a plumber at a kitchen, a landscaper in a backyard, a florist arranging flowers, a contractor at a job site
   - Mood: trustworthy, approachable, competent — this image must make the reader feel safe choosing this business
   - Style: warm natural lighting, photorealistic, shallow depth of field preferred
   - Always end prompt with: `"Photorealistic, warm and professional atmosphere. No text, logos, or watermarks in the image."`

   **Example prompts:**
   - Plumbing: *"A friendly male plumber in a clean uniform kneeling beside a kitchen sink in a bright modern home, smiling confidently at the camera. Warm natural light. Photorealistic, warm and professional atmosphere. No text, logos, or watermarks in the image."*
   - HVAC: *"A professional HVAC technician in a plain unbranded work uniform inspecting an air conditioning unit on the side of a suburban home, bright sunny day. Photorealistic, warm and professional atmosphere. No text, logos, or watermarks in the image."*
   - Flower delivery: *"An elegantly dressed female florist arranging a large bouquet of fresh roses and greenery on a marble countertop in a bright studio. Photorealistic, warm and professional atmosphere. No text, logos, or watermarks in the image."*

5. **Reviews Section**

   ### HTML Structure

   ```html
   <section class="reviews">
     <div class="container">
       <h2 class="section-title">COMPELLING HEADLINE</h2>
       <p class="section-intro">INTRODUCTION PARAGRAPH</p>
       <div class="reviews-grid">

         <div class="review-card">
           <i class="fa-solid fa-quote-left review-icon"></i>
           <h3 class="review-title">HIGH-CONVERTING TITLE</h3>
           <p class="review-body">REVIEW TEXT</p>
           <p class="review-name">— Reviewer Name</p>
         </div>

         <!-- repeat × 3 total -->

       </div>
     </div>
   </section>
   ```

   ---

   ### Section Title (`h2.section-title`)
   - Left-aligned
   - Speaks to the reader's fear of making the wrong choice or desire for reassurance
   - Uses social proof framing — positions real customers as the proof
   - Examples:
     - ✅ "Don't Just Take Our Word for It — Here's What Your Neighbors Are Saying"
     - ✅ "Real Results from Real Homeowners in CITY"
     - ✅ "See Why CITY Families Keep Calling Us Back"
     - ❌ "Customer Reviews" / "Testimonials"

   ---

   ### Introduction Paragraph (`p.section-intro`)
   - Left-aligned
   - **40–60 words** — tight and scannable
   - Frames the reviews as proof that removes the reader's skepticism — not just "here are some nice things people said"
   - Visitor-first language: "you can trust", "your neighbors", "people just like you"
   - `width: 100%` of the container, `margin-bottom: var(--space-lg)` for spacing before cards

   ```css
   .section-intro {
     width: 100%;
     text-align: left;
     margin-bottom: var(--space-lg);
     font-size: 1rem;
     line-height: 1.7;
     color: var(--color-text-dark);
   }
   ```

   ---

   ### Review Icon

   All 3 cards use the **same icon**: `fa-quote-left` from Font Awesome 7 Free Solid.

   ```html
   <i class="fa-solid fa-quote-left review-icon"></i>
   ```

   Verified available in FA7 Free Solid set. Styled:
   ```css
   .review-icon {
     font-size: 2rem;
     color: var(--color-primary);
     margin-bottom: var(--space-xs);
   }
   ```

   ---

   ### 3 Review Cards

   **Grid layout** — 1 column mobile → 3 columns desktop:
   ```css
   .reviews-grid {
     display: grid;
     grid-template-columns: 1fr;
     gap: var(--space-md);
   }
   @media (min-width: 768px) {
     .reviews-grid { grid-template-columns: repeat(3, 1fr); }
   }
   .review-card {
     background: var(--color-bg-white);
     border-radius: 8px;
     padding: var(--space-md);
     box-shadow: 0 2px 12px rgba(0,0,0,0.07);
     display: flex;
     flex-direction: column;
     align-items: flex-start;
     gap: var(--space-xs);
   }
   ```

   **Card structure — vertically stacked, left-aligned:**
   1. `<i class="fa-solid fa-quote-left review-icon">` — quote icon, `color: var(--color-primary)`
   2. `<h3 class="review-title">` — high-converting title (see rules below)
   3. `<p class="review-body">` — the review text
   4. `<p class="review-name">` — reviewer's name in cursive

   **`h3.review-title` rules:**
   - Must capture the single most emotionally powerful thing the reviewer experienced
   - Speaks to a pain point that was resolved or a desire that was fulfilled
   - Written as if the reviewer is speaking directly to the next potential customer
   - Examples:
     - ✅ "They Fixed What Three Other Plumbers Couldn't"
     - ✅ "Finally — Someone Who Actually Shows Up on Time"
     - ✅ "Worth Every Penny. My AC Hasn't Felt This Good in Years."
     - ❌ "Great Service!" / "Highly Recommend" / "5 Stars"

   ```css
   .review-title {
     color: var(--color-text-dark);
     margin: 0;
   }
   ```

   **`p.review-body` rules:**
   - 2–4 sentences, 30–60 words
   - Written in the reviewer's natural voice — conversational, specific, credible
   - Must mention at least one specific detail: a problem solved, a fear removed, a result achieved, or how fast/easy the experience was
   - Avoid generic superlatives ("amazing", "fantastic") without specifics to back them up
   - If testimonials were provided in the brief: use them, extract the most emotionally resonant excerpt, and write the `h3` title around its core message
   - If no testimonials were provided: write realistic, industry-specific reviews that sound authentic — not marketing copy. Make them plausible for the city, industry, and business type. Add an HTML comment: `<!-- Placeholder review — replace with real customer testimonial -->`

   ```css
   .review-body {
     color: var(--color-text-muted);
     margin: 0;
     font-size: 0.95rem;
     line-height: 1.6;
   }
   ```

   **`p.review-name` — name in cursive:**
   - Format: `— First Name Last Name, CITY` (e.g. `— Maria González, Phoenix`)
   - Rendered in a cursive Google Font. Default: `'Dancing Script'` — load it alongside the other Google Fonts:
   ```html
   <!-- Add to existing Google Fonts @import -->
   family=Dancing+Script:wght@600
   ```
   ```css
   .review-name {
     font-family: 'Dancing Script', cursive;
     font-size: 1.1rem;
     font-weight: 600;
     color: var(--color-primary);
     margin: 0;
   }
   ```

6. **Banner Section**

   ### Background
   The banner always uses `--color-primary` as its background, marked `!important` to override the alternating section color system.

   ```css
   .banner {
     background-color: var(--color-primary) !important;
   }
   ```

   ### HTML Structure

   ```html
   <section class="banner">
     <div class="container">
       <p class="banner-text">PERSUASIVE TEXT</p>
       <div class="banner-ctas">
         <a href="tel:PHONE" class="btn-banner-primary">CTA BUTTON 1</a>
         <button class="btn-banner-secondary" data-modal="hero-modal">CTA BUTTON 2</button>
       </div>
     </div>
   </section>
   ```

   ### Banner Text (`p.banner-text`)
   - Centered horizontally
   - `font-weight: 700`, `font-size: 25px`, `color: #ffffff`
   - 1–2 sentences that create urgency and compel the reader to click one of the buttons below
   - Speaks directly to what they'll gain or what they'll lose by waiting
   - Examples:
     - ✅ "Every minute you wait, the damage gets worse — and the repair gets more expensive. Call now and get a licensed tech at your door today."
     - ✅ "Your neighbors are already calling us. Don't wait until it's an emergency — get your free quote right now and lock in today's pricing."
     - ❌ "Contact us today for more information about our services."

   ```css
   .banner-text {
     font-size: 25px;
     font-weight: 700;
     color: #ffffff;
     text-align: center;
     margin-bottom: var(--space-lg);
     max-width: 800px;
     margin-left: auto;
     margin-right: auto;
   }
   ```

   ### CTA Buttons
   Same layout rules as the Hero section (flex, wrap, center, full-width at < 700px). Two buttons:

   **Primary button (`btn-banner-primary`)** — same label as hero primary CTA (`tel:PHONE`):
   - Background: `#000000` (black)
   - Text color: `#ffffff`
   - On hover: background becomes `var(--color-hover)`
   - Text color on hover remains `#ffffff`

   **Secondary button (`btn-banner-secondary`)** — same label as hero secondary CTA (opens modal):
   - Identical to the hero secondary button — no changes

   ```css
   .banner-ctas {
     display: flex;
     flex-wrap: wrap;
     gap: var(--space-sm);
     justify-content: center;
   }
   .btn-banner-primary {
     background-color: #000000;
     color: #ffffff;
     text-decoration: none;
     /* inherit padding, border-radius, font from global .btn styles */
     transition: background-color 0.2s;
   }
   .btn-banner-primary:hover {
     background-color: var(--color-hover);
     color: #ffffff;
   }
   @media (max-width: 700px) {
     .banner-ctas .btn-banner-primary,
     .banner-ctas .btn-banner-secondary {
       width: 100%;
     }
   }
   ```

7. **Services Section**

   ### Step A — Research & Service Selection (MANDATORY before writing copy or generating images)

   Before writing any copy or building this section, Claude must:

   1. **Search for popular websites in the current page's industry and city** to understand how top-performing competitors present their services. Search query: `"[INDUSTRY] services [CITY]"` or `"best [INDUSTRY] company [CITY]"`. Review 2–3 results to understand common service framing and benefit language used in this market.

   2. **Select exactly 4 services** from the confirmed `SERVICES` list that are most relevant to the current page's goal. For the homepage, pick the 4 most popular/universal services. For a service page, pick the 4 most closely related services. If the client has fewer than 4 confirmed services, use all of them.

   3. **Write service card copy informed by the research** — framing, benefit language, and objection handling should reflect how real customers in this market think and speak.

   ---

   ### HTML Structure

   ```html
   <section class="services-section">
     <div class="container">
       <h2 class="section-title">COMPELLING HEADLINE</h2>
       <p class="section-intro">INTRODUCTION PARAGRAPH</p>
       <div class="services-grid">

         <div class="service-card">
           <div class="service-card-image">
             <img src="/images/service-[slug].webp" alt="SERVICE NAME — ALT TEXT" loading="lazy">
           </div>
           <div class="service-card-body">
             <h3 class="service-card-title">HIGH-CONVERTING TITLE</h3>
             <p class="service-card-text">CARD BODY COPY</p>
           </div>
         </div>

         <!-- repeat × 4 total -->

       </div>
     </div>
   </section>
   ```

   ---

   ### Section Title (`h2.section-title`)
   - Left-aligned
   - Speaks to the reader's desire for the outcome your services deliver — not a list of what you do
   - Examples:
     - ✅ "Everything You Need to Protect Your Home — Done Right the First Time"
     - ✅ "The Services Phoenix Homeowners Trust Most"
     - ❌ "Our Services" / "What We Offer"

   ---

   ### Introduction Paragraph (`p.section-intro`)
   - Left-aligned, `width: 100%`, `margin-bottom: var(--space-lg)`
   - **40–60 words** — tight and benefit-driven
   - Connects the reader's need to the services below — frames them as solutions, not a product menu
   - Visitor-first language: "everything you need", "your home", "your schedule"

   ```css
   .section-intro {
     width: 100%;
     text-align: left;
     margin-bottom: var(--space-lg);
     font-size: 1rem;
     line-height: 1.7;
     color: var(--color-text-dark);
   }
   ```

   ---

   ### Service Images (Gemini API — `1:1` / `1K`)

   Each of the 4 service cards gets its own dedicated image. Add all 4 to `images_manifest.json`:

   ```json
   {
     "filename": "service-[slug].webp",
     "section": "Services — [Service Name]",
     "aspect_ratio": "1:1",
     "resolution": "1K",
     "prompt": "..."
   }
   ```

   **Filename:** derived from the service name slug — e.g. `service-drain-cleaning.webp`, `service-water-heater.webp`.

   **Prompt rules for service card images:**
   - Show the service being performed or its outcome — not a generic stock shot
   - Context: real environment relevant to the service (under a sink, on a roof, in a garden, etc.)
   - Mood: professional, competent, clean — the image should make the reader feel the problem is solvable
   - Tight framing: `1:1` square crop — keep the subject centered and prominent
   - Always end with: `"Photorealistic, clean and professional. No text, logos, or watermarks in the image."`
   - Examples:
     - Drain cleaning: *"Close-up of a professional plumber using a drain snake tool in a clean kitchen sink. Clear water flowing, tools visible. Photorealistic, clean and professional. No text, logos, or watermarks in the image."*
     - AC repair: *"HVAC technician checking refrigerant levels on an outdoor AC unit on a sunny day, tools laid out neatly. Photorealistic, clean and professional. No text, logos, or watermarks in the image."*
     - Lawn care: *"Overhead square shot of a freshly mowed, lush green lawn with clean mow lines in a suburban backyard. Photorealistic, clean and professional. No text, logos, or watermarks in the image."*

   ---

   ### 4 Service Cards — Grid Layout

   **Strictly 2 cards per row** at all viewport sizes except mobile:

   ```css
   .services-grid {
     display: grid;
     grid-template-columns: 1fr;
     gap: var(--space-md);
   }
   @media (min-width: 600px) {
     .services-grid {
       grid-template-columns: repeat(2, 1fr);
     }
   }
   .service-card {
     background: var(--color-bg-white);
     border-radius: 8px;
     overflow: hidden;
     box-shadow: 0 2px 12px rgba(0,0,0,0.07);
     display: flex;
     flex-direction: column;
   }
   .service-card-image img {
     width: 100%;
     height: auto;
     display: block;
     aspect-ratio: 1 / 1;
     object-fit: cover;
   }
   .service-card-body {
     padding: var(--space-md);
     display: flex;
     flex-direction: column;
     gap: var(--space-xs);
     text-align: left;
   }
   ```

   ---

   ### Card Content Rules

   **`h3.service-card-title`** — outcome-driven, visitor-focused. Must describe what the reader gets, not just the service name:
   - ❌ "Drain Cleaning"
   - ✅ "Clear Your Drains Fast — No Mess, No Damage, Guaranteed"
   - ❌ "Water Heater Installation"
   - ✅ "Hot Water Whenever You Need It — Installed Right the Same Day"

   ```css
   .service-card-title {
     color: var(--color-text-dark);
     margin: 0;
   }
   ```

   **`p.service-card-text`** — 2–3 sentences, 30–50 words. Addresses the specific pain point this service resolves. Written from the reader's perspective — what they experience, what they're afraid of, what they'll gain:
   ```css
   .service-card-text {
     color: var(--color-text-muted);
     margin: 0;
     font-size: 0.95rem;
     line-height: 1.6;
   }
   ```

8. **Steps To Work With Us Section**

   ### Purpose
   This section exists to eliminate the friction of getting started. Many visitors who want to hire the business hesitate because they don't know what happens after they call. These 3 cards answer that anxiety directly — showing the process is simple, fast, and low-risk.

   ### HTML Structure

   ```html
   <section class="steps-section">
     <div class="container">
       <h2 class="section-title">COMPELLING HEADLINE</h2>
       <p class="section-intro">INTRODUCTION PARAGRAPH</p>
       <div class="steps-grid">

         <div class="step-card">
           <i class="fa-solid fa-[icon] step-icon"></i>
           <h3 class="step-title">STEP TITLE</h3>
           <p class="step-body">STEP BODY COPY</p>
         </div>

         <!-- repeat × 3 total -->

       </div>
     </div>
   </section>
   ```

   ---

   ### Section Title (`h2.section-title`)
   - Left-aligned
   - Reframes the process as effortless and risk-free for the reader
   - Examples:
     - ✅ "Getting Started Is Easier Than You Think — Here's How It Works"
     - ✅ "From Your First Call to a Finished Job — We Make It Simple"
     - ✅ "Three Steps to Fixing Your Problem Today"
     - ❌ "How It Works" / "Our Process" / "Steps"

   ---

   ### Introduction Paragraph (`p.section-intro`)
   - Left-aligned, `width: 100%`, `margin-bottom: var(--space-lg)`
   - **40–60 words**
   - Addresses the reader's fear of hassle, wasted time, or being locked into something — reassures them the process is easy and they're in control
   - Examples:
     - ✅ "You don't need to figure anything out on your own. Just reach out and we'll handle the rest — from the first call to the final cleanup. No confusing steps, no surprises, no pressure."

   ```css
   .section-intro {
     width: 100%;
     text-align: left;
     margin-bottom: var(--space-lg);
     font-size: 1rem;
     line-height: 1.7;
     color: var(--color-text-dark);
   }
   ```

   ---

   ### 3 Step Cards

   **Exactly 3 cards** — one per step. Grid: 1 column mobile → 3 columns desktop:

   ```css
   .steps-grid {
     display: grid;
     grid-template-columns: 1fr;
     gap: var(--space-md);
   }
   @media (min-width: 768px) {
     .steps-grid { grid-template-columns: repeat(3, 1fr); }
   }
   .step-card {
     background: var(--color-bg-white);
     border-radius: 8px;
     padding: var(--space-md);
     box-shadow: 0 2px 12px rgba(0,0,0,0.07);
     display: flex;
     flex-direction: column;
     align-items: flex-start;
     gap: var(--space-xs);
   }
   ```

   **Card structure — vertically stacked, left-aligned:** icon → `h3` → `p`

   ---

   ### Icons (FA7 Free Solid — validated)

   Each step uses a distinct icon representing that stage of the process. Choose from this validated FA7 Free Solid set — one per step, no repeats:

   | Step | Recommended icon | Class |
   |---|---|---|
   | Contact / Reach out | Phone | `fa-solid fa-phone` |
   | Schedule / Book | Calendar | `fa-solid fa-calendar-check` |
   | Quote / Assessment | Clipboard | `fa-solid fa-clipboard-list` |
   | Show up / Arrive | Truck / Van | `fa-solid fa-truck` |
   | Work / Fix | Wrench | `fa-solid fa-wrench` |
   | Complete / Done | Circle check | `fa-solid fa-circle-check` |
   | Guarantee / Peace of mind | Shield | `fa-solid fa-shield` |
   | Payment | Dollar sign | `fa-solid fa-dollar-sign` |

   All icons are confirmed available in Font Awesome 7 Free Solid. Pick the 3 most appropriate for the industry and step sequence. Style:

   ```css
   .step-icon {
     font-size: 2rem;
     color: var(--color-primary);
     margin-bottom: var(--space-xs);
   }
   ```

   ---

   ### Default 3-Step Sequence (adapt to industry)

   **Step 1 — Contact:**
   - Icon: `fa-solid fa-phone`
   - `h3`: "Call or Fill Out the Form in Under 60 Seconds"
   - Body: Reassure them the first step is effortless. No commitment, no obligation. They just reach out and someone responds fast.

   **Step 2 — Assessment / Quote:**
   - Icon: `fa-solid fa-clipboard-list`
   - `h3`: "Get a Clear, Honest Quote — No Surprises"
   - Body: Address the price fear directly. They'll know exactly what it costs before any work begins. No hidden fees, no upsells.

   **Step 3 — Done:**
   - Icon: `fa-solid fa-circle-check`
   - `h3`: "Sit Back — We Handle Everything From Start to Finish"
   - Body: Paint the relief of the problem being solved. The job is done right, the area is clean, and their life is back to normal.

   ---

   ### Card Copy Rules

   **`h3.step-title`** — names the step AND delivers the benefit or removes the fear associated with that step in one line:
   - ❌ "Step 1: Call Us"
   - ✅ "Call or Fill Out the Form — We'll Respond Within the Hour"
   - ❌ "Step 3: Job Complete"
   - ✅ "Your Problem Is Fixed, the Area Is Clean, and You're Covered by Our Guarantee"

   ```css
   .step-title {
     color: var(--color-text-dark);
     margin: 0;
   }
   ```

   **`p.step-body`** — 2–3 sentences, 25–45 words. Eliminates the specific anxiety associated with this step. What will they experience? What won't happen to them? What can they expect?

   ```css
   .step-body {
     color: var(--color-text-muted);
     margin: 0;
     font-size: 0.95rem;
     line-height: 1.6;
   }
   ```

9. **FAQs Section**

   ### HTML Structure

   ```html
   <section class="faqs-section">
     <div class="container">
       <h2 class="section-title">COMPELLING HEADLINE</h2>
       <p class="section-intro">INTRODUCTION PARAGRAPH</p>
       <div class="faqs-accordion">

         <div class="faq-item">
           <button class="faq-question" aria-expanded="false">
             <h3>QUESTION TEXT</h3>
             <i class="fa-solid fa-chevron-down faq-chevron"></i>
           </button>
           <div class="faq-answer" hidden>
             <p>ANSWER TEXT</p>
           </div>
         </div>

         <!-- repeat × 6 total -->

       </div>
     </div>
   </section>
   ```

   ---

   ### Section Title (`h2.section-title`)
   - Left-aligned
   - Frames the FAQs as answers to real concerns — not a generic header
   - Examples:
     - ✅ "You've Got Questions — Here Are the Honest Answers"
     - ✅ "Everything Phoenix Homeowners Ask Before Hiring Us"
     - ✅ "What You're Probably Wondering Right Now"
     - ❌ "Frequently Asked Questions" / "FAQs"

   ---

   ### Introduction Paragraph (`p.section-intro`)
   - Left-aligned, `width: 100%`, `margin-bottom: var(--space-lg)`
   - **40–60 words**
   - Validates the reader's hesitation — tells them it's smart to ask questions before hiring anyone. Positions the answers as transparent and trustworthy.
   - Example: *"It's smart to do your homework before inviting anyone into your home. We've answered the questions we hear most — honestly and without the runaround. If you don't see your question here, call us and we'll answer it straight."*

   ```css
   .section-intro {
     width: 100%;
     text-align: left;
     margin-bottom: var(--space-lg);
     font-size: 1rem;
     line-height: 1.7;
     color: var(--color-text-dark);
   }
   ```

   ---

   ### 6 FAQ Items

   **Always generate exactly 6 FAQs** — never fewer, never more. If the brief provided FAQs, use those first and fill remaining slots with generated ones. All 6 must be relevant to the specific `INDUSTRY` and page service.

   **Question copy rules (`h3` inside `.faq-question`):**
   - Phrased as a real question the reader is already thinking — not a company talking point
   - Addresses a fear, objection, or uncertainty that would prevent someone from calling
   - Written in plain, conversational language — the way a real customer would ask it
   - **Never discusses specific pricing** — no dollar amounts, no price ranges
   - Examples:
     - ✅ "How quickly can you come out if it's an emergency?"
     - ✅ "Will you give me a quote before starting any work?"
     - ✅ "Do I need to be home while the work is being done?"
     - ✅ "What happens if something goes wrong after the job is done?"
     - ❌ "How much does drain cleaning cost?" (pricing — forbidden)
     - ❌ "What are your service areas?" (not pain-point driven)

   **Answer copy rules (`p` inside `.faq-answer`):**
   - **70–150 words** — detailed enough to genuinely answer the question, not a vague deflection
   - Directly and confidently answers the question — no hedging, no "it depends" without explanation
   - Uses visitor-first language throughout: "you'll", "your", "you can expect"
   - Ends with a subtle reassurance or micro-CTA where natural: *"If you have more questions, call us — we'll give you a straight answer."*

   **Default FAQ topics by anxiety type** (generate 6 from this framework, adapt to industry):
   1. **Response time** — How fast do you show up? (urgency/reliability fear)
   2. **Upfront pricing** — Will I know the cost before work starts? (hidden fee fear)
   3. **Licensing & insurance** — Are your technicians licensed and insured? (trust/liability fear)
   4. **Disruption** — How long will this take / will it affect my day? (hassle fear)
   5. **Guarantee** — What if I'm not satisfied / something goes wrong after? (quality fear)
   6. **First step** — What do I need to do to get started? (inertia / not knowing what to do)

   ---

   ### Question Style — `.faq-question`

   ```css
   .faq-question {
     display: flex;
     align-items: center;
     justify-content: space-between;
     width: 100%;
     padding: var(--space-sm) var(--space-md);
     background-color: var(--color-primary);
     color: #ffffff;
     border: none;
     cursor: pointer;
     text-align: left;
     gap: var(--space-sm);
   }
   .faq-question h3 {
     color: #ffffff;
     margin: 0;
     font-size: clamp(1rem, 2vw, 1.1rem);
     flex: 1;
   }
   .faq-chevron {
     color: #ffffff;
     font-size: 1rem;
     flex-shrink: 0;
     transition: transform 0.25s ease;
   }
   .faq-question[aria-expanded="true"] .faq-chevron {
     transform: rotate(180deg);
   }
   ```

   ### Answer Style — `.faq-answer`

   ```css
   .faq-answer {
     padding: var(--space-sm) var(--space-md);
     background-color: var(--color-bg-white);
     border: 1px solid var(--color-border);
     border-top: none;
   }
   .faq-answer p {
     margin: 0;
     color: var(--color-text-dark);
     line-height: 1.7;
   }
   ```

   ### Accordion Container

   ```css
   .faqs-accordion {
     display: flex;
     flex-direction: column;
     gap: var(--space-xs);
   }
   .faq-item {
     border-radius: 4px;
     overflow: hidden;
   }
   ```

   ### Accordion JavaScript

   In `js/main.js` under a `/* ── FAQs Accordion ── */` comment block:

   ```javascript
   /* ── FAQs Accordion ── */
   document.querySelectorAll('.faq-question').forEach(button => {
     button.addEventListener('click', () => {
       const isOpen = button.getAttribute('aria-expanded') === 'true';
       const answer = button.nextElementSibling;

       // Close all other open items first
       document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(openBtn => {
         if (openBtn !== button) {
           openBtn.setAttribute('aria-expanded', 'false');
           openBtn.nextElementSibling.hidden = true;
         }
       });

       // Toggle current item
       button.setAttribute('aria-expanded', String(!isOpen));
       answer.hidden = isOpen;
     });
   });
   ```

   **Behavior:** clicking a question opens its answer and simultaneously closes any other open answer. One item open at a time. Chevron rotates 180° when open via the CSS `aria-expanded` selector.

10. **Footer Section**

   ### Background
   Always `#282828` (dark), marked `!important` to override the alternating section color system. All text defaults to white or light-colored.

   ```css
   .footer {
     background-color: #282828 !important;
   }
   ```

   ---

   ### Step 1 — Check for IFRAME URL

   Before building the footer, verify whether `GOOGLE_MAPS_IFRAME` contains an actual embed URL (not null, not the placeholder comment). This determines which of the two layouts below to use.

   ---

   ### Layout A — IFRAME URL Present (Two Columns)

   ```html
   <footer class="footer">
     <div class="container footer-inner">

       <!-- Left column -->
       <div class="footer-left">
         <a href="/" class="footer-brand">
           <img src="LOGO_PATH" alt="BUSINESS_NAME logo" width="200">
           <span class="footer-company-name">BUSINESS_NAME</span>
         </a>
         <a href="tel:PHONE" class="btn-primary footer-btn">CTA BUTTON 1 LABEL</a>
         <button class="btn-secondary footer-btn" data-modal="hero-modal">CTA BUTTON 2 LABEL</button>
       </div>

       <!-- Right column -->
       <div class="footer-right">
         GOOGLE_MAPS_IFRAME
       </div>

     </div>

     <div class="footer-bottom">
       <p>&copy; <span id="footer-year"></span> BUSINESS_NAME. All rights reserved.</p>
     </div>
   </footer>
   ```

   **Left column rules:**
   - `<a class="footer-brand">` wraps both logo and company name — links to `/`, `text-decoration: none`
   - Logo: `width: 200px; height: auto; display: block`
   - Company name `<span>`: `font-size: 22px; font-weight: 800; text-transform: uppercase; color: var(--color-primary); display: block`
   - Both logo and company name centered vertically within the `<a>` tag using flexbox: `display: flex; flex-direction: column; align-items: center; gap: var(--space-xs)`
   - CTA buttons placed **directly after** the `<a>` tag — no wrapper divs around them
   - Buttons stacked vertically, centered, full-width on mobile

   **Right column rules:**
   - Contains the raw `GOOGLE_MAPS_IFRAME` embed — make it responsive:
   ```css
   .footer-right iframe {
     width: 100%;
     height: 350px;
     border: 0;
     border-radius: 8px;
     display: block;
   }
   ```

   **Two-column grid — stacks below 1000px:**
   ```css
   .footer-inner {
     display: grid;
     grid-template-columns: 1fr 1fr;
     gap: var(--space-xl);
     align-items: center;
     padding: var(--space-xl) 0;
   }
   @media (max-width: 1000px) {
     .footer-inner {
       grid-template-columns: 1fr;
     }
     .footer-right {
       order: 2;
     }
   }
   ```

   **Left column flex layout:**
   ```css
   .footer-left {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: var(--space-md);
   }
   .footer-brand {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: var(--space-xs);
     text-decoration: none;
   }
   .footer-company-name {
     font-size: 22px;
     font-weight: 800;
     text-transform: uppercase;
     color: var(--color-primary);
   }
   .footer-btn {
     width: 100%;
     text-align: center;
     text-decoration: none;
   }
   ```

   ---

   ### Layout B — No IFRAME URL (Single Column, Centered)

   ```html
   <footer class="footer">
     <div class="container footer-inner-solo">

       <a href="/" class="footer-brand">
         <img src="LOGO_PATH" alt="BUSINESS_NAME logo" width="200">
         <span class="footer-company-name">BUSINESS_NAME</span>
       </a>

       <div class="footer-ctas">
         <a href="tel:PHONE" class="btn-primary">CTA BUTTON 1 LABEL</a>
         <button class="btn-secondary" data-modal="hero-modal">CTA BUTTON 2 LABEL</button>
       </div>

     </div>

     <div class="footer-bottom">
       <p>&copy; <span id="footer-year"></span> BUSINESS_NAME. All rights reserved.</p>
     </div>
   </footer>
   ```

   ```css
   .footer-inner-solo {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: var(--space-lg);
     padding: var(--space-xl) 0;
     text-align: center;
   }
   .footer-ctas {
     display: flex;
     flex-wrap: wrap;
     gap: var(--space-sm);
     justify-content: center;
     max-width: 600px;
     width: 100%;
   }
   @media (max-width: 700px) {
     .footer-ctas .btn-primary,
     .footer-ctas .btn-secondary {
       width: 100%;
     }
   }
   ```

   ---

   ### Shared Rules (Both Layouts)

   - **No text decoration on any links** — `a { text-decoration: none }` scoped to `.footer`
   - **All text on dark background**: body text `color: #ffffff` or `color: rgba(255,255,255,0.75)` for secondary text
   - **Copyright bar** auto-updates year via JS in `main.js`:
   ```javascript
   /* ── Footer year ── */
   const yearEl = document.getElementById('footer-year');
   if (yearEl) yearEl.textContent = new Date().getFullYear();
   ```
   - **Footer bottom bar** style:
   ```css
   .footer-bottom {
     border-top: 1px solid rgba(255,255,255,0.1);
     padding: var(--space-sm) 0;
     text-align: center;
   }
   .footer-bottom p {
     color: rgba(255,255,255,0.5);
     font-size: 0.85rem;
     margin: 0;
   }
   ```

---

## Step 4: Multi-Step Modal Spec

Every page includes CTA buttons (in the Hero, Banner, and Footer) that open a multi-step popup modal. This is the **only lead capture mechanism** on the site — there is no separate contact form section. The modal is a lightweight, focused qualifier designed to capture high-intent leads.

### Questions Generation (MANDATORY — do not skip)

Before building the modal, Claude must generate 2–3 qualifying questions tailored to the `INDUSTRY`. These questions should help the business understand the visitor's specific need before calling them back. They must be:

- **Directly relevant** to the service industry
- **Easy to answer quickly** — multiple choice preferred for steps 1 and 2, short text input acceptable for step 2 or 3 if the answer benefits from specifics
- **Psychologically commitment-building** — each answer makes the visitor feel more invested in completing the form

**Generate questions using this logic:**
1. **Step 1** — What type of service do they need? (multiple choice, based on `SERVICES` list)
2. **Step 2** — A qualifying follow-up relevant to their step 1 choice, or a secondary qualifier about urgency, property type, or specific situation (multiple choice or short text)
3. **Step 3 — Contact info** — Always last, always the same: Full Name, Phone Number, Email Address (all required)

**Examples by industry:**

*Plumbing:*
- Step 1: "What do you need help with?" → Emergency Repair / Water Heater / Drains / Other
- Step 2: "How urgent is this?" → It's an emergency / Within 24 hours / This week / Just getting a quote

*HVAC:*
- Step 1: "What's the issue?" → AC not cooling / Heating problem / New installation / Maintenance
- Step 2: "What type of property?" → Single-family home / Condo / Commercial / Rental

*Roofing:*
- Step 1: "What do you need?" → Repair a leak / Full replacement / Storm damage / Free inspection
- Step 2: "How old is your roof?" → Under 10 years / 10–20 years / Over 20 years / Not sure

*General contractor:*
- Step 1: "What project are you planning?" → Kitchen / Bathroom / Addition / Other
- Step 2: "What's your timeline?" → ASAP / 1–3 months / 3–6 months / Just exploring

Generate the qualifying questions yourself from the `INDUSTRY` and the audience research in the brief, then build the modal directly (do not ask for confirmation). The modal always ends with a contact step:
- Step 1: [question + choices]
- Step 2: [question + choices or text input]
- Step 3: Full Name, Phone Number, Email Address (required)

---

### Modal Behavior Rules

**Trigger:** Secondary CTA button in the **Hero, Banner, and Footer** sections — all use `data-modal="hero-modal"`. Clicking any of them opens the same modal overlay.

**Overlay:** Full-screen semi-transparent dark overlay (`rgba(0,0,0,0.6)`). Clicking outside the modal closes it. ESC key closes it.

**Modal box:** Centered, max-width 520px, border-radius 12px, white background, generous padding. On mobile: full-width with bottom-sheet style (slides up from bottom).

**Progress indicator:** Shows "Step 1 of 3", "Step 2 of 3", "Step 3 of 3" at the top of the modal. Visual step dots or progress bar using `--color-primary`.

**Navigation:** "Next" button advances. "Back" button returns to previous step. No full-page reload at any point. First step has no Back button.

**Validation:**
- Step 1 & 2: At least one option must be selected (or text field not empty) before Next is enabled
- Step 3: Full Name, Phone Number, and Email are all required. Basic format validation on phone and email before submit.

**Phone input formatting (MANDATORY for ANY phone input on the site, including this modal):**

The visitor only types digits — Claude's JS adds the formatting characters as they type. Final visible format: `(XXX) XXX-XXXX` (standard US format, ten digits).

HTML attributes on every phone input:
```html
<input
  type="tel"
  name="phone"
  inputmode="numeric"
  autocomplete="tel"
  placeholder="(555) 123-4567"
  maxlength="14"
  required
  class="js-phone-input">
```

JS in `js/main.js` — runs once on page load and binds to every `.js-phone-input`:
```js
(function bindPhoneInputs() {
  function formatUSPhone(digits) {
    digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length < 4) return '(' + digits;
    if (digits.length < 7) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }
  function onInput(e) {
    var digits = (e.target.value || '').replace(/\D/g, '');
    e.target.value = formatUSPhone(digits);
  }
  document.querySelectorAll('.js-phone-input').forEach(function (el) {
    el.addEventListener('input', onInput);
  });
})();
```

**Submission:** Send the **formatted** value (e.g. `(602) 555-1234`) in the webhook payload — that's what the business sees. If you also need a digits-only version, add a parallel field by stripping non-digits server-side or in JS before submit.

**Validation rule:** before allowing form submit, strip non-digits from the phone field and require exactly 10 digits. Show inline error if not (`Please enter a valid 10-digit phone number`).

**Submission:** On final step submit, POST JSON to `MODAL_WEBHOOK_URL` via `fetch()`.

**Success state:** Replace modal content with a thank-you message:
> *"Thanks [First Name]! We've received your request and will call you within [X hours]. You can also reach us directly at PHONE."*

**Error state:** If the POST fails:
> *"Something went wrong. Please call us directly at PHONE or try again."*

**Close button:** Visible "×" in the top-right corner of the modal on all steps. Does not submit — just closes.

---

### Pabbly Connect Payload — Modal

```json
{
  "source":       "hero_modal",
  "business":     "BUSINESS_NAME",
  "step1_question": "What do you need help with?",
  "step1_answer": "...",
  "step2_question": "How urgent is this?",
  "step2_answer": "...",
  "full_name":    "...",
  "phone":        "...",
  "email":        "...",
  "submitted_at": "ISO timestamp"
}
```

The `"source": "hero_modal"` field identifies these leads in Pabbly Connect.

---

### CSS & JS Notes

- Modal HTML goes at the bottom of `<body>`, outside all sections
- All modal CSS goes in `css/styles.css` under a `/* ── Hero Modal ── */` comment block
- All modal JS goes in `js/main.js` under a `/* ── Hero Modal ── */` comment block
- `body.modal-open { overflow: hidden }` — prevent background scroll when modal is open
- The modal is hidden by default: `display: none` — shown via JS adding class `.modal-visible`
- Transition: modal box scales from `0.95` to `1.0` with `opacity 0→1` over `200ms` on open

---

**`<title>` tag format — MANDATORY for all pages:**

| Page type | Format | Example |
|---|---|---|
| Homepage | `BUSINESS_NAME \| INDUSTRY in CITY, STATE` | `Sunrise Plumbing \| Plumber in Phoenix, AZ` |
| Service page (with location) | `Service Name CITY, STATE` | `Drain Cleaning Phoenix, AZ` |
| Service page (without location) | `Service Name` | `Drain Cleaning` |
| Spanish homepage | `BUSINESS_NAME \| INDUSTRY en CITY, STATE` | `Sunrise Plumbing \| Plomero en Phoenix, AZ` |
| Spanish service page (with location) | `Nombre del Servicio CITY, STATE` | `Limpieza de Drenajes Phoenix, AZ` |
| Spanish service page (without location) | `Nombre del Servicio` | `Limpieza de Drenajes` |

**Service name always comes before location. Never reverse the order. Service pages do not include the business name in the title.**

**`<html lang="">` — MANDATORY on every page:**

| Page | Tag |
|---|---|
| English pages | `<html lang="en">` |
| Spanish pages | `<html lang="es">` (or `lang="es-MX"` etc. based on `SPANISH_REGION`) |
| Privacy Policy / T&C (English) | `<html lang="en">` |
| Privacy Policy / T&C (Spanish) | `<html lang="es">` |

**`<title>` tag format — MANDATORY for all pages:**

| Page type | Format | Example |
|---|---|---|
| Homepage | `BUSINESS_NAME \| INDUSTRY in CITY, STATE` | `Sunrise Plumbing \| Plumber in Phoenix, AZ` |
| Service page (with location) | `Service Name CITY, STATE` | `Drain Cleaning Phoenix, AZ` |
| Service page (without location) | `Service Name` | `Drain Cleaning` |
| Spanish homepage | `BUSINESS_NAME \| INDUSTRY en CITY, STATE` | `Sunrise Plumbing \| Plomero en Phoenix, AZ` |
| Spanish service page (with location) | `Nombre del Servicio CITY, STATE` | `Limpieza de Drenajes Phoenix, AZ` |
| Spanish service page (without location) | `Nombre del Servicio` | `Limpieza de Drenajes` |

**Service name always comes before location. Never reverse the order. Service pages do not include the business name in the title.**

**Domain in meta tags:** For `og:url`, `og:image`, `canonical`, and `hreflang` — use `https://DOMAIN/` if `DOMAIN` is known. If `DOMAIN = null`, use `https://yourdomain.com/` as placeholder and add comment: `<!-- Replace yourdomain.com with your actual domain before going live -->`. All other internal links use absolute paths (`/page/`) and never need the domain.

Always include the full tag set below in `<head>` on every page — **in this exact order**. Charset and viewport must come first. All values are page-specific — never reuse the homepage values on service pages.

```html
<!-- ── Charset & Viewport FIRST — must precede all other tags ── -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ── Core SEO ── -->
<title><!-- see title format table above --></title>
<meta name="description" content="PAGE_DESCRIPTION">
<meta name="keywords" content="SERVICE, CITY, STATE, INDUSTRY">
<link rel="canonical" href="https://DOMAIN/PAGE_PATH">
<meta name="robots" content="index, follow">

<!-- ── Favicon ── -->
<link rel="icon" href="FAVICON_PATH" type="image/TYPE">
<link rel="apple-touch-icon" href="FAVICON_PATH">

<!-- ── Open Graph (Facebook, LinkedIn, WhatsApp, iMessage, Slack, etc.) ── -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="BUSINESS_NAME">
<meta property="og:title" content="PAGE_TITLE">
<meta property="og:description" content="PAGE_DESCRIPTION">
<meta property="og:url" content="https://DOMAIN/PAGE_PATH">
<meta property="og:image" content="https://DOMAIN/images/og-image.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="BUSINESS_NAME — ALT TEXT describing the image">
<meta property="og:locale" content="en_US">
<!-- Spanish pages: -->
<!-- <meta property="og:locale" content="es_MX"> (adapt to SPANISH_REGION) -->

<!-- ── Twitter / X Card ── -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PAGE_TITLE">
<meta name="twitter:description" content="PAGE_DESCRIPTION">
<meta name="twitter:image" content="https://DOMAIN/images/og-image.webp">
<meta name="twitter:image:alt" content="BUSINESS_NAME — ALT TEXT">

<!-- ── Geo / Local SEO ── -->
<meta name="geo.region" content="US-STATE">
<meta name="geo.placename" content="CITY">
```

**Per-page value rules:**

| Tag | Homepage | Service page |
|---|---|---|
| `og:title` | `BUSINESS_NAME \| INDUSTRY in CITY, STATE` | `Service Name CITY, STATE` |
| `og:description` | Tagline + city + call to action | Benefit-focused description of that specific service |
| `og:url` | `https://DOMAIN/` | `https://DOMAIN/service-slug/` |
| `og:image` | `https://DOMAIN/images/og-image.webp` | Same shared OG image for all pages |
| `twitter:card` | `summary_large_image` | `summary_large_image` |
| `meta description` | 140–160 chars, includes city + phone | 140–160 chars, service + benefit + city |

**`meta description` copy rules:**
- 140–160 characters — long enough for Google to use it, short enough not to truncate
- Must include: service/industry keyword, city, and a benefit or action
- Homepage example: *"Phoenix's trusted plumber for leaks, drains & water heaters. Licensed, insured, same-day service. Call (602) 555-1234 for a free quote."*
- Service page example: *"Fast drain cleaning in Phoenix, AZ. No mess, no damage, guaranteed. Licensed plumbers available today. Call (602) 555-1234."*

---

### OG Image Spec

The OG image (`og-image.webp`) is used across all pages for social sharing previews. One image per site.

**Dimensions: 1200×630px** — the standard for Facebook, LinkedIn, Twitter/X, WhatsApp, and iMessage link previews.

**If `OG_IMAGE_SOURCE = generated`** — add to `images_manifest.json`:
```json
{
  "filename": "og-image.webp",
  "section": "OG Social Share Image",
  "aspect_ratio": "16:9",
  "resolution": "1K",
  "prompt": "..."
}
```

**OG image prompt rules:**
- Represents the business and industry at a glance — someone scrolling Facebook should immediately understand what this business does
- Bold, visually striking composition — it competes with cat photos and news articles for attention
- Include the business context: a professional in the trade, a recognizable result, or the business environment
- No text in the image (text will be overlaid by the social platform's preview card)
- Warm, high-contrast, professional — should look great as a thumbnail at 300px wide
- Always end with: `"Wide 16:9 format, photorealistic, high contrast, professional. No text, logos, or watermarks in the image."`
- Examples:
  - Plumbing: *"Wide-angle shot of a professional plumber confidently working on copper pipes in a bright modern kitchen. Clean, well-lit, high contrast. Wide 16:9 format, photorealistic, high contrast, professional. No text, logos, or watermarks in the image."*
  - HVAC: *"Split view of a comfortable cool living room on one side and an outdoor AC unit in sunshine on the other. High contrast, professional. Wide 16:9 format, photorealistic, high contrast, professional. No text, logos, or watermarks in the image."*
  - Flower delivery: *"Overhead flat lay of an abundant fresh flower bouquet — peonies, roses, eucalyptus — on a white marble surface. Bright, editorial, lush. Wide 16:9 format, photorealistic, high contrast, professional. No text, logos, or watermarks in the image."*

**If `OG_IMAGE_SOURCE = client`** — use the provided file or URL directly. If a file was uploaded, convert to WebP, compress, and save as `images/og-image.webp`. If a URL was given, reference it directly in the `og:image` and `twitter:image` tags instead of `images/og-image.webp`.

Add LocalBusiness JSON-LD schema:
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "BUSINESS_NAME",
  "telephone": "PHONE",
  "email": "EMAIL",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "BUSINESS_ADDRESS",
    "addressLocality": "CITY",
    "addressRegion": "STATE",
    "addressCountry": "US"
  },
  "description": "TAGLINE"
}
```

---

## Step 6: Technical Requirements

### Mobile-First Responsive Design (MANDATORY)

Every site must be fully usable on phones, tablets, and desktops. Build mobile-first:

**Breakpoints:**
```css
/* Mobile default: 0–767px — base styles */
/* Tablet: 768px+ */
@media (min-width: 768px) { ... }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { ... }
```

**Mobile rules:**
- Navigation collapses to hamburger menu at <768px. Tapping hamburger opens a full-width dropdown nav.
- Hero headline: `clamp(1.8rem, 5vw, 3.2rem)` — never overflows on small screens
- Service cards: 1 column on mobile → 2 on tablet → 3 on desktop (`grid-template-columns`)
- Testimonial cards: 1 column on mobile → 3 on desktop
- Contact form: full width on mobile, max-width 600px centered on desktop
- Footer: stacked single column on mobile → multi-column on desktop
- Tap targets: all buttons and links minimum 44×44px touch area
- No horizontal scroll at any viewport width — test by setting `overflow-x: hidden` on `body`
- Mobile sticky CTA bar (fixed bottom) with Call + Get Quote buttons — hide on desktop (`display: none` at 768px+)

### Spacing & Readability (MANDATORY)

Generous, consistent spacing makes sites look professional and easy to read:

```css
/* Spacing scale — use these exclusively */
:root {
  --space-xs: 0.5rem;    /* 8px */
  --space-sm: 1rem;      /* 16px */
  --space-md: 1.5rem;    /* 24px */
  --space-lg: 2.5rem;    /* 40px */
  --space-xl: 4rem;      /* 64px */
  --space-2xl: 6rem;     /* 96px */
  --section-padding-mobile: var(--space-xl) var(--space-sm);
  --section-padding-desktop: var(--space-2xl) var(--space-lg);
  --container-max-width: 1200px;
}
```

**Section padding — MANDATORY, identical on every section:**
```css
section {
  padding: var(--section-padding-mobile);
}
@media (min-width: 768px) {
  section {
    padding: var(--section-padding-desktop);
  }
}
```
Never add extra padding or margin to individual sections. All sections use `--section-padding-mobile` / `--section-padding-desktop` exclusively. No exceptions.

**Container max-width — MANDATORY, identical on every section:**
```css
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--space-sm);
  width: 100%;
}
```
Every section wraps its content in a single `<div class="container">`. Never set a different max-width per section.

**Section positioning — MANDATORY:**
- All sections use the default `position: static` — no `position: fixed` or `position: sticky` on any section or its direct children.
- The **Navigation** is the only element on the page that may use `position: sticky; top: 0` — nothing else.
- The **mobile CTA bar** uses `position: fixed; bottom: 0` — but it is not a section, it is a UI utility element outside the main content flow.
- Never float sections or use absolute positioning to layer sections over each other.

**Typography readability rules:**
- Body font size: minimum `1rem` (16px). Never smaller.
- Line height: `1.6` for body text, `1.2` for headings
- **Paragraph width: ALWAYS 100% of the parent container. DO NOT apply `max-width` (no `65ch`, no `800px`, no `60em`, no numeric cap of any kind) to paragraphs in section content.** Line-length readability is handled by the `.container` max-width at the section level (`1200px`) — not by paragraph-level caps. The only exceptions where a narrower paragraph is allowed: (1) inside a 2-column subcontainer layout where the column is already ~50% (e.g. About Us text column), (2) the Banner CTA text which is centered and visually balanced at ~800px, (3) `max-width: 100%` on images. Every other `<p>` takes the full width of its parent.
- Heading hierarchy: `h1` (hero) → `h2` (section titles) → `h3` (card titles) — never skip levels
- Sufficient contrast: body text on white/gray backgrounds must meet WCAG AA (4.5:1 ratio minimum)

**Card spacing:**
- Card padding: `var(--space-md)` inside
- Card gap in grid: `var(--space-md)` between cards
- Cards get `border-radius: 8px` and a subtle shadow: `box-shadow: 0 2px 12px rgba(0,0,0,0.07)`

### Global Button Styles (MANDATORY — define once in `css/styles.css`)

All buttons across the site share this base. Section-specific classes override only what's different (background, color, width).

```css
/* ── Global Button Base ── */
.btn-primary,
.btn-secondary,
.btn-banner-primary,
.btn-banner-secondary,
.footer-btn {
  display: inline-block;
  padding: 0.85rem 1.75rem;
  border-radius: 4px;
  font-family: 'FONT_HEADING', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s, color 0.2s, transform 0.1s;
  min-height: 44px; /* accessibility tap target */
  line-height: 1.2;
}
.btn-primary:hover,
.btn-secondary:hover {
  transform: translateY(-1px);
}

/* Primary button — default state */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-cta-text);
}
.btn-primary:hover {
  background-color: var(--color-hover);
  color: #ffffff;
}

/* Secondary button — outline style */
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}
.btn-secondary:hover {
  background-color: var(--color-primary);
  color: var(--color-cta-text);
}
```

Add `--color-cta-text` to the `:root` CSS variables in Step 2:
```css
--color-cta-text: #ffffff; /* or #000000 if COLOR_PRIMARY is very light — check contrast */
```

### Other Technical Requirements
- **File naming convention**: All page slugs are derived directly from the SEO `<title>` — lowercase, spaces replaced with hyphens, commas and punctuation removed, `ñ` → `n`, all accent marks stripped (á→a, é→e, í→i, ó→o, ú→u, ü→u). Each slug becomes a **folder** containing `index.html`, and the public URL is the folder path with a trailing slash (no `.html`). The title and slug are always in sync — never derive them separately. Examples: title `"Drain Cleaning Phoenix, AZ"` → file `drain-cleaning-phoenix-az/index.html`, URL `/drain-cleaning-phoenix-az/` · title `"Servicios de Plomería"` → file `servicios-de-plomeria/index.html`, URL `/servicios-de-plomeria/`. The only files that stay at the project root are the English `index.html` (served at `/`) and `404.html`. Never use spaces, underscores, or special characters in any slug.
- **Separate CSS and JS files**: Never inline CSS or JS into HTML files. Always output:
  - `css/styles.css` — all styles for the site
  - `js/main.js` — all JavaScript for the site
  - HTML files reference them via `<link rel="stylesheet" href="/css/styles.css">` and `<script src="/js/main.js" defer></script>` (absolute paths so they resolve correctly from nested folders)
  - For bilingual sites, the English `index.html` (at root) and the Spanish `[spanish-home-slug]/index.html` link to the same `css/styles.css` and `js/main.js` — do not duplicate these files
- **No frameworks**: Vanilla HTML/CSS/JS only (no React/Vue) unless user requests
- **Performance**: Lazy-load images (`loading="lazy"`), no heavy libraries
- **Accessibility**: Semantic HTML5 tags, alt attributes, ARIA labels on all form inputs
- **CTA consistency**: Primary button with phone number in nav, hero, and footer
- **Smooth scroll**: `scroll-behavior: smooth` on `html`
- **Animations**: Subtle fade-in on scroll via IntersectionObserver (see `references/section-snippets.md`)

### Generated Support Files (always include in every build)

**`sitemap.xml`** — lists every HTML page in the site for search engine crawling:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://DOMAIN/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- one <url> block per service page -->
  <url>
    <loc>https://DOMAIN/drain-cleaning-phoenix-az/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Spanish homepage if BILINGUAL=yes -->
  <url>
    <loc>https://DOMAIN/SPANISH_HOME_SLUG/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://DOMAIN/privacy-policy/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://DOMAIN/terms-and-conditions/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```
If `DOMAIN = null`, use `https://yourdomain.com/` and add comment: `<!-- Replace yourdomain.com before going live -->`.

**`robots.txt`** — tells crawlers what to index:

```
User-agent: *
Allow: /
Disallow: /scripts/
Disallow: /.env

Sitemap: https://DOMAIN/sitemap.xml
```
If `DOMAIN = null`, use `https://yourdomain.com/sitemap.xml` with a placeholder comment.

**`.gitignore`** — prevents secrets and generated files from being committed to Git:

```
# Environment variables — NEVER commit this
.env
.env.local
.env.*

# Generated images (re-run generate_images.py to recreate)
# Remove this line if you want to commit images
# images/

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
```

---

## Step 6.6: Image Generation with Google Gemini

All website images are AI-generated using Google Gemini. No stock photos, no broken/missing images, no empty placeholders — every image slot on every page must end up with a real, purpose-built image file that loads.

### Step A — How to generate images (AUTONOMOUS — do NOT ask the user)

**You are running fully autonomously. There is NO user to answer questions and NO interactive `.env` setup step. Never ask about a `GEMINI_API_KEY`, never wait for confirmation, and never block the build on a missing key.** Two paths are available, in priority order:

1. **PREFERRED — the `generate_image` MCP tool (already authenticated).** The orchestrator exposes a `generate_image` tool backed by a server-side Gemini key — it needs no `.env`, no `pip install`, and no user setup. Call it for EVERY photographic image the site needs (hero, about, each service card, banner, steps, OG). It returns a base64 data URL; decode the part after the comma and write it to the correct `images/FILENAME` file. Use `generate_logo` ONLY if no logo was provided (see logo rules) — never for photos. This is the reliable path; use it by default.
2. **Fallback — the Python script (`scripts/generate_images.py`).** Only if a working `GEMINI_API_KEY` is already present in the environment/`.env` WITHOUT any user interaction. If the key is absent, do NOT stop and do NOT ask — fall back to path 1 (the MCP tool).

**Non-negotiable outcome:** by the end of the build, every `<img src>` and CSS `background-image` that points at `images/…` MUST resolve to a real file that exists on disk. If any image could not be generated after retries, generate a relevant photographic substitute with `generate_image` — NEVER leave a broken image, an empty box, or a logo standing in for a missing photo. Verify this before finishing (see the final pass).

---

### Step B — Look Up the Current Gemini Image Model

**MANDATORY: Never hardcode a Gemini model name.** Google updates and deprecates models regularly — the best model today may be renamed or replaced in months.

Before generating the manifest or writing the Python script, **search the web for the current recommended Gemini image generation model**:

Search query: `Google Gemini API best image generation model site:ai.google.dev`

Look for the model recommended for **professional-grade, high-quality image generation** (equivalent to what was called "Nano Banana Pro" or `gemini-3-pro-image-preview` at time of writing). Use whatever the current docs recommend as of today.

Write the confirmed model name into:
1. The `images_manifest.json` as a `"model"` field
2. The `generate_images.py` script as `MODEL = "confirmed-model-name"`
3. A comment in the script: `# Model confirmed: [date] from ai.google.dev/gemini-api/docs/models`

---

### Step C — How It Works

1. **Claude builds the images manifest** — a JSON file (`images_manifest.json`) listing every image the site needs, with a detailed prompt, filename, aspect ratio, resolution, and confirmed model for each.
2. **The Python script runs** — `scripts/generate_images.py` reads the manifest, calls the Gemini API for each image, and saves all outputs to the `images/` folder.
3. **HTML references the images** — all `<img>` tags and CSS `background-image` properties point to `images/FILENAME` as specified in the manifest.

### Install Dependencies (one time)
```bash
pip install google-genai pillow python-dotenv
```

### Running the Scripts
```bash
# First: validate your API key
python scripts/validate_env.py

# Then: generate all images
python scripts/generate_images.py scripts/images_manifest.json
```

### Images Manifest Format

```json
{
  "business": "BUSINESS_NAME",
  "city": "CITY, STATE",
  "model": "confirmed-model-name-from-live-docs",
  "images": [
    {
      "filename": "hero-bg.jpg",
      "section": "Hero",
      "aspect_ratio": "16:9",
      "resolution": "2K",
      "prompt": "..."
    }
  ]
}
```

**Fields:**
- `filename` — stem name only, **always use `.webp` extension** e.g. `hero-bg.webp`, `about-owner.webp`. The script enforces this automatically but the manifest should match.
- `section` — which page section uses this image
- `aspect_ratio` — valid values: `"1:1"`, `"3:4"`, `"4:3"`, `"16:9"`, `"9:16"`, `"21:9"`
- `resolution` — `"512"`, `"1K"`, `"2K"`, `"4K"` — use `"2K"` for hero and banner, `"1K"` for all others
- `prompt` — detailed description (see prompt rules below)

**WebP format — MANDATORY for all generated images:**
- The script converts every image to WebP at `quality=82, method=6` before saving — visually lossless, ~30–50% smaller than JPEG
- All `<img src="">` tags and CSS `background-image: url()` in the generated HTML/CSS **must use `.webp` filenames** — never `.jpg` or `.png` for generated images
- The only exception is the client-supplied logo (`images/LOGO`) — keep its original format

### Standard Image Set per Site

| Section | Filename | Aspect | Resolution |
|---|---|---|---|
| Hero | `hero-bg.webp` | `16:9` | `2K` |
| About Us | `about-us.webp` | `1:1` | `1K` |
| Services (×4) | `service-[slug].webp` | `1:1` | `1K` |
| Banner | `banner-cta.webp` | `21:9` | `2K` |
| Steps To Work With Us | `steps-bg.webp` | `16:9` | `1K` |
| OG Social Share | `og-image.webp` | `16:9` | `1K` |

Service image filenames are derived from the service name slug (e.g. `service-drain-cleaning.webp`, `service-ac-repair.webp`). Add one entry per service card to the manifest. The OG image is only generated if `OG_IMAGE_SOURCE = generated`.

### Image Prompt Rules

Write prompts that are specific to the `BUSINESS_NAME`, `INDUSTRY`, and `CITY`. Generic prompts produce generic images — every detail matters.

**⚠️ CRITICAL — photos are PHOTOS, never logos:** Every generated site image (hero, about-us, service cards, banner, steps, OG/social share) is a **clean photograph**. It must contain **NO text, letters, words, logos, brand names, company names, signage, or watermarks anywhere in the frame** — not on walls, trucks, uniforms, screens, or overlaid on the image. The company logo and business name are added afterward **only via HTML/CSS** (an `<img>` logo in the header, CSS text overlays on the hero). NEVER bake the brand into a photo. A logo floating in the middle of a hero photo is a defect — this is the #1 image mistake, do not make it.

**⚠️ CRITICAL — never use the logo as a photo placeholder:** The logo image (`images/LOGO`) belongs ONLY in the site header and footer, at its normal small size. It must NEVER be used as the `src` / `background-image` of a hero, about-us, service card, banner, steps, or OG slot. Every one of those slots needs its **own distinct real photograph**. If an image fails to generate (API error, refusal, missing key), **retry the photo or use a relevant royalty-free photographic placeholder — do NOT drop the logo (or any brand mark) into a photo slot as a fallback.** Two service cards showing the same company logo instead of service photos is the exact defect to avoid. Before finishing, verify no `<img>`/`background-image` outside the header/footer points at the logo file, and that every image slot has a unique photographic image.

**⚠️ CRITICAL — no giant faded logo watermark behind the hero (or anywhere):** Do NOT place a large, faded, low-opacity, or oversized copy of the logo (or the business name as a graphic) as a decorative background/watermark behind the hero text, behind sections, or anywhere on the page. The hero background is a **photograph** (or a solid/gradient color if the brief says none) — never the logo tinted, blurred, watermarked, or scaled up. The brand appears exactly twice: the small header logo and the footer logo. A washed-out "FENIX WEB DESIGN" phoenix ghosted behind the hero copy is the exact defect to avoid — do not add it.

**If you generate images with a tool/MCP instead of the Python script:** use the **`generate_image`** tool for ALL photographs (hero, about, service, banner, steps, OG). Use **`generate_logo`** ONLY for the actual logo/favicon mark. Never call `generate_logo` for a hero or section photo — that is precisely what produces a logo baked into the picture.

**Prompt structure:** Subject → Setting → Style → Lighting → Mood → Restrictions

**MANDATORY restrictions on every prompt:**
- End every prompt with: `"Photorealistic. No text, letters, logos, brand names, or watermarks anywhere in the image."`
- Never include the company name or ask for a logo/sign/label to appear in the image
- Never include real brand names, recognizable logos, or identifiable real people
- For images with people: describe **plain, unbranded** attire (no printed logos or lettering on clothing), a friendly expression, and a role that matches the business type (e.g. "technician in a plain uniform", "smiling homeowner couple")

**Prompt examples by section:**

*Hero (plumbing):*
> "Professional male plumber in a clean plain unbranded uniform crouching confidently beside a modern kitchen sink in a bright Phoenix home. Natural daylight, warm inviting atmosphere. Photorealistic. No text, letters, logos, brand names, or watermarks anywhere in the image."

*Hero (flower delivery):*
> "Elegant hand-tied bouquet of fresh white roses and eucalyptus on a marble countertop in a luxury Phoenix home. Soft natural light, shallow depth of field, editorial flower photography style. Photorealistic. No text, logos, or watermarks in the image."

*Banner (HVAC):*
> "Wide cinematic shot of a comfortable modern living room with a ceiling vent and perfect temperature on the thermostat display. Cool blue-tinted ambient light, affluent home interior. Photorealistic. No text, logos, or watermarks in the image."

*About Us (general contractor):*
> "Confident male contractor in his 40s wearing a hard hat and a plain unbranded polo, standing in front of a newly completed custom home exterior in a sunny Phoenix suburb. Arms crossed, warm smile. Photorealistic. No text, letters, logos, brand names, or watermarks anywhere in the image."

### See Also
- `scripts/generate_images.py` — image generation script (model name populated at build time)
- `scripts/validate_env.py` — validates `.env` and API key before spending credits
- `scripts/images_manifest_example.json` — complete example manifest for a plumbing business

### Architecture — Two Separate HTML Files

A bilingual site is delivered as **two fully self-contained HTML files** that mirror each other exactly in structure, design, and section order. One file is English, one is Spanish. They are linked to each other via a language toggle button in the navigation.

**English homepage:** always `index.html` at the project root → served at `/`

**Spanish homepage (`SPANISH_HOME_SLUG`):** lives in its own folder as `[spanish-home-slug]/index.html` → served at `/[spanish-home-slug]/`. The slug is derived from the Spanish SEO title of the main service, following the standard slug rule. The title is the translated service + city, stripped of accents, `ñ` → `n`, lowercased, hyphenated. Examples:
- Roofing in Phoenix → title "Compañía de Techos Phoenix AZ" → `compania-de-techos-phoenix-az/index.html` → URL `/compania-de-techos-phoenix-az/`
- Plumbing in Phoenix → title "Plomería en Phoenix AZ" → `plomeria-en-phoenix-az/index.html` → URL `/plomeria-en-phoenix-az/`
- HVAC in Dallas → title "Aire Acondicionado Dallas TX" → `aire-acondicionado-dallas-tx/index.html` → URL `/aire-acondicionado-dallas-tx/`

Store the slug as `SPANISH_HOME_SLUG` when building the Spanish homepage.

```
project-folder/
├── index.html                       ← English version (primary, served at /)
├── [spanish-home-slug]/
│   └── index.html                   ← Spanish version (e.g. compania-de-techos-phoenix-az/index.html)
├── css/
│   └── styles.css                   ← all styles (shared by both HTML files)
├── js/
│   └── main.js                      ← all JavaScript (shared by both HTML files)
└── images/
    └── LOGO
```

If the site has additional pages beyond the single-page scroll, apply the same slug rules to all pages: lowercase, hyphen-separated, no accents, `ñ` → `n`, each as `[slug]/index.html`. Examples:
- "Servicios de Plomería" → `servicios-de-plomeria/index.html` → URL `/servicios-de-plomeria/`
- "Sobre Nosotros" → `sobre-nosotros/index.html` → URL `/sobre-nosotros/`
- "Preguntas Frecuentes" → `preguntas-frecuentes/index.html` → URL `/preguntas-frecuentes/`

**Why two files, not JS-based DOM swapping:**
- Both pages are fully crawlable by Google — critical for local SEO in both English and Spanish
- No JavaScript language logic = simpler, faster, and nothing to break
- Each page has its own `<html lang="">`, title, meta description, and hreflang tags
- Deploys to any static host with zero configuration

---

### Language Toggle Button

Appears **inside the hero section, directly above the h1**, on every page (English and Spanish) when `BILINGUAL = yes`. Uses the FA7 solid icon `fa-language`. Styled as a plain text link — **no border, no background, no padding**. White text + icon on the dark hero overlay. On hover, the text and icon scale up slightly (10%) and change color to `--color-primary`.

**On English pages (homepage, service pages, Privacy, T&C):** button reads **"ESPAÑOL"** and links to `/SPANISH_HOME_SLUG/` (the Spanish homepage).
**On Spanish pages:** button reads **"ENGLISH"** and links to `/` (the English homepage).

```html
<!-- On any English page — substitute actual SPANISH_HOME_SLUG -->
<a href="/compania-de-techos-phoenix-az/" class="lang-toggle" aria-label="Ver en Español">
  <i class="fa-solid fa-language" aria-hidden="true"></i> ESPAÑOL
</a>

<!-- On any Spanish page -->
<a href="/" class="lang-toggle" aria-label="View in English">
  <i class="fa-solid fa-language" aria-hidden="true"></i> ENGLISH
</a>
```

```css
/* Language toggle — styled as a plain text link, NOT a button */
.lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;             /* sits on the left edge of hero-content */
  margin-bottom: var(--space-sm);     /* space before the h1 below */
  padding: 0;                          /* no padding — it's a link, not a button */
  border: none;                        /* no border */
  background: transparent;             /* no background */
  color: #ffffff;                      /* white on the dark hero overlay */
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  text-decoration: none;
  letter-spacing: 0.05em;
  cursor: pointer;
  transform-origin: left center;       /* grow from the left anchor, not the middle */
  transition: transform 0.2s ease, color 0.2s ease;
}
.lang-toggle:hover,
.lang-toggle:focus-visible {
  color: var(--color-primary);         /* text AND icon turn primary color */
  transform: scale(1.1);               /* slightly bigger on hover */
}
.lang-toggle i {
  font-size: 1.05rem;                  /* icon slightly larger than text */
  color: inherit;                      /* icon follows text color on hover */
}
```

**Placement note:** The toggle is NOT in the navigation anymore. It lives inside `.hero-content` as the first child, above the H1. The navigation contains only the logo, the menu items (Home / Services ▾ / About Us ▾), and no language toggle.

**Pages without a hero (Privacy Policy, Terms & Conditions, 404):** The language toggle appears at the top of the page content block, directly above the `<h1>` for those pages. Same text-link styling, same hover behavior. On a light background, the default text color is `--color-text-dark` (instead of white). On hover, the text + icon still turn `--color-primary` and scale up 10%.

```css
/* On Privacy Policy / T&C / 404 (light background) */
.legal-content .lang-toggle,
.not-found .lang-toggle {
  color: var(--color-text-dark);
}
.legal-content .lang-toggle:hover,
.legal-content .lang-toggle:focus-visible,
.not-found .lang-toggle:hover,
.not-found .lang-toggle:focus-visible {
  color: var(--color-primary);
  transform: scale(1.1);
}
```

---

### HTML Head — Language & SEO Tags

**`index.html` (English):**
```html
<html lang="en">
<head>
  <title>BUSINESS_NAME | SERVICE in CITY</title>
  <meta name="description" content="TAGLINE_EN. Serving CITY. Call PHONE.">
  <link rel="alternate" hreflang="en" href="https://DOMAIN/">
  <link rel="alternate" hreflang="es-REGION" href="https://DOMAIN/SPANISH_HOME_SLUG/">
  <link rel="canonical" href="https://DOMAIN/">
</head>
```

**Spanish homepage (`[spanish-home-slug]/index.html` — e.g. `compania-de-techos-phoenix-az/index.html`):**
```html
<html lang="es">
<head>
  <title>SPANISH SEO TITLE</title>
  <meta name="description" content="TAGLINE_ES. Sirviendo CITY. Llame al PHONE.">
  <link rel="alternate" hreflang="en" href="https://DOMAIN/">
  <link rel="alternate" hreflang="es-REGION" href="https://DOMAIN/SPANISH_HOME_SLUG/">
  <link rel="canonical" href="https://DOMAIN/SPANISH_HOME_SLUG/">
</head>
```

Use the correct `hreflang` region code based on `SPANISH_REGION` (e.g. `es-MX`, `es-CO`, `es-US` — see Translation Rules section).

---

### Translation Rules

**ALL visible copy must be translated** — not just headlines, but every button, label, placeholder, error message, success message, nav link, footer line, and ARIA label.

| Element | English | Spanish |
|---|---|---|
| Nav CTA button | "Get a Free Quote" | "Obtén una Cotización Gratis" |
| Hero CTA button | "Book Same-Day Service" | "Agenda Servicio el Mismo Día" |
| Form: Step 1 heading | "What do you need help with?" | "¿Con qué necesitas ayuda?" |
| Form: Name field | "Your Name" | "Tu Nombre" |
| Form: Phone field | "Phone Number" | "Número de Teléfono" |
| Form: Email field | "Email Address" | "Correo Electrónico" |
| Form: Submit button | "Get My Free Quote →" | "Obtener Mi Cotización Gratis →" |
| Form: Success message | "Thanks [Name]! We'll contact you within..." | "¡Gracias [Name]! Te contactaremos en..." |
| Form: Error message | "Something went wrong. Please call us at..." | "Algo salió mal. Por favor llámanos al..." |
| Mobile CTA bar | "📞 Call Now" / "Get a Quote" | "📞 Llama Ahora" / "Cotización" |
| Footer copyright | "All rights reserved." | "Todos los derechos reservados." |

**Regional Spanish (`SPANISH_REGION`) — MANDATORY:** Every word, phrase, idiom, and CTA must sound natural and native to the specified region. This is not a generic translation — it's how a local in that market actually speaks.

| `SPANISH_REGION` | Key linguistic traits to apply |
|---|---|
| Mexican Spanish | Use *tú* for second person. Common vocabulary: *cotización*, *chamba*, *ahorita*, *cuánto cuesta*. Warm, direct tone. Very common for US-based Hispanic markets. |
| Monterrey, Mexico | Same as Mexican Spanish but more formal and business-forward. Regiomontanos value efficiency and directness. Avoid overly casual slang. |
| Colombian Spanish | Use *usted* for second person (more formal, especially in Bogotá/Medellín). Vocabulary: *presupuesto* over *cotización*, *listo* as a filler, warm professional tone. |
| US Spanish (neutral) | Avoid region-specific slang. Use widely understood vocabulary across Latin American dialects. Safe for mixed-origin Hispanic audiences. Leans toward Mexican vocabulary as it's the dominant US Hispanic group. |
| Argentinian Spanish | Use *vos* for second person. Distinct *ll/y* pronunciation reflected in word choices. Vocabulary: *presupuesto*, *laburo*. More European-influenced tone. |
| Puerto Rican / Caribbean Spanish | Faster-paced, informal register acceptable. Use *tú*. More English loanwords integrated naturally. Common for East Coast US Hispanic markets. |

For any `SPANISH_REGION` not in the table above, apply the known linguistic characteristics of that country or city naturally — vocabulary preferences, second-person pronoun (*tú* vs. *usted* vs. *vos*), level of formality, and common local expressions.

**Copywriting tone in Spanish:** Apply the same visitor-first, direct-response copywriting principles from the Copywriting Persona section. Spanish copy must be equally persuasive — never a literal word-for-word translation. Idioms, CTAs, and emotional hooks must resonate with the specific regional audience defined by `SPANISH_REGION`.

**Section headings in Spanish — examples:**
- "Our Services" → "Servicios Disponibles" (not "Nuestros Servicios" — avoid "Nuestros")
- "About Us" → "¿Por Qué Elegirnos?" ("Why Choose Us?" — keeps it visitor-focused)
- "What Our Customers Say" → "Lo Que Dicen Nuestros Clientes"
- "Get a Free Quote" → "Tu Cotización Gratis" (uses "Tu" — visitor-first)
- "Frequently Asked Questions" → "Preguntas Frecuentes"

**`hreflang` tag:** Use the appropriate language-region code based on `SPANISH_REGION`:
- Mexican Spanish → `hreflang="es-MX"`
- Colombian Spanish → `hreflang="es-CO"`
- Argentinian Spanish → `hreflang="es-AR"`
- US Spanish / neutral → `hreflang="es-US"`
- City-specific (e.g. Monterrey) → use the country code (e.g. `hreflang="es-MX"`)
- Unknown/other → use generic `hreflang="es"`

**Contact form Pabbly payload:** Add both `"language": "es"` and `"spanish_region": "SPANISH_REGION"` to the Spanish page's form submission:
```json
{ "language": "es", "spanish_region": "Mexican Spanish", "name": "...", "phone": "...", ... }
```

---

### Section Structure Parity

Both files must have **identical section order and IDs**. Nav anchor links (`#services`, `#contact`, etc.) must work the same on both pages. The only differences between the two files are the `lang` attribute, meta tags, all visible text copy, the toggle button label, and the `language` field in the form payload.

---

## Step 7: Output Delivery

1. Output all HTML files as downloadable files
2. Remind the user of the expected folder structure:

**English-only site:**
```
project-folder/
├── index.html                       ← Homepage (served at /)
├── 404.html                         ← 404 page (served by host on 404)
├── [service-slug]/
│   └── index.html                   ← One folder per service page (URL /[service-slug]/)
├── privacy-policy/
│   └── index.html                   ← URL /privacy-policy/
├── terms-and-conditions/
│   └── index.html                   ← URL /terms-and-conditions/
├── sitemap.xml
├── robots.txt
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── images/
│   ├── LOGO
│   ├── og-image.webp
│   ├── hero-bg.webp
│   └── ...
├── scripts/
│   ├── generate_images.py
│   └── images_manifest.json
└── .env                             ← GEMINI_API_KEY (never deploy)
```

**Bilingual site:**
```
project-folder/
├── index.html                       ← English homepage (served at /)
├── 404.html                         ← 404 page (served by host on 404)
├── [spanish-home-slug]/
│   └── index.html                   ← Spanish homepage (URL /[spanish-home-slug]/)
├── [service-slug]/
│   └── index.html                   ← English service pages
├── [servicio-slug]/
│   └── index.html                   ← Spanish service pages
├── privacy-policy/
│   └── index.html
├── terms-and-conditions/
│   └── index.html
├── politica-de-privacidad/
│   └── index.html
├── terminos-y-condiciones/
│   └── index.html
├── sitemap.xml                      ← includes all pages, both languages
├── robots.txt
├── .gitignore
├── css/
│   └── styles.css                   ← shared by all pages
├── js/
│   └── main.js                      ← shared by all pages
├── images/
│   ├── LOGO
│   ├── og-image.webp
│   ├── hero-bg.webp
│   └── ...
├── scripts/
│   ├── generate_images.py
│   └── images_manifest.json
└── .env                             ← GEMINI_API_KEY (never deploy)
```

3. Include a brief deployment note:
   - "Deploy the entire folder so the logo, images, and page links work correctly."
   - "**Never deploy the `.env` file** — it contains your API key. Add `.env` to your `.gitignore` if using Git."
   - "Run `python scripts/generate_images.py scripts/images_manifest.json` first to populate the `images/` folder before deploying."
   - Netlify/Vercel/Cloudflare Pages: drag and drop the whole folder (excluding `.env`)
   - Coolify: zip the folder (excluding `.env`) and upload as a static site
   - For bilingual sites: "The English `index.html` stays at the project root (served at `/`). The Spanish homepage lives in its own folder as `[spanish-home-slug]/index.html` (served at `/[spanish-home-slug]/`). Deploy the whole project folder so all nested `index.html` files resolve correctly."
4. List any remaining placeholders (booking embed code, testimonial photos, domain URL for hreflang tags)
5. Offer to adjust: colors, copy, sections, form steps, or add new sections

---

## Step 7.5: Privacy Policy & Terms and Conditions Pages

Both pages are always generated as part of every site build. They are linked from the About Us dropdown in the navigation.

---

### File locations

- English: `privacy-policy/index.html` (URL `/privacy-policy/`) and `terms-and-conditions/index.html` (URL `/terms-and-conditions/`)
- Spanish (if `BILINGUAL = yes`): `politica-de-privacidad/index.html` (URL `/politica-de-privacidad/`) and `terminos-y-condiciones/index.html` (URL `/terminos-y-condiciones/`)

---

### Layout

Both pages use the same simplified layout — no Hero, no section alternation, no CTA sections:

```
Navigation (Header)
  ↓
Legal Content Block (full-width)
  ↓
Footer
```

```html
<!-- privacy-policy/index.html or terms-and-conditions/index.html -->
<body>
  <!-- Navigation — identical to all other pages -->

  <main class="legal-page">
    <div class="container">
      <div class="legal-content">
        <!-- h1 + all content here -->
      </div>
    </div>
  </main>

  <!-- Footer — identical to all other pages -->
</body>
```

```css
/* ── Legal Pages ── */
.legal-page {
  padding: var(--space-2xl) 0;
  background-color: var(--color-bg-white);
}
.legal-content {
  width: 100%;
  max-width: 100%;
}
.legal-content h1 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  text-transform: capitalize;
  color: var(--color-text-dark);
  margin-bottom: var(--space-lg);
}
.legal-content h2 {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-sm);
  color: var(--color-text-dark);
}
.legal-content p,
.legal-content li {
  color: var(--color-text-dark);
  line-height: 1.8;
  margin-bottom: var(--space-sm);
  width: 100%;
  max-width: 100%;
}
.legal-content ul {
  padding-left: var(--space-md);
}
.legal-content a {
  color: var(--color-primary);
  text-decoration: underline;
}
```

---

### Content Generation Rules

Both documents must be:
- Written specifically for `BUSINESS_NAME`, `INDUSTRY`, `CITY`, `STATE`, and the confirmed `SERVICES` list — not generic boilerplate
- Professional, clear, and written in plain English (and plain Spanish for the Spanish version)
- Dated with the current build date: *"Last updated: [Month Day, Year]"*
- Include `BUSINESS_NAME`, `EMAIL`, and `PHONE` as the contact details throughout

---

### Privacy Policy — `privacy-policy/index.html`

**`<title>`:** `Privacy Policy | BUSINESS_NAME`
**`<h1>`:** `Privacy Policy`

Generate content covering these sections in order. Each section is an `<h2>` followed by prose paragraphs:

1. **Introduction** — Who we are, what this policy covers, that by using the site the visitor agrees to this policy. Include `BUSINESS_NAME`, `CITY`, `STATE`, and `EMAIL`.

2. **Information We Collect** — Two types:
   - *Information you provide:* name, phone number, email address, service requests submitted through the quote modal
   - *Information collected automatically:* IP address, browser type, pages visited, time spent on site (via standard web analytics)

3. **How We Use Your Information** — Specifically tailored to `INDUSTRY`:
   - To respond to service inquiries and quote requests
   - To schedule and confirm appointments
   - To send follow-up communications related to services requested
   - To improve the website experience
   - We do not sell, rent, or trade your personal information to third parties

4. **How We Share Your Information** — Limited to:
   - Service providers who help operate the website (hosting, analytics)
   - When required by law
   - We never sell personal data

5. **Cookies & Tracking** — Basic explanation that the site may use cookies for analytics. How to disable cookies in browser settings.

6. **Data Security** — We take reasonable measures to protect submitted information. No transmission over the internet is 100% secure.

7. **Third-Party Links** — Site may contain links to third-party sites (Google Maps, social media). We are not responsible for their privacy practices.

8. **Children's Privacy** — Services are not directed at children under 13. We do not knowingly collect data from minors.

9. **Your Rights** — Right to request access, correction, or deletion of personal data. Contact us at `EMAIL`.

10. **Changes to This Policy** — We may update this policy. Check back periodically. Last updated date shown at top.

11. **Contact Us** — `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `PHONE`, `EMAIL`.

---

### Terms and Conditions — `terms-and-conditions/index.html`

**`<title>`:** `Terms and Conditions | BUSINESS_NAME`
**`<h1>`:** `Terms and Conditions`

Generate content covering these sections in order:

1. **Acceptance of Terms** — By accessing this website or requesting services, the user agrees to these terms. If they disagree, they should not use the site.

2. **Services Offered** — Describe in general terms the `INDUSTRY` services provided by `BUSINESS_NAME` in `CITY`, `STATE`. Reference the `SERVICES` list naturally in prose. Note that service availability is subject to location, scheduling, and conditions.

3. **Quotes and Estimates** — Quotes provided through the website or phone are estimates only. Final pricing is confirmed on-site after assessment. `BUSINESS_NAME` reserves the right to adjust pricing based on actual conditions.

4. **Appointments and Scheduling** — Appointments are subject to availability. `BUSINESS_NAME` will make reasonable efforts to honor scheduled times. Client must provide accurate information and access to the work area.

5. **Payment Terms** — Payment is due upon completion of services unless otherwise agreed in writing. Accepted payment methods: as stated at time of booking. Late payments may incur fees.

6. **Warranty and Guarantee** — Work performed by `BUSINESS_NAME` is guaranteed as described at time of service. Warranty does not cover damage caused by misuse, third-party interference, or pre-existing conditions.

7. **Limitation of Liability** — `BUSINESS_NAME` is not liable for indirect, incidental, or consequential damages arising from use of the website or services beyond the amount paid for the specific service in question.

8. **Client Responsibilities** — Client must provide safe and reasonable access to the work site, disclose known hazards, and secure pets and valuables. `BUSINESS_NAME` is not responsible for damage resulting from undisclosed conditions.

9. **Intellectual Property** — All content on this website including text, images, and design is the property of `BUSINESS_NAME`. Do not reproduce without written permission.

10. **Dispute Resolution** — Any disputes will be resolved through good-faith negotiation. If unresolved, disputes will be subject to the laws of `STATE` and handled in the courts of `CITY`, `STATE`.

11. **Changes to Terms** — `BUSINESS_NAME` reserves the right to update these terms at any time. Continued use of the site constitutes acceptance of the updated terms.

12. **Contact Us** — `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `PHONE`, `EMAIL`.

---

### Spanish Versions (when `BILINGUAL = yes`)

Generate full Spanish translations of both pages following the same `SPANISH_REGION` rules that apply to the rest of the site. Files: `politica-de-privacidad/index.html` (URL `/politica-de-privacidad/`) and `terminos-y-condiciones/index.html` (URL `/terminos-y-condiciones/`).

Add links to these pages in the Spanish nav About Us dropdown alongside the English nav links.

---

- **No logo file yet?** Render a text-based logo using `--color-primary` in a bold heading font. Add an HTML comment: `<!-- Replace this with <img src="images/logo.png"> once logo is ready -->` so the client knows exactly where to swap it in.
- **No booking widget yet?** Leave a clearly-marked placeholder `<div id="booking-widget"><p>Booking widget coming soon</p></div>` with a comment.
- **Bilingual site — domain not yet known?** Use `href="#"` as a placeholder in hreflang and toggle link tags and leave an HTML comment: `<!-- Replace # with your actual domain URL before going live -->`.
- **Multiple pages?** This methodology produces single-page sites by default (one scrolling page per language) plus the dedicated service/legal pages. Build multi-page only if the brief requests it.
- **Existing branding?** If the brief provides a color palette or font, use it exactly — never override with defaults.

---

## Reference Files

- `references/industry-services.md` — Popular services by industry vertical (used in Phase 2 suggestions)
- `references/form-templates.md` — Pre-built multi-step form flows by business type
- `references/section-snippets.md` — Reusable HTML/CSS/JS patterns (nav, grids, mobile CTA, typography base)
