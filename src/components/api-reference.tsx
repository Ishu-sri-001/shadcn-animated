import { ApiReferenceVisibility } from "@/components/api-reference-visibility"
import { apiReferences, type ApiProp, type ApiReferenceSlug } from "@/components/api-reference-data"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

function PropList({ props, label }: { props: ApiProp[]; label: string }) {
  return (
    <Accordion
      aria-label={`${label} props`}
      multiple
      defaultValue={[]}
      duration={0.4}
      delay={0.06}
      stagger={0.04}
      className="gap-0 overflow-hidden rounded-xl border border-border/70 bg-background shadow-xs"
    >
      {props.map((prop) => {
        const restrictionStart = prop.description.lastIndexOf(" [")
        const hasRestriction = restrictionStart !== -1 && prop.description.endsWith("]")
        const description = hasRestriction ? prop.description.slice(0, restrictionStart) : prop.description
        const restriction = hasRestriction ? prop.description.slice(restrictionStart + 1) : null

        return (
          <AccordionItem key={prop.name} value={prop.name} className="py-0 last:[&>div[aria-hidden]]:hidden">
            <AccordionTrigger className="gap-4 rounded-none px-5 py-4 text-base font-normal tracking-tight text-foreground transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 motion-reduce:transition-none">
              <span>{prop.label}</span>
            </AccordionTrigger>
            <AccordionContent className="max-w-none gap-1 px-5 pt-1 pb-5 sm:px-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              {restriction && (
                <p className="text-xs leading-relaxed text-foreground/65">{restriction}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

function sectionId(name: string) {
  return `api-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
}

export function ApiReference({ slug }: { slug: ApiReferenceSlug }) {
  const groups = apiReferences[slug]
  const documented = groups.filter((group) => group.props.length > 0)

  return (
    <ApiReferenceVisibility>
      <section
        id="api-reference"
        aria-labelledby="api-reference-heading"
        className={`mx-auto mt-12 flex w-full min-w-0 scroll-mt-24 flex-col gap-10 border-t border-border/60 pt-10 pb-8 ${slug === "table" ? "max-w-3xl" : "max-w-2xl"}`}
      >
        <div className="space-y-3">
          <h2 id="api-reference-heading" className="text-2xl font-semibold tracking-tight">API Reference</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Settings match the props remixer above. Open a row for details and any restrictions.
          </p>
          <nav aria-label="API reference sections" className="flex flex-wrap gap-2 pt-2">
            {documented.map((group) => (
              <a key={group.name} href={`#${sectionId(group.name)}`} className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {group.name}
              </a>
            ))}
          </nav>
        </div>
        {documented.map((group) => (
          <div key={group.name} id={sectionId(group.name)} className="scroll-mt-24 space-y-3">
            <h3 className="flex items-center gap-3 font-medium"><code className="text-sm">{group.name}</code><span aria-hidden className="h-px flex-1 bg-border/60" /></h3>
            <PropList props={group.props} label={group.name} />
          </div>
        ))}

      </section>
    </ApiReferenceVisibility>
  )
}
