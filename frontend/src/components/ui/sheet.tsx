import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const SheetContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const [isOpen, setIsOpen] = React.useState(open)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(open)
  }, [open])

  const setOpen = React.useCallback(
    (val: boolean) => {
      setIsOpen(val)
      onOpenChange?.(val)
    },
    [onOpenChange]
  )

  // Prevent background scrolling when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

interface ButtonTriggerProps {
  onClick?: React.MouseEventHandler
}

export function SheetTrigger({
  asChild,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetTrigger must be used within Sheet")

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context.setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<ButtonTriggerProps>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        context.setOpen(true)
      },
      ...props
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export function SheetClose({
  asChild,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetClose must be used within Sheet")

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context.setOpen(false)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<ButtonTriggerProps>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        context.setOpen(false)
      },
      ...props
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom"
}

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: SheetContentProps) {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetContent must be used within Sheet")
  const { open, setOpen } = context

  // Listen for Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !open) return null

  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-full sm:max-w-md border-l animate-slide-in-from-right",
    left: "inset-y-0 left-0 h-full w-full sm:max-w-md border-r animate-slide-in-from-left",
    top: "inset-x-0 top-0 h-auto w-full border-b animate-slide-in-from-top",
    bottom: "inset-x-0 bottom-0 h-auto w-full border-t animate-slide-in-from-bottom"
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={() => setOpen(false)}
      />
      {/* Sheet Content Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col text-slate-900 border-slate-100",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer focus:outline-hidden"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-bold text-slate-900", className)}
      {...props}
    />
  )
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  )
}
