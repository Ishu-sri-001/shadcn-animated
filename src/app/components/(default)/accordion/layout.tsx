import { ApiReference } from "@/components/api-reference"

export default function ComponentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ApiReference slug="accordion" />
    </>
  )
}
