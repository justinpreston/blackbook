import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, TrendingUp, Plus } from "lucide-react";

interface HeaderProps {
  onNewTrade: () => void;
}

export function Header({ onNewTrade }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">BlackBook</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Share trades with your team</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={onNewTrade} data-testid="button-new-trade">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Trade</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
