# EMS Backend — Setup & Deployment Guide

## Local Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create your .env file
Copy `.env.example` to `.env` and fill in values:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=any_long_random_string_here
PORT=5000
```

### 3. Seed the database
This fills MongoDB with all your mock data (candidates, voters, officers, booths, etc.)
```bash
npm run seed
```
You only need to run this once. If you re-run it, it clears and re-inserts everything.

### 4. Start the server
```bash
npm run dev       # development (auto-restarts on file change)
npm start         # production
```

Server runs on http://localhost:5000
Test it: http://localhost:5000/ should return `{ "status": "EMS API running" }`

---

## MongoDB Atlas Setup (do this first)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new Project → Create a Cluster → choose **M0 Free Tier**
3. When asked: create a **Database User** with a username + password (save these)
4. Under **Network Access** → Add IP Address → click **Allow Access from Anywhere** (0.0.0.0/0)
   - This is required for Render to connect
5. Go to your cluster → **Connect** → **Drivers** → copy the connection string
6. Replace `<password>` in the string with your DB user's password
7. Paste the full string as `MONGO_URI` in your `.env`

The string looks like:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/ems?retryWrites=true&w=majority
```
The `/ems` part at the end is your database name — keep it.

---

## Deploy Backend to Render

1. Push the `backend/` folder to a **separate GitHub repo** (e.g. `bd-ems-backend`)
2. Go to https://render.com → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Under **Environment Variables**, add:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = any long random string
6. Click **Deploy**
7. Render gives you a URL like: `https://bd-ems-backend.onrender.com`

**Important:** Free tier Render services sleep after 15 min inactivity. First request after sleep takes ~30 seconds. Fine for a demo/project.

---

## Deploy Frontend to Netlify (update existing)

1. In your frontend repo, go to Netlify → Site Settings → **Environment Variables**
2. Add: `VITE_API_URL` = `https://bd-ems-backend.onrender.com` (your Render URL)
3. Redeploy the frontend (push a commit or trigger manual deploy)

That's it. Frontend reads `VITE_API_URL` at build time and all API calls go to your Render backend.

---

## API Endpoints Reference

| Method | Endpoint | Auth | Who |
|--------|----------|------|-----|
| POST | /api/voter/login | None | Voter |
| POST | /api/voter/vote | Voter JWT | Voter |
| GET | /api/voter/me | Voter JWT | Voter |
| POST | /api/officer/login | None | Any officer |
| GET | /api/booth/my | Officer JWT | APO |
| POST | /api/booth/submit | Officer JWT | APO |
| GET | /api/station/my | Officer JWT | PO |
| POST | /api/station/verify | Officer JWT | PO |
| GET | /api/incidents | Officer JWT | PO/ARO/RO |
| POST | /api/incidents | Officer JWT | PO |
| POST | /api/constituency/compile | Officer JWT | ARO |
| GET | /api/results/public | None | Everyone |
| POST | /api/results/declare | Officer JWT | RO |
| GET | /api/audit | Officer JWT | RO |

---

## Frontend Changes Needed in Dashboards

The ElectionContext now exposes `fetch*` functions instead of data loaded on startup.
Each dashboard needs to call the right fetch function in a `useEffect`:

**VoterDashboard.jsx** — add at top of component:
```js
const { fetchPublicResults } = useElection();
useEffect(() => { fetchPublicResults(); }, []);
```

**APODashboard.jsx** — replace the `booths` from context with fetched data:
```js
const { booths, fetchMyBooths, submitBooth } = useElection();
useEffect(() => { fetchMyBooths(); }, []);
// Remove: import { CANDIDATES, BOOTHS, STATIONS } from "../../data/mockData"
// Candidates now come from context as `candidates` array
```

**PODashboard.jsx:**
```js
const { stations, fetchMyStation, fetchIncidents, incidents, verifyStation, reportIncident } = useElection();
useEffect(() => { fetchMyStation(); fetchIncidents(); }, []);
```

**ARODashboard.jsx:**
```js
const { fetchPublicResults, compileConstituency } = useElection();
useEffect(() => { fetchPublicResults(); }, []);
```

**RODashboard.jsx:**
```js
const { fetchPublicResults, fetchAuditLog, declareResults } = useElection();
useEffect(() => { fetchPublicResults(); fetchAuditLog(); }, []);
```

**Guest.jsx:**
```js
const { fetchPublicResults } = useElection();
useEffect(() => {
  fetchPublicResults();
  const interval = setInterval(fetchPublicResults, 5000); // real polling
  return () => clearInterval(interval);
}, []);
```

Also in every dashboard: remove any `import { CANDIDATES, ... } from "../../data/mockData"`.
Use `candidates` from `useElection()` context instead.
