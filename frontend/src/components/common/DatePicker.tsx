import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  id,
  className,
}: {
  value?: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="label-eyebrow">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">
              {value ? format(value, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("pointer-events-auto p-3")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
