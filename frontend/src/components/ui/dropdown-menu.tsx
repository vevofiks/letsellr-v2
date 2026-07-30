import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
} | null>(null)

export function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(open || false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open !== undefined) setIsOpen(open)
  }, [open])

  const setOpen = React.useCallback(
    (val: boolean) => {
      setIsOpen(val)
      onOpenChange?.(val)
    },
    [onOpenChange]
  )

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

interface TriggerProps {
  onClick?: React.MouseEventHandler
  onKeyDown?: React.KeyboardEventHandler
}

export function DropdownMenuTrigger({
  asChild,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")
  const { open, setOpen, triggerRef } = context

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(!open)
  }

  // Handle keydown for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(true)
    }
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<TriggerProps>
    return React.cloneElement(child, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(!open)
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        child.props.onKeyDown?.(e)
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setOpen(true)
        }
      },
      ...props
    })
  }

  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  className,
  children,
  align = "right",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "left" | "right" }) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")
  const { open, setOpen, triggerRef } = context

  const contentRef = React.useRef<HTMLDivElement | null>(null)

  // Close when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        open &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [open, setOpen, triggerRef])

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen, triggerRef])

  if (!open) return null

  const alignmentClasses = align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute z-50 mt-2 w-56 rounded-lg border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in-50 slide-in-from-top-1 duration-100",
        alignmentClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  className,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")
  const { setOpen } = context

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      // Simulate click
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
      e.currentTarget.dispatchEvent(clickEvent)
    }
  }

  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 hover:text-slate-900 transition-colors focus:bg-slate-50 focus:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-slate-100", className)}
      {...props}
    />
  )
}
