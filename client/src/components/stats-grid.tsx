import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Activity, Trophy, Skull } from "lucide-react";
import { type UserStats } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  stats: UserStats;
  isLoading?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor,
  valueColor,
  isLoading,
  testId,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue?: string;
  iconColor?: string;
  valueColor?: string;
  isLoading?: boolean;
  testId: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mb-3" />
          <div className="w-20 h-8 bg-muted rounded animate-pulse mb-1" />
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={testId}>
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", iconColor || "bg-primary/10")}>
          <Icon className={cn("w-6 h-6", iconColor ? "text-white" : "text-primary")} />
        </div>
        <p className={cn("text-3xl font-bold tabular-nums mb-1", valueColor)}>
          {value}
        </p>
        {subValue && (
          <p className="text-sm text-muted-foreground mb-1">{subValue}</p>
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={Activity}
        label="Total Trades"
        value={isLoading ? "—" : stats.totalTrades.toString()}
        subValue={isLoading ? undefined : `${stats.openTrades} open`}
        isLoading={isLoading}
        testId="stat-total-trades"
      />
      <StatCard
        icon={Target}
        label="Win Rate"
        value={isLoading ? "—" : `${stats.winRate.toFixed(0)}%`}
        iconColor={stats.winRate >= 50 ? "bg-profit" : "bg-loss"}
        valueColor={stats.winRate >= 50 ? "text-profit" : "text-loss"}
        isLoading={isLoading}
        testId="stat-win-rate"
      />
      <StatCard
        icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
        label="Total P&L"
        value={isLoading ? "—" : formatPnl(stats.totalPnl)}
        iconColor={stats.totalPnl >= 0 ? "bg-profit" : "bg-loss"}
        valueColor={stats.totalPnl >= 0 ? "text-profit" : "text-loss"}
        isLoading={isLoading}
        testId="stat-total-pnl"
      />
      <StatCard
        icon={Trophy}
        label="Best Trade"
        value={isLoading || !stats.bestTrade ? "—" : formatPnl(stats.bestTrade.pnl || 0)}
        subValue={stats.bestTrade?.ticker}
        iconColor="bg-profit"
        valueColor="text-profit"
        isLoading={isLoading}
        testId="stat-best-trade"
      />
      <StatCard
        icon={Skull}
        label="Worst Trade"
        value={isLoading || !stats.worstTrade ? "—" : formatPnl(stats.worstTrade.pnl || 0)}
        subValue={stats.worstTrade?.ticker}
        iconColor="bg-loss"
        valueColor="text-loss"
        isLoading={isLoading}
        testId="stat-worst-trade"
      />
      <StatCard
        icon={TrendingUp}
        label="Closed"
        value={isLoading ? "—" : stats.closedTrades.toString()}
        subValue="trades"
        isLoading={isLoading}
        testId="stat-closed-trades"
      />
    </div>
  );
}
