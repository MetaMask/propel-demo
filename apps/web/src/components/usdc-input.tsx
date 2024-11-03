import React from "react";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";

export const USDCInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Input
          type={type ?? "number"}
          className={cn(className, "pl-8")}
          ref={ref}
          {...props}
        />
        <DollarSign className="absolute left-0 top-0 m-3.5 h-3.5 w-3.5 text-muted-foreground" />
        <div className="absolute right-8 top-3 text-sm text-muted-foreground">
          USDC
        </div>
      </div>
    );
  },
);
USDCInput.displayName = "USDCInput";
