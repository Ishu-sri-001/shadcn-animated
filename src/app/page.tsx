import Link from "next/link"

import { registry } from "@/components/registry"

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Components</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {registry.length} installed
      </p>
      <ul className="mt-6 divide-y rounded-lg border">
        {registry.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/components/${item.slug}`}
              className="block px-4 py-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{item.name}</span>
              <span className="block text-sm text-muted-foreground">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
