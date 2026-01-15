const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

interface CachedQuote {
  quote: StockQuote;
  cachedAt: number;
}

// Cache quotes for 5 minutes to avoid hitting rate limits (25 requests/day on free tier)
const quoteCache = new Map<string, CachedQuote>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const upperSymbol = symbol.toUpperCase();
  
  // Check cache first
  const cached = quoteCache.get(upperSymbol);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.quote;
  }

  if (!API_KEY) {
    console.error("ALPHA_VANTAGE_API_KEY not configured");
    return null;
  }

  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${upperSymbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data["Note"]) {
      console.warn("Alpha Vantage rate limit reached:", data["Note"]);
      return cached?.quote || null;
    }

    if (data["Error Message"]) {
      console.error("Alpha Vantage error:", data["Error Message"]);
      return null;
    }

    const globalQuote = data["Global Quote"];
    if (!globalQuote || !globalQuote["05. price"]) {
      console.warn("No quote data for symbol:", upperSymbol);
      return null;
    }

    const quote: StockQuote = {
      symbol: globalQuote["01. symbol"],
      price: parseFloat(globalQuote["05. price"]),
      change: parseFloat(globalQuote["09. change"]),
      changePercent: parseFloat(globalQuote["10. change percent"]?.replace("%", "") || "0"),
      high: parseFloat(globalQuote["03. high"]),
      low: parseFloat(globalQuote["04. low"]),
      volume: parseInt(globalQuote["06. volume"], 10),
      timestamp: globalQuote["07. latest trading day"],
    };

    // Cache the result
    quoteCache.set(upperSymbol, { quote, cachedAt: Date.now() });
    
    return quote;
  } catch (error) {
    console.error("Error fetching quote from Alpha Vantage:", error);
    return cached?.quote || null;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase())));
  
  // Fetch quotes sequentially to respect rate limits
  for (const symbol of uniqueSymbols) {
    const quote = await getStockQuote(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
    // Small delay between requests to respect rate limits
    if (uniqueSymbols.indexOf(symbol) < uniqueSymbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

export function clearQuoteCache(): void {
  quoteCache.clear();
}
