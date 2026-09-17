import type RenderManager from "sap/ui/core/RenderManager";
import formatter from "../model/formatter";
import type ResumeGantt from "./ResumeGantt";
import type { ResumeGanttI18nTexts } from "./ResumeGantt";
import type ResumeGanttEmployer from "./ResumeGanttEmployer";
import type ResumeGanttEngagement from "./ResumeGanttEngagement";
import type ResumeGanttPhase from "./ResumeGanttPhase";

interface YearMonth {
  year: number;
  month: number;
}

const HAT_BADGE_ICON: Record<string, string> = {
  sapui5: "sap-icon://web-cam",
  fullstack: "sap-icon://server",
  mobile: "sap-icon://iphone"
};

// Fallback texts if the i18nTexts property hasn't been bound yet (e.g. first paint
// before the i18n ResourceModel resolves). English only - real texts come from i18n.
const FALLBACK_TEXTS: ResumeGanttI18nTexts = {
  ariaLabel: "Career timeline",
  emptyState: "No timeline data available.",
  legendParallel: "Parallel / side engagement",
  hatLabels: { sapui5: "SAPUI5 Developer", fullstack: "SAP Full-Stack Developer", mobile: "SAP Mobile Developer" },
  present: "Present",
  durationYears: "{0}y",
  durationMonths: "{0}mo",
  durationYearsMonths: "{0}y {1}mo",
  ariaOnTeamAt: "{0} on team {1} at {2}, {3} to {4}.",
  ariaPrimaryRole: " Primary role: {0}.",
  ariaAlso: " Also: {0}.",
  ariaParallel: " Parallel / side engagement."
};

function parseYM(value: string | null | undefined): YearMonth | null {
  if (!value) return null;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m };
}

function nowYM(): YearMonth {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function ymIndex(ym: YearMonth): number {
  return ym.year * 12 + (ym.month - 1);
}

function effectiveEnd(end: string | null, current: boolean): YearMonth {
  if (current || !end) {
    return nowYM();
  }
  return parseYM(end) ?? nowYM();
}

function hatClass(hat: string): string {
  return `rgPhase--${hat || "sapui5"}`;
}

function formatRangeText(
  start: string,
  end: string | null,
  current: boolean,
  texts: ResumeGanttI18nTexts
): string {
  const startStr = formatter.monthYear(start) || "?";
  if (current || !end) {
    return `${startStr} → ${texts.present}`;
  }
  return `${startStr} → ${formatter.monthYear(end) || "?"}`;
}

function formatDurationText(
  start: string,
  end: string | null,
  current: boolean,
  texts: ResumeGanttI18nTexts
): string {
  return formatter.durationMonths(
    start,
    end,
    current,
    texts.durationYears,
    texts.durationMonths,
    texts.durationYearsMonths
  );
}

const ResumeGanttRenderer = {
  apiVersion: 2,

  render(rm: RenderManager, oControl: ResumeGantt): void {
    const texts = oControl.getI18nTexts() ?? FALLBACK_TEXTS;
    const employers = oControl.getEmployers();
    const rowHeight = oControl.getRowHeight();

    rm.openStart("div", oControl);
    rm.class("rgGantt");
    rm.attr("role", "grid");
    rm.attr("aria-label", texts.ariaLabel);
    rm.openEnd();

    if (!employers.length) {
      rm.openStart("div").class("rgGantt--empty").openEnd();
      rm.text(texts.emptyState);
      rm.close("div");
      rm.close("div");
      return;
    }

    if (oControl.getShowLegend()) {
      renderLegend(rm, texts);
    }

    rm.openStart("div").class("rgSwimlanes").openEnd();
    for (const employer of employers) {
      renderEmployerCard(rm, employer, rowHeight, texts);
    }
    rm.close("div");

    rm.close("div");
  }
};

function renderLegend(rm: RenderManager, texts: ResumeGanttI18nTexts): void {
  rm.openStart("div").class("rgLegend").attr("aria-hidden", "true").openEnd();
  for (const hat of ["sapui5", "fullstack", "mobile"] as const) {
    rm.openStart("span").class("rgLegendItem").class(`rgLegendItem--${hat}`).openEnd();
    rm.openStart("span").class("rgLegendSwatch").openEnd();
    rm.close("span");
    rm.openStart("span").class("rgLegendLabel").openEnd();
    rm.text(texts.hatLabels[hat]);
    rm.close("span");
    rm.close("span");
  }
  rm.openStart("span").class("rgLegendItem").class("rgLegendItem--parallel").openEnd();
  rm.openStart("span").class("rgLegendSwatch").openEnd();
  rm.close("span");
  rm.openStart("span").class("rgLegendLabel").openEnd();
  rm.text(texts.legendParallel);
  rm.close("span");
  rm.close("span");
  rm.close("div");
}

function renderEmployerCard(
  rm: RenderManager,
  employer: ResumeGanttEmployer,
  rowHeight: number,
  texts: ResumeGanttI18nTexts
): void {
  const empStart = parseYM(employer.getProperty("start") as string);
  const empEnd = effectiveEnd(
    employer.getProperty("end") as string | null,
    employer.getProperty("current") as boolean
  );
  if (!empStart) return;

  // Pad the START down to January of the start year so the first year tick sits
  // at 0%. Do NOT pad the END up to December — end exactly at the employer's
  // last month (+2 months breathing room) so bars use the full track width
  // instead of leaving most of a year empty on the right.
  const startYear = Math.floor(ymIndex(empStart) / 12);
  const axisStartIdx = startYear * 12;
  const axisEndIdx = ymIndex(empEnd);
  const totalMonths = Math.max(1, axisEndIdx - axisStartIdx + 1);

  rm.openStart("div", employer);
  rm.class("rgEmployerCard");
  rm.openEnd();

  // ----- header strip -----
  rm.openStart("div").class("rgEmployerHeader").openEnd();

  const emoji = (employer.getProperty("countryEmoji") as string) ?? "";
  rm.openStart("span").class("rgEmployerHeader__flag").attr("aria-hidden", "true").openEnd();
  rm.text(emoji);
  rm.close("span");

  rm.openStart("strong").class("rgEmployerHeader__name").openEnd();
  rm.text(employer.getProperty("name") as string);
  rm.close("strong");

  const range = formatRangeText(
    employer.getProperty("start") as string,
    employer.getProperty("end") as string | null,
    employer.getProperty("current") as boolean,
    texts
  );
  const duration = formatDurationText(
    employer.getProperty("start") as string,
    employer.getProperty("end") as string | null,
    employer.getProperty("current") as boolean,
    texts
  );

  rm.openStart("span").class("rgEmployerHeader__meta").openEnd();
  rm.text(`${employer.getProperty("city") as string} · ${range} · ${duration}`);
  rm.close("span");

  rm.close("div");

  // ----- per-employer axis -----
  renderAxis(rm, axisStartIdx, axisEndIdx, totalMonths);

  // ----- engagement rows (scoped to this employer's range) -----
  for (const engagement of employer.getEngagements()) {
    renderEngagementRow(rm, employer, engagement, axisStartIdx, totalMonths, rowHeight, texts);
  }

  rm.close("div");
}

function renderAxis(
  rm: RenderManager,
  axisStartIdx: number,
  axisEndIdx: number,
  totalMonths: number
): void {
  rm.openStart("div").class("rgEmployerAxis").openEnd();
  rm.openStart("div").class("rgAxisRail").openEnd();
  rm.close("div");
  const firstYear = Math.floor(axisStartIdx / 12);
  const lastYear = Math.floor(axisEndIdx / 12);
  for (let y = firstYear; y <= lastYear; y++) {
    const idx = y * 12;
    const left = ((idx - axisStartIdx) / totalMonths) * 100;
    rm.openStart("span").class("rgAxisTick").style("left", `${left}%`).openEnd();
    rm.text(String(y));
    rm.close("span");
  }
  rm.close("div");
}

function renderEngagementRow(
  rm: RenderManager,
  employer: ResumeGanttEmployer,
  engagement: ResumeGanttEngagement,
  axisStartIdx: number,
  totalMonths: number,
  baseRowHeight: number,
  texts: ResumeGanttI18nTexts
): void {
  const isParallel = engagement.getProperty("parallel") as boolean;

  rm.openStart("div", engagement);
  rm.class("rgRow");
  if (isParallel) rm.class("rgRow--parallel");
  rm.attr("role", "row");
  rm.style("height", `${baseRowHeight}px`);
  rm.openEnd();

  // ----- rail -----
  rm.openStart("div").class("rgRail").openEnd();
  rm.icon(engagement.getProperty("clientLogoIcon") as string, ["rgEmployerIcon"], {
    "aria-hidden": "true"
  });
  rm.openStart("div").class("rgRailText").openEnd();

  rm.openStart("strong").class("rgClientName").openEnd();
  rm.text(engagement.getProperty("client") as string);
  rm.close("strong");

  rm.openStart("small").class("rgEmployerMeta").openEnd();
  rm.text(
    `${engagement.getProperty("city") as string} · ${engagement.getProperty("department") as string}`
  );
  rm.close("small");

  rm.close("div");
  rm.close("div");

  // ----- track -----
  rm.openStart("div").class("rgTrack").openEnd();
  for (const phase of engagement.getPhases()) {
    renderPhase(rm, employer, engagement, phase, axisStartIdx, totalMonths, isParallel, texts);
  }
  rm.close("div");

  rm.close("div");
}

function renderPhase(
  rm: RenderManager,
  employer: ResumeGanttEmployer,
  engagement: ResumeGanttEngagement,
  phase: ResumeGanttPhase,
  axisStartIdx: number,
  totalMonths: number,
  isParallel: boolean,
  texts: ResumeGanttI18nTexts
): void {
  const start = parseYM(phase.getProperty("start") as string);
  if (!start) return;
  const end = effectiveEnd(
    phase.getProperty("end") as string | null,
    phase.getProperty("current") as boolean
  );
  const startIdx = ymIndex(start);
  const endIdx = ymIndex(end);
  const left = ((startIdx - axisStartIdx) / totalMonths) * 100;
  const width = ((endIdx - startIdx + 1) / totalMonths) * 100;
  const role = phase.getProperty("role") as string;
  const team = phase.getProperty("team") as string;
  const hat = phase.getProperty("hat") as string;
  const additionalHats = (phase.getProperty("additionalHats") as string[] | null) ?? [];
  const isCurrent = phase.getProperty("current") as boolean;

  const primaryRoleLabel = texts.hatLabels[hat as keyof typeof texts.hatLabels] ?? hat;
  let ariaLabel = texts.ariaOnTeamAt
    .replace("{0}", role)
    .replace("{1}", team)
    .replace("{2}", String(engagement.getProperty("client")))
    .replace("{3}", formatter.monthYear(phase.getProperty("start") as string) || "?")
    .replace("{4}", isCurrent ? texts.present : formatter.monthYear(phase.getProperty("end") as string) || "?");
  ariaLabel += texts.ariaPrimaryRole.replace("{0}", primaryRoleLabel);
  if (additionalHats.length) {
    const alsoLabels = additionalHats
      .map((h) => texts.hatLabels[h as keyof typeof texts.hatLabels] ?? h)
      .join(", ");
    ariaLabel += texts.ariaAlso.replace("{0}", alsoLabels);
  }
  if (isParallel) {
    ariaLabel += texts.ariaParallel;
  }

  rm.openStart("div", phase);
  rm.class("rgPhase");
  rm.class(hatClass(hat));
  if (isParallel) rm.class("rgPhase--parallel");
  if (isCurrent) rm.class("rgPhase--current");
  rm.attr("role", "gridcell");
  rm.attr("tabindex", "0");
  rm.attr("data-phase-id", phase.getProperty("phaseId") as string);
  rm.attr("data-engagement-id", engagement.getProperty("engagementId") as string);
  rm.attr("data-employer-id", employer.getProperty("employerId") as string);
  rm.attr("aria-label", ariaLabel);
  rm.style("left", `${left}%`);
  rm.style("width", `${width}%`);
  rm.openEnd();

  rm.openStart("span").class("rgPhaseRole").openEnd();
  rm.text(role);
  rm.close("span");
  rm.openStart("span").class("rgPhaseTeam").openEnd();
  rm.text(team);
  rm.close("span");

  for (const extra of additionalHats) {
    const icon = HAT_BADGE_ICON[extra];
    if (icon) {
      rm.icon(icon, ["rgPhaseBadge", `rgPhaseBadge--${extra}`], {
        "aria-hidden": "true",
        title: texts.hatLabels[extra as keyof typeof texts.hatLabels] ?? extra
      });
    }
  }

  rm.close("div");
}

export default ResumeGanttRenderer;
