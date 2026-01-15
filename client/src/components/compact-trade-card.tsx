import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { StrategyBadge } from "@/components/strategy-badge";
import { Heart, MessageCircle, TrendingUp, TrendingDown, Share2, RefreshCw } from "lucide-react";
import { type Trade, type User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CompactTradeCardProps {
  trade: Trade;
  user: User;
  currentUserId: string;
  onLike: (tradeId: string) => void;
  onComment: (tradeId: string) => void;
  onShare?: (tradeId: string) => void;
  showShareToggle?: boolean;
  currentQuote?: StockQuote | null;
}

export function CompactTradeCard({
  trade,
  user,
  currentUserId,
  onLike,
  onComment,
  onShare,
  showShareToggle = false,
  currentQuote,
}: CompactTradeCardProps) {
  const isLiked = trade.likes.includes(currentUserId);
  
  // Calculate live P&L for open trades
  let displayPnl = trade.pnl;
  let displayPnlPercent = trade.pnlPercent;
  
  if (trade.status === "OPEN" && currentQuote && trade.entryPrice > 0) {
    const currentValue = currentQuote.price * trade.quantity * 100; // Options are 100 shares per contract
    const entryValue = trade.entryPrice * trade.quantity * 100;
    displayPnl = currentValue - entryValue;
    displayPnlPercent = ((currentQuote.price - trade.entryPrice) / trade.entryPrice) * 100;
  }
  
  const isProfitable = displayPnl !== null && displayPnl > 0;
  const isLoss = displayPnl !== null && displayPnl < 0;

  const formatPnl = (pnl: number | null) => {
    if (pnl === null) return "—";
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPnlPercent = (percent: number | null) => {
    if (percent === null) return "";
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getStatusBadge = () => {
    switch (trade.status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
            Open
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            Closed
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
            Partial
          </Badge>
        );
    }
  };

  return (
    <Card
      className="overflow-hidden hover-elevate transition-shadow"
      data-testid={`card-trade-${trade.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 border shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate" data-testid={`text-trader-name-${trade.id}`}>
              {user.displayName}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight" data-testid={`text-ticker-${trade.id}`}>
              {trade.ticker}
            </span>
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : isLoss ? (
              <TrendingDown className="h-4 w-4 text-loss" />
            ) : null}
          </div>
          <div className="flex flex-col items-end">
            {trade.status === "OPEN" && currentQuote && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" />
                ${currentQuote.price.toFixed(2)}
              </div>
            )}
            <div
              className={cn(
                "text-lg font-bold tabular-nums",
                isProfitable && "text-profit",
                isLoss && "text-loss",
                displayPnl === null && "text-muted-foreground"
              )}
              data-testid={`text-pnl-${trade.id}`}
            >
              {formatPnl(displayPnl)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <StrategyBadge strategy={trade.strategy} size="sm" />
          {displayPnlPercent !== null && (
            <span
              className={cn(
                "text-xs tabular-nums",
                isProfitable && "text-profit",
                isLoss && "text-loss"
              )}
            >
              {formatPnlPercent(displayPnlPercent)}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          {trade.quantity} {trade.quantity === 1 ? "contract" : "contracts"} @ ${trade.entryPrice.toFixed(2)}
        </div>

        {trade.status === "CLOSED" && trade.missedPnl !== null && (
          <div className={cn(
            "text-xs p-2 rounded-md mb-3",
            trade.missedPnl > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-green-500/10 text-green-700 dark:text-green-400"
          )}>
            {trade.missedPnl > 0 ? (
              <span>
                If held to expiry @ ${trade.expirationStockPrice?.toFixed(2)}: {formatPnl(trade.missedPnl)} more
              </span>
            ) : (
              <span>
                Good exit! At expiry @ ${trade.expirationStockPrice?.toFixed(2)}: {formatPnl(Math.abs(trade.missedPnl))} saved
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1 h-7 px-2", isLiked && "text-pink-500")}
              onClick={() => onLike(trade.id)}
              data-testid={`button-like-${trade.id}`}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              <span className="tabular-nums text-xs">{trade.likes.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 px-2"
              onClick={() => onComment(trade.id)}
              data-testid={`button-comment-${trade.id}`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="tabular-nums text-xs">{trade.commentCount}</span>
            </Button>
          </div>
          {showShareToggle && onShare && (
            <div className="flex items-center gap-2">
              <Share2 className={cn("h-3.5 w-3.5", trade.shared ? "text-primary" : "text-muted-foreground")} />
              <Switch
                checked={trade.shared}
                onCheckedChange={() => onShare(trade.id)}
                data-testid={`switch-share-${trade.id}`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
