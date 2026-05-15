<div align="center">

# GarageIQ

### Automotive Ownership Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)

A full-stack platform for car enthusiasts to track vehicles, loans, maintenance, warranties, insurance, and modifications — with a data-driven insights engine that recommends whether to **keep, sell, trade, or refinance**.

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Sample Data](#sample-data)
- [License](#license)

---

## Features

<table>
<tr>
<td width="50%">
### Dashboard
- Portfolio value, total equity & monthly cost overview
- Equity-by-vehicle area chart
- Annual cost breakdown pie chart
- Top ownership insights across all vehicles

### Vehicle Detail
- Market value history & maintenance-by-category charts
- Warranty status with expiration alerts
- Modification inventory with category breakdown
- One-click market value refresh from auction sites

### Loan Tracker
- Payoff progress bar with interest paid & remaining payments
- 24-month equity projection chart (market value vs. loan balance)
- Edit loan terms at any time

### Maintenance History
- Full service log (date, type, description, cost, mileage, shop)
- Cost-by-category bar chart with running totals

</td>
<td width="50%">

### Warranty Tracker
- Factory, extended, powertrain & bumper-to-bumper warranties
- Days/miles remaining with visual expiration alerts

### Insurance Tracker
- Policy history with premium, deductible & coverage type
- Current vs. historical policy comparison

### Modifications
- Track mods by category (performance, exhaust, suspension, wheels, etc.)
- Category cost breakdown & total investment tracking

### Scenario Simulator
- Adjust extra payments, refinance APR, projection period & depreciation rate
- Side-by-side current vs. modified equity trajectory
- Dynamic charts showing projected outcomes

### Ownership Insights Engine
- **Keep / Sell / Trade / Refinance** recommendations
- Confidence scores with detailed reasoning & supporting metrics
- Covers equity analysis, refinance detection, depreciation, warranty expiration, maintenance trends & more

</td>
</tr>
</table>

### Market Value Scraping

- Searches **Cars & Bids** past auctions and **Bring a Trailer** completed listings
- Calculates average and median prices from recent real-world sales
- Stores results as historical market value data points

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.5 |
| **Styling** | Tailwind CSS 3.4 |
| **Charts** | Recharts 2.12 |
| **ORM** | Prisma 5.22 |
| **Database** | PostgreSQL |
| **Auth** | NextAuth.js 4 (credentials) |
| **Scraping** | Cheerio |
| **Date Utils** | date-fns |
| **Password Hashing** | bcrypt.js |

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/) running locally or a cloud instance (e.g., Supabase, Neon, Railway)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/garageiq.git
cd garageiq

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env

# 4. Push the database schema
npx prisma db push

# 5. Seed sample data (3 vehicles with full history)
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and sign in.

> **Demo credentials:** `demo@garageiq.com` / `demo1234`

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/garageiq"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## Project Structure

```
garageiq/
├── prisma/
│   ├── schema.prisma               # Database schema (7 models)
│   └── seed.ts                     # Sample data seeder
├── src/
│   ├── middleware.ts                # Auth route protection
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   ├── providers.tsx           # Client providers (NextAuth)
│   │   ├── globals.css             # Global styles
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   │   ├── register/           # User registration
│   │   │   └── vehicles/           # Vehicle CRUD + sub-resources
│   │   │       └── [id]/
│   │   │           ├── insights/       # AI-driven recommendations
│   │   │           ├── insurance/      # Insurance CRUD
│   │   │           ├── loan/           # Loan CRUD
│   │   │           ├── maintenance/    # Maintenance log CRUD
│   │   │           ├── market-value/   # Auction scraper endpoint
│   │   │           ├── modifications/  # Mod tracker CRUD
│   │   │           └── warranty/       # Warranty CRUD
│   │   ├── dashboard/              # Main dashboard
│   │   ├── login/                  # Sign-in page
│   │   ├── register/               # Sign-up page
│   │   ├── scenario/               # Scenario simulator
│   │   └── vehicles/
│   │       ├── new/                # Add vehicle form
│   │       └── [id]/               # Vehicle detail + sub-pages
│   ├── components/
│   │   ├── Charts.tsx              # Recharts wrappers (area, pie, bar)
│   │   ├── InsightCard.tsx         # Insight recommendation card
│   │   ├── Navbar.tsx              # Top navigation
│   │   ├── Shell.tsx               # Page shell with sidebar
│   │   ├── StatCard.tsx            # Dashboard stat card
│   │   └── VehicleCard.tsx         # Vehicle summary card
│   └── lib/
│       ├── auth.ts                 # NextAuth configuration
│       ├── calculations.ts         # Financial formulas (amortization, equity, depreciation)
│       ├── insights.ts             # Recommendation engine
│       ├── prisma.ts               # Prisma client singleton
│       ├── scraper.ts              # Cars & Bids + BaT scraper
│       └── session.ts              # Server-side session helper
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema

```
User ──< Vehicle ──< MaintenanceRecord
              │──< Warranty
              │──< Insurance
              │──< Modification
              │──< MarketValue
              └─── Loan (1:1)
```

| Model | Description |
|-------|-------------|
| **User** | Authenticated user account |
| **Vehicle** | Core vehicle record (year, make, model, VIN, mileage, purchase info) |
| **Loan** | Auto loan details (balance, APR, term, monthly payment) |
| **Warranty** | Factory/extended warranty tracking with expiration |
| **MaintenanceRecord** | Service history log |
| **Insurance** | Policy details and coverage types |
| **Modification** | Aftermarket modifications by category |
| **MarketValue** | Scraped auction price data points |

---

## Sample Data

The seed script (`npm run db:seed`) creates three vehicles with complete history:

| Vehicle | Color | Highlights |
|---------|-------|------------|
| **2022 BMW M3 Competition xDrive** | Isle of Man Green | KW coilovers, M Performance exhaust |
| **2019 Porsche 911 Carrera S (992)** | GT Silver | Fabspeed cats, BBS wheels |
| **2020 Toyota GR Supra 3.0 Premium** | Red | HKS exhaust, Bootmod3 tune |

Each includes full loan, warranty, maintenance, insurance, modification, and market value records.

---

## License

This project is for personal/educational use.

---

<div align="center">
  <sub>Built with Next.js, Prisma, and a passion for cars.</sub>
</div>
