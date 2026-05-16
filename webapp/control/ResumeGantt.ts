import Control from "sap/ui/core/Control";
import type ResumeGanttEmployer from "./ResumeGanttEmployer";
import type ResumeGanttPhase from "./ResumeGanttPhase";
import ResumeGanttRenderer from "./ResumeGanttRenderer";

/**
 * Custom control that renders a multi-employer career timeline as a Gantt.
 * Each employer becomes a card, every engagement inside it becomes a swimlane,
 * and the colored segments inside a swimlane are role phases whose color is
 * derived from a "hat" (sapui5 / fullstack / mobile) for semantic encoding.
 *
 * Showcase intent:
 *  - Three-tier nested Element aggregations (Control -> Employer -> Engagement -> Phase)
 *  - Theme-aware Fiori Indication colors mapped to role hats
 *  - Compact horizontal legend rendered above the swimlanes
 *  - Keyboard + ARIA accessibility (role="grid", focusable phases, Enter/Space/Arrow handling)
 *
 * @namespace ui5.interactive.resume.control
 */
export default class ResumeGantt extends Control {
  static readonly metadata = {
    properties: {
      startMonth: { type: "string" },
      endMonth: { type: "string" },
      rowHeight: { type: "int", defaultValue: 42 },
      showLegend: { type: "boolean", defaultValue: true }
    },
    defaultAggregation: "employers",
    aggregations: {
      employers: {
        type: "ui5.interactive.resume.control.ResumeGanttEmployer",
        multiple: true,
        singularName: "employer"
      }
    },
    events: {
      phasePress: {
        parameters: {
          phaseId: { type: "string" },
          engagementId: { type: "string" },
          employerId: { type: "string" },
          domRef: { type: "object" }
        }
      }
    }
  };

  static renderer = ResumeGanttRenderer;

  public getEmployers!: () => ResumeGanttEmployer[];
  public getStartMonth!: () => string | null;
  public getEndMonth!: () => string | null;
  public getRowHeight!: () => number;
  public getShowLegend!: () => boolean;
  public firePhasePress!: (params: {
    phaseId: string;
    engagementId: string;
    employerId: string;
    domRef: HTMLElement;
  }) => this;

  public onclick(oEvent: MouseEvent): void {
    this.handleActivation(oEvent.target as HTMLElement);
  }

  public onsapenter(oEvent: KeyboardEvent): void {
    this.handleActivation(oEvent.target as HTMLElement);
  }

  public onsapspace(oEvent: KeyboardEvent): void {
    oEvent.preventDefault?.();
    this.handleActivation(oEvent.target as HTMLElement);
  }

  public onsapleft(oEvent: KeyboardEvent): void {
    this.moveFocus(oEvent.target as HTMLElement, -1);
  }

  public onsapright(oEvent: KeyboardEvent): void {
    this.moveFocus(oEvent.target as HTMLElement, 1);
  }

  private handleActivation(target: HTMLElement): void {
    const phaseEl = target?.closest?.("[data-phase-id]") as HTMLElement | null;
    if (!phaseEl) {
      return;
    }
    this.firePhasePress({
      phaseId: phaseEl.getAttribute("data-phase-id") ?? "",
      engagementId: phaseEl.getAttribute("data-engagement-id") ?? "",
      employerId: phaseEl.getAttribute("data-employer-id") ?? "",
      domRef: phaseEl
    });
  }

  private moveFocus(current: HTMLElement, direction: number): void {
    const root = this.getDomRef();
    if (!root || !current?.closest) {
      return;
    }
    const all = Array.from(root.querySelectorAll<HTMLElement>("[data-phase-id]"));
    const idx = all.indexOf(current.closest("[data-phase-id]") as HTMLElement);
    if (idx === -1) {
      return;
    }
    const next = all[(idx + direction + all.length) % all.length];
    next?.focus();
  }

  public findPhase(
    phaseId: string
  ): { phase: ResumeGanttPhase; engagementClient: string; employerName: string } | undefined {
    for (const employer of this.getEmployers()) {
      for (const engagement of employer.getEngagements()) {
        for (const phase of engagement.getPhases()) {
          if (phase.getProperty("phaseId") === phaseId) {
            return {
              phase,
              engagementClient: engagement.getProperty("client") as string,
              employerName: employer.getProperty("name") as string
            };
          }
        }
      }
    }
    return undefined;
  }
}
