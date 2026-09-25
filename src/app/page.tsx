import { registry } from "@/components/registry"

import { ComponentList } from "./component-list"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[50vw] flex-col gap-[3vw] px-4 py-[8vh] max-[1025px]:max-w-[80vw] max-[1025px]:gap-[5vw] max-md:max-w-full max-md:gap-[10vw]">
      <header className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">shadcn/ui · Motion · GSAP</span>
        <h1 className="text-4xl font-semibold tracking-tight max-md:text-3xl">
          Animated components
        </h1>
        <p className="w-[80%] text-muted-foreground max-md:w-full">
          shadcn/ui components with smooth micro-interactions, built with Motion and GSAP. Pick
          one to see it in action and tune it from the controls panel.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {registry.length} components
        </span>
        <ComponentList items={registry} />
      </section>
    </main>
  )
}
