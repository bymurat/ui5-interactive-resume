import UI5Element from "sap/ui/core/Element";
import type ResumeGanttEngagement from "./ResumeGanttEngagement";

/**
 * Element representing one employer (contract holder). Contains one or more client
 * engagements; each engagement becomes a swimlane in the Option-B Gantt rendering.
 * @namespace ui5.interactive.resume.control
 */
export default class ResumeGanttEmployer extends UI5Element {
  static readonly metadata = {
    properties: {
      employerId: { type: "string" },
      name: { type: "string" },
      kind: { type: "string", defaultValue: "consultancy" },
      country: { type: "string" },
      countryEmoji: { type: "string" },
      city: { type: "string" },
      start: { type: "string" },
      end: { type: "string" },
      current: { type: "boolean", defaultValue: false }
    },
    defaultAggregation: "engagements",
    aggregations: {
      engagements: {
        type: "ui5.interactive.resume.control.ResumeGanttEngagement",
        multiple: true,
        singularName: "engagement"
      }
    }
  };

  public getEngagements!: () => ResumeGanttEngagement[];
}
