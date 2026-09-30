import { HpxApiReference } from "@/components/api-reference"

export default function ComponentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HpxApiReference slug="radio" />
    </>
  )
}
