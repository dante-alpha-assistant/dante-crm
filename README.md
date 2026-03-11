# Dante CRM

Personal CRM for managing contacts, companies, interactions, and reminders.

## Stack

- **Frontend:** React + Vite
- **Backend:** Express.js
- **Database:** Supabase (PostgreSQL + Auth)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/dante-alpha-assistant/dante-crm.git
cd dante-crm
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run migrations
# Copy SQL files from migrations/ into Supabase SQL editor, or:
npm run migrate

# 4. Start dev servers
npm run dev
# Client: http://localhost:3000
# Server: http://localhost:4000
```

## Docker

```bash
docker-compose up --build
```

## Project Structure

```
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Supabase client, utilities
│   │   ├── pages/          # Page components
│   │   └── styles/         # CSS
│   └── vite.config.js
├── server/                 # Express.js API
│   └── src/
│       ├── lib/            # Supabase client
│       ├── middleware/      # Error handler, auth
│       └── routes/         # API routes (contacts, companies, etc.)
├── migrations/             # SQL migration files (idempotent)
├── scripts/                # Migration runner, utilities
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/contacts` | List / Create contacts |
| GET/PATCH/DELETE | `/api/contacts/:id` | Get / Update / Delete contact |
| GET/POST | `/api/companies` | List / Create companies |
| GET/PATCH/DELETE | `/api/companies/:id` | Get / Update / Delete company |
| GET/POST | `/api/interactions` | List / Create interactions |
| PATCH/DELETE | `/api/interactions/:id` | Update / Delete interaction |
| GET/POST | `/api/reminders` | List / Create reminders |
| PATCH/DELETE | `/api/reminders/:id` | Update / Delete reminder |
| GET/POST | `/api/groups` | List / Create groups |
| GET/DELETE | `/api/groups/:id` | Get (with members) / Delete group |
| POST | `/api/groups/:id/members` | Add member to group |
| DELETE | `/api/groups/:id/members/:contactId` | Remove member |

## Database Schema

See `migrations/` for the full schema. Tables:
- `contacts` — People you know
- `companies` — Organizations
- `interactions` — Calls, emails, meetings, notes, messages
- `reminders` — Follow-up reminders per contact
- `contact_groups` — Custom grouping
- `contact_group_members` — Group membership (many-to-many)
