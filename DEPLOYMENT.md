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
