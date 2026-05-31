Deployment guide — Vercel (frontend) + Render (backend)

Overview
- Frontend: deploy to Vercel as a static site (Vite build -> `dist`).
- Backend: deploy to Render as a Docker web service using `backend/Dockerfile`.

Pre-requisites
- Push this repo to GitHub.
- Create accounts: Vercel (for frontend) and Render (for backend).
- Create/obtain a MongoDB connection string (Atlas or other) and API keys.

Frontend (Vercel)
1. In the Vercel dashboard, import your GitHub repository.
2. Set the root or project to the repository root; Vercel will detect `frontend/package.json`.
3. Build command: `npm ci && npm run build` (Vercel uses `package.json` by default).
4. Output directory: `dist`.
5. Add environment variables (if your frontend needs them) in Vercel Project Settings.
6. Deploy — Vercel will auto-deploy on pushes to the connected branch.

Notes: A `frontend/vercel.json` file is included to help Vercel detect the static build and route all requests to `index.html`.

Automated GitHub Actions deploy
- A workflow is included at `.github/workflows/deploy-frontend-vercel.yml` that builds the `frontend` and deploys to Vercel on pushes to `main`.
- Before this workflow will succeed, add the following repository secrets in GitHub Settings → Secrets → Actions:
   - `VERCEL_TOKEN` — a Vercel personal token (create in Vercel dashboard).
   - `VERCEL_ORG_ID` — your Vercel organization ID.
   - `VERCEL_PROJECT_ID` — your Vercel project ID.
- To find `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, go to your project settings in Vercel or run `vercel projects ls --token $TOKEN` using the Vercel CLI.


Backend (Render)
1. In the Render dashboard, create a new Web Service.
   - Choose "Docker" as the environment.
   - Connect your GitHub repo and select the branch (e.g., `main`).
   - Set the Dockerfile path to `backend/Dockerfile`.
2. Set environment variables / secrets:
   - `MONGO_URI` (as a Render Secret)
   - `GEMINI_API_KEY` (as a Render Secret)
   - `DATABASE_NAME` (optional; default `sentinelmind`)
3. Deploy. Render will build the Docker image and run the service.

Optional: Use `render.yaml` (included) to declare the service and secrets as infrastructure-as-code. Replace the `repo` value and secret placeholders, then import with the Render dashboard or use the Render CLI.

Local testing before remote deploy
- Run the local docker compose stack:

```powershell
Set-Location d:\SentinelMind\sentinelmind-lite
.\scripts\deploy.ps1
```

Troubleshooting
- Ensure `backend/.env` values are set for local runs.
- For Render, ensure your backend listens on the `$PORT` provided by Render when not using Docker. (This repo's Dockerfile exposes 8000 and binds to 0.0.0.0.)

Next steps I can do for you
- Create GitHub Actions to build and push Docker image to a registry and trigger Render deploys.
- Configure Vercel and Render from the CLI (if you grant access tokens).
