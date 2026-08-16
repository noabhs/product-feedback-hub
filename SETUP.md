# Navina Insights Hub — Setup guide

## 1. Database (Supabase — free tier works)

1. Create a project at supabase.com
2. Go to Project Settings → Database → Connection string → URI
3. Copy the URI and set it as `DATABASE_URL` in `.env.local`

Run migrations:
```bash
npx prisma migrate dev --name init
```

## 2. Google OAuth

1. Go to console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-vercel-url.vercel.app/api/auth/callback/google` (prod)
4. Enable these APIs in the project:
   - Google Docs API
   - Google Drive API
   - Google Sheets API
5. Copy Client ID → `AUTH_GOOGLE_ID`
6. Copy Client Secret → `AUTH_GOOGLE_SECRET`

## 3. Anthropic API

1. Get a key at console.anthropic.com
2. Set it as `ANTHROPIC_API_KEY` in `.env.local`

## 4. Auth secret

Generate a random secret:
```bash
openssl rand -base64 32
```
Set it as `AUTH_SECRET` in `.env.local`

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — it will redirect to /login.
Sign in with your @navina.ai Google account.

## 6. Import the feedback sheet

After signing in, go to **Admin** → **Run import**.
This pulls all discovery questions and client feedback from the Google Sheet.

## 7. Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create navina-insights-hub --private --source=. --push
```

Then in Vercel:
1. Import the GitHub repo
2. Add all env vars from `.env.local`
3. Update `AUTH_URL` to your Vercel URL
4. Update Google OAuth redirect URI with the Vercel URL
5. Deploy

## .env.local reference

```
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
ANTHROPIC_API_KEY="..."
GOOGLE_SHEET_ID="1tUGw9CDL-Obqf7SK1OaCtHsDaaEmRQBkrkA8ykpvCIQ"
```
