# Campus Food Ordering System

A production-grade food ordering platform for college campuses, enabling students to order from multiple canteens with real-time tracking and delivery to hostel rooms.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- AWS account with $100 credits
- Git

### Installation

1. **Clone and install dependencies**
```bash
# Install all packages
cd backend && npm install
cd ../frontend && npm install
cd ../shared && npm install && npm run build
```

2. **Configure environment**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, AWS keys, etc.

# Frontend
cp frontend/.env.local frontend/.env.local
```

3. **Run development servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
├── backend/          Express API + Socket.io
├── frontend/         Next.js 16 app
├── shared/           TypeScript types
└── docs/             Documentation
```

---

## 🛠️ Tech Stack

**Frontend**: Next.js 16, TypeScript, Tailwind v4, Zustand, React Query  
**Backend**: Node.js, Express, MongoDB, Socket.io, JWT  
**Deploy**: Vercel (frontend) + AWS EC2 (backend)

---

## 📖 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation and configuration
- [Architecture](docs/ARCHITECTURE.md) - System design and data models
- [Roadmap](docs/ROADMAP.md) - Development plan (15 weeks)
- [Project Summary](docs/PROJECT_SUMMARY.md) - Complete overview

---

## ✨ Features

Students, canteen staff/owners, and the platform admin each sign in through their own door.

### For Students
- Browse multiple canteens and live menus (category + veg/non-veg filters)
- Cart and checkout, cash-on-delivery
- Delivery to hostel block + room
- Live order tracking (pending → preparing → out for delivery → delivered)
- Order history

### For Cafeteria Staff
- Live incoming-order dashboard with real-time alerts
- Update order status through the delivery lifecycle
- Toggle item availability (in / out of stock)
- Manage the menu when granted the `manage_menu` permission

### For Canteen Owners
- Everything staff can do, for their own canteen
- Full menu management (add / edit / delete items)
- *Sales analytics & reports — planned*

### For Platform Admin
- Create canteens and provision owners/staff via single-use invite links
- Assign staff duties (kitchen / delivery) and permissions

---

## 🎨 Design System

Custom "Fresh emerald" design (not generic blue!):
- **Colors**: Deep emerald accent (`#1b7a45`) + sun-yellow highlight (`#ffc93c`) on soft green-tinted paper (`#f6f9f6`)
- **Typography**: Outfit (geometric sans) for display + Inter for body
- **Mobile-first**, production-ready UI
- All tokens live in `frontend/app/globals.css` (Tailwind v4, CSS-first)

---

## 📊 Current Status

**Built and working (≈ half the roadmap — Phases 1–4):**
- ✅ **Authentication** — three sign-in doors (student / partner / admin), invite-based provisioning, owner/staff split, per-staff powers
- ✅ **Canteens & menu** — browse with filters, full menu CRUD, availability toggle
- ✅ **Cart & checkout** — hostel-block + room delivery address, cash-on-delivery
- ✅ **Order tracking** — full status lifecycle, live via Socket.io, staff order dashboard

**Not started yet (Phases 5–8):**
- ⬜ Owner analytics & reports
- ⬜ Polish / PWA, caching, security hardening
- ⬜ Online payment (deliberately last — COD for now)
- ⬜ Production deployment

See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) and [docs/ROADMAP.md](docs/ROADMAP.md) for the full breakdown.

**Timeline**: targeting production deployment at the campus  
**Scale**: 6000+ students, multiple canteens

---

## 🤝 Contributing

This is a college project with startup potential. Built for real-world use.

---

## 📝 License

MIT

---

**Made with care for campus life** 🎓
