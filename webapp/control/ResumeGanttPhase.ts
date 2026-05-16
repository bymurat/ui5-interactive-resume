import UI5Element from "sap/ui/core/Element";

/**
 * Element representing a single role/phase inside an engagement. The phase
 * carries a primary role "hat" (sapui5 / fullstack / mobile) plus an optional
 * list of additional hats rendered as small badges on the bar.
 * @namespace ui5.interactive.resume.control
 */
export default class ResumeGanttPhase extends UI5Element {
  static readonly metadata = {
    properties: {
      phaseId: { type: "string" },
      team: { type: "string" },
      role: { type: "string" },
      hat: { type: "string", defaultValue: "sapui5" },
      additionalHats: { type: "object" },
      start: { type: "string" },
      end: { type: "string" },
      current: { type: "boolean", defaultValue: false },
      summary: { type: "string" },
      achievements: { type: "object" },
      technologies: { type: "object" }
    }
  };
}
