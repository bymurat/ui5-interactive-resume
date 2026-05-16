const MONTH_NAMES = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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

function formatMonth(value: string | null | undefined, currentLabel = "Present"): string {
	const parsed = parseYearMonth(value);
	if (!parsed) {
		return currentLabel;
	}
	return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

export default {
	/**
	 * "Jan 2022 – Present" or "Jun 2019 – Dec 2021".
	 */
	dateRange: (start: string, end: string | null, current: boolean): string => {
		const startStr = formatMonth(start);
		const endStr = current || !end ? "Present" : formatMonth(end);
		return `${startStr} – ${endStr}`;
	},

	/**
	 * Whole-month difference rendered as "Xy Ymo" or "Ymo" for short ranges.
	 * "current=true" snaps the end to the current month.
	 */
	durationMonths: (start: string, end: string | null, current: boolean): string => {
		const s = parseYearMonth(start);
		if (!s) {
			return "";
		}
		let e: { year: number; month: number };
		if (current || !end) {
			const now = new Date();
			e = { year: now.getFullYear(), month: now.getMonth() + 1 };
		} else {
			const parsed = parseYearMonth(end);
			if (!parsed) {
				return "";
			}
			e = parsed;
		}
		const totalMonths = Math.max(0, (e.year - s.year) * 12 + (e.month - s.month) + 1);
		const years = Math.floor(totalMonths / 12);
		const months = totalMonths % 12;
		if (years === 0) {
			return `${months}mo`;
		}
		if (months === 0) {
			return `${years}y`;
		}
		return `${years}y ${months}mo`;
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
	 * Human label for a role hat ("sapui5" -> "SAPUI5 Developer").
	 */
	hatLabel: (hat: string | undefined): string => {
		switch (hat) {
			case "sapui5": return "SAPUI5 Developer";
			case "fullstack": return "SAP Full-Stack Developer";
			case "mobile": return "SAP Mobile Developer";
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
	 * "2020-06" -> "Jun 2020"; passes through anything that isn't YYYY-MM.
	 */
	monthYear: (value: string | null | undefined): string => {
		if (!value) return "";
		const parts = value.split("-").map(Number);
		const y = parts[0];
		const m = parts[1];
		if (!y || !m || m < 1 || m > 12) return value;
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${months[m - 1]} ${y}`;
	},

	/**
	 * Truthy when the bound value is a non-empty string. For visibility flags on optional links.
	 */
	hasValue: (value: string | null | undefined): boolean => !!value && value.trim().length > 0
};
