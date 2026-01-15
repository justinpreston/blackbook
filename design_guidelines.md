# BlackBook Trading Journal - Design Guidelines

## Design Approach
**Hybrid System-Based with Creative Flair**: Using shadcn/ui component library as the foundation (per user request) while incorporating modern fintech aesthetics inspired by Robinhood's approachability and Linear's refined execution. The design balances professional trading credibility with social engagement features.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent for numbers
- **Headings**: Font weights 700-800, sizes from text-3xl (dashboard headers) to text-lg (card titles)
- **Body Text**: Font weight 400-500, text-sm to text-base for descriptions and metadata
- **Numerical Data**: Font weight 600, tabular-nums for aligned figures, text-2xl for P&L displays
- **Strategy Badges**: Font weight 600, text-xs uppercase with tracking-wide

### Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 consistently
- Card padding: p-6
- Section spacing: gap-8 between major sections, gap-4 within components
- Grid gaps: gap-6 for card grids, gap-3 for form inputs
- Margins: mb-8 for section headers, mb-4 for subsections

### Component Library

**Navigation**
- Top navigation bar: h-16, sticky positioning
- Logo + app name on left, user profile/menu on right
- Desktop: horizontal menu items with gap-8
- Mobile: hamburger menu with slide-in drawer

**Trade Cards** (Primary Component)
- Base card: rounded-xl border with shadow-sm
- Header: flex justify-between with strategy badge and timestamp
- P&L Display: Large numerical value with +/- indicator
- Ticker/Strike: text-lg font-semibold
- Multi-leg Display: Collapsible accordion (closed by default), each leg indented with pl-4
- Footer: flex items-center gap-4 for social actions (like, comment counts)
- Card states: default, hover (subtle shadow-md transition), loading skeleton

**Dashboard Stats Grid**
- 3-column grid on desktop (grid-cols-3), single column mobile
- Stat cards: p-6, centered content
- Icon at top (h-12 w-12), large number (text-4xl font-bold), label below (text-sm)

**Trade Feed**
- Infinite scroll container with max-w-4xl mx-auto
- Filter tabs: sticky top-16, horizontal scroll on mobile
- Card grid: grid-cols-1 gap-6, maintains single column for content focus

**Forms & Inputs**
- Input fields: h-10, rounded-md with border
- Labels: text-sm font-medium mb-2
- Multi-step form for complex strategies: progress indicator at top
- Dropdown selects for strategy type with emoji prefixes
- Number inputs with step controls for strikes/quantities

**Modals & Overlays**
- Centered modal: max-w-2xl, rounded-xl
- Backdrop: backdrop-blur-sm
- Trade detail modal: full trade info, comment thread, related metrics
- Confetti overlay: full viewport, pointer-events-none, auto-dismisses after 3s

**Performance Dashboard**
- Chart container: aspect-video for responsiveness
- Metrics row: grid-cols-4 on desktop, grid-cols-2 on mobile
- Best/Worst trades: horizontal scrollable carousel on mobile

**Social Elements**
- Like button: ghost variant, heart icon with count
- Comment section: nested with pl-8 for replies, avatar + username + timestamp header
- Share button: opens native share sheet on mobile

### Animations
**Minimal, Purposeful Motion**
- Card hover: transform scale-105 transition-transform duration-200
- Confetti: Only on trade post success, brief celebration
- Loading states: Simple pulse animation on skeleton cards
- Tab transitions: Slide indicator underneath active tab
- NO scroll-triggered animations, NO parallax effects

### Layout Patterns

**Dashboard View**
- Stats grid at top (full width)
- Two-column below: 2/3 chart area, 1/3 recent activity sidebar on desktop
- Mobile: stack vertically

**Feed View**
- Centered single-column feed, max-w-4xl
- Sticky filter bar below navigation
- Floating action button (bottom-right) for "New Trade" on mobile

**Trade Detail**
- Modal overlay for quick view
- Full page on mobile with back button
- Strategy diagram/visualization at top for multi-leg trades
- Chronological comment thread below

## Images
**No hero image required** - This is a utility application focused on data and functionality. Use gradient backgrounds or solid fills for visual interest instead. Strategy diagrams can use SVG visualizations showing profit/loss curves for educational value within trade cards.