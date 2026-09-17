import DateFormat from "sap/ui/core/format/DateFormat";
import type { ResumeGanttI18nTexts } from "../control/ResumeGantt";

// Locale-aware month/year formatting (e.g. "Jan 2022", "janv. 2022", "Jan. 2022").
// Resolves against the framework's current language automatically - no hardcoded month names.
const monthYearFormat = DateFormat.getDateInstance({ format: "yMMM" });

function parseYearMonth(value: string | null | undefined): { year: number; month: number } | null {
	if (!value) {
		return null;
	}
	const [y, m] = value.split("-").map(Number);
	if (!y || !m || m < 1 || m > 12) {
		return null;
	}
	return { year: y, month: m };
}

function formatMonth(value: string | null | undefined): string {
	const parsed = parseYearMonth(value);
	if (!parsed) {
		return "";
	}
	return monthYearFormat.format(new Date(parsed.year, parsed.month - 1, 1));
}

function totalMonthsBetween(start: string, end: string | null, current: boolean): number {
	const s = parseYearMonth(start);
	if (!s) {
		return 0;
	}
	let e: { year: number; month: number } | null;
	if (current || !end) {
		const now = new Date();
		e = { year: now.getFullYear(), month: now.getMonth() + 1 };
	} else {
		e = parseYearMonth(end);
	}
	if (!e) {
		return 0;
	}
	return Math.max(0, (e.year - s.year) * 12 + (e.month - s.month) + 1);
}

export default {
	/**
	 * "Jan 2022 – Present" or "Jun 2019 – Dec 2021". `presentLabel` should be bound
	 * to `{i18n>ganttPresent}` so the word is translated along with the rest of the UI.
	 */
	dateRange: (
		start: string,
		end: string | null,
		current: boolean,
		presentLabel = "Present",
	): string => {
		const startStr = formatMonth(start) || "?";
		const endStr = current || !end ? presentLabel : formatMonth(end) || "?";
		return `${startStr} – ${endStr}`;
	},

	/**
	 * Whole-month difference rendered as "Xy Ymo" or "Ymo" for short ranges, using
	 * locale-aware unit templates (each with a "{0}"/"{1}" placeholder) bound from
	 * `{i18n>ganttDurationYears}`, `{i18n>ganttDurationMonths}`, `{i18n>ganttDurationYearsMonths}`.
	 * "current=true" snaps the end to the current month.
	 */
	durationMonths: (
		start: string,
		end: string | null,
		current: boolean,
		yearsTemplate = "{0}y",
		monthsTemplate = "{0}mo",
		yearsMonthsTemplate = "{0}y {1}mo",
	): string => {
		const totalMonths = totalMonthsBetween(start, end, current);
		const years = Math.floor(totalMonths / 12);
		const months = totalMonths % 12;
		if (years === 0) {
			return monthsTemplate.replace("{0}", String(months));
		}
		if (months === 0) {
			return yearsTemplate.replace("{0}", String(years));
		}
		return yearsMonthsTemplate.replace("{0}", String(years)).replace("{1}", String(months));
	},

	/**
	 * Joins an array of tags into a comma-separated string.
	 */
	joinTags: (values: string[] | undefined, separator = ", "): string => {
		if (!Array.isArray(values)) {
			return "";
		}
		return values.join(separator);
	},

	/**
	 * Human label for a role hat ("sapui5" -> "SAPUI5 Developer"). Labels are bound
	 * from `{i18n>hatSapui5}` / `{i18n>hatFullstack}` / `{i18n>hatMobile}` so callers
	 * get the translated text without this module needing to know about locales.
	 */
	hatLabel: (
		hat: string | undefined,
		sapui5Label = "SAPUI5 Developer",
		fullstackLabel = "SAP Full-Stack Developer",
		mobileLabel = "SAP Mobile Developer",
	): string => {
		switch (hat) {
			case "sapui5": return sapui5Label;
			case "fullstack": return fullstackLabel;
			case "mobile": return mobileLabel;
			default: return hat ?? "";
		}
	},

	/**
	 * ObjectStatus semantic state for a hat (drives the indicator color in the popover).
	 */
	hatState: (hat: string | undefined): "Information" | "Success" | "Warning" | "None" => {
		switch (hat) {
			case "sapui5": return "Information";
			case "fullstack": return "Success";
			case "mobile": return "Warning";
			default: return "None";
		}
	},

	/**
	 * "2020-06" -> "Jun 2020" (locale-aware); passes through anything that isn't YYYY-MM.
	 */
	monthYear: (value: string | null | undefined): string => {
		if (!value) return "";
		return formatMonth(value) || value;
	},

	/**
	 * "Acme Corp · via 4Dev SARL", with the connector template bound from
	 * `{i18n>popoverViaLine}` (e.g. German: "{0} · über {1}").
	 */
	viaLine: (client: string, employer: string, template = "{0} · via {1}"): string =>
		template.replace("{0}", client ?? "").replace("{1}", employer ?? ""),

	/**
	 * Truthy when the bound value is a non-empty string. For visibility flags on optional links.
	 */
	hasValue: (value: string | null | undefined): boolean => !!value && value.trim().length > 0,

	/**
	 * Packs the i18n texts the ResumeGantt custom renderer needs into one object.
	 * Custom renderers render from plain control properties, not XML bindings, so we
	 * can't bind multiple `{i18n>...}` parts directly inside the renderer like a view can -
	 * this formatter runs once per i18n change and the result is stored as the control's
	 * `i18nTexts` property instead.
	 */
	packGanttTexts: (
		ariaLabel: string,
		emptyState: string,
		legendParallel: string,
		hatSapui5: string,
		hatFullstack: string,
		hatMobile: string,
		present: string,
		durationYears: string,
		durationMonths: string,
		durationYearsMonths: string,
		ariaOnTeamAt: string,
		ariaPrimaryRole: string,
		ariaAlso: string,
		ariaParallel: string,
	): ResumeGanttI18nTexts => ({
		ariaLabel,
		emptyState,
		legendParallel,
		hatLabels: { sapui5: hatSapui5, fullstack: hatFullstack, mobile: hatMobile },
		present,
		durationYears,
		durationMonths,
		durationYearsMonths,
		ariaOnTeamAt,
		ariaPrimaryRole,
		ariaAlso,
		ariaParallel,
	}),
};
