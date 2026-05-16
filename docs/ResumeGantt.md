# ResumeGantt — Custom UI5 Control

`ResumeGantt` is a hand-written SAPUI5 custom control that renders a career
timeline as a set of per-employer Gantt cards. It is the showcase centrepiece
of this project: it demonstrates idiomatic UI5 control authoring, the
RenderManager 2.0 semantic API, theme-aware styling, data binding through
nested aggregations, and keyboard + ARIA accessibility.

This document explains how it is built and how to use it.

---

## 1. Why a custom control (and not standard UI5)?

SAP ships `sap.gantt.*`, but it is heavyweight, enterprise-scheduling oriented,
and visually wrong for a CV. A resume timeline needs:

- One **scaled ruler per employer** (a 4-year tenure and a 1-year tenure should
  each be readable, not squashed onto one global axis).
- **Semantic colour** (role "hat") rather than decorative colour.
- A compact, Fiori-Horizon-native look that prints well.

That set of requirements is small and specific — a focused ~300-line control is
simpler to reason about than bending a generic Gantt library, and it doubles as
a demonstration of how to build UI5 controls properly.

---

## 2. Class hierarchy

The control is a four-level tree of `ManagedObject`s. Three are lightweight
`sap.ui.core.Element` subclasses (data holders, no own DOM); only the root is a
`sap.ui.core.Control` (owns DOM + renderer).

```
ResumeGantt              (sap.ui.core.Control)      — root, renders everything
└─ employers : ResumeGanttEmployer[]   (Element)    — one bordered card
   └─ engagements : ResumeGanttEngagement[] (Element) — one swimlane row
      └─ phases : ResumeGanttPhase[]    (Element)    — one coloured bar
```

| File | Role |
|---|---|
| `ResumeGantt.ts` | Control. Metadata (properties/aggregations/events), DOM event handlers, focus management, `findPhase()` lookup. |
| `ResumeGanttEmployer.ts` | Element. Employer-level data + `engagements` aggregation. |
| `ResumeGanttEngagement.ts` | Element. One client engagement + `phases` aggregation. Carries `parallel`. |
| `ResumeGanttPhase.ts` | Element. One role phase: `hat`, dates, summary, achievements, technologies. |
| `ResumeGanttRenderer.ts` | Renderer object (`apiVersion: 2`). Pure function from control state → DOM. |
| `ResumeGantt.css` | Theme-aware styles, registered via `manifest.json` `sap.ui5/resources/css`. |

Why split into Elements? Because UI5's binding engine can then template-bind a
JSON array onto an aggregation and instantiate one Element per record, with each
Element's properties bound to that record's fields. No manual loop, no manual
re-render on data change — the framework handles invalidation.

---

## 3. Metadata — the contract

Every `ManagedObject` declares a static `metadata` block. UI5 reads it to
generate getters/setters, validate bindings, and drive invalidation.

`ResumeGantt` (root control):

```ts
static readonly metadata = {
  properties: {
    startMonth: { type: "string" },              // optional axis override
    endMonth:   { type: "string" },
    rowHeight:  { type: "int", defaultValue: 42 },
    showLegend: { type: "boolean", defaultValue: true }
  },
  defaultAggregation: "employers",
  aggregations: {
    employers: {
      type: "ui5.interactive.resume.control.ResumeGanttEmployer",
      multiple: true, singularName: "employer"
    }
  },
  events: {
    phasePress: {
      parameters: {
        phaseId: { type: "string" }, engagementId: { type: "string" },
        employerId: { type: "string" }, domRef: { type: "object" }
      }
    }
  }
};
static renderer = ResumeGanttRenderer;
```

Notes / gotchas worth knowing:

- **`id` is reserved** by `ManagedObject`. That is why the data-bearing
  properties are named `employerId` / `engagementId` / `phaseId`, not `id`.
- Array/object-valued properties (`additionalHats`, `achievements`,
  `technologies`) use `type: "object"`. UI5 has no first-class array property
  type; `object` accepts the bound JSON array as-is.
- `defaultValue` on a `string` property is omitted on purpose — declaring
  `defaultValue: null` makes the TypeScript transpiler infer `any` and fail
  strict type-checking. Booleans/ints keep explicit defaults.
- The `renderer` is assigned as a **static class field** (not a string module
  name) so the bundler resolves it at build time.

The TypeScript `public getX!: () => T;` declarations under the class are not
runtime code — they are ambient type hints so the rest of the codebase gets
typed access to the UI5-generated accessors.

---

## 4. Rendering — RenderManager 2.0 (`apiVersion: 2`)

The renderer is a plain object with `apiVersion: 2` and a `render(rm, control)`
function. The semantic API (`openStart` / `class` / `attr` / `style` /
`openEnd` / `text` / `close`) is mandatory for `apiVersion: 2` and gives UI5 DOM
patching (it diffs instead of replacing innerHTML on re-render).

Pipeline:

1. Open the root `div.rgGantt` with `role="grid"` and an `aria-label`.
2. If there are no employers → render an empty-state message and stop.
3. If `showLegend` → render the colour legend (`renderLegend`).
4. For each employer → `renderEmployerCard`:
   - Compute the employer's own time window. The axis is **padded to whole
     years** so ticks land on year boundaries.
   - `effectiveEnd()` resolves an open/`current` end to "now" so an ongoing
     engagement extends to today.
   - Render the header strip (flag, name, city, range, duration).
   - Render the **per-employer axis** (`renderAxis`) — this is the key design
     decision: each card has its own ruler, so tenures of very different
     lengths are each readable.
   - For each engagement → `renderEngagementRow`:
     - Left **rail** = client logo icon + client name + city · department.
     - **Track** = positioned phase bars. `left%` and `width%` are computed
       from month indices relative to *this employer's* axis window.
5. `renderPhase` writes the bar: hat colour class, `parallel` modifier,
   `current` dot, `data-*` attributes (used by the click handler), an
   `aria-label` describing role/team/dates/hat, and any additional-hat badge
   icons via `rm.icon(...)`.

`rm.icon()` is used instead of hand-writing icon-font spans — it resolves the
`sap-icon://` URI and emits correct, accessible markup.

---

## 5. Interaction & accessibility

DOM events are handled by **convention-named methods on the control** — UI5's
event delegation calls them automatically:

| Method | Trigger | Effect |
|---|---|---|
| `onclick` | mouse click | activate phase under cursor |
| `onsapenter` | Enter | activate focused phase |
| `onsapspace` | Space | activate focused phase (preventDefault to stop scroll) |
| `onsapleft` / `onsapright` | ◀ ▶ arrows | move focus to prev/next phase bar |

`handleActivation()` walks up from the event target with
`closest("[data-phase-id]")`, reads the `data-*` attributes, and fires the
public `phasePress` event with `{ phaseId, engagementId, employerId, domRef }`.
The view's controller listens and opens the detail popover anchored to
`domRef`.

Accessibility specifics:

- Root `role="grid"`, rows `role="row"`, bars `role="gridcell"` with
  `tabindex="0"` so every phase is keyboard-reachable.
- Each bar has a descriptive `aria-label` (role, team, client, dates, hat) — so
  colour is a *hint*, never the only signal (covers colour-blind users).
- The legend and the country-flag emoji are `aria-hidden="true"` (decorative;
  the per-bar `aria-label` already conveys the meaning).

`findPhase(phaseId)` is a public helper the controllers use to resolve a fired
event back to the phase + its engagement/employer context for the popover.

---

## 6. Styling & theming

`ResumeGantt.css` is registered in `manifest.json` under
`sap.ui5/resources/css`, so UI5 loads it with the component.

Principles:

- **No hard-coded colours.** Everything uses Fiori CSS custom properties with a
  safe literal fallback, e.g.
  `background: var(--sapIndicationColor_5_Background, #cdebf7);`. This makes the
  control recolour correctly in Horizon light/dark and in print.
- **Role hat → colour** is a CSS class mapping: `.rgPhase--sapui5` (blue,
  Indication 5), `.rgPhase--fullstack` (green, Indication 4), `.rgPhase--mobile`
  (amber, Indication 3). The legend swatches reuse the exact same variables, so
  legend and bars are guaranteed identical.
- **Parallel engagements** are not a different colour — only a dashed border +
  alternating rail background, so the hat colour stays consistent.
- **Alignment across cards** uses one shared variable `--rg-rail-width` on
  `.rgGantt`; every row is a CSS grid `grid-template-columns: var(--rg-rail-width) 1fr`
  and each per-employer axis uses `margin-left: var(--rg-rail-width)`. Result:
  the client column and the rulers line up pixel-perfect across every card.
- A `@media (max-width: 720px)` block collapses the rail above the track for
  phones; a `.sapUiSizeCompact` block tightens paddings for compact density.

---

## 7. Using the control in a view

Register the namespace, then declare the tree. Aggregations are template-bound
to the `resume` JSON model — UI5 instantiates one Element per array record:

```xml
<mvc:View xmlns:rgc="ui5.interactive.resume.control" ...>
  <rgc:ResumeGantt
      rowHeight="48"
      showLegend="true"
      employers="{resume>/timeline/employers}"
      phasePress=".onPhasePress">
    <rgc:employers>
      <rgc:ResumeGanttEmployer
          employerId="{resume>id}" name="{resume>name}"
          kind="{resume>kind}" country="{resume>country}"
          countryEmoji="{resume>countryEmoji}" city="{resume>city}"
          start="{resume>start}" end="{resume>end}"
          current="{resume>current}" engagements="{resume>engagements}">
        <rgc:engagements>
          <rgc:ResumeGanttEngagement
              engagementId="{resume>id}" client="{resume>client}"
              department="{resume>department}" city="{resume>city}"
              clientLogoIcon="{resume>clientLogoIcon}"
              start="{resume>start}" end="{resume>end}"
              current="{resume>current}" parallel="{resume>parallel}"
              phases="{resume>phases}">
            <rgc:phases>
              <rgc:ResumeGanttPhase
                  phaseId="{resume>id}" team="{resume>team}"
                  role="{resume>role}" hat="{resume>hat}"
                  additionalHats="{resume>additionalHats}"
                  start="{resume>start}" end="{resume>end}"
                  current="{resume>current}" summary="{resume>summary}"
                  achievements="{resume>achievements}"
                  technologies="{resume>technologies}" />
            </rgc:phases>
          </rgc:ResumeGanttEngagement>
        </rgc:engagements>
      </rgc:ResumeGanttEmployer>
    </rgc:employers>
  </rgc:ResumeGantt>
</mvc:View>
```

It is used twice: a compact instance in the Object Page (`Resume.view.xml`,
`rowHeight="42"`) and a roomier one on the full-screen route
(`Timeline.view.xml`, `rowHeight="48"`). Same control, different `rowHeight`.

Controller side (simplified):

```ts
public async onPhasePress(event: Event): Promise<void> {
  const { phaseId, domRef } = event.getParameters() as { phaseId: string; domRef: HTMLElement };
  const found = (this.byId("resumeGantt") as ResumeGantt).findPhase(phaseId);
  // populate a detail JSONModel, then open the ProjectPopover fragment by domRef
}
```

---

## 8. Data shape

The control is data-shape-driven by `webapp/model/resume.json` →
`timeline.employers[]`. Each employer has `engagements[]`, each engagement has
`phases[]`. A phase's `hat` (`"sapui5" | "fullstack" | "mobile"`) selects the
colour; `additionalHats` adds badge icons; `parallel: true` on an engagement
marks it as a non-dedicated/side engagement (dashed rendering). Types live in
`webapp/types/resume.d.ts`.

---

## 9. Extending it

- **New hat:** add a `HAT_LABELS` + `HAT_BADGE_ICON` entry in the renderer and a
  matching `.rgPhase--<hat>` + `.rgLegendItem--<hat>` rule in the CSS.
- **Today marker:** in `renderEmployerCard`, compute `nowYM()`'s left% and emit
  a positioned `div.rgTodayLine` inside the track.
- **Quarter ticks:** extend `renderAxis` to also emit minor ticks at
  `idx % 3 === 0`.
- **Tooltip on hover:** add a `title` attribute in `renderPhase`, or attach a
  `sap.m.Popover` on `mouseover` (debounced).

Keep the renderer pure (state in → DOM out, no side effects) so UI5's DOM
patching keeps working and the control stays predictable.
