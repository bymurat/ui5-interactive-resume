import type Popover from "sap/m/Popover";
import Fragment from "sap/ui/core/Fragment";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ResumeGantt from "../control/ResumeGantt";
import type {
	ResumeGantt$PhasePressEvent,
	ResumeGantt$PhasePressEventParameters,
} from "../control/ResumeGantt";
import BaseController from "./BaseController";

/**
 * @namespace ui5.interactive.resume.controller
 */
export default class Timeline extends BaseController {
	private popover?: Popover;
	private detailModel = new JSONModel({});

	public onInit(): void {
		this.getView().setModel(this.detailModel, "phaseDetail");
	}

	public async onPhasePress(
		oEvent: ResumeGantt$PhasePressEvent,
	): Promise<void> {
		const oParameters =
			oEvent.getParameters() as ResumeGantt$PhasePressEventParameters;
		const gantt = this.byId("resumeGantt") as ResumeGantt;
		const found = gantt?.findPhase(oParameters.phaseId);
		if (!found) {
			return;
		}
		const { phase, engagementClient, employerName } = found;

		this.detailModel.setData({
			role: phase.getProperty("role"),
			team: phase.getProperty("team"),
			hat: phase.getProperty("hat"),
			additionalHats: phase.getProperty("additionalHats") ?? [],
			client: engagementClient,
			employer: employerName,
			start: phase.getProperty("start"),
			end: phase.getProperty("end"),
			current: phase.getProperty("current"),
			summary: phase.getProperty("summary"),
			achievements: phase.getProperty("achievements") ?? [],
			technologies: phase.getProperty("technologies") ?? [],
		});

		if (!this.popover) {
			this.popover = (await Fragment.load({
				id: this.getView().getId(),
				name: "ui5.interactive.resume.fragment.ProjectPopover",
				controller: this,
			})) as Popover;
			this.getView().addDependent(this.popover);
		}

		this.popover.openBy(oParameters.domRef);
	}

	public onClosePopover(): void {
		this.popover?.close();
	}
}
