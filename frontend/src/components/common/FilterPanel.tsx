import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import type { FuelType, Transmission, VehicleQuery, VehicleType } from "@/types";

export const VEHICLE_TYPES: VehicleType[] = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Van",
  "Luxury",
  "Bike",
];
export const FUEL_TYPES: FuelType[] = ["Electric", "Hybrid", "Petrol", "Diesel"];
export const TRANSMISSIONS: Transmission[] = ["Automatic", "Manual"];
export const SEAT_OPTIONS = [2, 4, 5, 7];

export interface FilterState {
  types: VehicleType[];
  fuels: FuelType[];
  transmissions: Transmission[];
  seats: number[];
  priceRange: [number, number];
  location: string;
}

export const emptyFilters: FilterState = {
  types: [],
  fuels: [],
  transmissions: [],
  seats: [],
  priceRange: [500, 10000],
  location: "",
};

export function filtersToQuery(filters: FilterState): VehicleQuery {
  return {
    types: filters.types,
    fuels: filters.fuels,
    transmissions: filters.transmissions,
    seats: filters.seats,
    minPrice: filters.priceRange[0],
    maxPrice: filters.priceRange[1],
    location: filters.location,
  };
}

export function activeFilterCount(filters: FilterState) {
  return (
    filters.types.length +
    filters.fuels.length +
    filters.transmissions.length +
    filters.seats.length +
    (filters.location ? 1 : 0) +
    (filters.priceRange[0] !== 500 || filters.priceRange[1] !== 10000 ? 1 : 0)
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border pt-5 first:border-0 first:pt-0">
      <legend className="label-eyebrow mb-3">{title}</legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="cursor-pointer text-sm text-muted-foreground">
        {label}
      </label>
    </div>
  );
}

export function FilterPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}) {
  const count = activeFilterCount(filters);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">Filters</h2>
        {count > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={onClear}>
            <X className="size-3" /> Clear {count}
          </Button>
        )}
      </div>

      <Group title="Location">
        <Input
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          placeholder="City or airport"
          aria-label="Filter by location"
        />
      </Group>

      <Group title="Vehicle type">
        {VEHICLE_TYPES.map((type) => (
          <CheckRow
            key={type}
            id={`type-${type}`}
            label={type}
            checked={filters.types.includes(type)}
            onChange={() => onChange({ ...filters, types: toggle(filters.types, type) })}
          />
        ))}
      </Group>

      <Group title={`Price per day`}>
        <Slider
          value={filters.priceRange}
          min={500}
          max={10000}
          step={5}
          onValueChange={(value) =>
            onChange({ ...filters, priceRange: [value[0]!, value[1]!] })
          }
          aria-label="Price range per day"
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatCurrency(filters.priceRange[0])}</span>
          <span>{formatCurrency(filters.priceRange[1])}+</span>
        </div>
      </Group>

      <Group title="Fuel type">
        {FUEL_TYPES.map((fuel) => (
          <CheckRow
            key={fuel}
            id={`fuel-${fuel}`}
            label={fuel}
            checked={filters.fuels.includes(fuel)}
            onChange={() => onChange({ ...filters, fuels: toggle(filters.fuels, fuel) })}
          />
        ))}
      </Group>

      <Group title="Transmission">
        {TRANSMISSIONS.map((t) => (
          <CheckRow
            key={t}
            id={`trans-${t}`}
            label={t}
            checked={filters.transmissions.includes(t)}
            onChange={() =>
              onChange({ ...filters, transmissions: toggle(filters.transmissions, t) })
            }
          />
        ))}
      </Group>

      <Group title="Seats">
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((seat) => {
            const active = filters.seats.includes(seat);
            return (
              <Button
                key={seat}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => onChange({ ...filters, seats: toggle(filters.seats, seat) })}
              >
                {seat === 7 ? "7+" : seat}
              </Button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}

export function FilterPanelMobile(props: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}) {
  const count = activeFilterCount(props.filters);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 lg:hidden">
          <SlidersHorizontal className="size-4" />
          Filters{count > 0 ? ` (${count})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterPanel {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
