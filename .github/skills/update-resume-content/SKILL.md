---
name: update-resume-content
description: 'Add or edit resume content: employers, engagements/clients, role phases, skills, education, certifications, languages, or contact info in resume.json. Use when the user wants to add a new job, project, skill, certification, or update career timeline data.'
---

# Update Resume Content

Keeps [webapp/model/resume.json](../../../webapp/model/resume.json) and its TypeScript contract [webapp/types/resume.d.ts](../../../webapp/types/resume.d.ts) in sync when editing resume content.

## When to Use

- Adding a new employer, client engagement, or role phase to the career timeline
- Adding/editing a skill group, education entry, certification, or language
- Updating profile summary, availability, or contact channels

## Procedure

1. **Read the current shape first**: check [webapp/types/resume.d.ts](../../../webapp/types/resume.d.ts) for the exact fields/types of the entity being edited (e.g. `TimelinePhase`, `TimelineEngagement`, `TimelineEmployer`, `Skill`, `Education`, `Certification`, `ContactChannel`).
2. **Edit [webapp/model/resume.json](../../../webapp/model/resume.json)** following that shape exactly:
   - Timeline nesting is `timeline.employers[].engagements[].phases[]` — never flatten it.
   - `id` fields must be unique strings within their array (used for popover lookups via `ResumeGantt.findPhase`).
   - `hat` on a phase must be one of `"sapui5" | "fullstack" | "mobile"` (controls both the Gantt color coding and the `hatLabel` formatter output in [webapp/model/formatter.ts](../../../webapp/model/formatter.ts)). Use `additionalHats` for secondary role types.
   - Dates use the format already present in sibling entries (check a neighboring record); `current: true` entries should omit/omit-consistent `end`.
   - `parallel: true` on an engagement renders it as a lighter/secondary swimlane — only set it for concurrent/overlapping client work.
3. **If the shape itself needs to change** (new field, new entity), update `resume.d.ts` in the same change, and check whether [webapp/model/formatter.ts](../../../webapp/model/formatter.ts) or the Gantt control classes (`webapp/control/ResumeGantt*.ts`) need a matching update to read/render the new field.
4. **Verify**: run `npm run ts-typecheck` — this validates any code binding to `resume.json` still compiles against the updated types. There is no JSON Schema validation, so the type-check is the only automated guardrail for shape correctness.
5. If the change affects `profile` or top-level SEO-relevant fields, note that [scripts/inject-seo.mjs](../../../scripts/inject-seo.mjs) reads `resume.json` at build time to generate the schema.org/Person JSON-LD — re-run `npm run build` (or `build:opt`) if verifying SEO output.
