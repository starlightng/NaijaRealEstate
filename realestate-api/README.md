# NaijaProperty API

**Nigerian Community Real Estate Platform** — Properties listed in ₦ Naira.

## Tech Stack

| Layer        | Technology                                                      |
|-------------|----------------------------------------------------------------|
| **Backend**  | Python 3.13+, FastAPI, SQLAlchemy 2.0 (async), Alembic         |
| **Database** | PostgreSQL 16 (async via asyncpg)                              |
| **Auth**     | JWT (access + refresh tokens), bcrypt password hashing         |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand        |
| **Storage**  | Local filesystem (image uploads with Pillow processing)        |

## Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│   Next.js Frontend  │ ──▶  │  FastAPI Backend      │
│   (React + TS)      │ ◀──  │  (REST API)           │
└─────────────────────┘      └──────────┬───────────┘
                                        │
                              ┌─────────▼───────────┐
                              │  PostgreSQL Database │
                              │  (via asyncpg)       │
                              └─────────────────────┘
```

- **Auth**: JWT access tokens (1h) + rotating refresh tokens (30d, HttpOnly cookie).
- **RBAC**: Three roles — `landlord`, `agent`, `admin` — enforced via FastAPI dependency injection.
- **Moderation**: Listings go through `draft → pending_review → approved/rejected` workflow.

## Quick Start

### Prerequisites

- Python 3.13+
- PostgreSQL 16+
- Node.js 20+
- npm

### 1. Clone & Backend Setup

```bash
git clone <repo-url>
cd realestate-api

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 2. Database

```bash
# Create the database
createdb naijaproperty

# Run migrations
alembic upgrade head

# Seed initial data (optional)
python -m app.seed
```

### 3. Run the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend Setup

```bash
cd realestate-frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

## API Overview

| Endpoint Group      | Prefix             | Auth Required |
|--------------------|-------------------|---------------|
| Auth               | `/auth/*`         | Mixed         |
| Users              | `/users/*`        | Yes           |
| Properties         | `/properties/*`   | Mixed         |
| Inquiries / Leads  | `/inquiries/*`    | Yes           |
| Admin              | `/admin/*`        | Admin only    |
| Uploads            | `/uploads/*`      | Yes           |

## Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable                     | Default                       | Description                  |
|-----------------------------|-------------------------------|------------------------------|
| `DATABASE_URL`              | postgresql+asyncpg://...      | PostgreSQL connection string |
| `SECRET_KEY`                | change-me-in-production       | JWT signing key              |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 60                          | Access token TTL             |
| `CORS_ORIGINS`              | http://localhost:3000          | Allowed CORS origins         |
| `UPLOAD_DIR`                | uploads                       | Image storage path           |

## License

MIT
