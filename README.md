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
├── frontend/         Next.js 15 app
├── shared/           TypeScript types
└── docs/             Documentation
```

---

## 🛠️ Tech Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, Zustand, React Query  
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

### For Students
- Browse multiple canteens
- Real-time menu with availability
- Cart management
- Order tracking
- Delivery to hostel room

### For Cafeteria Staff
- View incoming orders
- Update order status
- Menu management
- Toggle item availability

### For Owners
- Sales analytics
- Popular items reports
- Revenue tracking
- Staff management

---

## 🎨 Design System

Custom warm, earthy design (not generic blue!):
- **Colors**: Terracotta accent (#C4612F), warm cream background
- **Typography**: Fraunces serif + Inter sans
- **Mobile-first**, production-ready UI

---

## 📊 Current Status

✅ **Phase 1: Foundation Complete**
- Backend API structure
- Database models
- Frontend base setup
- Design system
- Documentation

⏳ **Next: Phase 1 Continuation - Authentication**
- User registration & login
- Email verification
- JWT auth flow
- Protected routes

**Timeline**: 3-4 months to production  
**Scale**: 6000+ students, 10+ canteens

---

## 🤝 Contributing

This is a college project with startup potential. Built for real-world use.

---

## 📝 License

MIT

---

**Made with care for campus life** 🎓
