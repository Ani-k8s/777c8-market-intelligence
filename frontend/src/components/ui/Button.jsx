import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary CTA — crimson red gradient
        default:
          "bg-gradient-to-r from-[#8B0000] via-brand to-[#A00020] text-white shadow-[0_0_0_1px_rgba(200,16,46,0.30),0_4px_16px_rgba(200,16,46,0.35)] hover:shadow-[0_0_0_1px_rgba(200,16,46,0.50),0_4px_24px_rgba(200,16,46,0.50)] hover:brightness-110",

        // Gold CTA — luxury amber
        gold:
          "bg-gradient-to-r from-[#7A5500] via-gold to-[#9A7000] text-white shadow-[0_0_0_1px_rgba(201,146,10,0.30),0_4px_16px_rgba(201,146,10,0.35)] hover:shadow-[0_0_0_1px_rgba(201,146,10,0.50),0_4px_24px_rgba(201,146,10,0.50)] hover:brightness-110",

        // Secondary — glass border
        secondary:
          "border border-line/80 bg-surfaceHigh text-textSecondary hover:border-brand/60 hover:text-white hover:bg-brandDim",

        // Ghost — minimal
        ghost:
          "text-textSecondary hover:bg-brandDim hover:text-white",

        // Danger — red destructive
        danger:
          "border border-danger/50 bg-dangerDim text-danger hover:bg-danger/20 hover:border-danger/70",
      },
      size: {
        default: "h-10 px-4",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-12 px-6 text-base font-bold",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  },
);

export default function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
