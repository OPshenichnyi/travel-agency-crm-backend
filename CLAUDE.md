# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server

# Testing
npm test             # Run all Jest tests
npm test -- --testPathPattern=order  # Run a single test file

# Database utilities
npm run reset-db     # Full database reset
npm run create-admin # Create admin account
npm run reset-admin  # Reset admin password
npm run reset-password # Reset user password
```

## Environment

Copy `env.example` to `.env`. Key variables:
- `NODE_ENV` — `development` uses SQLite (`database.sqlite`), `production` uses PostgreSQL
- `FORCE_SYNC=true` — drops and recreates all tables on startup (destructive)
- `JWT_SECRET` — must be set for auth to work
- `DB_*` — only used in production (PostgreSQL)

Docker runs on port **3002** (mapped to internal 3000). Direct dev server runs on **3000**.

## Architecture

**Pattern:** Route → Controller → Service → Model (strict layering; business logic lives in services, not controllers)

**ES Modules** — the project uses `"type": "module"`, so all files use `import`/`export` syntax.

### Role hierarchy
Three roles with different access scopes:
- `admin` — full system access
- `manager` — manages their assigned agents, owns bank accounts
- `agent` — operates under a manager, creates orders

User self-reference: `User.managerId → User.id` (manager-agent relationship).

### Models

**`users`** — `id` (UUID PK), `managerId` (UUID FK → users.id, nullable), `role` (admin|manager|agent), `email` (unique), `password` (bcrypt), `firstName`, `lastName`, `phone`, `isActive`. Password is auto-hashed via `beforeCreate`/`beforeUpdate` hooks.

**`orders`** — `id` (UUID PK), `agentId` (UUID FK → users.id), `statusOrder` (pending|approved|rejected), `reservationNumber`, `clientName`, `clientPhone` (JSON array), `clientEmail`, `clientCountry`, `clientDocumentNumber`, `countryTravel`, `cityTravel`, `propertyName`, `propertyNumber`, `guests` (JSON), `checkIn`/`checkOut` (DATEONLY), `nights`, `officialPrice`, `taxClean`, `discount`, `totalPrice` (auto-calculated in `beforeCreate` if not provided), `bankAccount`. Payment split into two blocks:
- Deposit: `depositAmount`, `depositStatus` (unpaid|paid), `depositDueDate`, `depositPaidDate`, `depositPaymentMethods` (JSON)
- Balance: `balanceAmount`, `balanceStatus` (unpaid|paid), `balanceDueDate`, `balancePaidDate`, `balancePaymentMethods` (JSON)

**`bank_accounts`** — `id` (UUID PK), `managerId` (UUID FK → users.id), `bankName`, `swift` (8 or 11 chars), `iban`, `holderName`, `address`, `identifier`. Unique constraint on `(managerId, identifier)`.

**`invitations`** — `id` (UUID PK), `email`, `role` (manager|agent), `invitedBy` (UUID FK → users.id), `token` (UUID, unique), `expiresAt` (7 days from creation), `used` (boolean).

### Database sync
`src/models/index.js` calls `syncModels()` which runs `sequelize.sync()` on app startup. Migrations in `src/migrations/` are standalone scripts run manually, not via a migration framework.

### API surface
All routes mount under `/api`. Swagger docs at `/api-docs`. Health check at `/api/health` (also tests DB connectivity).

### Auth flow
1. Login → `authService` validates credentials, `jwtService` issues JWT
2. Protected routes use `authMiddleware` (verifies JWT) then `roleMiddleware` (checks role)

### Services worth knowing
- `emailService.js` — Nodemailer; in development, verifies SMTP connection on startup
- `pdfService.js` — PDFKit for voucher generation
- `jwtService.js` — token sign/verify wrapper
- `invitationService.js` — generates time-limited tokens for user registration emails
