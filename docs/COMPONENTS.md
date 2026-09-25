# Components

The nine components listed on the home page (`src/app/page.tsx`, from `src/components/registry.ts`), where each one comes from, and what this project adds on top. Every item below can be switched on and off from the controls panel on the component's page.

| Component | Page | Source | File |
| --- | --- | --- | --- |
| Accordion | `/components/accordion` | shadcn `accordion` | `src/components/ui/accordion.tsx` |
| Date Picker | `/components/date-picker` | Built here from shadcn `calendar`, `popover`, `select`, `button` | `src/components/ui/date-picker.tsx` |
| Toast | `/components/toast` | shadcn `toast` | `src/components/ui/toast.tsx` |
| Button | `/components/button` | shadcn `button` | `src/components/ui/button.tsx` |
| Attachment | `/components/attachment` | shadcn `attachment` | `src/components/ui/attachment.tsx` |
| Bubble | `/components/bubble` | shadcn `bubble` | `src/components/ui/bubble.tsx` |
| Checkbox | `/components/checkbox` | Built here (shadcn `checkbox` is kept for the controls panel) | `src/components/ui/checkbox-group.tsx` |
| Radio | `/components/radio` | Built here | `src/components/ui/radio-group.tsx` |
| Sidebar | `/components/sidebar` | shadcn `sidebar` (brings in `sheet`, `tooltip`, `input`, `separator`, `skeleton`, `use-mobile`) | `src/components/ui/sidebar.tsx` |

## Accordion

- Open several at once, or one at a time
- Opens on hover (with a short hover delay), not only on click
- Optional border, and an elastic, bouncy open and close
- Adjustable duration, bounce, content delay and stagger
- Answer paragraphs fade in one after another
- Open item gets a filled background, with adjustable roundness
- Line under the heading on hover
- Choice of heading icon

## Date Picker

- Trigger: optional icon, date label that rolls to the new date, choice of date format
- Popup grows out from behind the trigger, with a choice of content entrance and start scale
- Optional close on select
- Month header: month and year pickers, month only, year only, or a plain label, with a set range of years, and arrows that slide
- Month change: choice of transition and slide distance
- Date hover: a background that glides between days, with adjustable duration and bounce
- Calendar options: week start, only the current month, fixed six weeks, disable past dates, highlight today

## Toast

- Default, success, info, warning, error and loading variants, with optional description (collapsible when long) and an undo action
- Adjustable time on screen, with a time-left bar
- Springy entrance that grows from the button that triggered it
- Content fades in; choice of exit animation
- Tilts while being swiped away
- Loading spinner morphs into a tick when a promise resolves
- Style: glass background, coloured side line, roundness, screen position

## Button

- The shadcn button as installed: default, secondary, outline, ghost, destructive and link variants
- No additions yet

## Attachment

- Files spring in one after another, and fly in from where they were dropped
- Drop zone with a marching dashed border
- Shrink out on remove
- Upload progress: rolling percentage, shimmering title, a line running around the border
- Image cards fill with a muted background as they upload, left to right or bottom to top
- Error shake, and retry
- Hover: remove button slides in, image zooms, image stays blurred until uploaded
- Drag to reorder, tilt while scrolling, wrap onto rows, open an image in a full-screen preview
- "Delete all" removes attachments one after another
- Long file names cut to 20 characters

## Bubble

- New messages pop in; earlier ones slide up to make room
- Typing indicator, and replies that stream in word by word
- Sent text flies from the message box into the bubble
- Delivery status (sending, sent, delivered, read) with a retry that spins before re-sending, and an error shake
- Reactions: double-click to heart (again to remove it), a hover picker that opens above or below, magnifying emojis, one reaction per emoji, pill that wiggles and rolls its count
- Swipe a message to reply (from the bubble's edge with a mouse, anywhere by touch)
- Selectable text, hover lift, suggested replies, "Show more" for long messages
- Time shown in every bubble, as in WhatsApp
- A sender's messages split into a new group after a minute's gap; optional joined corners
- Shift+Enter for a new line; an "Auto reply" switch to send without replies

## Checkbox

- `CheckboxGroup` and `CheckboxItem`, for picking any number of options
- Inline or card style (muted or solid card fill), box can be hidden
- Box fills from the centre; springy tick and press squish
- Filled or outline box, with adjustable corner radius
- Strike-through on ticked labels
- "Select all" and "Deselect all" text buttons (with a drawn underline), ticking in turn
- Rolling "n selected" counter
- Shift-click to tick a range
- Minimum and maximum picks, with a shake or a wiggle and a message
- Drag to reorder, and a colour per option
- Standalone `CheckboxItem` with an indeterminate (dash) state

## Radio

- `RadioGroup` and `RadioGroupItem`, for picking exactly one option
- Inline or card style (muted or solid card fill), radio can be hidden
- Dot slides from the old choice to the new one, or shrinks and grows
- Card highlight slides between cards, or shrinks and grows
- Springy pick
- Outline, filled, or full (one solid circle) look
- Arrow keys, Home and End move the choice
- Drag to reorder, and a colour per option

## Sidebar

- Group headings kept as a hidden `label` for screen readers; items evenly spaced, sub-items included
- Hover background glides across every item, groups included, in sync with the label
- Label text rolls on hover (off by default)
- Active item: primary or muted highlight, adjustable roundness, slides to the new item
- Active indicator: a bar, a pulsing dot, or none
- Press squish and springy tooltips
- Number badges roll to the new value and pop
- Team switcher in the header, with animated logos
- Sidebar toggle morphs into an arrow on hover, optionally spinning 180°
- Breadcrumb bar with search, or just a floating toggle
- Drag the edge to resize
- Page content scales and fades when switching pages
