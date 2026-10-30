# 🎯 Project Status

**Last updated:** 2026-10-13

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
- **Invite provisioning** — the admin creates canteens and issues single-use invite links; an account stays inactive until the invitee accepts and sets a password
- **Owner vs staff split** — owners run their own canteen; staff are scoped to it
- **Per-staff powers** — duties (kitchen / delivery) and permissions (e.g. `manage_menu`)
- Email verification, JWT, password reset, protected routes

### Canteens & menu — Phase 2
- Canteen listing + detail pages
- Menu browsing with category and veg/non-veg filters
- Full menu management (add / edit / delete) for owners and permitted staff
- Availability toggle (in / out of stock)
- *Not done: image upload to S3 — items currently take an image URL.*

### Cart & ordering — Phase 3
- Cart with quantity management and persistence
- Checkout with hostel block + room delivery address and special instructions
- Cash-on-delivery
- Order confirmation

### Order tracking & staff dashboard — Phase 4
- Full status lifecycle: pending → confirmed → preparing → ready → out for delivery → delivered (+ cancelled)
- Live updates over Socket.io
- Student "my orders" + order detail / tracking
- Staff live order-book dashboard with new-order alerts

---

## ⬜ Not started yet

| Phase | What it covers |
|---|---|
| 5. Analytics & owner dashboard | Sales / popular-items / revenue reports (route stub exists, no logic yet) |
| 6. Polish & optimization | PWA, push notifications, ratings, caching, rate-limiting, security headers |
| 7. Payment | Online payment — deliberately last; COD for now (schema already payment-ready) |
| 8. Deployment | 🟡 In progress — EC2 backend + SSL (campusfood.duckdns.org), Vercel frontend (campus-food-lime.vercel.app) |

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
