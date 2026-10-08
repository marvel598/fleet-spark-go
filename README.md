# Fleet Spark Go

Fleet Spark Go is a multi-role automotive marketplace and finance platform designed for vehicle buying, renting, financing, and payout management in Kenya.

## Highlights

- Vehicle marketplace with buying and rental flows
- Finance calculator with APR-based estimate logic
- Role-based access for customers, owners, dealers, lenders, and admins
- Settlement and commission management for transactions
- M-Pesa and bank transfer payout support
- Transaction tracking for marketplace payouts

## Commission model

- Buying transactions: 8% platform commission
- Leasing transactions: 15% of monthly lease value
- Payment processing: 2.9% for settlement rails

## Key routes

- `/` — home page
- `/inventory` — vehicle listings
- `/rentals` — rental inventory
- `/finance/calculator` — finance estimator
- `/account` — account overview
- `/payouts` — payout account management and transaction history
- `/admin` — admin dashboard
- `/dealer` — dealer hub
- `/owner` — owner hub
- `/lender` — lender hub

## Tech stack

- React + Vite
- TypeScript
- Supabase
- Tailwind CSS
- shadcn/ui components

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Set the following in your environment for Supabase:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```
