import { SkeletonDemo } from "./skeleton-demo"

export default function SkeletonPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Skeleton</h1>
        <p className="text-sm text-muted-foreground">
          Placeholders that hold a card&apos;s shape while it loads, then hand over to the real
          content.
        </p>
      </div>

      <SkeletonDemo />
    </div>
  )
}
