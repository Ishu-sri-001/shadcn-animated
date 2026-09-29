import { TabsDemo } from "./tabs-demo"

export default function TabsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tabs</h1>
        <p className="text-sm text-muted-foreground">
          Switch between related panels. The indicator glides to the active tab and the content slides or fades in the direction you moved.
        </p>
      </div>

      <TabsDemo />
    </div>
  )
}
