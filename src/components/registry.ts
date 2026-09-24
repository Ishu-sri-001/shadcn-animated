export type RegistryItem = {
  slug: string
  name: string
  description: string
}

// Add an entry here after creating src/app/components/<slug>/page.tsx.
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
    slug: "button",
    name: "Button",
    description: "Displays a button or a component that looks like a button.",
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
]
