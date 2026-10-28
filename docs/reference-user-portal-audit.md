# Reference User Portal Audit & Route Mapping Matrix

This document provides a comprehensive structural audit of the reference member portal (`https://rozgar-egg-point.pk/user`) and maps every reference route to its corresponding implementation in **GrowMeta Egg** (`D:\pak_hen\pakhen\pakhen`).

---

## 1. Complete Route Inventory & Mapping Table

| Reference Page | Reference Route | GrowMeta Route | Layout Structure | Data & Business Features | Interactions & UX | Required Work |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Home** | `/user/index` | `/dashboard` | Sidebar + Centered Header + 3 Summary Cards + 2 Action Banners + Referral + Pending + 1/2 WhatsApp + 10 Quick Access Emblems + Daily Harvest Nest + 7 Farm Stats + Footer + Floating Bottom Dock | Active hens, Available eggs balance, Referral bonus, Total investment, Sold eggs, Total paid, Recent activity, Notifications | Quick Access hover bounce, daily collection progress bar, WhatsApp links, copy referral button, bottom dock navigation | ✅ Completed high-fidelity 3D emblem integration, peeking mascots, amber timer box |
| **My Hens / My Plans** | `/user/packages` | `/dashboard/hens` | Inner Top Bar + Secondary Header + Large Hero Card (`MY ACTIVE FARM`) + 4 Summary Cards + Running Flocks Section + 3-Step Collection Schedule + Bottom Dock | Active hen assets, daily egg accrual rates, production date windows, remaining days, total maximum eggs | Count-up animations, plan expansion, empty state card with CTA, "Add more hens" action | Rebuild `/dashboard/hens` from raw table into 4-card summary + populated running flock cards + collection schedule |
| **Buy Hens** | `/user/package/buy` | `/dashboard/plans` | Inner Top Bar + Back Button + Purchase Hero (`GROWMETA HEN MARKET`) + 3-Step Progress Flow (Quantity ➔ Method ➔ Details) + Plan Cards + Quantity Stepper + Dynamic Discount Matrix + Payment Selection | Hen plans, price per hen (Rs 750 / configured), daily eggs, validity days, quantity discount tiers, referral discounts, Paybost & manual payment methods | 3-step active progression, spring quantity adjuster, dynamic total recalculation, payment method selection, proof upload | Rebuild `/dashboard/plans` into wide image-led multi-step purchasing flow |
| **Sell Eggs** | `/user/withdraw` | `/dashboard/sell-eggs` | Inner Top Bar + Large Egg Balance Hero + Quantity Input + Price Calculation & Fees Breakdown + Payout Method Selector + Review Confirmation Step | Current egg balance, active egg rate per egg, processing fee, estimated PKR payout, active user payout methods | Live price calculation, input validation, payout method radio selection, submission modal | Rebuild `/dashboard/sell-eggs` from plain checklist into reference multi-step egg trading flow |
| **Profile & Support** | `/user/profile` | `/dashboard/profile` | Inner Top Bar + Farmer Profile Hero + Account Details + Referral Link + Security & Password Controls + 2×2 WhatsApp Support Grid | Username, phone, referral code, role, status, last login, saved accounts | Password visibility toggle, copy referral code, WhatsApp direct launch, logout confirmation | Rebuild `/dashboard/profile` into card-based profile with security controls & support channels |
| **Orders & Invoices** | `/user/orders` | `/dashboard/orders` | Inner Top Bar + Filter Tabs (All, Pending, Approved) + Order Cards with Status Badges + Proof Viewer | Purchase orders, order references, total amounts, timestamps, payment proof URLs | Proof thumbnail zoom, re-upload proof, pay online redirect | Polish orders layout with reference-style status cards |
| **Egg Sales Ledger** | `/user/history` | `/dashboard/egg-sales` | Inner Top Bar + Status Summary + Sales Request Cards | Egg sale requests, egg quantities, total PKR amount, review status | View payout details, cancel pending request | Polish sales history cards |
| **Referrals & Team** | `/user/referral` | `/dashboard/referrals` | Inner Top Bar + Referral Link Card + Reward Summary + Member Tree / Table | Direct invitees, earned referral eggs, commission tiers (Rs 100 / 20%) | One-click copy, WhatsApp share, team member search | Align referral cards & earnings summary |

---

## 2. Design System & Structural Tokens

### A. Dimensions & Proportions
- **Max Content Width**: `1280px` (`max-w-7xl`) for desktop portal layout.
- **Inner Header Height**: `68px` desktop, `60px` mobile, sticky/elevated with rounded bottom corners.
- **Top Row Summary Cards**: Min-height `160px` with 3-column desktop layout (`grid-cols-1 md:grid-cols-3`).
- **Quick Access Grid**: 2 rows of 5 circular emblems on desktop (`grid-cols-5`), 3 columns on mobile (`grid-cols-3`).
- **Daily Egg Collection**: Height `160–180px` with left 3D egg nest and right nested amber countdown box (`w-72`).
- **Farm Performance Stats**: 7 elongated cards in responsive 4-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

### B. Color Palette by Role
- **Base Canvas (Warm Porcelain)**: `#FFFDF4` to `#F4E8D2`
- **Surface Cards (Warm Cream)**: `#FFFDF4` with border `#D8793F]/25`
- **Hero & Dominant Navy Cards**: `linear-gradient(135deg, #09263A 0%, #061A2B 100%)`
- **Burnished Copper (Primary Action)**: `linear-gradient(180deg, #F59B52 0%, #D8793F 100%)`, `#8C3A14` shadow
- **Mint / Agricultural Green**: `#134E4A` / `#2D9B78` / `#A7F3D0`
- **Amber Timer Box**: `linear-gradient(to bottom, #FEF3C7, #FDE68A)` with border `#F59E0B]/40`
- **Primary Text**: `#17372F` (Deep Forest Charcoal)
- **Muted Text**: `#566D7E` (Slate Blue)

### C. Shadows & Bevels
- **Card Bevel Shadows**: `box-shadow: 0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.2)`
- **Button Offset Shadows**: `box-shadow: 0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.3)`
- **Dominant Navy Shadows**: `box-shadow: 0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A`

### D. Navigation Hierarchy
- **Desktop**: Left fixed navigation sidebar on Dashboard + Centered top navigation header on inner portal pages.
- **Mobile**: Floating bottom capsule dock with circular elevated 3D hen mascot center button (`Home`, `Hens`, `Sell Eggs`).

---

## 3. Motion & Animation Tokens
- **Route Crossfade**: `200ms ease-out` with 6px upward slide (`animate-in fade-in slide-in-from-bottom-2 duration-200`).
- **Card Hover**: `translate-y-[-2px]` with `scale-[1.01]` and smooth shadow deepening.
- **Button Interactions**: `active:translate-y-[1px]` with `hover:brightness-105`.
- **Count-Up Transitions**: Numbers transition smoothly on initial client mount.
- **Accessibility**: Full `@media (prefers-reduced-motion: reduce)` support with `transition-none` fallback.
