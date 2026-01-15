import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsGrid } from "@/components/stats-grid";
import { FeedFilters } from "@/components/feed-filters";
import { TradeFeed } from "@/components/trade-feed";
import { NewTradeForm } from "@/components/new-trade-form";
import { CommentDialog } from "@/components/comment-dialog";
import { Confetti } from "@/components/confetti";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Trade, type User, type UserStats, type Comment, type FeedFilter, type InsertTrade } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [showNewTradeForm, setShowNewTradeForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [commentTradeId, setCommentTradeId] = useState<string | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades", activeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/trades?filter=${activeFilter}`);
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

  const createTradeMutation = useMutation({
    mutationFn: async (data: Omit<InsertTrade, "userId">) => {
      const result = await apiRequest("POST", "/api/trades", data);
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowConfetti(true);
      toast({
        title: "Trade posted!",
        description: "Your trade has been shared with the team.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ tradeId, content }: { tradeId: string; content: string }) => {
      await apiRequest("POST", `/api/trades/${tradeId}/comments`, { content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", variables.tradeId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
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

  const handleSubmitComment = async (tradeId: string, content: string) => {
    await commentMutation.mutateAsync({ tradeId, content });
  };

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const selectedTrade = commentTradeId ? trades.find((t) => t.id === commentTradeId) || null : null;

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

  return (
    <div className="min-h-screen bg-background">
      <Confetti show={showConfetti} onComplete={handleConfettiComplete} />
      
      <Header onNewTrade={() => setShowNewTradeForm(true)} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <section className="mb-8" aria-label="Performance Statistics">
          <h2 className="text-lg font-semibold mb-4">Performance Dashboard</h2>
          <StatsGrid stats={stats || defaultStats} isLoading={statsLoading} />
        </section>

        <section aria-label="Trade Feed">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>

          <TradeFeed
            trades={trades}
            users={usersMap}
            currentUserId={currentUser?.id || "guest"}
            isLoading={tradesLoading}
            onLike={handleLike}
            onComment={handleComment}
          />
        </section>
      </main>

      <NewTradeForm
        open={showNewTradeForm}
        onOpenChange={setShowNewTradeForm}
        onSubmit={createTradeMutation.mutateAsync}
        isSubmitting={createTradeMutation.isPending}
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
