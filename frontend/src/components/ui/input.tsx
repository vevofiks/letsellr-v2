import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, spellCheck, ...props }: React.ComponentProps<"input">) {
  const isTechnical = type === "email" || type === "password" || type === "tel";
  return (
    <InputPrimitive
      type={type}
      spellCheck={spellCheck ?? (isTechnical ? false : undefined)}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 transition-all outline-none focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
