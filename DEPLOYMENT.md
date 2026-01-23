# Deployment Guide

This guide will help you deploy the Booking Platform:
- **Backend** on Render
- **Frontend** on Vercel

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Render account (free tier available)
3. Vercel account (free tier available)
4. MongoDB Atlas account (free tier available)
5. Razorpay account (for payments)

---

## Part 1: Deploy Backend on Render

### Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Ensure `render.yaml` and `package.json` have the `start` script

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Render Service

**Basic Settings:**
- **Name**: `booking-employees-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `./` if needed)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**OR use render.yaml:**
- If you have `render.yaml` in your repo, Render will auto-detect it
- You can also manually configure in the dashboard

### Step 4: Set Environment Variables in Render

Go to **Environment** tab and add these variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
RAZORPAY_PLAN_ID=your_razorpay_plan_id
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Replace `your_mongodb_atlas_connection_string` with your actual MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (can use: `openssl rand -base64 32`)
- Get Razorpay keys from your Razorpay dashboard
- `FRONTEND_URL` will be set after deploying frontend

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your backend URL: `https://your-app-name.onrender.com`

### Step 6: Test Backend

Visit: `https://your-app-name.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Booking API is running"
}
```

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

Or use Vercel Dashboard (recommended for first time)

### Step 2: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select your repository

### Step 3: Configure Vercel Project

**Framework Preset:**
- Select **"Create React App"** or **"Other"**

**Root Directory:**
- Set to `client` (since your React app is in the client folder)

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**OR use vercel.json:**
- If you have `vercel.json` in your repo, Vercel will use it

### Step 4: Set Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

```
REACT_APP_API_URL=https://your-app-name.onrender.com/api
```

**Important:**
- Replace `your-app-name.onrender.com` with your actual Render backend URL
- Make sure to add this for **Production**, **Preview**, and **Development** environments

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment (usually 1-3 minutes)
4. You'll get a URL like: `https://your-app-name.vercel.app`

### Step 6: Update Backend CORS

1. Go back to Render Dashboard
2. Update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
3. Redeploy the backend (or it will auto-redeploy)

---

## Part 3: Configure MongoDB Atlas

### Step 1: Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. For Render: Add `0.0.0.0/0` (allow all IPs) OR add Render's IP ranges
5. For Vercel: Add `0.0.0.0/0` (allow all IPs) OR add Vercel's IP ranges

### Step 2: Database User

1. Go to **Database Access**
2. Create a database user (if not already created)
3. Note the username and password

### Step 3: Connection String

1. Go to **Clusters** → **Connect**
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your database password
5. Use this in `MONGODB_URI` environment variable

---

## Part 4: Configure Razorpay

### Step 1: Get API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Key ID** and **Key Secret**
4. Add these to Render environment variables

### Step 2: Webhook Configuration (Optional)

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-app-name.onrender.com/api/payments/webhook`
3. Copy the webhook secret and add to `RAZORPAY_WEBHOOK_SECRET`

---

## Part 5: Final Steps

### 1. Update Frontend API URL

After both are deployed:
- Frontend: `https://your-app-name.vercel.app`
- Backend: `https://your-app-name.onrender.com`

Update Vercel environment variable:
```
REACT_APP_API_URL=https://your-app-name.onrender.com/api
```

### 2. Test the Application

1. Visit your Vercel URL
2. Try to register/login
3. Test booking flow
4. Test payment (use Razorpay test mode)

### 3. Custom Domain (Optional)

**Vercel:**
- Go to Project Settings → Domains
- Add your custom domain

**Render:**
- Go to Service Settings → Custom Domain
- Add your custom domain

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check Render logs
- Verify `start` script in `package.json`
- Check environment variables

**Problem**: MongoDB connection error
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access
- Ensure IP is whitelisted

**Problem**: CORS errors
- Verify `FRONTEND_URL` in Render matches Vercel URL
- Check CORS configuration in `server/index.js`

### Frontend Issues

**Problem**: API calls failing
- Verify `REACT_APP_API_URL` in Vercel
- Check backend is running (visit `/api/health`)
- Check browser console for errors

**Problem**: Build fails
- Check build logs in Vercel
- Verify all dependencies are in `package.json`
- Check for TypeScript/ESLint errors

### Payment Issues

**Problem**: Razorpay not working
- Verify Razorpay keys are correct
- Check if using test/live keys appropriately
- Check Razorpay dashboard for errors

---

## Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_ID=...
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel (Frontend)
```
REACT_APP_API_URL=https://your-app.onrender.com/api
```

---

## Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Razorpay Documentation](https://razorpay.com/docs/)

---

## Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for frontend errors

Good luck with your deployment! 🚀
