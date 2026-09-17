# AGENTS.md

Interactive resume/CV: an OpenUI5 + TypeScript single-page app deployed to GitHub Pages, featuring a custom Gantt-style control that visualizes career history.

## Architecture

- Entry point [webapp/Component.ts](webapp/Component.ts): registers two models — `device` (responsive state) and `resume` (static [webapp/model/resume.json](webapp/model/resume.json) as a read-only `JSONModel`) — and starts hash-based routing.
- Routing (`sap.m.routing.Router`, see [webapp/manifest.json](webapp/manifest.json)): route `""` → Resume view, route `"timeline"` → Timeline view. Both views share the [BaseController](webapp/controller/BaseController.ts) (router/model/resource-bundle helpers).
- [webapp/view/Resume.view.xml](webapp/view/Resume.view.xml) — `ObjectPageLayout` with profile/overview/skills and an inline Gantt.
- [webapp/view/Timeline.view.xml](webapp/view/Timeline.view.xml) — full-screen Gantt, same phase-popover pattern via [webapp/fragment/ProjectPopover.fragment.xml](webapp/fragment/ProjectPopover.fragment.xml).
- Custom control `webapp/control/ResumeGantt*`: a 4-level element tree (`ResumeGantt` → `ResumeGanttEmployer` → `ResumeGanttEngagement` → `ResumeGanttPhase`) rendered by [ResumeGanttRenderer.ts](webapp/control/ResumeGanttRenderer.ts) using the semantic RenderManager API (apiVersion 2). Bound directly to `resume>/timeline/employers` — no manual re-render logic needed, the framework reacts to aggregation/data changes. Full design rationale in [docs/ResumeGantt.md](docs/ResumeGantt.md).

## Data model

- [webapp/model/resume.json](webapp/model/resume.json) is the single source of content (profile, skills, `timeline.employers[].engagements[].phases[]`, education, certifications, languages, contact).
- [webapp/types/resume.d.ts](webapp/types/resume.d.ts) is the TypeScript contract for that JSON — **keep both in sync** when adding/editing entries.
- [webapp/model/formatter.ts](webapp/model/formatter.ts) has the binding-facing helpers (`dateRange`, `durationMonths`, `joinTags`, `hatLabel`) — reuse these instead of formatting dates/durations inline in views.
- `hat` values are constrained to `"sapui5" | "fullstack" | "mobile"` (drives both label and theme color coding in the Gantt).

## Build, test, lint

- `npm start` (local UI5 bootstrap via [webapp/index.html](webapp/index.html)) vs `npm run start-cdn` ([webapp/index-cdn.html](webapp/index-cdn.html), loads UI5 from CDN) — pick based on what you're validating.
- `npm run ts-typecheck` and `npm run lint` (type-aware ESLint flat config, ignores `webapp/test/e2e/**`) before considering a change done.
- `npm test` runs lint + full coverage suite (50% threshold on branch/function/line/statement) — this is what CI-equivalent verification looks like.
- `webapp/test/unit` and `webapp/test/integration` (OPA) are currently empty placeholders; `webapp/test/e2e` has a WebdriverIO (`wdio-ui5-service`) sample. When adding tests, follow the existing QUnit/OPA/wdio conventions already wired into [webapp/test/testsuite.qunit.ts](webapp/test/testsuite.qunit.ts) rather than introducing a new test runner.
- `npm run build` vs `npm run build:opt` (self-contained, bundles the full UI5 runtime — needed for hosting without CDN access) — both run [scripts/inject-seo.mjs](scripts/inject-seo.mjs) afterward to inject schema.org JSON-LD and a crawlable fallback into `dist/index.html` from `resume.json`.

## Conventions

- Commit via `npm run commit` (czg emoji conventional commits) rather than raw `git commit` messages when asked to commit.
- Node version is pinned in `.nvmrc` (24).
- TypeScript path alias `ui5/interactive/resume/*` → `./webapp/*` (see [tsconfig.json](tsconfig.json)); `strictNullChecks`/`strictPropertyInitialization` are intentionally relaxed for UI5's ownership model.

## Deployment

GitHub Pages via [.github/workflows/pages.yml](.github/workflows/pages.yml) (push to `main` → lint + typecheck + `build:opt` → deploy). Full pipeline, subpath-routing rationale, and post-deploy checklist: [docs/github-pages.md](docs/github-pages.md).
