#!/usr/bin/env node
/**
 * inject-seo.mjs — build-time SEO enrichment for the UI5 resume.
 *
 * Reads `webapp/model/resume.json` and rewrites the marker comments
 *     <!-- SEO_JSON_LD -->
 *     <!-- SEO_FALLBACK -->
 * inside `dist/index.html` (and `dist/index-cdn.html` if present) with:
 *   1. A JSON-LD <script> containing a full schema.org/Person record.
 *   2. A semantic-HTML resume rendered from the same data, sitting in a
 *      visually-hidden <aside class="seo-fallback"> so crawlers that don't
 *      execute JS (or run the first Googlebot pass) still index everything.
 *
 * Run via `npm run build` or `npm run build:opt` — both chain to `npm run inject-seo`.
 * Standalone: `node scripts/inject-seo.mjs` after a `ui5 build`.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const RESUME_PATH = join(ROOT, "webapp", "model", "resume.json");

const escape = (s) =>
	String(s ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

function buildJsonLd(r) {
	const channels = r.contact?.channels ?? [];
	const sameAs = channels
		.filter((c) => /^https?:/.test(c.href ?? ""))
		.map((c) => c.href);
	const email = channels.find((c) => c.type === "email" && c.value)?.value;
	const canonical = r.seo?.canonicalUrl ?? "";

	const schema = {
		"@context": "https://schema.org",
		"@type": "Person",
		name: `${r.profile.firstName} ${r.profile.lastName}`,
		givenName: r.profile.firstName,
		familyName: r.profile.lastName,
		jobTitle: r.profile.title,
		description: r.profile.intro,
		url: canonical,
		...(email ? { email } : {}),
		...(sameAs.length ? { sameAs } : {}),
		address: {
			"@type": "PostalAddress",
			addressLocality: r.profile.location
		},
		knowsAbout: (r.skills ?? []).flatMap((g) => g.skills.map((s) => s.name)),
		alumniOf: (r.education ?? []).map((e) => ({
			"@type": "EducationalOrganization",
			name: e.institution,
			address: e.city
		})),
		hasCredential: (r.certifications ?? []).map((c) => ({
			"@type": "EducationalOccupationalCredential",
			name: c.name,
			recognizedBy: { "@type": "Organization", name: c.issuer },
			dateCreated: c.issued,
			...(c.verifyUrl && !c.verifyUrl.includes("REPLACE") ? { url: c.verifyUrl } : {})
		})),
		knowsLanguage: (r.languages ?? []).map((l) => l.name),
		worksFor: (r.timeline?.employers ?? []).slice(0, 1).map((e) => ({
			"@type": "Organization",
			name: e.name,
			address: e.city
		}))
	};
	return JSON.stringify(schema, null, "\t");
}

function buildFallbackHtml(r) {
	const lines = [];
	const push = (s) => lines.push(s);
	const fmt = (s) => (s ? escape(s) : "Present");

	push(`<h1>${escape(r.profile.firstName)} ${escape(r.profile.lastName)} — ${escape(r.profile.title)}</h1>`);
	push(`<p>${escape(r.profile.intro)}</p>`);
	push(`<p><strong>Location:</strong> ${escape(r.profile.location)} · <strong>Availability:</strong> ${escape(r.profile.availability)}</p>`);

	push(`<h2>Professional Summary</h2>`);
	push(`<p>${escape(r.summary)}</p>`);

	push(`<h2>Experience</h2>`);
	for (const emp of r.timeline?.employers ?? []) {
		push(`<section>`);
		push(`<h3>${escape(emp.name)} — ${escape(emp.country)} · ${escape(emp.city)}</h3>`);
		push(`<p>${escape(emp.start)} → ${fmt(emp.end)}</p>`);
		for (const eng of emp.engagements ?? []) {
			push(`<article>`);
			push(`<h4>${escape(eng.client)} — ${escape(eng.city)} · ${escape(eng.department)}${eng.parallel ? " (parallel / side engagement)" : ""}</h4>`);
			push(`<p>${escape(eng.start)} → ${fmt(eng.end)}</p>`);
			for (const ph of eng.phases ?? []) {
				push(`<p><strong>${escape(ph.role)}</strong> · ${escape(ph.team)} (${escape(ph.start)} → ${fmt(ph.end)})</p>`);
				push(`<p>${escape(ph.summary)}</p>`);
				if (ph.achievements?.length) {
					push(`<ul>`);
					for (const a of ph.achievements) push(`<li>${escape(a)}</li>`);
					push(`</ul>`);
				}
				if (ph.technologies?.length) {
					push(`<p><em>Technologies:</em> ${ph.technologies.map(escape).join(", ")}</p>`);
				}
			}
			push(`</article>`);
		}
		push(`</section>`);
	}

	push(`<h2>Skills</h2>`);
	for (const grp of r.skills ?? []) {
		push(`<h3>${escape(grp.title)}</h3>`);
		push(`<ul>`);
		for (const s of grp.skills ?? []) {
			push(`<li>${escape(s.name)}${s.years ? ` (${s.years} years)` : ""}</li>`);
		}
		push(`</ul>`);
	}

	if (r.education?.length) {
		push(`<h2>Education</h2>`);
		push(`<ul>`);
		for (const e of r.education) {
			push(`<li>${escape(e.degree)} ${escape(e.field)} — ${escape(e.institution)}, ${escape(e.city)} (${escape(e.start)} → ${escape(e.end)})</li>`);
		}
		push(`</ul>`);
	}

	if (r.certifications?.length) {
		push(`<h2>Certifications</h2>`);
		push(`<ul>`);
		for (const c of r.certifications) {
			push(`<li>${escape(c.name)} — ${escape(c.issuer)} (${escape(c.issued)})${c.verifyUrl && !c.verifyUrl.includes("REPLACE") ? ` <a href="${escape(c.verifyUrl)}">verify</a>` : ""}</li>`);
		}
		push(`</ul>`);
	}

	if (r.languages?.length) {
		push(`<h2>Languages</h2>`);
		push(`<ul>`);
		for (const l of r.languages) push(`<li>${escape(l.name)} — ${escape(l.level)}</li>`);
		push(`</ul>`);
	}

	if (r.contact?.channels?.length) {
		push(`<h2>Contact</h2>`);
		push(`<ul>`);
		for (const ch of r.contact.channels) {
			push(`<li>${escape(ch.label)}: <a href="${escape(ch.href)}">${escape(ch.value)}</a></li>`);
		}
		push(`</ul>`);
	}

	return lines.join("\n");
}

function enrich(htmlPath, jsonLd, fallback) {
	if (!existsSync(htmlPath)) return false;
	let html = readFileSync(htmlPath, "utf8");
	const before = html.length;
	html = html.replace(
		"<!-- SEO_JSON_LD -->",
		`<script type="application/ld+json">\n${jsonLd}\n\t\t</script>`
	);
	html = html.replace("<!-- SEO_FALLBACK -->", fallback);
	if (html.length === before) {
		console.warn(`[inject-seo] markers not found in ${htmlPath}; nothing replaced`);
		return false;
	}
	writeFileSync(htmlPath, html);
	console.log(`[inject-seo] enriched ${htmlPath} (+${html.length - before} bytes)`);
	return true;
}

if (!existsSync(RESUME_PATH)) {
	console.error(`[inject-seo] ${RESUME_PATH} not found`);
	process.exit(1);
}
if (!existsSync(DIST)) {
	console.error(`[inject-seo] ${DIST} not found — run 'ui5 build' first`);
	process.exit(1);
}

const resume = JSON.parse(readFileSync(RESUME_PATH, "utf8"));
const jsonLd = buildJsonLd(resume);
const fallback = buildFallbackHtml(resume);

let touched = 0;
for (const name of ["index.html", "index-cdn.html"]) {
	if (enrich(join(DIST, name), jsonLd, fallback)) touched++;
}
if (!touched) {
	console.error("[inject-seo] no files enriched");
	process.exit(1);
}
