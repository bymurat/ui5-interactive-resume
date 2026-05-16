# GitHub Pages Deployment

The site is deployed automatically by GitHub Actions on every push to `main`.

## How it works

`.github/workflows/pages.yml` runs:

1. **Checkout** the repo.
2. **Set up Node** from `.nvmrc` (Node 24), with npm cache.
3. **`npm ci`** — clean, lockfile-exact install.
4. **`npm run ui5lint`** + **`npm run ts-typecheck`** — fail the deploy if the
   code is broken (a green site is better than a fast broken one).
5. **`npm run build:opt`** — self-contained UI5 build into `dist/` (bundles the
   whole OpenUI5 runtime so the site has zero CDN dependency) and then runs
   `scripts/inject-seo.mjs` to inject the JSON-LD + SEO fallback HTML from
   `resume.json` into `dist/index.html`.
6. **`touch dist/.nojekyll`** — stops GitHub Pages' Jekyll layer from stripping
   any underscore-prefixed files.
7. **Upload `dist/`** as the Pages artifact and **deploy** it.

`dist/` stays git-ignored — it's a build artifact, rebuilt fresh in CI every
time. Nothing to commit.

## One-time repository setup (manual — do this once)

1. Create a **public** repo named exactly **`ui5-interactive-resume`**.
   - The name matters: the canonical URL, `sitemap.xml`, `robots.txt`, and the
     Open Graph tags are all hard-coded to
     `https://bymurat.github.io/ui5-interactive-resume/`. If you pick a
     different repo name, update those (see "Changing the URL" below).
2. Push the code to `main`.
3. In the repo: **Settings → Pages → Build and deployment → Source =
   "GitHub Actions"** (not "Deploy from a branch").
4. Push (or re-run the workflow from the Actions tab). First deploy takes a
   couple of minutes; the live URL appears in the workflow's `deploy` job and
   under Settings → Pages.

## Why it works under the `/ui5-interactive-resume/` sub-path

- `index.html` uses a **relative** resource root
  (`data-sap-ui-resource-roots='{"ui5.interactive.resume": "./"}'`) and the
  self-contained build loads `resources/sap-ui-core.js` relatively — so the app
  doesn't care what sub-path it's served from.
- Routing is **hash-based** (`sap.m.routing.Router`), so `#/timeline` works
  under any base path with no server rewrites (GitHub Pages can't do rewrites).

## Post-deploy checklist

- [ ] Open the live URL — Object Page renders, Gantt loads.
- [ ] `#/timeline` deep link works (full-screen Gantt).
- [ ] `view-source:` shows the JSON-LD `<script>` and the `seo-fallback` block.
- [ ] `https://bymurat.github.io/ui5-interactive-resume/sitemap.xml` loads.
- [ ] Submit that sitemap in Google Search Console (after verifying the
      property via the meta tag placeholder in `index.html`).
- [ ] Test a LinkedIn/Slack paste of the URL — Open Graph preview shows.

## Changing the URL (custom domain or different repo name)

The deployment URL is referenced in four places — update all if it changes:

- `webapp/index.html` & `webapp/index-cdn.html` — `<link rel="canonical">`,
  `og:url`, `og:image`, `twitter:image`.
- `webapp/sitemap.xml` — both `<loc>` entries.
- `webapp/robots.txt` — the `Sitemap:` line.
- `webapp/model/resume.json` — `seo.canonicalUrl`.

For a custom domain, also add a `webapp/CNAME` file containing the domain
(it gets copied into `dist/` by the build) and configure DNS per GitHub's docs.
