import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import Localization from "sap/base/i18n/Localization";
import type { Select$ChangeEvent } from "sap/m/Select";
import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import type Router from "sap/ui/core/routing/Router";
import UIComponent from "sap/ui/core/UIComponent";
import type Model from "sap/ui/model/Model";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import type AppComponent from "../Component";

/**
 * @namespace ui5.interactive.resume.controller
 */
export default abstract class BaseController extends Controller {
	/**
	 * Convenience method for accessing the component of the controller's view.
	 * @returns The component of the controller's view
	 */
	public getOwnerComponent(): AppComponent {
		return super.getOwnerComponent() as AppComponent;
	}

	/**
	 * Convenience method to get the components' router instance.
	 * @returns The router instance
	 */
	public getRouter(): Router {
		return UIComponent.getRouterFor(this);
	}

	/**
	 * Convenience method for getting the i18n resource bundle of the component.
	 * @returns {Promise<sap.base.i18n.ResourceBundle>} The i18n resource bundle of the component
	 */
	public getResourceBundle(): Promise<ResourceBundle> {
		const oModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
		return oModel.getResourceBundle() as Promise<ResourceBundle>;
	}

	/**
	 * Convenience method for getting the view model by name in every controller of the application.
	 * @param [sName] The model name
	 * @returns The model instance
	 */
	public getModel(sName?: string): Model {
		return this.getView().getModel(sName);
	}

	/**
	 * Convenience method for setting the view model in every controller of the application.
	 * @param oModel The model instance
	 * @param [sName] The model name
	 * @returns The current base controller instance
	 */
	public setModel(oModel: Model, sName?: string): BaseController {
		this.getView().setModel(oModel, sName);
		return this;
	}

	/**
	 * Convenience method for triggering the navigation to a specific target.
	 * @public
	 * @param sName Target name
	 * @param [oParameters] Navigation parameters
	 * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
	 */
	public navTo(sName: string, oParameters?: object, bReplace?: boolean): void {
		this.getRouter().navTo(sName, oParameters, undefined, bReplace);
	}

	/**
	 * Convenience event handler for navigating back.
	 * It there is a history entry we go one step back in the browser history
	 * If not, it will replace the current entry of the browser history with the main route.
	 */
	public onNavBack(): void {
		const sPreviousHash = History.getInstance().getPreviousHash();
		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("resume", {}, undefined, true);
		}
	}

	/**
	 * The base language subtag of the current UI5 session (e.g. "en", "fr", "de", "lb").
	 * Used as the `selectedKey` of the language switcher.
	 */
	public getCurrentLanguageKey(): string {
		const language = Localization.getLanguage().toLowerCase();
		const base = language.split(/[-_]/)[0];
		return ["fr", "de", "lb"].includes(base) ? base : "en";
	}

	/**
	 * Switches the app language: persists the choice in the URL (`sap-language`) and
	 * reloads, so both the i18n bundle and the (per-locale) resume content model are
	 * re-resolved consistently from a clean boot - simpler and more robust than an
	 * in-place hot-swap of two independently-loaded models.
	 */
	public onLanguageChange(oEvent: Select$ChangeEvent): void {
		const key = oEvent.getParameter("selectedItem")?.getKey();
		if (!key) {
			return;
		}
		const url = new URL(window.location.href);
		url.searchParams.set("sap-language", key);
		window.location.href = url.toString();
	}
}
