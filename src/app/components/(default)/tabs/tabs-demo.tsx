"use client"

import { HpxControlsPanel, useHpxControls, type HpxControlSchema } from "@/components/controls-panel"
import {
  HpxTabs,
  HpxTabsContent,
  HpxTabsList,
  HpxTabsPanels,
  HpxTabsTrigger,
  type HpxTabsActiveColor,
  type HpxTabsContentMotion,
  type HpxTabsIndicator,
  type HpxTabsRounded,
} from "@/components/ui/tabs"

const tabs = [
  {
    value: "overview",
    label: "Overview",
    title: "This week",
    body: "Revenue is up 12% on last week, mostly from returning customers.",
  },
  {
    value: "analytics",
    label: "Analytics",
    title: "Traffic",
    body: "Most visitors arrive from search. Mobile now makes up 64% of sessions, and the longest visits start from a shared link.",
    extra: ["Search 48%", "Direct 27%", "Shared links 15%", "Other 10%"],
  },
  {
    value: "reports",
    label: "Reports",
    title: "Scheduled",
    body: "The monthly summary goes out on the 1st. Two reports are waiting for review.",
  },
  {
    value: "settings",
    label: "Settings",
    title: "Workspace",
    body: "Change who can see reports, and how often summaries are emailed to the team.",
  },
]

const controls = {
  activeIndicator: {
    group: "Tabs",
    type: "select",
    label: "Active indicator",
    value: "glide",
    options: [
      { label: "Glide pill", value: "glide" },
      { label: "Slide underline", value: "underline" },
      { label: "Fade underline", value: "fade" },
    ],
  },
  activeColor: {
    disabled: (v) => v.activeIndicator !== "glide",
    group: "Tabs",
    type: "select",
    label: "Active tab colour",
    value: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Muted", value: "muted" },
    ],
  },
  hoverHighlight: { group: "Tabs", type: "checkbox", label: "Hover highlight", value: false },
  divider: { group: "Tabs", type: "checkbox", label: "Line under tabs", value: true },
  listBorder: { group: "Tabs", type: "checkbox", label: "Border on tabs", value: false },
  panelBorder: { group: "Content", type: "checkbox", label: "Border on content", value: false },
  rounded: {
    group: "Tabs",
    type: "select",
    label: "Roundness",
    value: "lg",
    options: [
      { label: "None", value: "none" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
      { label: "Full", value: "full" },
    ],
  },

  contentAnimation: {
    group: "Content",
    type: "select",
    label: "Content animation",
    value: "slide",
    options: [
      { label: "Slide", value: "slide" },
      { label: "Fade in / out", value: "fade" },
      { label: "None", value: "none" },
    ],
  },
  slideDistance: {
    disabled: (v) => v.contentAnimation !== "slide",
    group: "Content",
    type: "slider",
    label: "Slide distance",
    value: 40,
    min: 0,
    max: 120,
    step: 4,
    unit: "px",
  },
  smoothHeight: { group: "Content", type: "checkbox", label: "Smooth panel height", value: true },

  fadeDuration: {
    disabled: (v) => v.contentAnimation !== "fade",
    group: "Content",
    type: "slider",
    label: "Fade duration",
    value: 0.35,
    min: 0.1,
    max: 1.2,
    step: 0.05,
    unit: "s",
  },
  duration: {
    group: "Motion",
    type: "slider",
    label: "Duration",
    value: 0.35,
    min: 0.1,
    max: 1,
    step: 0.05,
    unit: "s",
  },
  bounce: {
    disabled: (v) => v.activeIndicator === "fade" && v.contentAnimation !== "slide",
    group: "Motion",
    type: "slider",
    label: "Bounce",
    value: 0.15,
    min: 0,
    max: 0.6,
    step: 0.05,
  },
} satisfies HpxControlSchema

export function HpxTabsDemo() {
  const panel = useHpxControls(controls)
  const { values } = panel

  return (
    <div className="flex flex-col gap-3">
      {/* Top-aligned, so the tabs stay put and only the content below moves as its height changes */}
      <div className="flex min-h-[60vh] flex-col justify-start rounded-lg border px-[4vw] py-8">
        <HpxTabs
          defaultValue="overview"
          activeIndicator={values.activeIndicator as HpxTabsIndicator}
          contentAnimation={values.contentAnimation as HpxTabsContentMotion}
          slideDistance={values.slideDistance}
          duration={values.duration}
          fadeDuration={values.fadeDuration}
          bounce={values.bounce}
          activeColor={values.activeColor as HpxTabsActiveColor}
          smoothHeight={values.smoothHeight}
          hoverHighlight={values.hoverHighlight}
          divider={values.divider}
          listBorder={values.listBorder}
          panelBorder={values.panelBorder}
          rounded={values.rounded as HpxTabsRounded}
        >
          <HpxTabsList>
            {tabs.map((tab) => (
              <HpxTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </HpxTabsTrigger>
            ))}
          </HpxTabsList>
          <HpxTabsPanels>
            {tabs.map((tab) => (
              <HpxTabsContent key={tab.value} value={tab.value}>
                <h3 className="font-semibold">{tab.title}</h3>
                <p className="text-muted-foreground">{tab.body}</p>
                {tab.extra && (
                  <ul className="grid grid-cols-2 gap-2 pt-2">
                    {tab.extra.map((item) => (
                      <li key={item} className="rounded-md bg-muted px-3 py-2 text-base">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </HpxTabsContent>
            ))}
          </HpxTabsPanels>
        </HpxTabs>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: click tabs left and right to see the content travel the way you moved. Arrow keys switch tabs too.
      </p>

      <HpxControlsPanel title="Tabs" {...panel} />
    </div>
  )
}
