# Deployment Guide

## Option 1: Railway (Recommended)

Railway provides the simplest deployment experience with built-in PostgreSQL and automatic HTTPS.

### Prerequisites

- A [Railway](https://railway.app) account (GitHub login)
- Git repository with your code pushed

### Steps

#### Backend

1. **Create a new Railway project** from the dashboard.
2. **Add a PostgreSQL database** — Railway provisions a managed instance with a connection string.
3. **Add a service** for the backend:
   - Connect your Git repository.
   - Set **Root Directory** to `realestate-api` (if monorepo) or deploy from the backend directory.
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Set Environment Variables** in Railway dashboard:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql+asyncpg://<railway-provided-url>` |
   | `SECRET_KEY` | Generate a strong random key: `openssl rand -hex 32` |
   | `CORS_ORIGINS` | `https://your-frontend.railway.app` |
   | `DEBUG` | `false` |

5. **Run migrations** — Railway can run a one-off command:
   ```bash
   alembic upgrade head
   ```
   Or add a post-deploy script in `railway.json`.

#### Frontend

1. **Add another service** for the frontend:
   - **Root Directory**: `realestate-frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
2. **Set Environment Variables**:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` |

3. **Update CORS** in the backend env to include your frontend URL.

### Railway Configuration File (`railway.json`)

Create at project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Option 2: Render

### Backend (Web Service)

1. Push code to GitHub/GitLab.
2. In Render dashboard, create a **New Web Service**.
3. Connect repository and configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (same as Railway table above).
5. Add a **Managed PostgreSQL** database from Render dashboard.
6. Run migrations via Render Shell:
   ```bash
   alembic upgrade head
   ```

### Frontend (Static Site)

1. Create a **New Static Site** on Render.
2. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `out` (for static export) or `.next` (for Node server)
3. For SSR (recommended), use a **Web Service** instead:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

## Option 3: Fly.io

### Backend

```bash
# Install flyctl
# In realestate-api directory:
fly launch
fly postgres create --name naijaproperty-db
fly secrets set DATABASE_URL=postgresql+asyncpg://<connection-string>
fly secrets set SECRET_KEY=$(openssl rand -hex 32)
fly deploy
```

### Frontend

```bash
# In realestate-frontend directory:
fly launch
fly secrets set NEXT_PUBLIC_API_URL=https://your-backend.fly.dev
fly deploy
```

## Production Checklist

- [ ] Generate strong `SECRET_KEY` (at least 32 hex bytes)
- [ ] Set `DEBUG=false`
- [ ] Enable HTTPS (automatic on Railway/Render/Fly)
- [ ] Set up a custom domain
- [ ] Configure database backups (automated on managed Postgres)
- [ ] Set up monitoring (Railway metrics, Render logs)
- [ ] Implement rate limiting for auth endpoints
- [ ] Add proper email service (SendGrid, Mailgun, etc.)
- [ ] Set up object storage for images (S3-compatible: Cloudflare R2, AWS S3)

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```
