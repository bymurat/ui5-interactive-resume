import JSONModel from "sap/ui/model/json/JSONModel";
import BindingMode from "sap/ui/model/BindingMode";
import Device from "sap/ui/Device";
import Localization from "sap/base/i18n/Localization";

// Locales with a fully translated resume.<locale>.json content file. Luxembourgish
// only has translated UI chrome (see i18n_lb.properties), so it's not listed here -
// LB visitors get the English CV content.
const CONTENT_LOCALES = ["fr", "de"];

/**
 * Resolves the current UI5 language (already negotiated from ?sap-language=,
 * a persisted preference, or the browser) down to a resume content locale.
 * Returns undefined when the default (English) content should be used.
 */
export function resolveContentLocale(): string | undefined {
	const language = Localization.getLanguage().toLowerCase();
	const base = language.split(/[-_]/)[0];
	return CONTENT_LOCALES.includes(base) ? base : undefined;
}

export default {
	createDeviceModel: () => {
		const oModel = new JSONModel(Device);
		oModel.setDefaultBindingMode(BindingMode.OneWay);
		return oModel;
	},

	createResumeModel: (locale = resolveContentLocale()) => {
		const fileName = locale ? `resume.${locale}.json` : "resume.json";
		const oModel = new JSONModel(sap.ui.require.toUrl(`ui5/interactive/resume/model/${fileName}`));
		oModel.setDefaultBindingMode(BindingMode.OneWay);
		return oModel;
	}
};
