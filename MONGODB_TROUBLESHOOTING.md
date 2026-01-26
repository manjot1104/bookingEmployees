# MongoDB Connection Troubleshooting

## Current Error: `getaddrinfo ENOTFOUND`

This error means your computer cannot resolve the MongoDB Atlas hostname. Here's how to fix it:

## Quick Fixes

### 1. Check Internet Connection
- Make sure you're connected to the internet
- Try accessing https://cloud.mongodb.com/ in your browser

### 2. Check MongoDB Atlas Cluster Status
1. Go to https://cloud.mongodb.com/
2. Login to your account
3. Check if your cluster is **running** (not paused)
4. If paused, click **"Resume"** to start it

### 3. Verify Connection String
Check your `.env` file has the correct connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 4. Check Network Access (IP Whitelist)
1. Go to MongoDB Atlas → **Security** → **Network Access**
2. Make sure your IP is whitelisted
3. Or temporarily add `0.0.0.0/0` to allow all IPs (for testing)

### 5. Try DNS Resolution
Test if you can resolve the hostname:
```bash
ping ac-b8ygcta-shard-00-00.o8yosoh.mongodb.net
```

## Alternative: Use Local MongoDB

If Atlas continues to have issues, switch to local MongoDB:

1. **Install MongoDB locally** (if not installed)
2. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bookingEmployees
   ```
3. **Start MongoDB service**
4. **Restart your server**

## Still Having Issues?

1. Check MongoDB Atlas dashboard for cluster status
2. Verify your connection string is correct
3. Check if your IP address changed
4. Try restarting your router/internet connection
5. Contact MongoDB Atlas support if cluster is down


