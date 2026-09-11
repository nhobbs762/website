# Hobbes Digital — website

Astro static site, deployed by Cloudflare Pages.

---

## ⛔ HARD CONSTRAINTS — never violate these

### 1. Stay on the Cloudflare free tier. Always.

**Never build anything that would push this account beyond the Cloudflare free
tier.** This is not a preference. It is a hard limit on every design decision.

If a requested feature *would* cross a free-tier boundary:

1. **Stop before building it.**
2. Explicitly tell Nic which limit it would cross, what it would cost, and why.
3. Offer a free-tier alternative.
4. Only proceed once he has said yes with that knowledge.

Applies equally to anything added incidentally — a binding, a service, a
dependency that needs paid infrastructure. "It's only a few dollars" is not a
judgement available to you; surface it and let him decide.

### 2. Never touch billing or subscription settings.

**Never adjust subscription, plan, or billing settings in Cloudflare or GitHub
— under any circumstances, including if it appears to unblock a task.** Do not
upgrade a plan, add a payment method, change a seat count, or enable a paid
add-on. If a task genuinely requires a plan change, stop and tell Nic. He makes
that call himself, in the dashboard, personally.

### Free-tier ceilings to design against

| Service | Free limit |
|---|---|
| Pages — builds | 500 / month |
| Pages — bandwidth & requests | Unlimited |
| Pages — custom domains | 100 |
| Workers — requests | 100,000 / day |
| Workers — CPU | 10 ms / invocation |
| Zero Trust (Access) | 50 users |
| KV | 100k reads, 1k writes / day; 1 GB |
| D1 | 5 GB; 5 M rows read / day |
| R2 | 10 GB; zero egress fees |

Current usage is nowhere near any of these. Keep it that way. The realistic
risks are **Pages build minutes** (don't add build-heavy steps or chatty
auto-deploy loops) and **adding a paid-only service** without noticing.

---

## Architecture

- **Astro 4**, static output. No SSR adapter, no server runtime.
- **Cloudflare Pages** project `hobbes-digital-website`, connected to GitHub
  `nhobbs762/website`. Build: `npm run build` → `dist`, root dir `""`.
- Production branch is `main`; it serves `hobbesdigital.com`.
- **Every branch gets a free preview deploy** (`preview_branch_includes: ["*"]`).
  That is the staging environment — use it, don't build a second one.
- Deploys are automatic on push. There is no GitHub Actions workflow and none
  is needed; do not add one for deployment.

## Site structure

Three destinations only — homepage, resources, blog.

- `/` — homepage
- `/resources` + `/resources/[slug]` — evergreen, maintained guides
- `/blog` + `/blog/[slug]` — dated posts, timely
- `/admin` — Sveltia CMS

## Content

Both collections live in `src/content/` as markdown with frontmatter and share
a schema base in `src/content/config.ts`.

Drafts: set `draft: true`. `src/lib/content.ts` strips drafts from production
builds only (detected via `CF_PAGES_BRANCH === 'main'`), so a draft stays
visible on branch previews and in local dev. Always read collections through
`getPosts()` from `src/lib/content.ts` — never call `getCollection()` directly
in a page, or drafts will leak to production.

## Styles

`public/styles/tokens.css` (design tokens, font imports) and `main.css`
(components). Dark palette: midnight background, bone text, oxblood accent.
Use the existing tokens and component classes; don't introduce a new system or
a CSS framework.

## Conventions

- Keep `npm run build` green before every commit.
- No analytics, tracking, or third-party scripts without asking.
