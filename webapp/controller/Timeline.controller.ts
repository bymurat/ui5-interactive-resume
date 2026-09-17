import type Popover from "sap/m/Popover";
import Fragment from "sap/ui/core/Fragment";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ResumeGantt from "../control/ResumeGantt";
import type { ResumeGantt$PhasePressEvent } from "../control/ResumeGantt";
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
		const oParameters = oEvent.getParameters();
		const gantt = this.byId("resumeGantt") as ResumeGantt;
		const found = gantt?.findPhase(oParameters.phaseId);
		if (!found) {
			return;
		}
		const { phase, engagementClient, employerName } = found;

		this.detailModel.setData({
			role: phase.getProperty("role") as string,
			team: phase.getProperty("team") as string,
			hat: phase.getProperty("hat") as string,
			additionalHats: (phase.getProperty("additionalHats") as string[] | undefined) ?? [],
			client: engagementClient,
			employer: employerName,
			start: phase.getProperty("start") as string,
			end: phase.getProperty("end") as string | null,
			current: phase.getProperty("current") as boolean,
			summary: phase.getProperty("summary") as string,
			achievements: (phase.getProperty("achievements") as string[] | undefined) ?? [],
			technologies: (phase.getProperty("technologies") as string[] | undefined) ?? [],
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
