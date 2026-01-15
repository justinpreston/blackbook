import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsGrid } from "@/components/stats-grid";
import { FeedFilters } from "@/components/feed-filters";
import { CompactTradeCard } from "@/components/compact-trade-card";
import { NewTradeForm } from "@/components/new-trade-form";
import { CommentDialog } from "@/components/comment-dialog";
import { Confetti } from "@/components/confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Trade, type User, type UserStats, type Comment, type FeedFilter, type InsertTrade } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Home as HomeIcon, User as UserIcon } from "lucide-react";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Home() {
  const { toast } = useToast();
  const [showNewTradeForm, setShowNewTradeForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "my-trades">("home");
  const [homeFilter, setHomeFilter] = useState<FeedFilter>("all");
  const [myFilter, setMyFilter] = useState<FeedFilter>("all");
  const [commentTradeId, setCommentTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: sharedTrades = [], isLoading: sharedLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/shared", homeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/trades/shared?filter=${homeFilter}`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
  });

  const { data: myTrades = [], isLoading: myTradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/mine", myFilter],
    queryFn: async () => {
      const res = await fetch(`/api/trades/mine?filter=${myFilter}`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/trades", commentTradeId, "comments"],
    queryFn: async () => {
      if (!commentTradeId) return [];
      const res = await fetch(`/api/trades/${commentTradeId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!commentTradeId,
  });

  const usersMap = new Map(users.map((u) => [u.id, u]));

  // Get unique ticker symbols from open trades
  const openTradeSymbols = useMemo(() => {
    const allTrades = [...sharedTrades, ...myTrades];
    const openTrades = allTrades.filter(t => t.status === "OPEN");
    return Array.from(new Set(openTrades.map(t => t.ticker)));
  }, [sharedTrades, myTrades]);

  // Fetch quotes for open trades (refreshes every 5 minutes)
  const { data: quotes = {} } = useQuery<Record<string, StockQuote>>({
    queryKey: ["/api/quotes/trades/open"],
    enabled: openTradeSymbols.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: Omit<InsertTrade, "userId">) => {
      const result = await apiRequest("POST", "/api/trades", data);
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowConfetti(true);
      toast({
        title: "Trade posted!",
        description: "Your trade has been added to your journal.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      await apiRequest("POST", `/api/trades/${tradeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/mine"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const result = await apiRequest("POST", `/api/trades/${tradeId}/share`);
      return result.json();
    },
    onSuccess: (data, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/mine"] });
      toast({
        title: data.shared ? "Trade shared!" : "Trade unshared",
        description: data.shared 
          ? "Your trade is now visible to everyone." 
          : "Your trade is now private.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update share status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ tradeId, content }: { tradeId: string; content: string }) => {
      await apiRequest("POST", `/api/trades/${tradeId}/comments`, { content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", variables.tradeId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/mine"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editTradeMutation = useMutation({
    mutationFn: async ({ tradeId, data }: { tradeId: string; data: Omit<InsertTrade, "userId"> }) => {
      const result = await apiRequest("PUT", `/api/trades/${tradeId}`, data);
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/shared"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditingTrade(null);
      toast({
        title: "Trade updated!",
        description: "Your trade has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = useCallback((tradeId: string) => {
    likeMutation.mutate(tradeId);
  }, [likeMutation]);

  const handleComment = useCallback((tradeId: string) => {
    setCommentTradeId(tradeId);
  }, []);

  const handleShare = useCallback((tradeId: string) => {
    shareMutation.mutate(tradeId);
  }, [shareMutation]);

  const handleSubmitComment = async (tradeId: string, content: string) => {
    await commentMutation.mutateAsync({ tradeId, content });
  };

  const handleEdit = useCallback((trade: Trade) => {
    setEditingTrade(trade);
    setShowNewTradeForm(true);
  }, []);

  const handleTradeFormSubmit = async (data: Omit<InsertTrade, "userId">) => {
    if (editingTrade) {
      await editTradeMutation.mutateAsync({ tradeId: editingTrade.id, data });
    } else {
      await createTradeMutation.mutateAsync(data);
    }
  };

  const handleTradeFormClose = (open: boolean) => {
    setShowNewTradeForm(open);
    if (!open) {
      setEditingTrade(null);
    }
  };

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const allTrades = [...sharedTrades, ...myTrades];
  const selectedTrade = commentTradeId ? allTrades.find((t) => t.id === commentTradeId) || null : null;

  const defaultStats: UserStats = {
    totalTrades: 0,
    winRate: 0,
    totalPnl: 0,
    bestTrade: null,
    worstTrade: null,
    openTrades: 0,
    closedTrades: 0,
  };

  const defaultUser: User = {
    id: "guest",
    username: "guest",
    displayName: "Guest Trader",
    avatarUrl: undefined,
  };

  const renderTradeGrid = (trades: Trade[], isLoading: boolean, showShareToggle: boolean) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      );
    }

    if (trades.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No trades found</p>
          <p className="text-sm mt-1">
            {showShareToggle 
              ? "Create a new trade to get started!" 
              : "No one has shared any trades yet."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trades.map((trade) => (
          <CompactTradeCard
            key={trade.id}
            trade={trade}
            user={usersMap.get(trade.userId) || defaultUser}
            currentUserId={currentUser?.id || "guest"}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onEdit={handleEdit}
            showShareToggle={showShareToggle}
            currentQuote={trade.status === "OPEN" ? quotes[trade.ticker.toUpperCase()] : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Confetti show={showConfetti} onComplete={handleConfettiComplete} />
      
      <Header onNewTrade={() => setShowNewTradeForm(true)} />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "home" | "my-trades")}>
          <TabsList className="mb-6" data-testid="tabs-navigation">
            <TabsTrigger value="home" className="gap-2" data-testid="tab-home">
              <HomeIcon className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="my-trades" className="gap-2" data-testid="tab-my-trades">
              <UserIcon className="h-4 w-4" />
              My Trades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-0">
            <section className="mb-6" aria-label="Performance Statistics">
              <h2 className="text-lg font-semibold mb-4">Team Performance</h2>
              <StatsGrid stats={stats || defaultStats} isLoading={statsLoading} />
            </section>

            <section aria-label="Shared Trade Feed">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">Shared Trades</h2>
                <FeedFilters activeFilter={homeFilter} onFilterChange={setHomeFilter} />
              </div>
              {renderTradeGrid(sharedTrades, sharedLoading, false)}
            </section>
          </TabsContent>

          <TabsContent value="my-trades" className="mt-0">
            <section aria-label="My Trades">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">My Trades</h2>
                  <p className="text-sm text-muted-foreground">Toggle the share switch to show trades on the home feed</p>
                </div>
                <FeedFilters activeFilter={myFilter} onFilterChange={setMyFilter} />
              </div>
              {renderTradeGrid(myTrades, myTradesLoading, true)}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <NewTradeForm
        open={showNewTradeForm}
        onOpenChange={handleTradeFormClose}
        onSubmit={handleTradeFormSubmit as any}
        isSubmitting={editingTrade ? editTradeMutation.isPending : createTradeMutation.isPending}
        editingTrade={editingTrade}
      />

      <CommentDialog
        open={!!commentTradeId}
        onOpenChange={(open) => !open && setCommentTradeId(null)}
        trade={selectedTrade}
        comments={comments}
        users={usersMap}
        currentUser={currentUser || defaultUser}
        onSubmit={handleSubmitComment}
        isLoading={commentsLoading}
        isSubmitting={commentMutation.isPending}
      />
    </div>
  );
}
