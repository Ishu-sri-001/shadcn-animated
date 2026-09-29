export type RegistryItem = {
  slug: string
  name: string
  description: string
}

export const registry: RegistryItem[] = [
  {
    slug: "accordion",
    name: "Accordion",
    description: "Expandable sections that reveal their answers with a staggered fade.",
  },
  {
    slug: "date-picker",
    name: "Date Picker",
    description: "A button that opens a calendar to pick a single date.",
  },
  {
    slug: "toast",
    name: "Toast",
    description: "Brief messages that stack in the corner and can be swiped away.",
  },
  {
    slug: "attachment",
    name: "Attachment",
    description: "File chips that show upload progress, errors and previews.",
  },
  {
    slug: "bubble",
    name: "Bubble",
    description: "Chat message bubbles with variants, grouping and reactions.",
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description: "Pick any number of options, with select all, shift-click ranges and limits.",
  },
  {
    slug: "radio",
    name: "Radio",
    description: "Pick exactly one option; the dot glides between choices.",
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    description: "A collapsible side navigation with groups, badges and sub-menus.",
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    description: "A menu of actions or options that opens from a button.",
  },
  {
    slug: "table",
    name: "Table",
    description: "Sort, filter, select and reorder rows that glide into place.",
  },
  {
    slug: "dialog",
    name: "Dialog",
    description: "A window over the page that asks for a decision before you carry on.",
  },
  {
    slug: "drawer",
    name: "Drawer",
    description: "A panel that slides in from the edge and can be swiped away.",
  },
  {
    slug: "field",
    name: "Field",
    description: "Labels, hints and errors that hold a form's inputs together.",
  },
  {
    slug: "hover-card",
    name: "Hover Card",
    description: "A preview that appears when you hover a link.",
  },
  {
    slug: "input-otp",
    name: "Input OTP",
    description: "A one-time code entered one character per box.",
  },
  {
    slug: "menubar",
    name: "Menubar",
    description: "A row of desktop-style menus that glide from one to the next.",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "Placeholders that shimmer while loading, then hand over to the content.",
  },
  {
    slug: "slider",
    name: "Slider",
    description: "Pick a value or a range, with a fill that springs after the thumb.",
  },
  {
    slug: "switch",
    name: "Switch",
    description: "Turn a setting on or off in one click.",
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Switch between related panels without leaving the page.",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description: "A short label that appears when you hover or focus a control.",
  },
  {
    slug: "command",
    name: "Command",
    description: "Search and run commands from the keyboard, inline or in a palette.",
  },
  {
    slug: "button",
    name: "Button",
    description: "Displays a button or a component that looks like a button.",
  },
  {
    slug: "questionnaire",
    name: "Questionnaire",
    description: "Step through questions one at a time, with the next question sliding or fading in.",
  },
]
