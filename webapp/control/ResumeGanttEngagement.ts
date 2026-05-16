import UI5Element from "sap/ui/core/Element";
import type ResumeGanttPhase from "./ResumeGanttPhase";

/**
 * Element representing a single client engagement (one swimlane in Option B).
 * Lives inside a ResumeGanttEmployer; contains one or more ResumeGanttPhase entries.
 * @namespace ui5.interactive.resume.control
 */
export default class ResumeGanttEngagement extends UI5Element {
  static readonly metadata = {
    properties: {
      engagementId: { type: "string" },
      client: { type: "string" },
      department: { type: "string" },
      city: { type: "string" },
      clientLogoIcon: { type: "string", defaultValue: "sap-icon://building" },
      start: { type: "string" },
      end: { type: "string" },
      current: { type: "boolean", defaultValue: false },
      parallel: { type: "boolean", defaultValue: false }
    },
    defaultAggregation: "phases",
    aggregations: {
      phases: {
        type: "ui5.interactive.resume.control.ResumeGanttPhase",
        multiple: true,
        singularName: "phase"
      }
    }
  };

  public getPhases!: () => ResumeGanttPhase[];
}
