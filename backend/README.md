# Fleet Spark Go API

This repository now includes a Go backend scaffold for the Fleet Spark Go application.

## Structure

```text
backend/
  cmd/api/main.go
  internal/
    auth/
    config/
    db/
    handlers/
    models/
  migrations/
  .env.example
  go.mod
  Dockerfile
```

## Quick start

1. Copy environment variables:

```bash
cp backend/.env.example backend/.env
```

2. Start PostgreSQL and run the migration:

```bash
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
```

3. Start the API:

```bash
cd backend
go mod download
go run ./cmd/api
```

## Endpoints

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/me
- GET /api/v1/vehicles
- POST /api/v1/vehicles
- GET /api/v1/finance/quote
- GET /api/v1/payouts
- GET /api/v1/admin/dashboard

## Notes

This scaffold is designed to sit next to the existing React frontend and provides a real backend foundation for auth, finance, vehicles, payouts, and admin services.
