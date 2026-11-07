# Development Roadmap

> ## 📊 Progress snapshot — updated 2026-10-13
>
> **Phases 1–4 are built and working; Phases 5–8 are not started** — roughly
> half the roadmap. The whole order path (browse → cart → checkout → live
> tracking → hostel-room delivery) works end to end on cash-on-delivery.
>
> | Phase | Status |
> |---|---|
> | 1. Foundation & Authentication | ✅ Done (upgraded — see note) |
> | 2. Canteen & Menu Management | ✅ Done |
> | 3. Cart & Order Placement | ✅ Done |
> | 4. Order Tracking & Management | ✅ Done |
> | 5. Analytics & Owner Dashboard | ✅ Done |
> | 6. Polish & Optimization | ✅ Done |
> | 7. Payment Integration | ⬜ Not started (deliberately last) |
> | 8. Deployment | 🟡 In progress (EC2 + Vercel live) |
>
> **Auth was upgraded beyond this plan.** The original Phase 1 assumed simple
> "register and pick a role." Real deployment needed controlled access, so it
> became: **three sign-in doors** (student / partner / admin), **admin-issued
> invite provisioning**, an **owner-vs-staff split**, and **per-staff powers**
> (duties: kitchen/delivery; permissions: e.g. `manage_menu`). These aren't in
> the checklists below — they replaced the naive auth.
>
> *The checklists below are now ticked to match what's actually built. A note in
> italics means an item is partial or changed from the original plan.*

## Phase 1: Foundation & Authentication (Week 1-2) — ✅ COMPLETE

### Backend
- [x] Project structure setup
- [x] Database models (User, Canteen, MenuItem, Order)
- [x] Middleware (auth, error handling)
- [x] Auth controllers
  - [x] Register with email verification
  - [x] Login with JWT
  - [x] Password reset flow
  - [x] Get current user
- [x] User profile management *(personal details, default hostel room & password change)*
- [x] Email service setup (Nodemailer)
- [x] Input validation (express-validator)

### Frontend
- [x] Next.js project setup
- [x] Authentication pages
  - [x] Login
  - [x] Register (with role selection) *(students self-register; owners/staff are invited instead)*
  - [x] Email verification
  - [x] Forgot/Reset password
- [x] Auth context/store (Zustand)
- [x] Protected route wrapper
- [x] API client setup (axios/fetch)

### Added beyond the original plan ✅
- [x] Three sign-in doors (student / partner / admin)
- [x] Invite-based provisioning (admin provisions owners; owners invite and manage staff)
- [x] Owner vs staff split
- [x] Per-staff powers — duties (kitchen/delivery) + permissions (e.g. `manage_menu`)
- [x] Owner self-service — owners edit their own canteen and invite / remove their own staff
- [x] Immediate session deactivation & role sync (`auth.middleware.ts` rejects deactivated accounts with HTTP 401 instantly)
- [x] Role-aware password recovery — preserves entry door context and routes resets cleanly by actual user role
- [x] Email resend rate-limiting (60s cooldown enforced on backend + live countdown buttons in UI)
- [x] Real-time window focus & tab-switching sync (`AuthSync` removes verification banner in real time without page reload)
- [x] Instant auto-login upon clicking email verification link
- [x] Password visibility toggles (Eye / Eye-off SVG icons) across all auth fields
- [x] Role-separated profile pages (removes student hostel delivery fields from admin/partner accounts)

### Testing
- [x] Manual end-to-end verification of registration, login, verification, and role-based guards *(Tested locally & on EC2/Vercel)*
- [ ] Automated unit & integration tests *(Jest/Supertest test suite planned for post-launch stabilization)*

---

## Phase 2: Canteen & Menu Management (Week 3-4) — ✅ COMPLETE

### Backend
- [x] Canteen controllers (CRUD)
- [x] Menu controllers (CRUD)
- [x] Image upload to S3 *(AWS S3 Hyderabad ap-south-2 with Multer streaming & UUID keys)*
- [x] Menu search and filtering *(done client-side on the browse page; no separate backend endpoint)*
- [x] Availability management

### Frontend
- [x] Home page (canteen listing)
- [x] Canteen detail page
- [x] Menu browsing with filters *(menu grouped by category; filters are client-side)*
  - [x] Category filter
  - [x] Veg/Non-veg filter
  - [x] Search functionality
- [x] Admin / management dashboard *(split into the admin console + an owner/staff menu screen)*
  - [x] Canteen management
  - [x] Menu item CRUD
  - [x] Image upload component *(ImageUploadField with drag & drop, preview, cloud upload)*
- [x] Availability toggle (in / out of stock)

### Added beyond the original plan ✅
- [x] Operating hours order guard (IST timeZone calculation blocks orders placed outside canteen open hours)
- [x] Temporarily offline store alert & ordering pause on `/canteens/[id]` when `isActive: false`
- [x] Staff quick search bar in `/dashboard/menu` for instant 2-keystroke stock toggling during peak hours
- [x] Explicit "Sold out" and "Closed" pills on dish cards in place of vanished Add button
- [x] Graceful image fallback for broken/slow CDN images to clean initial badges

### Testing
- [x] Manual end-to-end verification of menu CRUD, stock toggles, and S3 uploads *(Tested locally & on EC2/Vercel)*
- [ ] Automated unit & integration tests *(Planned for post-launch stabilization)*
- [x] Test image upload to S3 *(verified live upload to ap-south-2 & HTTP 200 public CDN fetch)*

---

## Phase 3: Cart & Order Placement (Week 5-6) — ✅ COMPLETE

### Backend
- [x] Order creation endpoint
- [x] Order validation
  - [x] Check item availability
  - [x] Calculate total amount
  - [x] Verify delivery address
- [x] Order retrieval (student's orders)
- [x] Real-time order notifications (Socket.io)

### Frontend
- [x] Cart functionality
  - [x] Add to cart
  - [x] Update quantity
  - [x] Remove from cart
  - [x] Cart persistence (localStorage)
- [x] Checkout page
  - [x] Review order
  - [x] Delivery address form *(hostel block + room number)*
  - [x] Special instructions
  - [x] Place order
- [x] Order confirmation page
- [x] Socket.io integration

### Added beyond the original plan ✅
- [x] Delivery handover PIN leak protection in Socket.io broadcasts (strips `deliveryPin` before broadcasting to canteen room)
- [x] Floating bottom cart pill on `/canteens/[id]` displaying item count, live subtotal, and 1-tap "View Cart →"
- [x] Dish thumbnail previews in Cart review page with fallback placeholder badges
- [x] Seamless "+ Add more dishes" return link on Cart page directly routing to the active canteen
- [x] Quantity stepper boundary guards (capped at 50 max per dish with toast warning; trash can `🗑️` delete icon at quantity 1)
- [x] Double-click and rapid-submission race condition lock (`placingRef`) during checkout
- [x] Delivery room auto-save to user profile (`[x] Save as default delivery address in profile`)
- [x] Order item deduplication and line consolidation on backend
- [x] 6-Digit Order ID space hardening (expands daily space to 900,000 to eliminate MongoDB duplicate key errors)
- [x] Live menu price & availability validation on Cart page (auto-syncs updated prices and alerts/blocks sold-out dishes)
- [x] Guest cart adoption priority upon student login (preserves active guest selections over stale vaults)
- [x] Phantom canteen ID guard (strictly nullifies `canteenId` when cart items are empty)
- [x] Delivery address & notes input boundary enforcement (`max: 50` chars for block/room, trimmed notes)
- [x] Live operating hours & offline store guard on Checkout page (prevents ordering when canteen closes)
- [x] Re-order live menu stock & availability review (redirects re-orders via Cart review before checkout)
- [x] Real-time multi-tab cart synchronization via window storage events
- [x] Accidental cart wipeout confirmation guard (`Clear cart` confirmation prompt)
- [x] Delivery contact phone preview with direct profile edit link at checkout
- [x] Kitchen notes live character counter (`{notes.length}/500`)

### Testing
- [ ] Test cart operations *(no automated tests yet — verified manually)*
- [ ] Test order placement flow
- [ ] Test real-time notifications

---

## Phase 4: Order Tracking & Management (Week 7-8) — ✅ COMPLETE

### Backend
- [x] Order status update endpoint
- [x] Get canteen orders (for staff)
- [x] Order cancellation *(endpoint open to student / staff / owner / admin)*
- [x] Real-time status broadcast
- [x] 4-Digit Delivery Handover PIN generation & verification *(prevents wrong pickup at hostel desk)*

### Frontend (Student)
- [x] My Orders page
- [x] Order detail/tracking page
- [x] Real-time status updates
- [x] Order cancellation *(cancel button on the order detail page; only while pending/confirmed)*
- [x] 4-Digit Handover PIN Card on tracking screen & PIN badge in order history

### Frontend (Staff Dashboard)
- [x] Incoming orders view
- [x] Order status management
- [x] Order details modal *(shown inline on the order card)*
- [x] Real-time new order alerts
- [x] Menu availability toggle
- [x] Delivery handover verification prompt *(numeric PIN check + Owner Emergency Override)*

### Added beyond the original plan ✅
- [x] Student contact identification & 1-tap `tel:` phone link on Staff dashboard and runner order cards
- [x] Accidental cancellation safety guard with structured cancellation reasons dropdown on staff order card
- [x] Intelligent baseline ETA computation on backend (`max(prepTime) + 15 min buffer`) stored at order creation
- [x] Quick ETA adjustment chips (`+10m`, `+20m`) on staff order cards for active rush hours
- [x] Live estimated delivery countdown badge on student tracking page (`🕒 Arriving in ~25 mins (by HH:MM)`)
- [x] Kitchen station / stage filtering on staff dashboard (`All Active`, `New / Incoming`, `Cooking`, `Ready / Delivery`) with live station counts
- [x] Robust socket listener race-condition guard on student tracking page (`updated._id === id || updated.orderId === order?.orderId`)
- [x] Elevated delivery handover PIN pulse and arrival banner when status transitions to `out_for_delivery`
- [x] Canteen `totalOrders` counter atomic increment on order placement
- [x] BSON ObjectId casting safety in rating aggregation pipeline
- [x] Order cancellation cache synchronization across order detail and order list queries

### Testing
- [ ] Test order status flow *(no automated tests yet — verified manually)*
- [ ] Test staff dashboard
- [ ] Test real-time updates

---

## Phase 5: Analytics & Owner Dashboard (Week 9-10) — ✅ COMPLETE

### Backend
- [x] Sales analytics endpoint (`/api/analytics/sales`)
- [x] Popular items endpoint (`/api/analytics/popular-items`)
- [x] Orders timeline (`/api/analytics/orders-timeline`)
- [x] Dashboard stats (`/api/analytics/dashboard`)

### Frontend (Owner Dashboard)
- [x] Sales overview & area chart
- [x] Popular items leaderboard
- [x] 24-hour kitchen demand graph
- [x] 7/14/30-day window switcher
- [x] CSV revenue report export

### Testing
- [ ] Test analytics calculations
- [ ] Test data visualization

---

## Phase 6: Polish & Optimization (Week 11-12) — ✅ COMPLETE

### Features
- [x] Kitchen audio chime & background tab alert (Web Audio API)
- [x] Order history filters (All, Active, Completed, Cancelled) & search
- [x] 1-Click Reorder flow
- [x] Favorite items (1-tap heart toggle on dishes + dedicated /favorites page)
- [x] Rating system (5-star reviews + dynamic canteen score aggregation)
- [x] PWA manifest and service worker (/sw.js)
- [x] Mobile Add-to-Home-Screen install prompt
- [x] Offline shell caching
- [x] User-scoped Cart Vault (isolated persistent carts per account)

### Performance
- [ ] Database query optimization
- [ ] Add Redis caching
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading

### Security
- [ ] Rate limiting
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Security headers

### Testing
- [ ] Load testing
- [ ] Security audit
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

---

## Phase 7: Payment Integration (Week 13-14) — ⬜ NOT STARTED (deliberately last)

### Backend
- [ ] Razorpay/Stripe integration
- [ ] Payment webhook handling
- [ ] Order payment status tracking
- [ ] Refund handling

### Frontend
- [ ] Payment gateway UI
- [ ] Payment success/failure pages
- [ ] Transaction history

### Testing
- [ ] Test payment flow
- [ ] Test webhook handling
- [ ] Test refund process

---

## Phase 8: Deployment (Week 15) — 🟡 IN PROGRESS

### Backend Deployment
- [x] AWS EC2 setup
- [x] Environment variables configuration
- [x] MongoDB Atlas setup
- [x] S3 bucket creation (AWS S3 ap-south-2 Hyderabad with direct Multer streaming)
- [x] SSL certificate (Let's Encrypt / Certbot)
- [x] Domain configuration (campusfood.duckdns.org)
- [ ] Monitoring setup

### Frontend Deployment
- [x] Vercel deployment (campus-food-lime.vercel.app)
- [x] Environment variables
- [ ] Custom domain setup
- [ ] Performance monitoring

### Final Testing
- [ ] Production smoke tests
- [ ] Performance testing
- [ ] User acceptance testing

---

## Future Enhancements

### V2 Features
- [ ] Group ordering
- [ ] Pre-order scheduling
- [ ] Loyalty points system
- [ ] Referral program
- [ ] Dietary preferences
- [ ] Allergen filtering
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Voice ordering
- [ ] Order history export

### Scaling
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Redis pub/sub for Socket.io
- [ ] CDN for static assets
- [ ] Database sharding
- [ ] Horizontal scaling

---

## Success Metrics

### Technical
- Page load time < 2s
- API response time < 200ms
- 99.9% uptime
- Zero critical security vulnerabilities

### Business
- 500+ active users in first month
- 100+ daily orders
- Average rating > 4.0
- < 5% order cancellation rate
