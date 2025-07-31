import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "peer w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-2 text-sm shadow-sm transition-all duration-200",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a8cb7] focus:border-[#0a8cb7]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "dark:bg-gray-800 dark:text-white",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
