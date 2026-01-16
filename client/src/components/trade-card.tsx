import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StrategyBadge } from "@/components/strategy-badge";
import { Heart, MessageCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { type Trade, type User, STRATEGIES } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TradeCardProps {
  trade: Trade;
  user: User;
  currentUserId: string;
  onLike: (tradeId: string) => void;
  onComment: (tradeId: string) => void;
}

export function TradeCard({ trade, user, currentUserId, onLike, onComment }: TradeCardProps) {
  const [legsExpanded, setLegsExpanded] = useState(false);
  const strategyInfo = STRATEGIES[trade.strategy];
  const hasMultipleLegs = trade.legs.length > 1;
  const isLiked = trade.likes.includes(currentUserId);
  
  // Helper to determine if this is a stock trade
  const isStockTrade = trade.strategy === "STOCK" || trade.legs.every(leg => leg.type === "STOCK");
  
  const isProfitable = trade.pnl !== null && trade.pnl > 0;
  const isLoss = trade.pnl !== null && trade.pnl < 0;

  const formatPnl = (pnl: number | null) => {
    if (pnl === null) return "—";
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPnlPercent = (percent: number | null) => {
    if (percent === null) return "";
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    switch (trade.status) {
      case "OPEN":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Open</Badge>;
      case "CLOSED":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Closed</Badge>;
      case "PARTIAL":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Partial</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-shadow" data-testid={`card-trade-${trade.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium" data-testid={`text-trader-name-${trade.id}`}>{user.displayName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(trade.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <StrategyBadge strategy={trade.strategy} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold tracking-tight" data-testid={`text-ticker-${trade.id}`}>
                {trade.ticker}
              </span>
              {trade.status === "CLOSED" && (
                isProfitable ? (
                  <TrendingUp className="h-5 w-5 text-profit" />
                ) : isLoss ? (
                  <TrendingDown className="h-5 w-5 text-loss" />
                ) : null
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {trade.quantity} {trade.quantity === 1 ? (isStockTrade ? "share" : "contract") : (isStockTrade ? "shares" : "contracts")} @ ${trade.entryPrice.toFixed(2)}
            </p>
          </div>

          <div className="text-right">
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isProfitable && "text-profit",
                isLoss && "text-loss",
                trade.pnl === null && "text-muted-foreground"
              )}
              data-testid={`text-pnl-${trade.id}`}
            >
              {formatPnl(trade.pnl)}
            </p>
            {trade.pnlPercent !== null && (
              <p
                className={cn(
                  "text-sm tabular-nums",
                  isProfitable && "text-profit",
                  isLoss && "text-loss"
                )}
              >
                {formatPnlPercent(trade.pnlPercent)}
              </p>
            )}
          </div>
        </div>

        {(trade.maxProfit !== undefined || trade.maxLoss !== undefined) && (
          <div className="flex items-center gap-4 mb-4 p-3 rounded-md bg-muted/50">
            {trade.maxProfit !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-profit" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Max: </span>
                  <span className="font-medium text-profit">${trade.maxProfit.toFixed(0)}</span>
                </span>
              </div>
            )}
            {trade.maxLoss !== undefined && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-loss" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Risk: </span>
                  <span className="font-medium text-loss">${Math.abs(trade.maxLoss).toFixed(0)}</span>
                </span>
              </div>
            )}
            {trade.maxProfit !== undefined && trade.maxLoss !== undefined && trade.maxLoss !== 0 && (
              <div className="text-sm text-muted-foreground">
                R/R: {(trade.maxProfit / Math.abs(trade.maxLoss)).toFixed(1)}:1
              </div>
            )}
          </div>
        )}

        {hasMultipleLegs && (
          <Collapsible open={legsExpanded} onOpenChange={setLegsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground"
                data-testid={`button-expand-legs-${trade.id}`}
              >
                <span>{strategyInfo.legs} Legs</span>
                {legsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {trade.legs.map((leg, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-1"
                    data-testid={`text-leg-${trade.id}-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={leg.action === "BUY" ? "default" : "secondary"} className="text-xs">
                        {leg.action}
                      </Badge>
                      <span className="font-medium">{leg.quantity}x</span>
                      <span>{leg.type}</span>
                      {leg.strike && <span className="text-muted-foreground">${leg.strike}</span>}
                    </div>
                    {leg.expiration && (
                      <span className="text-muted-foreground text-xs">{leg.expiration}</span>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {trade.notes && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
            {trade.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-4 pt-0 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", isLiked && "text-pink-500")}
          onClick={() => onLike(trade.id)}
          data-testid={`button-like-${trade.id}`}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          <span className="tabular-nums">{trade.likes.length}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => onComment(trade.id)}
          data-testid={`button-comment-${trade.id}`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{trade.commentCount}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
