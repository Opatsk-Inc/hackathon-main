import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding font-medium whitespace-nowrap tracking-[-0.01em] transition-all duration-200 outline-none select-none focus-visible:ring-4 focus-visible:ring-primary/25 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(217,119,6,0.28)] hover:bg-amber-500 hover:shadow-[0_14px_34px_rgba(217,119,6,0.34)] [a]:hover:bg-amber-500",
        outline:
          "border-white/60 bg-white/55 text-foreground shadow-[0_1px_2px_rgba(11,28,54,0.04),0_6px_16px_rgba(11,28,54,0.06)] backdrop-blur-xl hover:bg-white/75 hover:border-white/80 aria-expanded:bg-white/75",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_8px_22px_rgba(37,99,235,0.22)] hover:bg-sky-700 hover:shadow-[0_12px_28px_rgba(37,99,235,0.28)]",
        soft:
          "bg-amber-50/80 text-amber-800 border-amber-200/70 hover:bg-amber-100 backdrop-blur-xl",
        "soft-sky":
          "bg-sky-50/80 text-sky-800 border-sky-200/70 hover:bg-sky-100 backdrop-blur-xl",
        ghost:
          "text-foreground hover:bg-white/60 hover:text-foreground aria-expanded:bg-white/70",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_26px_rgba(220,38,38,0.28)] hover:bg-red-700",
        "destructive-soft":
          "bg-red-50/80 text-red-700 border-red-200/70 hover:bg-red-100 backdrop-blur-xl",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-[0.75rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-lg px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-lg in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
