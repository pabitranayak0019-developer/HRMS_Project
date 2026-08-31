# HRMS — Deployment Guide

Deploy your Corporate Employee Management Portal publicly in ~15 minutes.

---

## Overview

| Component | Platform | URL |
|---|---|---|
| **Database** | MongoDB Atlas (free M0) | `mongodb+srv://...` |
| **Backend** | Render.com (free) | `https://hrms-backend-xxxx.onrender.com` |
| **Frontend** | Vercel (free) | `https://hrms-frontend-xxxx.vercel.app` |

---

## Step 1 — MongoDB Atlas (Database)

1. Go to **https://cloud.mongodb.com** → Sign up (free)
2. Click **Build a Database** → choose **M0 FREE**
3. Choose a cloud region (closest to your users, e.g. **Mumbai**)
4. Create a **Database User**:
   - Username: `hrms_user`
   - Password: choose a strong password (save it!)
5. Click **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
6. Click **Database** → **Connect** → **Connect your application**
7. Copy the connection string. It looks like:
   ```
   mongodb+srv://hrms_user:<password>@cluster0.xxxxx.mongodb.net/hrms_db?retryWrites=true&w=majority
   ```
8. **Replace `<password>`** with your actual database user password

**Save this connection string — you'll need it in Step 2.**

---

## Step 2 — Backend (Render.com)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (push your code to GitHub first if you haven't)
   - Or use **Manual Deploy** → upload the zip
4. Fill in:
   - **Name**: `hrms-backend`
   - **Region**: (nearest)
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free
5. Add **Environment Variables** (click "Add Environment Variable" for each):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | _(paste your Atlas connection string from Step 1)_ |
   | `JWT_SECRET` | _(click "Generate" or type a random string like `my_hrms_secret_2026_xyz`)_ |
   | `JWT_EXPIRES_IN` | `8h` |
   | `CLIENT_URL` | _(leave empty for now — update after frontend deploy)_ |

6. Click **Create Web Service**
7. Wait for deploy to finish (~2-3 min). You'll get a URL like:
   ```
   https://hrms-backend-xxxx.onrender.com
   ```
8. Test: open `https://hrms-backend-xxxx.onrender.com/api/health`
   - Should show: `{"success":true,"message":"HRMS API is running"}`

> **Note:** Render free tier sleeps after 15 min of inactivity. First request takes ~30s to wake up. This is normal for free tier.

---

## Step 3 — Seed the database

After backend is live, seed demo data:

1. Go to Render dashboard → your backend service → **Shell** tab
2. Run:
   ```bash
   node seed/seed.js
   ```
3. Wait for "SEED COMPLETE" message
4. Demo accounts are ready:
   - HR Admin: `hr@nexuscorp.example` / `Welcome@123`
   - Manager: `manager@nexuscorp.example` / `Welcome@123`
   - Employee: `employee@nexuscorp.example` / `Welcome@123`

---

## Step 4 — Frontend (Vercel)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your GitHub repo
3. Fill in:
   - **Framework**: Vite (auto-detected)
   - **Root Directory**: `frontend/` (important!)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
4. Add **Environment Variables** (click "Add" for each):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://hrms-backend-xxxx.onrender.com/api` _(your Render URL + /api)_ |
   | `VITE_UPLOADS_URL` | `https://hrms-backend-xxxx.onrender.com` _(your Render URL)_ |

   > ⚠️ Replace `hrms-backend-xxxx` with your actual Render URL from Step 2.

5. Click **Deploy**
6. Wait ~1-2 min. You'll get a URL like:
   ```
   https://hrms-frontend-xxxx.vercel.app
   ```
7. **Open it** → Login page appears → Use demo credentials to test

---

## Step 5 — Final CORS Update

1. Go back to **Render dashboard** → your backend → **Environment** tab
2. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL = https://hrms-frontend-xxxx.vercel.app
   ```
3. Save → Render auto-redeploys (~1 min)

**Done! Your HRMS is now live at your Vercel URL. 🎉**

---

## Important Notes

### Demo Data
After each Render redeploy, the filesystem resets but **MongoDB data persists**. Seed only needed once.

### File Uploads
Render free tier has an **ephemeral filesystem** — uploaded photos/receipts reset on redeploy. For production, you'd use AWS S3. For a demo/internship, this is fine.

### First Load
Render free tier sleeps after inactivity. First visit takes ~30 seconds. Subsequent requests are instant.

### Budget
All platforms have **free tiers**. Total cost for internship demo: **₹0**

---

## Quick Commands

```bash
# Local development
cd backend && npm run dev     # localhost:5000
cd frontend && npm run dev    # localhost:5173

# Production deploy
# Push code to GitHub → Vercel/Render auto-deploy
```
