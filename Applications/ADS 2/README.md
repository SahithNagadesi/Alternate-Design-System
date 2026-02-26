# ADS 2

Alternate Design System application connecting to **HotelRes** via Pega DX API v24.1.

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your Pega credentials
npm run dev
```

## Pega DX API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| GET /casetypes | List available case types |
| GET /cases | List cases |
| POST /cases | Create a new case |
| GET /cases/{id} | Get case details |
| GET /assignments/{id} | Get assignment |
| PATCH /assignments/{id}/actions/{actionId} | Submit assignment |
| GET /data_views/{id} | Query data view |

## Project Structure

```
src/
  services/
    auth.ts         — OAuth 2.0 authentication
    pega-api.ts     — Pega DX API client
  pages/
    Dashboard.tsx   — Case type overview
    CaseList.tsx    — List all cases
    CaseDetail.tsx  — Single case view
    CreateCase.tsx  — Create new case
  styles/
    index.css       — Base styles
  App.tsx           — Root layout with navigation
  main.tsx          — Entry point with routing
```
