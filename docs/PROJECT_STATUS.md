# 🎯 Project Status

**Last updated:** 2026-11-09

**Where we are:** Phases 1–4 of the 8-phase [roadmap](ROADMAP.md) are built and
working — roughly half the project. The whole order path (browse → cart →
checkout → live tracking → hostel-room delivery) runs end to end on
cash-on-delivery.

---

## ✅ What's built and working

### Authentication & access — Phase 1 (upgraded beyond the original plan)
The original plan was simple "register and pick a role." Real deployment needed
controlled access, so this grew into:
- **Three sign-in doors** — student, partner (owner/staff), and platform admin — each rejecting the wrong audience
- **Invite provisioning** — the admin creates canteens and provisions owners; owners invite/manage their own staff
- **Immediate session revocation** — accounts deactivated by an admin or owner are locked out instantly on their next request
- **Role-aware password recovery** — preserves door context and directs users to their appropriate portal upon reset
- **Real-time verification sync & auto-login** — email verification link logs user in instantly; tab focus sync clears unverified status live without refresh
- **Email rate limiting** — 60-second cooldown protects SMTP services with real-time UI countdown timers
- **Password visibility toggles** — interactive Eye/Eye-off controls on password fields
- **Owner vs staff split** — owners run their own canteen; staff are scoped to it
- **Per-staff powers** — duties (kitchen / delivery) and permissions (e.g. `manage_menu`)
- Email verification, JWT (7-day duration), password reset, protected routes

### Canteens & menu — Phase 2
- Canteen listing + detail pages
- Menu browsing with category and veg/non-veg filters
- Full menu management (add / edit / delete) for owners and permitted staff
- Availability toggle (in / out of stock)
- **Image upload to S3** — AWS S3 (Hyderabad ap-south-2) direct upload with UUID keys for canteens and menu items.

### Cart & ordering — Phase 3
- Cart with quantity management, boundary limits (max 50), trash cues, and localStorage persistence
- Dish thumbnail previews in Cart review and seamless "+ Add more dishes" canteen return link
- Sticky floating bottom cart bar on `/canteens/[id]` displaying item count, subtotal, and 1-tap checkout
- Checkout with hostel block + room delivery address, rapid-submission race guard, and profile auto-sync
- Cash-on-delivery
- Real-time Socket.io events with delivery PIN stripped from canteen room broadcasts
- 6-Digit Order ID generation space (`ORD-YYYYMMDD-XXXXXX`) eliminating MongoDB duplicate key collisions
- Live menu validation on Cart review (auto-syncs prices, highlights sold-out dishes, blocks invalid checkouts)
- Input boundary hardening (`max: 50` chars for block/room, phantom canteen lockout guard, guest cart adoption)
- Checkout operating hours guard (alerts and blocks submission if canteen is closed or offline)
- Multi-tab real-time cart synchronization and safe re-order availability review
- Accidental cart wipeout confirmation guard, delivery contact phone preview, and live kitchen notes counter

### Order tracking & staff dashboard — Phase 4
- Full status lifecycle: pending → confirmed → preparing → ready → out for delivery → delivered (+ cancelled)
- Live updates over Socket.io with student/canteen room segregation
- Student "my orders" + order detail / live tracking
- Staff live order-book dashboard with station/stage filtering (All Active, New, Cooking, Dispatch)
- Student contact identification & direct 1-tap `tel:` phone call link for campus runners
- Accidental cancellation safety guard with structured cancellation reasons on staff dashboard
- Intelligent baseline ETA calculation on backend with quick adjustment chips (+10m, +20m) on kitchen cards
- Live arrival countdown badge on student tracking page (`🕒 Arriving in ~25 mins`)
- Elevated delivery handover PIN pulse and runner arrival banner for `out_for_delivery`
- Canteen `totalOrders` counter atomic increment and BSON type-safe rating aggregation

### Analytics & Canteen Owner Dashboard — Phase 5
- Midnight-aligned campus date partitioning (`Asia/Kolkata` UTC+5:30)
- Realized vs. in-flight revenue segregation
- Order prep time outlier clamping (1–180 minutes)
- Peak 24-hour hourly order demand distribution
- Top-selling menu items by revenue and quantity
- Blob-based CSV financial export with Excel UTF-8 BOM (`\uFEFF`)
- 60-second real-time auto-polling

### Polish, Performance & Security — Phase 6
- Kitchen audio chime & background tab alert (Web Audio API)
- 1-Click Reorder & order history filters/search
- 5-Star post-delivery rating system with dynamic canteen score aggregation
- Headless PWA lifecycle & discreet Add-to-Home-Screen header/profile triggers
- User-scoped Cart Vault (isolated persistent carts per student account)
- Compound B-tree database indexing & `.lean()` query optimizations
- Multi-tier rate limiting (Global 150 req/min, Auth 15 attempts/15min, Email 5 req/hr)
- NoSQL injection recursive operator stripping middleware
- Production-tuned Helmet security headers (HSTS, nosniff, SAMEORIGIN, CORP)

### Production Deployment & Operations — Phase 8
- AWS EC2 production backend (`16.113.19.64`, ap-south-2 Hyderabad)
- Domain & SSL: `https://campusfood.duckdns.org` (Let's Encrypt / Certbot timer active)
- Vercel production frontend: `https://campus-food-lime.vercel.app` (CI/CD active)
- Reliability & monitoring: PM2 daemon with `pm2-logrotate`, 1GB swapfile, `/health` probe
- Verified superadmin access (`anuraganand.sru@gmail.com` & `kpranjal2222@gmail.com`)

---

## 📋 Scope Status

| Phase | What it covers | Status |
|---|---|---|
| 1. Authentication & Access | 3-door sign-in, verification, session security | ✅ Complete |
| 2. Canteens & Menu | Canteen management, menu CRUD, S3 upload | ✅ Complete |
| 3. Cart & Ordering | Multi-item cart, live checkout, boundary validation | ✅ Complete |
| 4. Order Tracking & Staff | Real-time tracking, live kitchen dashboard, PIN | ✅ Complete |
| 5. Analytics & Owner Reports | Financial KPIs, charts, CSV export, auto-polling | ✅ Complete |
| 6. Polish, Performance & Security | PWA, audio chime, rate-limiting, NoSQL sanitizer | ✅ Complete |
| 7. Payment | Online payment (Razorpay) — COD active; deferred | ⏸️ Deferred |
| 8. Deployment & Handover | AWS EC2, Vercel, SSL, PM2, swap, superadmins | ✅ Complete |

---

## Tech stack

**Frontend:** Next.js 16, TypeScript, Tailwind v4, Zustand, React Query, Socket.io client
**Backend:** Node.js, Express, TypeScript, MongoDB / Mongoose, JWT, Socket.io, Nodemailer
**Infra (planned):** MongoDB Atlas, Vercel (frontend), a Node host for the backend — TBD at deployment

## Design system

"Fresh emerald" — light & clean. Deep emerald accent (`#1b7a45`) + sun-yellow
highlight (`#ffc93c`) on soft green-tinted paper (`#f6f9f6`). Outfit (display) +
Inter (body). All tokens live in `frontend/app/globals.css`.

---

## Run it locally

```bash
# backend  → http://localhost:5000
cd backend && npm install && npm run dev

# frontend → http://localhost:3000
cd frontend && npm install && npm run dev

# seed demo data (2 canteens, owners, staff, demo students)
cd backend && npm run seed
```

Full setup (database, email, environment variables) is in
[SETUP.md](SETUP.md) and [../GET_STARTED.md](../GET_STARTED.md).
