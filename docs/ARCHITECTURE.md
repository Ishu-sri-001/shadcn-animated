# How the project works

This project takes shadcn/ui components and adds animation on top, using Motion (`motion/react`) and GSAP. Each component has its own page with a controls panel, so every animation can be switched on and off live.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (`base-nova` style, built on Base UI), Motion, GSAP, next-themes.

## Folder layout

```
src/
  app/
    layout.tsx                 Root layout: fonts, theme, navbar
    page.tsx                   Home page: the list of components
    globals.css                Tailwind, theme colours (CSS variables)
    components/
      (default)/               Route group: every component page except the sidebar
        layout.tsx             Shared page frame and "← All components" link
        accordion/page.tsx
        attachment/page.tsx    (+ upload-demo.tsx, notes-demo.tsx)
        bubble/page.tsx        (+ chat-demo.tsx)
        …
      sidebar/                 Sidebar page, with its own full-screen layout
        layout.tsx             Wraps the page in SidebarShell
        sidebar-shell.tsx      The sidebar, header and controls panel
        page.tsx, page-content.tsx, receive-message.tsx
  components/
    ui/                        The components (shadcn files, plus our additions)
    animated-icons/            Icons that animate on hover (used by the sidebar)
    controls-panel.tsx         The floating controls panel and useControls
    registry.ts                The list shown on the home page
    navbar.tsx, theme-toggle.tsx, theme-provider.tsx
  hooks/                       use-mobile, use-prefers-reduced-motion
  lib/utils.ts                 Re-exports cn
docs/                          These notes
```

## Routes

Each component has its own route, `/components/<slug>`.

- **Home (`/`)**: `src/app/page.tsx` maps over `registry` from `src/components/registry.ts` and links to each component's page. A component only shows up on the home page once it has an entry there.
- **Component pages**: `src/app/components/(default)/<slug>/page.tsx`. The `(default)` folder is a Next.js route group. It doesn't appear in the URL; it lets these pages share one `layout.tsx` (a centred frame with the "← All components" link).
- **Sidebar page**: `src/app/components/sidebar/`, deliberately outside `(default)`. It needs a full-height app layout instead of the centred frame, so it has its own `layout.tsx`, which wraps the page in `SidebarShell`.

**Adding a component:**

1. Install the base: `npx shadcn@latest add <name>` (lands in `src/components/ui/`).
2. Add the animations to that file, each as a prop.
3. Create `src/app/components/(default)/<slug>/<slug>-demo.tsx` (controls, state, the component with its props) and `page.tsx` (title, description, the demo), as in [The common pattern](#the-common-pattern).
4. Add `{ slug, name, description }` to `src/components/registry.ts`.

## The common pattern

Every component is split across three files, each with one job:

```
src/components/ui/radio-group.tsx                        1. The component
src/app/components/(default)/radio/radio-demo.tsx        2. The demo: controls, state, props
src/app/components/(default)/radio/page.tsx              3. The route: title, description, demo
```

Props flow one way, from the controls panel down to the component:

```
ControlsPanel ──set()──▶ values (in the demo) ──props──▶ RadioGroup ──context──▶ RadioGroupItem
```

### 1. The component (`src/components/ui/<name>.tsx`)

The shadcn file, plus our animations. Every animation is a prop with a default, and the component knows nothing about the demo or the controls panel. Group components share their props with their items through context (see [From a group component to its items](#from-a-group-component-to-its-items)).

```tsx
function RadioGroup({ value, defaultValue, onValueChange, variant = "default", reorder = false, ...optionProps }) {
  // options (dotSlide, cardSlide, bounce, appearance…) go into RadioGroupContext
}

function RadioGroupItem({ value, label, description, accent, disabled }) {
  const group = React.useContext(RadioGroupContext) // reads the group's options
}

export { RadioGroup, RadioGroupItem, type RadioVariant, type RadioCardFill, type RadioAppearance }
```

### 2. The demo (`<slug>/<slug>-demo.tsx`, a Client Component)

Where the component is used and wired to the controls panel. It holds:
- **Sample data** (for example the four shipping options).
- **The controls schema**: one entry per prop you can change.
- **State** for the component's value, so it's controlled.
- **The layout** around the component, and the `ControlsPanel`.

```tsx
"use client"

const shipping = [{ value: "Standard", description: "3–5 working days. Free." }, …]

const controls = {
  dotSlide: { group: "Choosing", type: "checkbox", label: "Dot slides between", value: false },
  appearance: { group: "Radio", type: "select", label: "Look", value: "outline", options: […] },
  …
} satisfies ControlSchema

export function RadioDemo() {
  const panel = useControls(controls)
  const { variant, cardFill, appearance, colorful, ...groupOptions } = panel.values
  const [choice, setChoice] = React.useState("Express")

  return (
    <section className="flex flex-col gap-3">
      <RadioGroup
        {...groupOptions}                           // matching names pass straight through
        appearance={appearance as RadioAppearance}  // select values are strings, so cast
        value={choice}
        onValueChange={setChoice}
      >
        {shipping.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            label={option.value}
            accent={colorful ? option.accent : undefined} // demo-only control, used here
          />
        ))}
      </RadioGroup>

      <ControlsPanel title="Radio" {...panel} />
    </section>
  )
}
```

A control's key usually matches the prop's name, so most values are spread straight onto the component. The rest are pulled out of `values` first:
- **Select values** (`variant`, `cardFill`, `appearance`) are strings, so they're cast to the prop's type and passed one by one. The demo also uses `variant` to pick a grid or column layout.
- **Demo-only controls** (`colorful`) aren't props at all; the demo uses them to decide what to pass, here each item's `accent`.

### 3. The route (`<slug>/page.tsx`, a Server Component)

Only the page's title and description, then the demo:

```tsx
import { RadioDemo } from "./radio-demo"

export default function RadioPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Radio</h1>
        <p className="text-sm text-muted-foreground">Pick exactly one option. …</p>
      </div>

      <RadioDemo />
    </div>
  )
}
```

The shared `(default)/layout.tsx` wraps it with the page frame and the "← All components" link.

### Where routes differ

| Route | Files |
| --- | --- |
| Checkbox, Radio, Bubble | `page.tsx` + one demo (`checkbox-demo.tsx`, `radio-demo.tsx`, `chat-demo.tsx`) |
| Attachment | `page.tsx` + two demos (`upload-demo.tsx`, `notes-demo.tsx`), separated by a `Separator` |
| Accordion, Toast, Date Picker | Demo and route in one `page.tsx`, which is then a Client Component |
| Button | `page.tsx` only: the variants side by side, no controls panel |
| Sidebar | `layout.tsx` wraps the page in `sidebar-shell.tsx` (the demo: sidebar, header, controls); `page.tsx` renders `page-content.tsx` beside it |

## Rendering

- **Root layout** (`src/app/layout.tsx`): loads the Geist fonts, wraps everything in `ThemeProvider` (next-themes, which switches light and dark by a class on `<html>`), and renders the sticky `Navbar` above every page.
- **Server and client**: layouts and most `page.tsx` files are Server Components. They render the page title and description, then a client demo component (for example `ChatDemo`, `CheckboxDemo`). The UI components and demos are Client Components (`"use client"`), because they use state, effects and animation.
- **Sidebar**: `SidebarShell` renders the sidebar, the page header and the controls panel; `page-content.tsx` renders the area beside it. They talk through two React contexts defined in `sidebar-shell.tsx`:
  - `ActivePageContext`: which sidebar item is active, the unread count, and the "scale with fade" setting, read by the page content.
  - `InboxContext`: a `receive()` function, so the "Receive a message" button in the page can bump the Inbox badge in the sidebar.

## Do components depend on each other?

Mostly not. Each component in `src/components/ui/` stands on its own and can be used on any page. The only links are shadcn building blocks one component imports from another:

| Component | Imports |
| --- | --- |
| Attachment | `button` |
| Calendar | `button` |
| Date Picker | `calendar`, `popover`, `select`, `button`, `animated-icons/calendar-range-icon`, `hooks/use-prefers-reduced-motion` |
| Sheet | `button` |
| Sidebar | `button`, `input`, `separator`, `skeleton`, `tooltip`, `hooks/use-mobile` |
| Toast | `button` |

Accordion, Bubble, Checkbox group and Radio group import no other local component. Demo pages import only the components they show, plus `controls-panel`.

The pieces shared across pages are:
- **`controls-panel.tsx`**: the controls panel, used by every demo page except Button.
- **`registry.ts`**: the home-page list.
- **`cn`** (from the `cn` package, re-exported by `lib/utils.ts`): joins and merges class names.
- **`globals.css`**: theme colours as CSS variables (for example `--sidebar`, `--primary`), with light and dark values.

## How props are passed

### From the controls panel to a component

Each demo page describes its controls as a schema, then calls `useControls`:

```tsx
const controls = {
  bounce: { group: "Choosing", type: "checkbox", label: "Springy pick", value: true },
  appearance: {
    group: "Radio",
    type: "select",
    label: "Look",
    value: "outline",
    options: [{ label: "Outline", value: "outline" }, { label: "Filled", value: "filled" }],
  },
} satisfies ControlSchema

const panel = useControls(controls)        // { schema, values, set, reset }
<ControlsPanel title="Radio" {...panel} />  // renders a checkbox, slider or select per control
```

- **Values:** `values` starts from each control's `value` and holds the current setting. `set(key, value)` is called when a control changes, and `reset` goes back to the defaults.
- **Explicit props:** values are passed straight to the component, either one by one (`multiple={values.multiple}`) or by spreading the rest (`{...groupOptions}`).
- **Demo-only settings:** controls that aren't component props are taken out first (for example `breadcrumb` and `teamSwitcher` in `sidebar-shell.tsx`), so they aren't passed down.
- **Converting values:** select values are strings, so some are converted when passed, for example `min={Number(min)}` or `max={max === "any" ? undefined : Number(max)}` in the checkbox demo.

### From a group component to its items

Components made of a group and items share their options through React context, so options are set once on the group:

| Group (sets options) | Items (read them) | Context |
| --- | --- | --- |
| `SidebarProvider` | every sidebar part, via `useSidebar()` | `SidebarContext` |
| `CheckboxGroup` | `CheckboxItem` | `CheckboxGroupContext`, `CheckboxOptionsContext` |
| `RadioGroup` | `RadioGroupItem` | `RadioGroupContext` |
| `BubbleThread` | `Bubble`, `BubbleGroup` (smooth make-room) | `BubbleThreadContext` |
| `AttachmentGroup` | `Attachment` (drag to reorder, tilt) | `AttachmentReorderContext`, `AttachmentTiltContext` |
| `Toaster` | each toast | `ToastEffectsContext` |
| `Accordion` | its items | `AccordionMotionContext`, `AccordionHoverContext` |

For example, `SidebarProvider` takes options like `highlightTone`, `textRoll`, `spinTrigger` and `itemRadius`. `SidebarMenuButton` reads them with `useSidebar()` instead of receiving them as props.

### Value, defaultValue and onValueChange

Components with a selection follow the React (and shadcn) pattern:
- **Uncontrolled:** pass `defaultValue` and the component keeps its own state.
- **Controlled:** pass `value` and `onValueChange`, and the parent owns the state. The demos do this (for example `CheckboxGroup value={picks} onValueChange={setPicks}`).

## How prop changes work

Changing a control re-renders the demo with new props, and each component responds without being remounted:

- **Motion props**: most animation props change what a `motion.*` element animates to. For example, a new `radius` changes the `animate={{ borderRadius }}` target, and Motion eases to it. `initial={false}` on these elements stops them animating on first render.
- **CSS variables**: some values are set as CSS variables and read by Tailwind classes. For example, `itemRadius` on `SidebarProvider` becomes `--sidebar-item-radius` (in vw), used as `rounded-(--sidebar-item-radius)`.
- **Classes**: boolean props usually switch Tailwind classes on or off (for example `pressSquish && "active:scale-[0.96]"`), so the next interaction uses the new behaviour.
- **Read on mount**: a few effects only happen when something first appears, so changing them affects new items, not ones already shown. Examples: fly-in from the drop point or message box, word-by-word streaming, pop-in on arrival.
- **State attributes**: components expose their state as `data-*` attributes (`data-state`, `data-checked`, `data-active`, `data-glide`), and styles and animations key off them. For example, the sidebar's text roll follows the `data-glide` attribute the hover background sets, which keeps the two in sync.
- **Reduced motion**: most components wrap themselves in `<MotionConfig reducedMotion="user">` or check `useReducedMotion()`, so people who ask their system for less motion get the plain version. Toast doesn't do this yet.

## Animation libraries

- **Motion** (`motion/react`) does most of the animation: springs, layout animations (`layout`, `layoutId` for things that glide between items), `AnimatePresence` for enter and exit, and `Reorder` for drag to reorder.
- **GSAP** is used in Attachment: the line running around the border while uploading, `Flip` for rearranging when wrapping, and `MorphSVGPlugin` for the status icon changing shape.

## Styling rules

These come from `CLAUDE.md` and apply to every file:

- **Desktop first:** write desktop styles with no prefix, then override with `max-[1025px]:` for tablet and `max-md:` for mobile. Don't use `sm:`, `md:` or `lg:` for layout.
- **Units:** no `px` values. Use Tailwind's scale (`text-lg`, `size-8`), or `vw`, `vh` or `%` for custom sizes.
- **Spacing:** space elements with the parent's `flex` or `grid` `gap-*`. Use axis padding and margin (`px-*`, `py-*`, `mx-*`, `my-*`), not one-sided (`pt-*`, `mb-*`, …).
- **Variants:** components define variants with `cva` (class-variance-authority) and join classes with `cn`. Each part has a `data-slot` attribute (for example `data-slot="sidebar-menu-button"`) so it can be targeted in styles.
- **Comments:** only short, one-line comments (a few words) where they help.
