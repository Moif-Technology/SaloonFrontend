# Saloon POS — Claude Instructions

## Stack
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Mobile:** Capacitor (Android, iOS)
- **Desktop:** Tauri (Windows, macOS, Linux)
- **HTTP:** axios
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Charts:** Recharts

## Folders
- `src/` — React components, pages, hooks, utilities
- `src/pages/` — Route-level pages
- `src/components/` — Reusable UI components
- `src/api/` — HTTP client wrappers (axios)
- `src/types/` — TypeScript type definitions
- `src/hooks/` — Custom React hooks
- `src/utils/` — Utility functions
- `public/` — Static assets

## Backend Connection
- **API base:** `http://localhost:5010/api` (local dev)
- **Salon POS endpoints:** `/api/salon-pos/*`
- **Database:** PostgreSQL, company_id + branch_id scoped
- **Session:** JWT tokens, POS-scoped for PIN login, ERP-scoped for admin

See `SESSION_HANDOFF.md` in `api/` folder for backend status.

## Development
```bash
npm install
npm run dev          # Vite dev server on :5174
npm run build        # Production build
npm run tauri:dev    # Tauri desktop (when ready)
```

## Branches
- `main` — production ready
- `sabeeh` — development
- `arshidha` — feature branch
- `swetha` — feature branch

## To Start Building
1. Plan UI structure (screens, components, data flow)
2. Create pages in `src/pages/`
3. Extract reusable components to `src/components/`
4. Add axios wrappers in `src/api/`
5. Define TypeScript types in `src/types/`
6. Wire to backend `/api/salon-pos/*` endpoints

## Key Endpoints
- `POST /api/salon-pos/auth/pin-login` — Staff login
- `GET /api/salon-pos/stylists` — Staff list
- `POST /api/salon-pos/job/save` — Create job (order)
- `POST /api/salon-pos/sales/settle` — Checkout
- `GET /api/groups`, `/api/products`, `/api/customers` — Catalogue (POS-allowed)
