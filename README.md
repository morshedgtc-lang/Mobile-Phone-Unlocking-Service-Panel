# 📱 Professional Mobile Phone Unlocking Service Panel

Enterprise-grade, production-ready GSM unlocking service platform designed for scalability, security, and ease of management for non-technical owners.

## 🚀 Project Overview
This system provides a complete ecosystem for managing a phone unlocking business, featuring a high-conversion user panel and a comprehensive administrative control center.

### 🛠 Technology Stack

#### Frontend (The Experience)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **State Management:** TanStack Query (React Query)
- **Form Handling:** React Hook Form + Zod Validation
- **Icons:** Lucide Icons / Hero Icons
- **PWA:** Progressive Web App ready for mobile installation

#### Backend (The Engine)
- **Framework:** FastAPI (Python 3.12)
- **Database:** PostgreSQL (Hosted on Railway)
- **ORM:** SQLAlchemy 2.0 + Alembic (Migrations)
- **Auth:** JWT (Access & Refresh tokens) + Argon2 Password Hashing
- **Security:** Role-Based Access Control (RBAC), Rate Limiting, Audit Logging
- **API:** RESTful architecture with OpenAPI (Swagger) documentation

---

## 🏛 System Architecture

### 👥 User Panel
- **Dashboard:** Real-time balance, quick stats, and recent order snapshots.
- **Order System:** Intelligent order form with dynamic pricing based on user group (Retail, VIP, etc.) and auto-validation.
- **Wallet:** Balance management, reload requests, and detailed transaction history.
- **Support:** Ticket-based system with attachment support and status tracking.
- **Profile:** KYC verification, security settings, and language preferences.

### 🔑 Admin Panel (The Control Center)
- **Service Management:** Unlimited categories and services with multi-tier pricing (Retail $\rightarrow$ Distributor).
- **Order Control:** Bulk actions, status updates (Pending $\rightarrow$ Completed), and internal staff notes.
- **User Management:** User group assignment, balance adjustments, and account auditing.
- **Financials:** Revenue reports, profit tracking, and exportable CSV/Excel/PDF reports.
- **System Settings:** Global configurations manageable without touching code.

---

## 🎨 Design Specifications
- **Visual Style:** Modern SaaS, Glassmorphism, Rounded aesthetics.
- **Color Palette:**
  - Primary: `#2563EB` (Royal Blue)
  - Success: `#16A34A` | Danger: `#DC2626`
  - Background: `#F8FAFC` (Light) | `#0F172A` (Dark)
- **Experience:** Mobile-first, Dark/Light mode support, smooth page transitions, and loading skeletons.

---

## 🛡 Security & Production Standards
- **No Hardcoding:** All configurations stored in environment variables.
- **Data Integrity:** UUID primary keys, soft deletes, and database transactions to prevent data loss.
- **Performance:** Database indexing, lazy loading, and optimized API queries.
- **Hardening:** CSRF/XSS protection, SQL injection prevention, and secure HTTP headers.

---

## 📁 Project Structure

```text
/backend
  ├── api/          # Pydantic schemas & request/response models
  ├── models/       # SQLAlchemy database models
  ├── routes/       # API endpoints (auth, orders, users, admin)
  ├── services/     # Business logic layer (core logic)
  ├── database/     # Connection & session management
  ├── auth/         # JWT & Security logic
  ├── security/     # Middleware, Rate limiting, RBAC
  └── utils/        # Helpers & logging
/frontend
  ├── components/   # Reusable shadcn/ui components
  ├── layout/       # Global wrappers & navigation
  ├── pages/        # Next.js App router pages
  ├── forms/        # Zod-validated forms
  └── dashboard/    # Admin & User dashboard views
```

---

## ⚙️ Installation & Setup

### Backend
1. Navigate to `/backend`
2. Create a virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env` with your PostgreSQL credentials.
5. Run migrations: `alembic upgrade head`
6. Start server: `uvicorn main:app --reload`

### Frontend
1. Navigate to `/frontend`
2. Install dependencies: `npm install`
3. Configure `.env.local` with your API URL.
4. Start dev server: `npm run dev`

---

## 📋 Deployment Checklist
- [ ] Remove all debug/demo data.
- [ ] Verify HTTPS only configuration.
- [ ] Set up Railway production environment variables.
- [ ] Run final security & load tests.
- [ ] Establish automated database backups.
"# Mobile-Phone-Unlocking-Service-Panel" 
