import type ListItemBase from "sap/m/ListItemBase";
import { URLHelper } from "sap/m/library";
import PDFViewer from "sap/m/PDFViewer";
import type Popover from "sap/m/Popover";
import type Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ResumeGantt from "../control/ResumeGantt";
import type { ContactChannel } from "../types/resume";
import BaseController from "./BaseController";

/**
 * @namespace ui5.interactive.resume.controller
 */
export default class Resume extends BaseController {
  private popover?: Popover;
  private pdfViewer?: PDFViewer;
  private detailModel = new JSONModel({});

  public onInit(): void {
    this.getView().setModel(this.detailModel, "phaseDetail");
  }

  public onContactPress(): void {
    const email = this.getPrimaryEmail();
    if (email) {
      URLHelper.redirect(email.href, false);
    }
  }

  public onDownloadPdfPress(): void {
    const source = sap.ui.require.toUrl("ui5/interactive/resume/assets/Murat-Aydogdu-CV.pdf");
    if (!this.pdfViewer) {
      this.pdfViewer = new PDFViewer({
        source,
        title: "Murat AYDOĞDU — CV",
        showDownloadButton: true
      });
      this.getView().addDependent(this.pdfViewer);
    }
    this.pdfViewer.open();
  }

  public onOpenTimelinePress(): void {
    this.getRouter().navTo("timeline");
  }

  public onContactChannelPress(event: { getSource(): ListItemBase }): void {
    const item = event.getSource();
    const ctx = item.getBindingContext("resume");
    if (!ctx) {
      return;
    }
    const channel = ctx.getObject() as ContactChannel;
    if (channel?.href) {
      const newWindow = channel.type !== "email" && channel.type !== "phone";
      URLHelper.redirect(channel.href, newWindow);
    }
  }

  public async onPhasePress(event: Event): Promise<void> {
    const params = event.getParameters() as {
      phaseId: string;
      engagementId: string;
      employerId: string;
      domRef: HTMLElement;
    };
    const gantt = this.byId("resumeGanttInline") as ResumeGantt;
    const found = gantt?.findPhase(params.phaseId);
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
      technologies: phase.getProperty("technologies") ?? []
    });

    if (!this.popover) {
      this.popover = (await Fragment.load({
        id: this.getView().getId(),
        name: "ui5.interactive.resume.fragment.ProjectPopover",
        controller: this
      })) as Popover;
      this.getView().addDependent(this.popover);
    }

    this.popover.openBy(params.domRef);
  }

  public onClosePopover(): void {
    this.popover?.close();
  }

  private getPrimaryEmail(): ContactChannel | undefined {
    const resumeModel = this.getOwnerComponent().getModel("resume") as JSONModel;
    const channels = resumeModel.getProperty("/contact/channels") as ContactChannel[] | undefined;
    if (!channels) {
      return undefined;
    }
    return (
      channels.find((c) => c.type === "email" && c.primary) ??
      channels.find((c) => c.type === "email")
    );
  }
}
