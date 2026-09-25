import Link from "next/link"
import { cn } from "cn"

/**
 * A text link whose underline draws in from the left on hover and focus, and retracts to the
 * right when the pointer leaves. Pass `className` for size and colour.
 */
function AnimatedLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "group/link relative inline-flex w-fit items-center gap-1.5 transition-colors duration-300 outline-none",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}

/** The part of an `AnimatedLink` that gets the drawn underline. */
function AnimatedLinkText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "relative",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out",
        "group-hover/link:after:origin-left group-hover/link:after:scale-x-100 group-focus-visible/link:after:origin-left group-focus-visible/link:after:scale-x-100",
        className
      )}
      {...props}
    />
  )
}

export { AnimatedLink, AnimatedLinkText }
