# GitHub Issues: BlackBook AI Integration

**This document provides detailed issue templates for all 6 epics.**  
**Copy each issue into GitHub with the specified labels and milestone.**

---

## EPIC 1: AI Journal Assistant

### Issue #101: Chat UI Component & Router Integration
**Label**: `epic/ai-journal`, `ui`, `frontend`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 5

**Description**:
Create a collapsible chat interface accessible from the main app header that can serve AI responses.

**Acceptance Criteria**:
- [ ] Chat panel slides in from right side of screen (mobile: bottom sheet)
- [ ] Sticky header with "AI Journal Assistant" title and close button
- [ ] Input field for user queries at bottom
- [ ] Loading states while AI responds
- [ ] Markdown rendering for AI responses
- [ ] Trade citations as clickable links to trade cards
- [ ] Keyboard shortcut (Cmd+K / Ctrl+K) to focus input
- [ ] Persists chat history for current session (clears on reload)

**Technical Details**:
- Use existing shadcn/ui components (Sheet for drawer, Card for messages)
- Integration point: [client/src/App.tsx](client/src/App.tsx)
- Routing: Add `/api/ai/chat` endpoint (placeholder for now)

**Definition of Done**:
- [ ] Component screenshots in PR
- [ ] Mobile responsive tested (375px, 768px, 1920px)
- [ ] Keyboard navigation works
- [ ] No regressions in existing components

---

### Issue #102: OpenRouter API Integration & Auth
**Label**: `epic/ai-journal`, `backend`, `api`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 8

**Description**:
Set up OpenRouter API client with proper authentication, error handling, and cost tracking middleware.

**Acceptance Criteria**:
- [ ] Environment variable for OPENROUTER_API_KEY (fallback to placeholder)
- [ ] Create `server/services/openrouter.ts` service layer
- [ ] Implement request signing (User-Agent header with app name)
- [ ] Error handling: graceful fallbacks when API rate limited / unavailable
- [ ] Cost calculation middleware: track tokens used per request
- [ ] Request logging with timestamp, user_id, tokens, cost
- [ ] Rate limiting: 10 queries/day per user (stored in session)
- [ ] Create POST `/api/ai/chat` endpoint with above middleware

**Model Configuration**:
```typescript
// Use Claude Sonnet 4.5 as primary (best reasoning for conversations)
// Fallback: GPT-4 Turbo if Sonnet unavailable
// A/B test: 50% users route to each model
const model = shouldABTestGPT4() ? "openai/gpt-4-turbo" : "claude-sonnet-4.5";
```

**Technical Details**:
- OpenRouter Docs: https://openrouter.ai/docs/quickstart
- Response format includes `usage.prompt_tokens`, `usage.completion_tokens`
- Store cost in `users` table: `aiCreditUsed` and `aiCreditLimit`

**Definition of Done**:
- [ ] Integration tested with OpenRouter sandbox
- [ ] Cost logging verified in database
- [ ] Rate limiting enforced (returns 429 when exceeded)
- [ ] Error responses return helpful messages to frontend

---

### Issue #103: RAG System - Vectorize & Index Trades
**Label**: `epic/ai-journal`, `backend`, `ai`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 13

**Description**:
Implement Retrieval Augmented Generation (RAG) to surface relevant trades when answering user queries.

**Acceptance Criteria**:
- [ ] Create trade embedding pipeline: `server/services/embeddings.ts`
- [ ] Generate embeddings for: ticker + strategy + notes + outcome
- [ ] Store embeddings in memory (upgrade to Pinecone/Weaviate in Phase 2)
- [ ] Semantic search function: `findSimilarTrades(query, limit=5)`
- [ ] When user queries, retrieve top 5 similar trades automatically
- [ ] Include trade metadata in AI prompt context: P&L, date, win/loss
- [ ] Handle new trades: auto-embed on creation
- [ ] Handle trade edits: update embedding on save

**Example RAG Flow**:
```
User: "Why do my TSLA trades lose money?"
→ Embed query
→ Find 5 most similar TSLA trades
→ Pass to Claude with context:
   "Based on user's history:
    - TSLA Long Call 1/15 [+$200]
    - TSLA Put Spread 1/10 [-$150]
    - TSLA Covered Call 1/5 [-$50]
    ..."
→ Claude reasons over patterns
```

**Model Selection**:
- Use OpenRouter's embedding models or integrate: `sentence-transformers/all-minilm-l6-v2` (free, local)
- Trade-off: local = no API cost but slower, API = instant but costs

**Technical Details**:
- Embedding dimension: 384 tokens
- Storage: `trades` table gets `embedding` JSONB column
- Similarity metric: cosine distance

**Definition of Done**:
- [ ] 5 sample queries tested with correct trades retrieved
- [ ] Embedding quality validated (similar trades actually related)
- [ ] Performance acceptable (<100ms search latency)
- [ ] Embedding pipeline runs on app startup

---

### Issue #104: Cost Tracking & Usage Analytics
**Label**: `epic/ai-journal`, `backend`, `monitoring`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 5

**Description**:
Build dashboard and database tracking for AI feature costs and usage per user.

**Acceptance Criteria**:
- [ ] Database schema: `ai_usage` table (user_id, feature, tokens_in, tokens_out, cost, timestamp)
- [ ] Create `server/services/aiMetrics.ts` to log all AI requests
- [ ] Calculate cost from OpenRouter pricing (dynamic per model)
- [ ] Add `/api/ai/usage` endpoint returning:
  - Total cost this month
  - Cost by feature (journal assistant, patterns, etc.)
  - Daily breakdown chart data
  - Remaining quota for free tier
- [ ] Frontend: Add Usage Stats card in settings/profile page
- [ ] Alert user when approaching daily limit (80% threshold)
- [ ] Admin endpoint: `/api/admin/ai-costs` for PM dashboard

**Pricing Configuration**:
```typescript
const pricing = {
  "claude-sonnet-4.5": { prompt: 0.003, completion: 0.015 },
  "gpt-4-turbo": { prompt: 0.01, completion: 0.03 },
  "mixtral-8x7b": { prompt: 0.00014, completion: 0.00042 },
};
```

**Definition of Done**:
- [ ] Cost calculations verified against OpenRouter invoices
- [ ] Usage stats accurate (test with 10 queries)
- [ ] Quota warnings trigger correctly
- [ ] Admin dashboard displays cost trends

---

## EPIC 2: Pattern Discovery Engine

### Issue #201: Pattern Analysis Engine (Backend Service)
**Label**: `epic/patterns`, `backend`, `ai`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 13

**Description**:
Build scheduled analysis job that runs daily/weekly to discover profitable patterns in user's trade history.

**Acceptance Criteria**:
- [ ] Create `server/services/patternAnalyzer.ts` (analysis logic)
- [ ] Implement pattern detection:
  - Best performing strategies (by win rate + avg profit)
  - Best trading hours (0-23)
  - Best trading days (Mon-Fri)
  - Ticker affinity (which stocks/options user profits from)
  - Exit timing patterns (how many days/bars held for profit)
  - Max profit/loss position sizing patterns
- [ ] Call OpenRouter GPT-4 Turbo with trade data for narrative analysis
- [ ] Generate insights like:
  - "Your NVDA bull call spreads average 23% higher win rate on Tuesdays"
  - "You exit winners in avg 3.2 days, but hold losers 8.1 days"
  - "Iron condors work best when IV < 30"
- [ ] Store insights with confidence scores (0-100%)
- [ ] Scheduled job: runs 2 AM UTC daily (configurable)
- [ ] Handle edge case: new users with <10 trades (no insights yet)

**Model Usage**:
```typescript
// Use GPT-4 Turbo for batch analysis (optimized for throughput)
const prompt = `
Analyze this trader's patterns:
${trades.map(t => `${t.ticker} ${t.strategy}: ${t.pnl > 0 ? 'WIN' : 'LOSS'}`).join('\n')}
Return top 3 actionable insights in JSON format.
`;
```

**Technical Details**:
- Leverage existing [storage.ts](server/storage.ts) `getAllUserTrades()`
- Calculate statistics: win rate, avg profit, max drawdown, Sharpe ratio
- Store in new `insights` table: user_id, insight_type, content, confidence, generated_at

**Definition of Done**:
- [ ] Job runs successfully for test user
- [ ] Generated insights are specific and actionable
- [ ] Performance acceptable (<5min for 1000-trade user)
- [ ] Insights generated correctly for different strategy mixes

---

### Issue #202: Insights Data Model & Storage
**Label**: `epic/patterns`, `backend`, `database`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 3

**Description**:
Add schema and storage for AI-generated insights tied to user accounts.

**Acceptance Criteria**:
- [ ] Create `insights` table schema:
  - id (UUID)
  - user_id (FK)
  - insight_type (enum: strategy_ranking, time_of_day, ticker_affinity, etc.)
  - title (string)
  - content (text, markdown)
  - confidence (0-100)
  - metadata (JSONB for supporting data)
  - generated_at (timestamp)
  - expires_at (timestamp, null = permanent)
- [ ] Add Drizzle ORM migrations for table
- [ ] Implement storage methods:
  - `saveInsight(insight)`
  - `getUserInsights(userId, limit=10)`
  - `deleteExpiredInsights()`
- [ ] Index: (user_id, generated_at DESC) for quick retrieval

**Definition of Done**:
- [ ] Schema migrates cleanly
- [ ] CRUD operations work
- [ ] Query performance <50ms for typical queries

---

### Issue #203: Insights Dashboard Widget
**Label**: `epic/patterns`, `ui`, `frontend`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 8

**Description**:
Create dashboard widget displaying top insights on home page and detailed insights page.

**Acceptance Criteria**:
- [ ] Home page: "Your Edge" widget shows top 3 insights (max 100 chars each)
- [ ] Widget refreshes insights at 3 AM UTC when new analysis runs
- [ ] Clicking insight expands to full view with supporting data
- [ ] Dedicated `/insights` page shows all insights with filters:
  - Filter by type (strategy, timing, ticker)
  - Sort by confidence, date generated
  - Mark insights as "acted on" (track if trader uses recommendation)
- [ ] Export insights as PDF (for record-keeping)
- [ ] Visual: use existing Card + Badge components
- [ ] Empty state: "Check back tomorrow for your first insights"

**Technical Details**:
- Fetch from `GET /api/insights` endpoint
- Revalidate cache on home page every 24h
- Icons for each insight type (strategy=📊, timing=⏰, ticker=📈)

**Definition of Done**:
- [ ] Widget displays correctly (desktop + mobile)
- [ ] Insights update reflects latest analysis
- [ ] Export PDF functionality works
- [ ] No layout shifts when loading insights

---

### Issue #204: A/B Testing Framework for Model Selection
**Label**: `epic/patterns`, `backend`, `monitoring`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 8

**Description**:
Build infrastructure to A/B test different OpenRouter models for pattern analysis and track performance metrics.

**Acceptance Criteria**:
- [ ] Create experiment assignment: 50% users → Claude Sonnet, 50% → GPT-4 Turbo
- [ ] Store assignment in `user_preferences.ai_model` field
- [ ] Log in `ai_usage` table which model generated each insight
- [ ] Metrics to track:
  - Insight quality rating (user thumbs up/down on insight)
  - Cost per insight generated
  - Processing time (seconds)
  - Click-through rate (how many insights user clicks)
  - Outcome tracking (did trader act on insight, was it profitable)
- [ ] Weekly digest: compare metrics by model
- [ ] UI: Let users vote on insight quality ("This helped me" / "Not helpful")
- [ ] After 2 weeks: winner-take-all (promote best model, deprecate other)

**Metrics Dashboard**:
```
Claude Sonnet 4.5:
- Avg insight quality: 4.2/5
- Cost: $0.42/insight
- Click-through: 65%
- Outcome accuracy: 73%

GPT-4 Turbo:
- Avg insight quality: 4.1/5
- Cost: $0.67/insight
- Click-through: 62%
- Outcome accuracy: 71%
```

**Definition of Done**:
- [ ] Experiment running for 50% of users
- [ ] All metrics logging correctly
- [ ] Winner determined after 2-week test
- [ ] Documentation: how to run future A/B tests

---

## EPIC 3: Smart Trade Notes

### Issue #301: Notes Editor Enhancement & Sentiment Tagging
**Label**: `epic/smart-notes`, `ui`, `frontend`, `ai`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 8

**Description**:
Enhance trade notes textarea with AI sentiment detection and tagging.

**Acceptance Criteria**:
- [ ] When user enters notes (>20 chars), show "Analyzing..." briefly
- [ ] Use Mixtral 8x7B to classify sentiment: FOMO, disciplined, revenge_trading, uncertain, confident
- [ ] Display sentiment tag below textarea (auto-update as user types)
- [ ] Save sentiment tag with trade in database
- [ ] Add filter on home page: view trades by sentiment
- [ ] Historical view: chart sentiment over time (pie chart: % by type)
- [ ] No sentiment = skip tagging (show nothing)
- [ ] Optional: visual indicator (red emoji for FOMO, green for disciplined, etc.)

**Example**:
```
User enters: "Got excited about NVDA after earnings and bought too many
contracts. Felt FOMO kicking in. Should have scaled in more carefully."
→ Detected sentiment: FOMO (92% confidence)
→ Display: 🔴 FOMO badge
```

**Model Usage**:
```typescript
// Mixtral is 7.5x cheaper than Claude, perfect for classification
const response = await openrouter.post("/chat/completions", {
  model: "mistralai/mixtral-8x7b",
  messages: [{
    role: "user",
    content: `Classify sentiment: "${notes}". Return JSON: {sentiment, confidence}`
  }],
  temperature: 0.3, // Low temp = consistent classification
});
```

**Technical Details**:
- Add `sentiment` enum field to [shared/schema.ts](shared/schema.ts) Trade interface
- Update [new-trade-form.tsx](client/src/components/new-trade-form.tsx) to show tag
- Fetch from `POST /api/ai/sentiment` (new endpoint)

**Definition of Done**:
- [ ] Sentiment detected correctly for test notes
- [ ] No false positives (accurate classification)
- [ ] UI responsive, no jank
- [ ] Mobile friendly

---

### Issue #302: Pattern Matcher Service
**Label**: `epic/smart-notes`, `backend`, `ai`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 8

**Description**:
Build service that finds similar historical trades and warns if current trade matches negative patterns.

**Acceptance Criteria**:
- [ ] When user saves trade, query similar past trades instantly
- [ ] If trade matches a losing pattern, suggest warning:
  - "Similar TSLA puts lost 45% avg in Jan"
  - "You've tried this strategy 12x: 3 wins, 9 losses"
- [ ] Display warning as yellow Alert component above trade details
- [ ] Warning includes historical P&L distribution
- [ ] User can dismiss warning (stored in preferences)
- [ ] Only show warning if confidence > 70%
- [ ] Similarity based on: ticker, strategy, entry price range, IV rank (if available)

**Technical Details**:
- Query trades: same ticker + strategy, closed status
- Calculate P&L distribution
- Use Mixtral for pattern narrative
- Run on trade creation in [server/routes.ts](server/routes.ts) POST /trades

**Definition of Done**:
- [ ] Warnings shown for matching historical patterns
- [ ] No false alarms (accuracy > 80%)
- [ ] Alert dismissible, preference stored
- [ ] Performance < 500ms

---

### Issue #303: Voice-to-Text Integration
**Label**: `epic/smart-notes`, `ui`, `frontend`, `ai`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 5

**Description**:
Add voice recording button to notes field for quick trade journaling.

**Acceptance Criteria**:
- [ ] Microphone icon button next to notes textarea
- [ ] Click to start recording, click to stop
- [ ] Transcribe using OpenRouter Whisper API
- [ ] Display transcribed text inline with notes
- [ ] Allow user to edit transcription before saving
- [ ] Mobile: request microphone permissions gracefully
- [ ] Desktop: check browser support, fallback if unavailable
- [ ] Cancel button to discard recording

**Technical Details**:
- Use browser's MediaRecorder API for recording
- Send audio file to OpenRouter Whisper endpoint
- Append transcribed text to notes field
- Create POST `/api/ai/transcribe` endpoint

**Definition of Done**:
- [ ] Voice recording works on Chrome, Safari, Firefox
- [ ] Transcription accurate (>90% WER - Word Error Rate)
- [ ] Mobile microphone permissions handled
- [ ] Performance acceptable (<3s transcription time)

---

### Issue #304: Risk Warning System
**Label**: `epic/smart-notes`, `backend`, `ai`, `p1`  
**Milestone**: AI Integration Phase 2  
**Estimated Points**: 5

**Description**:
Detect extreme position sizing and warn users before committing trades.

**Acceptance Criteria**:
- [ ] When trade quantity > 2x user's historical average, show warning
- [ ] When trade quantity > 5, show "Large position" warning
- [ ] When max_loss > 20% of account size (estimated), warn
- [ ] Warning includes: "Your avg position is X, this is Y"
- [ ] User must click "Confirm" to override warning
- [ ] Track overridden warnings (learning signal for model)
- [ ] Configurable thresholds in settings page

**Example**:
```
User normally trades 2-3 contracts, enters 10 contracts
→ Alert: "⚠️ Large position - 4.3x your average. 
   Confirm to proceed or adjust quantity."
```

**Definition of Done**:
- [ ] Warnings trigger correctly for edge cases
- [ ] Confirmation required, not dismissible
- [ ] No false positives (don't warn on normal positions)

---

## EPIC 4: Exit Strategy Advisor

### Issue #401: Historical Trade Similarity Algorithm
**Label**: `epic/exit`, `backend`, `ai`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 8

**Description**:
Build algorithm to find trades similar to user's open positions for exit strategy recommendations.

**Acceptance Criteria**:
- [ ] For each open trade, find 10-20 similar closed trades
- [ ] Similarity factors:
  - Same ticker (50% weight)
  - Same strategy (30% weight)
  - Entry price within 10% (15% weight)
  - Similar market conditions (5% weight - IV rank if available)
- [ ] Return sorted by similarity score (0-100)
- [ ] Include each similar trade's outcome: entry/exit price, days held, P&L, P&L%
- [ ] Calculate statistics from similar trades:
  - Avg P&L, median P&L, P&L distribution
  - Avg hold time before profit-taking
  - Avg hold time before stopping out
  - Win rate of similar trades

**Technical Details**:
- Query [storage.ts](server/storage.ts) for closed trades
- Scoring algorithm: weighted sum of factors
- Cache results per open trade (invalidate on new trade added)

**Definition of Done**:
- [ ] Similar trades found are actually similar (validate manually)
- [ ] Statistics calculated correctly
- [ ] Performance acceptable (<1s per open trade)

---

### Issue #402: Exit Scenario Generator
**Label**: `epic/exit`, `backend`, `ai`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 10

**Description**:
Use Claude Sonnet to generate 3-5 exit scenarios based on historical data and current price.

**Acceptance Criteria**:
- [ ] For each open trade, generate exit scenarios:
  1. **Conservative**: Exit at 50% of max profit (success rate %, expected value)
  2. **Balanced**: Exit at your historical sweet spot (based on Issue #401 data)
  3. **Aggressive**: Hold for max profit or 90% max profit (upside %, downside risk)
  4. **Trailing**: Use trailing stop at 20% below high (max loss scenario)
- [ ] Each scenario includes:
  - Target exit price
  - Expected hold time (from similar trades)
  - Probability of success (win rate of similar exits)
  - Expected value (E[V] = P × Payoff - (1-P) × MaxLoss)
- [ ] Use Claude Sonnet to generate narrative explanation:
  - "Conservative: Most traders close at 50% profit here. Lower risk, consistent wins."
- [ ] Rank scenarios by expected value

**Model Prompt**:
```
User's open trade: NVDA Bull Call Spread $1500 max profit
Similar past trades show:
- 60% exit at +$750 (50% profit)
- 25% exit at +$1400 (93% profit)
- 15% take max loss

Recommend top 3 exit strategies with reasoning.
```

**Definition of Done**:
- [ ] Scenarios generated for sample open trade
- [ ] Expected value calculations verified
- [ ] Narrative explanations are clear and actionable
- [ ] Rankings make sense (reflect actual historical data)

---

### Issue #403: Exit Advisor UI Panel
**Label**: `epic/exit`, `ui`, `frontend`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 8

**Description**:
Add "Exit Scenarios" collapsible panel to open trade cards showing AI recommendations.

**Acceptance Criteria**:
- [ ] On [compact-trade-card.tsx](client/src/components/compact-trade-card.tsx), add button: "Exit Options"
- [ ] Click opens modal/sheet showing 3-5 scenarios in cards:
  - Card for each scenario: target price, hold time, success rate, EV
  - Visual: bar chart showing P&L distribution of similar trades
  - "Why this scenario?" button expands explanation
- [ ] Add one-click actions:
  - "Set profit target" → triggers limit order (or saves as reminder)
  - "Set stop loss" → triggers stop loss (or saves as reminder)
- [ ] Show "Last updated: 2 hours ago" with refresh button
- [ ] Mobile: full-screen sheet instead of modal
- [ ] If no similar trades found, show: "More data needed (need 10+ similar trades)"

**Technical Details**:
- Fetch from `GET /api/trades/{id}/exit-scenarios` (new endpoint)
- Cache scenario data (regenerate every 4 hours)
- Use Chart.js or Recharts for P&L distribution visualization

**Definition of Done**:
- [ ] Scenarios display correctly on trade card
- [ ] Charts render correctly (no jank)
- [ ] Mobile responsive
- [ ] One-click actions work (orders/reminders created)

---

### Issue #404: Real-time Market Data Integration
**Label**: `epic/exit`, `backend`, `api`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 5

**Description**:
Integrate current market prices into exit scenario recommendations.

**Acceptance Criteria**:
- [ ] On exit advisor load, fetch current stock/option price from Alpha Vantage
- [ ] For each scenario, calculate:
  - Current unrealized P&L vs scenario profit target
  - "You're at 30% of max profit, +$450. Conservative exit at 50% = +$750"
  - Days elapsed since entry (for time-based decisions)
- [ ] Show "Last price: $XYZ at 2:15 PM"
- [ ] Update price every 60 seconds (for active viewing)
- [ ] Show price change indicator (↑ green, ↓ red)
- [ ] Cache prices per ticker (don't hammer API)

**Technical Details**:
- Reuse [alpha-vantage.ts](server/alpha-vantage.ts) integration
- Add endpoint: `GET /api/quotes/{ticker}` for frontend
- Real-time: WebSocket optional (Phase 2 enhancement)

**Definition of Done**:
- [ ] Current prices displayed correctly
- [ ] Prices update in real-time
- [ ] No API rate limiting issues
- [ ] Mobile performance acceptable

---

## EPIC 5: Community Insights Layer

### Issue #501: Community Statistics Aggregation Service
**Label**: `epic/community`, `backend`, `ai`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 10

**Description**:
Build scheduled service that aggregates anonymous trading patterns across all users.

**Acceptance Criteria**:
- [ ] Daily job aggregates statistics from all shared trades:
  - Total trades analyzed
  - Win rate by strategy
  - Win rate by ticker
  - Avg P&L by strategy
  - Most popular strategy this week
  - Most profitable strategy this week
  - Volatility-adjusted rankings (control for IV spikes)
- [ ] Anonymize: no user identification, only aggregate stats
- [ ] Store snapshots in `community_insights` table (date, strategy, stats)
- [ ] Detect trends:
  - "Iron condors +45% more popular vs last week"
  - "Bull call spreads avg profit down 12% (IV contraction)"
- [ ] Handle edge cases:
  - Ignore users with <5 trades (too noisy)
  - Exclude obvious outliers (1000% winner = probably data error)
  - Min sample size per strategy (need 50+ trades to publish stat)

**Technical Details**:
- Query all trades where `shared=true` and `status=CLOSED`
- Group by strategy, ticker, date
- Calculate: count, win_count, avg_pnl, median_pnl, stddev
- Store in `community_insights` table

**Definition of Done**:
- [ ] Aggregation runs successfully
- [ ] Statistics match manual spot-checks
- [ ] No user identifiable info leaked
- [ ] Performance acceptable (<30 min for 10k trades)

---

### Issue #502: Privacy & Anonymization Framework
**Label**: `epic/community`, `backend`, `security`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 8

**Description**:
Implement robust privacy controls to ensure community insights never expose individual users.

**Acceptance Criteria**:
- [ ] All public statistics anonymized (no usernames, avatars, or IDs)
- [ ] Minimum aggregation thresholds:
  - Don't publish stat if <20 users contributed
  - Don't publish if one user dominates >30% of sample
- [ ] Salt/hash any user data before aggregation
- [ ] Audit logging: who accessed community insights, when
- [ ] Privacy controls per user:
  - Toggle "Opt-out of community analysis" (respects immediately)
  - View "Your contribution to community insights" (transparency)
  - Download your data (GDPR/CCPA compliance)
- [ ] No linkage: can't reverse-engineer individual trades from published insights
- [ ] Regular audit: verify no leakage (run monthly)

**Technical Details**:
- Add `opt_out_community` boolean to users table
- Hash user_id before aggregation: `sha256(user_id + salt)`
- Store anonymization log for audit trail
- Create privacy policy section in README

**Definition of Done**:
- [ ] Community insights published without any user identification
- [ ] Audit log tracks all data access
- [ ] Opt-out toggle works (user data excluded)
- [ ] Security review passed (third-party if possible)

---

### Issue #503: Community Insights Generator
**Label**: `epic/community`, `backend`, `ai`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 8

**Description**:
Use OpenRouter GPT-4 Turbo to generate narrative insights from community statistics.

**Acceptance Criteria**:
- [ ] Input: aggregated community stats + recent trend data
- [ ] Output: markdown-formatted insights like:
  - "Iron condors on $SPY are currently 2.3x more popular than historical average"
  - "Community members with 60%+ win rates favor bull put spreads when IV < 30"
  - "Best trading hour: 10-11 AM EST (62% win rate average)"
  - "Tech sector outperforming energy this week: +15% avg vs -8% avg"
- [ ] Insights include caveats:
  - "Based on X traders' data"
  - "Historical comparison: [link to time series]"
- [ ] Filter insights by: bull market, sideways market, bear market context
- [ ] Refresh daily at 4 PM UTC (after market close)
- [ ] Store insights with metadata: generated_at, confidence, supporting_data

**Model Prompt**:
```
Analyze this community trading data and generate 5 actionable insights:

Statistics:
- Iron Condors: 58% win rate (up 23% vs last week), 312 trades
- Bull Call Spreads: 52% win rate, 185 trades
- Best hour: 10-11 AM EST (64% win rate)

Generate JSON: [{title, insight, confidence, supporting_data}]
```

**Definition of Done**:
- [ ] Insights generated correctly
- [ ] Insights are specific and data-driven
- [ ] Narratives are clear to non-technical traders
- [ ] Caveats prevent overconfidence

---

### Issue #504: Reporting & Distribution System
**Label**: `epic/community`, `ui`, `backend`, `p2`  
**Milestone**: AI Integration Phase 3  
**Estimated Points**: 8

**Description**:
Build community insights feed and optional weekly email digest.

**Acceptance Criteria**:
- [ ] New page: `/community/insights` showing:
  - Top 10 community insights (updated daily)
  - Filter by type: strategy trends, timing patterns, sector analysis
  - Time series: how has community strategy mix evolved
  - Compare to your trades: "Your iron condor performance vs community"
- [ ] Optional: "Weekly Digest" email (opt-in, sent Sunday 9 AM)
  - Top 5 insights from past week
  - Your personalized comparison
  - Unsubscribe link
- [ ] Engagement tracking:
  - Click-through on insights
  - "Save insight" (bookmark for later reference)
  - "Rate this insight" (thumbs up/down)
- [ ] Share insights:
  - Copy insight as markdown
  - Share to Twitter/LinkedIn
  - Embed in community forum posts

**Technical Details**:
- Create Community Insights feed component
- Email templates using existing email service (or SendGrid)
- Webhook for daily insight generation → email queue

**Definition of Done**:
- [ ] Community insights feed displays all insights
- [ ] Email digest sends correctly
- [ ] No spam (one per week, honored opt-out)
- [ ] Share functionality works
- [ ] Engagement metrics tracking

---

## EPIC 6: Progressive Enhancement & Monitoring

### Issue #601: Feature Flags & Opt-In System
**Label**: `epic/infrastructure`, `backend`, `frontend`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 8

**Description**:
Build feature flag system to control AI feature rollout and user opt-in toggles.

**Acceptance Criteria**:
- [ ] Feature flags for each AI epic (can enable/disable globally)
- [ ] User-level opt-in toggles:
  - [ ] AI Journal Assistant (default: opt-in prompt on first use)
  - [ ] Pattern Discovery (default: ON, can disable)
  - [ ] Smart Trade Notes (default: ON, can disable)
  - [ ] Exit Strategy Advisor (default: ON, can disable)
  - [ ] Community Insights (default: ON, can disable)
- [ ] Store in `user_preferences` table: `aiFeatures` JSON
- [ ] UI: Settings page → "AI Features" section with toggles
- [ ] Frontend: Check feature flag before rendering AI UI
- [ ] Backend: Skip AI processing if feature disabled for user
- [ ] All AI features show "Powered by AI ⚡" badge
- [ ] Help text: "This feature uses AI. [Learn more]"

**Technical Details**:
- Add to [shared/schema.ts](shared/schema.ts) User interface: `aiPreferences`
- Middleware: check flags before processing
- Feature flag service: easy to enable/disable without deploys

**Definition of Done**:
- [ ] All feature flags wired correctly
- [ ] UI toggles work and persist
- [ ] Backend respects user preferences
- [ ] "Powered by AI" badges display consistently

---

### Issue #602: Cost Tracking & Billing Integration
**Label**: `epic/infrastructure`, `backend`, `monitoring`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 5

**Description**:
Implement cost tracking across all AI features and prepare for billing integration.

**Acceptance Criteria**:
- [ ] Log every AI API call: cost, tokens, feature, user, timestamp
- [ ] Daily cost aggregation per user per feature
- [ ] Calculate monthly cost per user
- [ ] Database table: `ai_billing` (user_id, month, feature, cost)
- [ ] Free tier limit: $1/month per user (roughly 10 API calls)
- [ ] Premium tier: unlimited AI (priced $4.99-9.99/month or included in pro plan)
- [ ] Endpoint: `GET /api/billing/ai-costs` returns user's monthly breakdown
- [ ] Admin endpoint: `GET /api/admin/ai-billing` for revenue reporting
- [ ] Alert when user approaches free tier limit
- [ ] Never charge without opt-in (free tier always available, but feature-limited)

**Example Pricing Model**:
```
Free Tier:
- $1/month budget
- 10 AI queries
- Sentiment tagging only (cheapest Mixtral)

Premium Tier:
- Unlimited AI queries
- All features enabled
- $4.99/month or included in pro subscription
```

**Definition of Done**:
- [ ] Cost calculations accurate
- [ ] Billing data correct in database
- [ ] Alerts trigger before hitting limits
- [ ] Admin dashboard shows revenue trends

---

### Issue #603: Usage Analytics & Dashboard
**Label**: `epic/infrastructure`, `frontend`, `backend`, `monitoring`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 8

**Description**:
Build analytics dashboard for monitoring AI adoption and health.

**Acceptance Criteria**:
- [ ] User-level dashboard: Settings → AI Usage
  - Total queries this month
  - Cost breakdown by feature (pie chart)
  - Daily query count (line chart)
  - Remaining budget/quota
  - Most-used feature ranking
- [ ] Admin dashboard: `/admin/ai-analytics` showing:
  - Total queries across all users (daily trend)
  - Cost trend (daily spend)
  - Feature adoption (% of users using each feature)
  - Model performance (latency, error rate per model)
  - Top features by queries
  - Cohort analysis (new users vs returning)
- [ ] Real-time alerts:
  - High error rate detected
  - Unusual cost spike
  - API rate limiting triggered
- [ ] Export: CSV report of usage metrics

**Technical Details**:
- Query `ai_usage` table with time-based aggregations
- Use Recharts for visualizations
- Caching: aggregate stats daily (not real-time)

**Definition of Done**:
- [ ] Dashboards load quickly (<2s)
- [ ] Charts accurate (spot-checked against database)
- [ ] Alerts trigger correctly
- [ ] Export functionality works

---

### Issue #604: Error Handling & Fallback Strategies
**Label**: `epic/infrastructure`, `backend`, `frontend`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 8

**Description**:
Implement graceful degradation when AI APIs fail or are rate-limited.

**Acceptance Criteria**:
- [ ] Rate limit handling:
  - Detect OpenRouter 429 response
  - Show user-friendly message: "AI features temporarily busy. Try again in 60s."
  - Queue request for retry (if user patience)
  - Fallback to cached response if available
- [ ] Timeout handling:
  - 30s timeout on all OpenRouter calls
  - Return cached/default response on timeout
  - Log error for debugging
- [ ] API error responses:
  - Catch 4xx/5xx errors
  - Show: "AI feature unavailable. Feature works without AI."
  - Never crash the app
- [ ] Graceful degradation:
  - Chat Assistant unavailable? → Show: "Chat temporarily offline"
  - Pattern discovery fails? → Show: "Insights generating..."
  - Sentiment analysis fails? → Skip tagging, but allow trade entry
- [ ] Retry logic:
  - Exponential backoff: 1s, 2s, 4s, 8s, max 5 retries
  - Add jitter to prevent thundering herd
- [ ] Error logging:
  - All errors → server logs + Sentry (error tracking service)
  - Alert engineering team on sustained failures

**Technical Details**:
- Middleware for API calls with retry logic
- Global error boundary component
- Toast notifications for user-facing errors

**Definition of Done**:
- [ ] Rate limiting handled gracefully
- [ ] Timeouts don't crash app
- [ ] Errors logged and visible to team
- [ ] User experience not degraded when AI fails

---

### Issue #605: Model Versioning & Configuration
**Label**: `epic/infrastructure`, `backend`, `monitoring`, `p0`  
**Milestone**: AI Integration Phase 1  
**Estimated Points**: 5

**Description**:
Pin and manage model versions to prevent breaking changes from upstream.

**Acceptance Criteria**:
- [ ] Environment variables for model IDs:
  ```
  OPENROUTER_MODEL_CHAT=claude-sonnet-4.5
  OPENROUTER_MODEL_ANALYSIS=gpt-4-turbo
  OPENROUTER_MODEL_TAGGING=mixtral-8x7b
  OPENROUTER_MODEL_TRANSCRIBE=openai/whisper-1
  ```
- [ ] Version pinning: always use specific model version (not "latest")
  - Example: `claude-3-5-sonnet-20241022` (pinned date)
  - Not: `claude-sonnet` (could auto-update)
- [ ] Configuration file: `.env.ai` documents:
  - Model choices and why
  - Cost per model (updated quarterly)
  - Performance baselines (latency, accuracy)
  - Last tested date
  - Deprecation timeline (when to swap models)
- [ ] Update process:
  - Manual review before updating models
  - A/B test new model vs current for 1 week
  - Roll out gradually (10% → 50% → 100%)
- [ ] Fallback chain: if primary model unavailable, try alternative

**Definition of Done**:
- [ ] Model versions pinned in code
- [ ] Configuration documented
- [ ] Update process defined
- [ ] Fallbacks working

---

## Issues Not Yet Detailed

The following issues would follow same format, created as team discusses:

- **#701-704**: Integrations (Slack bot, Discord bot, API for third-party apps, Zapier)
- **#801-803**: Analytics enrichment (predictability scoring, edge detection algorithm)
- **#901-905**: Advanced features (collaborative trading journals, mentor matching, strategy marketplace)

---

## How to Use This Document

1. **Copy issues into GitHub**: Each issue block above can be copy-pasted into GitHub as a new issue
2. **Set labels & milestone**: Apply labels and milestone as shown
3. **Assign points**: Use the estimated story points for sprint planning
4. **Link to epic**: Mark each issue with the epic label so GitHub's project view groups them
5. **Create milestones**: Create GitHub milestones for "AI Integration Phase 1/2/3"
6. **A/B test plan**: Coordinate with engineering on model selection A/B tests

---

## Reference: OpenRouter Model Recommendations

| Use Case | Recommended Model | Why | Cost Tier |
|----------|-------------------|-----|-----------|
| **Conversational Q&A** | Claude Sonnet 4.5 | Best reasoning, long context, stable | $$$ |
| **Batch Analysis** | GPT-4 Turbo | Throughput optimized, fast | $$$ |
| **Classification** | Mixtral 8x7B | 7.5x cheaper, MoE efficiency | $ |
| **Coding** | Claude Opus 4.5 | Best code generation | $$$$ |
| **Summarization** | Llama 2 70B | Good quality, moderate cost | $$ |
| **Embedding** | sentence-transformers (local) | Free if self-hosted | Free |
| **Transcription** | Whisper API | Accurate, standard tool | $ |

*Source: OpenRouter.ai model catalog, as of Jan 2026*

