import { TradeCard } from "@/components/trade-card";
import { type Trade, type User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TradeFeedProps {
  trades: Trade[];
  users: Map<string, User>;
  currentUserId: string;
  isLoading: boolean;
  onLike: (tradeId: string) => void;
  onComment: (tradeId: string) => void;
}

function TradeCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex justify-between mb-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Be the first to share a trade! Click "New Trade" to log your first position.
        </p>
      </CardContent>
    </Card>
  );
}

export function TradeFeed({
  trades,
  users,
  currentUserId,
  isLoading,
  onLike,
  onComment,
}: TradeFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="feed-loading">
        {[1, 2, 3].map((i) => (
          <TradeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6" data-testid="trade-feed">
      {trades.map((trade) => {
        const user = users.get(trade.userId);
        if (!user) return null;
        return (
          <TradeCard
            key={trade.id}
            trade={trade}
            user={user}
            currentUserId={currentUserId}
            onLike={onLike}
            onComment={onComment}
          />
        );
      })}
    </div>
  );
}
