import BaseController from "./BaseController";

/**
 * @namespace ui5.interactive.resume.controller
 */
export default class App extends BaseController {
	public onInit(): void {
		this.getView().addStyleClass(
			this.getOwnerComponent().getContentDensityClass(),
		);
	}
}
