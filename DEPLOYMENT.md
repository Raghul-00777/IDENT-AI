# Deployment Guide

## Vercel Frontend

The frontend is hosted on Vercel and uses the production build in `dist`.

1. From the `project/` folder, build the frontend:
   ```bash
   npm run build
   ```
2. Deploy to Vercel:
   ```bash
   npx vercel deploy --prod --yes
   ```
3. Make sure `vercel.json` is present and contains the static build config.

## Render Backend

The backend is designed to run on Render as a separate web service.

1. Add this repo to Render and create a new Web Service using `render.yaml`.
2. Render build command:
   ```bash
   cd backend && npm install
   ```
3. Render start command:
   ```bash
   cd backend && npm start
   ```
4. Environment variables:
   - `NODE_ENV=production`
   - `CORS_ORIGINS=https://ident-ai-nine.vercel.app`
   - `ADMIN_PASSWORD=IDENT AI`
   - `JWT_SECRET=ident-ai-secret`
   - `GROK_API_URL=https://api.grok.com/v1/responses`
   - `GROK_API_KEY=` (optional)
      - Grok AI integration has been removed from the backend. No external AI key is required.

## Frontend to Backend Integration

Set the following Vite environment variable before building the frontend:

```bash
VITE_API_BASE_URL=https://<your-backend-host>
```

For example:

```bash
VITE_API_BASE_URL=https://ident-ai-backend.onrender.com
npm run build
```

This allows the frontend to point directly at the Render backend.

## Notes

- The backend uses temp storage for uploads and reports on Render/Vercel.
- Reports are generated in memory and stored briefly in the backend temp folder.
- If you want Grok AI enrichment, set `GROK_API_KEY` in Render.

## Enabling Grok AI (production)

1. In your Render service, open the Service > Environment tab and add the following secrets:

   - `GROK_API_KEY` — your Grok API key (e.g. `gsk_...`).
   - `GROK_API_URL` — leave as `https://api.grok.com/v1/responses` unless instructed otherwise by Grok support.
   - `CORS_ORIGINS` — set to the frontend origin(s), e.g. `https://ident-ai-nine.vercel.app`.

2. After saving env vars, trigger a redeploy from the Render dashboard (Deploys → Manual Deploy).

3. Verify the endpoint by running:

```bash
curl -i https://<your-backend-host>/api/health
curl -i -F "file=@frontend/assets/test.jpg" https://<your-backend-host>/api/detection/analyze
```

4. If `/api/detection/analyze` returns 500 with a Grok-related message, check that Render's network policy allows outbound DNS resolution and HTTPS to `api.grok.com`.

Security note: do NOT commit your `backend/.env` containing `GROK_API_KEY` to source control; add it only in Render secrets.
