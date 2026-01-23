# Quick Deployment Guide

## 🚀 Deploy Backend on Render

### Steps:
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **"New +"** → **"Web Service"**
4. Connect GitHub repo
5. Configure:
   - **Name**: `booking-employees-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   RAZORPAY_PLAN_ID=your_plan_id
   FRONTEND_URL=https://your-app.vercel.app (set after frontend deploy)
   ```

7. Click **"Create Web Service"**
8. Wait for deployment
9. Note your backend URL: `https://your-app.onrender.com`

---

## 🎨 Deploy Frontend on Vercel

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-app.onrender.com/api
   ```
   (Replace with your actual Render backend URL)

6. Click **"Deploy"**
7. Wait for deployment
8. Note your frontend URL: `https://your-app.vercel.app`

---

## ⚙️ Update Backend CORS

After frontend is deployed:
1. Go to Render Dashboard
2. Update `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Redeploy backend

---

## ✅ Test Deployment

1. **Backend**: Visit `https://your-app.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Booking API is running"}`

2. **Frontend**: Visit `https://your-app.vercel.app`
   - Should load the app
   - Try login/register
   - Test booking flow

---

## 📝 Important Notes

- **MongoDB Atlas**: Make sure to whitelist `0.0.0.0/0` in Network Access
- **Razorpay**: Use test keys for testing, live keys for production
- **Environment Variables**: Never commit `.env` file to GitHub
- **CORS**: Backend will automatically allow your Vercel frontend URL

---

## 🐛 Troubleshooting

**Backend not starting?**
- Check Render logs
- Verify `npm start` works locally
- Check environment variables

**Frontend can't connect to backend?**
- Verify `REACT_APP_API_URL` in Vercel
- Check backend is running
- Check CORS settings

**MongoDB connection error?**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access
- Ensure IP whitelisting

---

For detailed instructions, see `DEPLOYMENT.md`
