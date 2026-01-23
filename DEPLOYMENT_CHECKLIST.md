# Deployment Verification Checklist

## ✅ Your Deployed URLs

- **Backend (Render)**: https://bookingemployees.onrender.com
- **Frontend (Vercel)**: https://booking-employees.vercel.app

---

## 🔍 Step 1: Verify Backend is Running

### Test Backend Health:
Visit: https://bookingemployees.onrender.com/api/health

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Booking API is running"
}
```

✅ If you see this, backend is working!

---

## 🔍 Step 2: Verify Frontend Configuration

### Check Vercel Environment Variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `booking-employees`
3. Go to **Settings** → **Environment Variables**
4. Verify this variable exists:

```
REACT_APP_API_URL = https://bookingemployees.onrender.com/api
```

⚠️ **Important**: 
- Make sure it's set for **Production**, **Preview**, and **Development**
- The URL should NOT have a trailing slash
- After adding/updating, **redeploy** the frontend

---

## 🔍 Step 3: Verify Backend CORS Configuration

### Check Render Environment Variables:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service: `bookingemployees`
3. Go to **Environment** tab
4. Verify these variables exist:

```
NODE_ENV = production
PORT = 10000
MONGODB_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_secret
RAZORPAY_KEY_ID = your_razorpay_key_id
RAZORPAY_KEY_SECRET = your_razorpay_key_secret
FRONTEND_URL = https://booking-employees.vercel.app
```

⚠️ **Important**: 
- `FRONTEND_URL` should match your Vercel URL exactly
- After updating, Render will auto-redeploy

---

## 🔍 Step 4: Test Frontend-Backend Connection

### Test in Browser Console:

1. Open your frontend: https://booking-employees.vercel.app
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Try to register/login
5. Check for errors:

**Common Errors:**

❌ **CORS Error**: 
```
Access to fetch at 'https://bookingemployees.onrender.com/api/...' from origin 'https://booking-employees.vercel.app' has been blocked by CORS policy
```
**Fix**: Update `FRONTEND_URL` in Render environment variables

❌ **404 Error**:
```
GET https://bookingemployees.onrender.com/api/... 404
```
**Fix**: Check if backend URL is correct in Vercel environment variables

❌ **Network Error**:
```
Network Error
```
**Fix**: Check if backend is running (visit /api/health)

---

## 🔍 Step 5: Test Complete Flow

### Test These Features:

1. ✅ **Registration/Login**
   - Go to frontend
   - Try to register a new user
   - Try to login

2. ✅ **View Employees**
   - After login, check if employees list loads
   - Check if filters work

3. ✅ **View Employee Profile**
   - Click on any employee
   - Check if profile page loads
   - Check if slots are visible

4. ✅ **Create Booking**
   - Try to book a slot
   - Complete payment flow

5. ✅ **View My Bookings**
   - Go to "My Bookings"
   - Check if bookings are displayed

---

## 🐛 Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:**
1. Check Vercel environment variable: `REACT_APP_API_URL`
2. Should be: `https://bookingemployees.onrender.com/api`
3. Redeploy frontend after updating

### Issue: CORS errors

**Solution:**
1. Check Render environment variable: `FRONTEND_URL`
2. Should be: `https://booking-employees.vercel.app`
3. Render will auto-redeploy

### Issue: Backend not responding

**Solution:**
1. Check Render logs
2. Verify MongoDB connection
3. Check if all environment variables are set

### Issue: Payment not working

**Solution:**
1. Verify Razorpay keys in Render
2. Check if using test/live keys appropriately
3. Check Razorpay dashboard for errors

---

## 📝 Quick Fix Commands

### Update Vercel Environment Variable:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add/Update: `REACT_APP_API_URL = https://bookingemployees.onrender.com/api`
3. Redeploy

### Update Render Environment Variable:
1. Render Dashboard → Service → Environment
2. Add/Update: `FRONTEND_URL = https://booking-employees.vercel.app`
3. Auto-redeploys

---

## ✅ Final Checklist

- [ ] Backend health check works: `/api/health`
- [ ] Vercel has `REACT_APP_API_URL` set correctly
- [ ] Render has `FRONTEND_URL` set correctly
- [ ] Frontend can register/login users
- [ ] Frontend can load employees
- [ ] Frontend can create bookings
- [ ] Frontend can view bookings
- [ ] Payment flow works (if tested)

---

## 🎉 Success Indicators

If everything is working:
- ✅ No CORS errors in browser console
- ✅ API calls return 200 status
- ✅ Data loads correctly
- ✅ User can complete booking flow

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Render logs for backend errors
3. Check Vercel logs for build errors
4. Verify all environment variables are set correctly

Good luck! 🚀
