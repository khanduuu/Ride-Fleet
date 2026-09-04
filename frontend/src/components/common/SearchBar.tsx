import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./DatePicker";
import { cn } from "@/lib/utils";

export function SearchBar({
  variant = "hero",
  defaultLocation = "",
  className,
}: {
  variant?: "hero" | "inline";
  defaultLocation?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(defaultLocation);
  const [start, setStart] = useState<Date | undefined>(undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void navigate({
      to: "/vehicles",
      search: {
        location: location || undefined,
        startDate: start ? format(start, "yyyy-MM-dd") : undefined,
        endDate: end ? format(end, "yyyy-MM-dd") : undefined,
      },
    });
  }

  const body = (
    <form
      onSubmit={submit}
      className={cn(
        "grid grid-cols-1 gap-4 rounded-md bg-background p-5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end",
        variant === "inline" && "border border-border",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="pickup-location" className="label-eyebrow">
          Pickup location
        </label>
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <input
            id="pickup-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Airport, city or point"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <DatePicker label="Departure" value={start} onChange={setStart} id="date-start" />
      <DatePicker label="Return" value={end} onChange={setEnd} id="date-end" />
      <Button type="submit" size="lg" className="gap-2 md:h-10">
        <Search className="size-4" />
        Search fleet
      </Button>
    </form>
  );

  if (variant === "inline") return <div className={className}>{body}</div>;

  return (
    <div
      className={cn(
        "rounded-xl bg-surface-strong p-1 shadow-panel ring-1 ring-foreground/5",
        className,
      )}
    >
      {body}
    </div>
  );
}
