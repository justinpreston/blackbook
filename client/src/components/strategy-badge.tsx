import { Badge } from "@/components/ui/badge";
import { STRATEGIES, type StrategyType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StrategyBadgeProps {
  strategy: StrategyType;
  size?: "sm" | "default";
}

const categoryColors: Record<string, string> = {
  simple: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  vertical: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  advanced: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export function StrategyBadge({ strategy, size = "default" }: StrategyBadgeProps) {
  const strategyInfo = STRATEGIES[strategy];
  const colorClass = categoryColors[strategyInfo.category] || categoryColors.simple;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold tracking-wide uppercase border",
        colorClass,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      )}
    >
      <span className="mr-1">{strategyInfo.emoji}</span>
      {strategyInfo.name}
    </Badge>
  );
}
