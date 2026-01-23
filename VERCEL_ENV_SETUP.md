# Vercel Environment Variable Setup Guide

## ⚠️ IMPORTANT: Fix 404 Error

If you're getting 404 errors on login, it means the API URL is not configured correctly in Vercel.

---

## 🔧 Step-by-Step Fix

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on your project: **booking-employees**

### Step 2: Navigate to Environment Variables

1. Click on **Settings** (top menu)
2. Click on **Environment Variables** (left sidebar)

### Step 3: Add/Update Environment Variable

**Variable Name:**
```
REACT_APP_API_URL
```

**Value:**
```
https://bookingemployees.onrender.com/api
```

⚠️ **Important Notes:**
- ✅ Include `https://`
- ✅ Include `/api` at the end
- ✅ NO trailing slash after `/api`
- ✅ Should match your Render backend URL exactly

### Step 4: Select Environments

Check ALL three boxes:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

### Step 5: Save and Redeploy

1. Click **Save**
2. Go to **Deployments** tab
3. Click the **three dots** (⋯) on the latest deployment
4. Click **Redeploy**
5. Or push a new commit to trigger auto-deploy

---

## ✅ Verify Configuration

### Check 1: Environment Variable is Set

After redeploying, check browser console:
1. Open your app: https://booking-employees.vercel.app
2. Open DevTools (F12)
3. Go to **Console** tab
4. You should see: `🔗 API Base URL: https://bookingemployees.onrender.com/api`

If you see `http://localhost:5000/api`, the environment variable is NOT set correctly.

### Check 2: Test API Connection

1. Open browser console (F12)
2. Try to login
3. Check console for API requests
4. Should see: `📤 API Request: { method: 'POST', url: '/auth/login', ... }`

### Check 3: Backend is Accessible

Visit directly in browser:
```
https://bookingemployees.onrender.com/api/health
```

Should return:
```json
{"status":"OK","message":"Booking API is running"}
```

---

## 🐛 Common Issues

### Issue 1: Still seeing localhost URL

**Problem:** Environment variable not loaded
**Solution:**
1. Make sure variable name is exactly: `REACT_APP_API_URL`
2. Make sure it's set for Production environment
3. Redeploy the frontend
4. Clear browser cache

### Issue 2: 404 Error persists

**Problem:** Backend URL might be wrong
**Solution:**
1. Verify backend is running: https://bookingemployees.onrender.com/api/health
2. Check Render logs for errors
3. Verify the URL in Vercel matches Render URL exactly

### Issue 3: CORS Error

**Problem:** Backend not allowing Vercel origin
**Solution:**
1. Go to Render Dashboard
2. Add environment variable: `FRONTEND_URL = https://booking-employees.vercel.app`
3. Render will auto-redeploy

---

## 📝 Quick Checklist

- [ ] Vercel environment variable `REACT_APP_API_URL` is set
- [ ] Value is: `https://bookingemployees.onrender.com/api`
- [ ] Set for Production, Preview, and Development
- [ ] Frontend is redeployed after setting variable
- [ ] Backend health check works: `/api/health`
- [ ] Browser console shows correct API URL (not localhost)

---

## 🎯 Expected Result

After fixing:
- ✅ No 404 errors
- ✅ Login works
- ✅ API calls succeed
- ✅ Console shows correct API URL

---

## 💡 Pro Tip

To verify environment variables are loaded:
1. Add this to your code temporarily:
```javascript
console.log('API URL:', process.env.REACT_APP_API_URL);
```
2. Check browser console
3. Should show your Render backend URL

---

## 📞 Still Not Working?

If issues persist:
1. Check Vercel deployment logs
2. Check browser console for exact error
3. Verify backend is running on Render
4. Test backend endpoint directly in browser

Good luck! 🚀
