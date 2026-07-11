# Phone Unlock Pro

Professional GSM Service Management Platform with Admin and Client roles.

## Tech Stack

- **Backend**: Express.js + TypeScript + Prisma ORM
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Auth**: JWT + Refresh Tokens + Email OTP

## Features

### Admin
- Dashboard with stats
- User management (CRUD, approve/reject)
- Service management with dynamic fields
- Category management
- Client group management (service visibility)
- Order management (status updates, messages)
- Deposit management (approve/reject)
- Wallet management (credit users)
- Audit logs

### Client
- Dashboard with balance and order stats
- Browse services (filtered by group)
- Create orders with dynamic fields
- Order history and messages
- Deposit requests
- Wallet and transaction history
- Profile management
- Password change

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL

### Setup

```bash
# Clone
git clone <repo-url>
cd Mobile-Phone-Unlocking-Service-Panel

# Backend
cd backend
cp .env.example .env  # Edit DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` for all required variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `SMTP_HOST/USER/PASS` - For email OTP (optional in dev)

## Default Admin

- Email: `admin@unlock.com`
- Password: `Admin@123456!`

## Docker

```bash
docker-compose up
```

## Deployment

### Railway
1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Docker
```bash
docker build -t unlock-panel ./backend
docker build -t unlock-frontend ./frontend
```

## Project Structure

```
├── backend/
│   ├── prisma/          # Database schema
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/   # Auth, rate limiting
│   │   └── services/    # Email service
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── auth/        # Login, register
│   │   ├── dashboard/   # Client panel
│   │   └── admin/       # Admin panel
│   ├── components/      # UI components
│   ├── context/         # Auth context
│   └── lib/             # Utilities
└── docker-compose.yml
```
