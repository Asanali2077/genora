import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Genora buttons. Primary: pine with a soft top highlight and a pressed state.
 * Outline: white with an ink hairline that turns pine on hover. Sizes keep 44px+ tap targets.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-marigold/70 active:not-aria-[haspopup]:translate-y-[1px] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-pine text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(15,92,77,0.35),0_6px_16px_-8px_rgba(15,92,77,0.6)] hover:-translate-y-px hover:bg-[#0b4c40]",
        outline:
          "border-ink/15 bg-white text-ink shadow-[0_1px_2px_rgba(23,42,38,0.06)] hover:border-pine/60 hover:text-pine aria-expanded:border-pine",
        secondary: "border-transparent bg-pine/[0.08] text-pine hover:bg-pine/[0.14]",
        ghost: "border-transparent text-muted-foreground hover:bg-pine/[0.07] hover:text-pine",
        destructive: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        link: "border-transparent text-pine underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 rounded-[10px] px-5 text-[15px]",
        sm: "h-9 rounded-[9px] px-3.5 text-sm",
        lg: "h-12 rounded-[12px] px-6 text-base",
        xs: "h-7 rounded-md px-2.5 text-xs",
        icon: "size-11 rounded-[10px]",
        "icon-sm": "size-9 rounded-[9px]",
        "icon-xs": "size-7 rounded-md",
        "icon-lg": "size-12 rounded-[12px]",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
