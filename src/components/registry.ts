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
  // {
  //   slug: "button",
  //   name: "Button",
  //   description: "Displays a button or a component that looks like a button.",
  // },
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
    description: "A responsive table for rows of data, with a header, body and footer.",
  },
]
