import Link from "next/link"

export default function ComponentsLayout({
  children,
}: LayoutProps<"/components">) {
  return (
    <main className="mx-auto max-w-[80vw] w-full  px-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All components
      </Link>
      <div className="mt-4">{children}</div>
    </main>
  )
}
