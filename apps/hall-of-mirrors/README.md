# Hall of Mirrors

A founder legibility diagnostic — and a free Claude skill — from AussieOS.

Live at: **aussieos.xyz/apps/hall-of-mirrors/**

---

## What this is

Hall of Mirrors simulates how the same startup is read by six different
parts of the innovation system at once — venture capital, angels,
government, grants, accelerators, and corporates — plus an optional
seventh layer for founders building in Web3 / open-source. It's built
around the Australian ecosystem specifically (fund sizes, sovereign
capability framing, grant/acquittal norms), but the skill adapts that
texture to the founder's actual market if they're building elsewhere —
see "Portability" below.

It doesn't score or rank. It shows six parallel readings, maps where
they contradict each other, and tells the founder whether the
contradiction is a narrative problem (reframe it) or a structural one
(a real choice they have to make).

The framework itself — the "Hall of Mirrors" concept — originates in
[Built Different](https://aussieos.xyz/builtdifferent/), AussieOS's
founder field guide. This folder packages that framework as a working
tool: a Claude skill, plus the microsite that explains and distributes it.

---

## Folder contents

```
apps/hall-of-mirrors/
├── index.html              the microsite — self-contained, no build step
├── hall-of-mirrors.skill   the Claude skill, ready to upload as-is
└── hall-of-mirrors.zip     identical contents to .skill, different extension
                            (some Claude upload flows expect .zip)
```

`hall-of-mirrors.skill` and `hall-of-mirrors.zip` are the same archive.
Both contain a single `SKILL.md` inside a `hall-of-mirrors/` folder —
that folder-at-the-root structure matters; if you ever rebuild the
archive by hand, zip the folder, not just the file inside it.

---

## Deploying the site

`index.html` is fully self-contained — fonts load from Google Fonts CDN,
all CSS and JS are inline, there's no build step. To publish:

1. Push this folder as-is to the repo, unchanged path.
2. It serves at `aussieos.xyz/apps/hall-of-mirrors/` once live.
3. The two download buttons on the page point to `./hall-of-mirrors.skill`
   and `./hall-of-mirrors.zip` — relative paths, so they only work if
   those two files sit in the same folder as `index.html`. Don't move
   one without the other.

No environment variables, no API keys, no server. If it ever needs one
in future (see "If you add a counter" below), that changes.

---

## Updating the skill

If you ever change the six rooms, add a room, or otherwise edit the
diagnostic's logic, **three places need to change together** or the
tool and the site will contradict each other — which, for a skill
about the cost of contradiction, would be a bad look:

1. **`hall-of-mirrors/SKILL.md`** (source file, not in this folder —
   keep it wherever you're editing from) — the actual skill logic.
2. **`hall-of-mirrors.skill` / `.zip`** — rebuild both after editing
   `SKILL.md`. They're identical archives with different extensions;
   regenerate both from the same source every time.
3. **The copy-paste prompt block on `index.html`** (inside the
   `#prompt` section, in a `<pre>` tag) — this is the same instruction
   set typed out in full for people without skill support. It needs to
   match the `SKILL.md` content or the two diverge.

To rebuild the archive after editing `SKILL.md`:

```bash
# from the folder containing hall-of-mirrors/SKILL.md
zip -r hall-of-mirrors.zip hall-of-mirrors
cp hall-of-mirrors.zip hall-of-mirrors.skill
```

Then copy both into this folder alongside `index.html`.

---

## How the skill works (summary)

Full detail lives in `SKILL.md` itself. Short version:

1. **Intake** — the founder describes the company and what evidence
   actually exists today. Gaps are marked as gaps, never filled in.
2. **Six room readings** — VC, Angels, Government, Grants,
   Accelerators, Corporates. Each reads the same company through its
   own grammar and reports what's legible, illegible, and what it
   would ask for next.
3. **Optional overlay** — Web3 / open-source, read only if the
   founder is actually building in that space.
4. **Misalignment map** — only the contradictions that actually arise
   from the intake, each tagged narrative or structural.
5. **Translation layer** — per-room fixes, labelled reframe / real
   change / missing receipt.
6. **Coherence check** — is there one true story that holds across
   every room, or does the founder have to choose.

Hard rules baked into the skill: no invented traction (absence is read
as absence), no real fund/program/scheme names (archetype-level only),
no scores or rankings ever, and it won't help optimise a single-room
pitch — it exists to surface cross-room friction, not resolve it away.

---

## Portability

The six-room structure is written for Australia specifically — local
fund sizes, sovereign-capability framing, grant/acquittal norms, and
so on. That specificity is what makes the readings sharp rather than
generic.

If a founder outside Australia uses it, the skill doesn't break or
force an Australian lens onto them. It keeps the same six-room
structure but adapts each room's texture to their actual market, and
says plainly that it's done this. That instruction lives in `SKILL.md`
(Step 1) and is mirrored in the copy-paste prompt on the site — if you
ever rewrite either, keep that line in both.

There's no separate "Global Edition" skill or country dropdown on the
site, and no plan to build one unless real demand shows up. A dropdown
on a static site can't actually regenerate a different skill file
per country without real backend logic, so it would be a UI promise
the tool couldn't back up.

---

## Site sections (index.html)

- **Hero** — headline, download CTAs, link back to Built Different
- **Framework image** — the Hall of Mirrors diagram from Built Different,
  for anyone landing here who hasn't seen the report
- **What It Is** — the premise, in plain terms
- **The Six Rooms** — one card per room, plus the optional overlay
- **How It Works** — the five-step method
- **Install** — step-by-step Claude skill upload instructions
- **Try These** — example prompts for once it's installed
- **The Prompt** — full copy-paste version for non-skill use
- **Share** — pre-filled X/Twitter post via a plain `<a>` link (not
  JS `window.open`, which is more reliable against popup blockers)

---

## Analytics

Cloudflare Web Analytics is wired into `<head>`. It's cookieless and
doesn't conflict with the footer's "no cookies, no tracking" line —
but it does mean a beacon script is present, worth knowing if anyone
asks what that footer line covers.

---

## If you add a download/share counter later

Static HTML can't count anything truthfully on its own — no server,
no database. Don't fake one with `localStorage` or a hardcoded number;
on a project this focused on honesty, a discovered fake counter would
cost more credibility than it's worth. If real social proof is wanted
later, the right build is a small serverless function (Netlify
Functions, since the rest of AussieOS already uses Netlify) writing to
a KV store, called on download/share click. Worth doing once the real
number is a strength, not before.

---

## Ownership

Part of the [AussieOS](https://aussieos.xyz) collective.
CC BY-SA 4.0 — AussieOS Collective — 2025–2026.
