---
title: "HörMäuschen Website — Build Journey"
date: 2026-04-21
---

# HörMäuschen Website — Build Journey

A short record of what was built, what broke, and how we fixed it.

---

## Stack (final)

| Layer | Choice |
|---|---|
| Hosting | Cloudflare Pages (Git-connected) |
| Static site | Plain HTML + Tailwind CSS (CDN) |
| CMS | Sveltia CMS (drop-in for Decap) |
| CMS auth | GitHub OAuth via Cloudflare Pages Functions |
| Payments | Payhip |
| Media/audio | Infomaniak Object Storage |
| Domains | hoermaeuschen.ch (canonical: www) + 7 redirect domains via Cloudflare Bulk Redirects |

---

## What we built

- Single-page German-language site: hero, song shop, categories, personalized song CTA, contact, footer
- GitHub OAuth backend: `functions/api/auth.js` (login) + `functions/api/auth/callback.js` (token exchange) — no third-party auth service needed
- Sveltia CMS at `/admin` for managing songs, bundles, streaming links, and categories via `songs.json`
- Legal pages: Impressum, Datenschutz, AGB — Swiss DSG compliant

---

## Key decisions & why

**Cloudflare Pages over Workers**
Initially deployed as a Worker (`npx wrangler deploy`), which silently ignored the `functions/` directory — causing 404s on `/api/auth`. Switched to Pages which does file-based function routing automatically.

**Sveltia CMS over Decap CMS**
Decap CMS works but looks dated. Sveltia is a drop-in replacement (same `config.yml`) with a modern UI. One script tag swap, zero config changes.

**Payhip over Stripe**
Stripe requires business registration and more setup overhead. Payhip handles checkout, delivery, and VAT out of the box — better fit for a small independent artist.

**No Formspree**
Removed the contact form entirely. A direct mailto link is simpler, requires no third-party account, and has no submission limits.

---

## Lessons learned

- `npx wrangler deploy` = Worker. `npx wrangler pages deploy` = Pages. They are different products, same CLI.
- Having both `functions/api/auth.js` and `functions/api/auth/callback.js` (file + same-name directory) is valid in Pages routing.
- Cloudflare Bulk Redirects is the right tool for cross-domain redirects — not `_redirects`, not Workers.
- Always test functions locally with `npx wrangler pages dev .` before deploying — a 500 locally (missing env vars) is better than a 404 in prod.
