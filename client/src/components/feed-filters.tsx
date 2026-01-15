import { Button } from "@/components/ui/button";
import { type FeedFilter } from "@shared/schema";
import { cn } from "@/lib/utils";

interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const filters: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All Trades" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "winners", label: "Winners" },
  { value: "losers", label: "Losers" },
];

export function FeedFilters({ activeFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "whitespace-nowrap shrink-0",
            activeFilter === filter.value && "shadow-sm"
          )}
          data-testid={`button-filter-${filter.value}`}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
