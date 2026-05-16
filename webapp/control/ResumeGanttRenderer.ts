import type RenderManager from "sap/ui/core/RenderManager";
import type ResumeGantt from "./ResumeGantt";
import type ResumeGanttEmployer from "./ResumeGanttEmployer";
import type ResumeGanttEngagement from "./ResumeGanttEngagement";
import type ResumeGanttPhase from "./ResumeGanttPhase";

interface YearMonth {
  year: number;
  month: number;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const HAT_LABELS: Record<string, string> = {
  sapui5: "SAPUI5 Developer",
  fullstack: "SAP Full-Stack Developer",
  mobile: "SAP Mobile Developer"
};

const HAT_BADGE_ICON: Record<string, string> = {
  sapui5: "sap-icon://web-cam",
  fullstack: "sap-icon://server",
  mobile: "sap-icon://iphone"
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

function formatMonth(ym: YearMonth): string {
  return `${MONTH_NAMES[ym.month - 1]} ${ym.year}`;
}

function hatClass(hat: string): string {
  return `rgPhase--${hat || "sapui5"}`;
}

function formatRangeText(start: string, end: string | null, current: boolean): string {
  const s = parseYM(start);
  const startStr = s ? formatMonth(s) : "?";
  if (current || !end) {
    return `${startStr} → Present`;
  }
  const e = parseYM(end);
  return `${startStr} → ${e ? formatMonth(e) : "?"}`;
}

function formatDurationText(start: string, end: string | null, current: boolean): string {
  const s = parseYM(start);
  if (!s) return "";
  const e = current || !end ? nowYM() : (parseYM(end) ?? nowYM());
  const totalMonths = Math.max(0, ymIndex(e) - ymIndex(s) + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}

const ResumeGanttRenderer = {
  apiVersion: 2,

  render(rm: RenderManager, oControl: ResumeGantt): void {
    const employers = oControl.getEmployers();
    const rowHeight = oControl.getRowHeight();

    rm.openStart("div", oControl);
    rm.class("rgGantt");
    rm.attr("role", "grid");
    rm.attr("aria-label", "Career timeline");
    rm.openEnd();

    if (!employers.length) {
      rm.openStart("div").class("rgGantt--empty").openEnd();
      rm.text("No timeline data available.");
      rm.close("div");
      rm.close("div");
      return;
    }

    if (oControl.getShowLegend()) {
      renderLegend(rm);
    }

    rm.openStart("div").class("rgSwimlanes").openEnd();
    for (const employer of employers) {
      renderEmployerCard(rm, employer, rowHeight);
    }
    rm.close("div");

    rm.close("div");
  }
};

function renderLegend(rm: RenderManager): void {
  rm.openStart("div").class("rgLegend").attr("aria-hidden", "true").openEnd();
  for (const hat of ["sapui5", "fullstack", "mobile"]) {
    rm.openStart("span").class("rgLegendItem").class(`rgLegendItem--${hat}`).openEnd();
    rm.openStart("span").class("rgLegendSwatch").openEnd();
    rm.close("span");
    rm.openStart("span").class("rgLegendLabel").openEnd();
    rm.text(HAT_LABELS[hat]);
    rm.close("span");
    rm.close("span");
  }
  rm.openStart("span").class("rgLegendItem").class("rgLegendItem--parallel").openEnd();
  rm.openStart("span").class("rgLegendSwatch").openEnd();
  rm.close("span");
  rm.openStart("span").class("rgLegendLabel").openEnd();
  rm.text("Parallel / side engagement");
  rm.close("span");
  rm.close("span");
  rm.close("div");
}

function renderEmployerCard(
  rm: RenderManager,
  employer: ResumeGanttEmployer,
  rowHeight: number
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
    employer.getProperty("current") as boolean
  );
  const duration = formatDurationText(
    employer.getProperty("start") as string,
    employer.getProperty("end") as string | null,
    employer.getProperty("current") as boolean
  );

  rm.openStart("span").class("rgEmployerHeader__meta").openEnd();
  rm.text(`${employer.getProperty("city") as string} · ${range} · ${duration}`);
  rm.close("span");

  rm.close("div");

  // ----- per-employer axis -----
  renderAxis(rm, axisStartIdx, axisEndIdx, totalMonths);

  // ----- engagement rows (scoped to this employer's range) -----
  for (const engagement of employer.getEngagements()) {
    renderEngagementRow(rm, employer, engagement, axisStartIdx, totalMonths, rowHeight);
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
  baseRowHeight: number
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
    renderPhase(rm, employer, engagement, phase, axisStartIdx, totalMonths, isParallel);
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
  isParallel: boolean
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
  const ariaLabel = `${role} on team ${team} at ${engagement.getProperty("client")}, ${formatMonth(start)} to ${phase.getProperty("current") ? "present" : formatMonth(end)}. Primary role: ${HAT_LABELS[hat] ?? hat}${additionalHats.length ? `. Also: ${additionalHats.map((h) => HAT_LABELS[h] ?? h).join(", ")}` : ""}${isParallel ? ". Parallel / side engagement." : ""}.`;

  rm.openStart("div", phase);
  rm.class("rgPhase");
  rm.class(hatClass(hat));
  if (isParallel) rm.class("rgPhase--parallel");
  if (phase.getProperty("current")) rm.class("rgPhase--current");
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
        title: HAT_LABELS[extra] ?? extra
      });
    }
  }

  rm.close("div");
}

export default ResumeGanttRenderer;
