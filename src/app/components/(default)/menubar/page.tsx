import { HpxMenubarDemo } from "./menubar-demo"

export default function MenubarPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Menubar</h1>
        <p className="text-sm text-muted-foreground">
          A row of menus, like the one at the top of a desktop app, that glides from one menu to
          the next.
        </p>
      </div>

      <HpxMenubarDemo />
    </div>
  )
}
