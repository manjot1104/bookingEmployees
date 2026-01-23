# Quick Fix: MongoDB Connection Timeout

## Problem
```
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms
```

## Solution: Whitelist Your IP in MongoDB Atlas

### Step-by-Step:

1. **Open MongoDB Atlas:**
   - Go to: https://cloud.mongodb.com/
   - Login to your account

2. **Navigate to Network Access:**
   - Click on your **Project**
   - Click **"Security"** in left sidebar
   - Click **"Network Access"**

3. **Add Your IP:**
   - Click green **"Add IP Address"** button
   - Select **"Add Current IP Address"** (recommended)
   - OR manually enter: `0.0.0.0/0` (allows all IPs - for testing only)
   - Click **"Confirm"**

4. **Wait:**
   - Wait 1-2 minutes for changes to take effect

5. **Restart Server:**
   ```bash
   npm run server
   ```

## Alternative: Use Local MongoDB

If you want to use local MongoDB instead:

1. **Install MongoDB:**
   - Download: https://www.mongodb.com/try/download/community
   - Install and start MongoDB service

2. **Update .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bookingEmployees
   ```

3. **Restart Server:**
   ```bash
   npm run server
   ```

## Verify Connection

After whitelisting IP, you should see:
```
✅ MongoDB connected successfully
```

If you still see errors, check:
- ✅ IP is whitelisted (wait 2 minutes after adding)
- ✅ Connection string in .env is correct
- ✅ MongoDB Atlas cluster is running
- ✅ Internet connection is stable
