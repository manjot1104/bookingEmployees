# MongoDB Atlas Connection Setup

## Issue: IP Whitelist Error

If you're getting this error:
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Whitelist Your IP Address

### Step 1: Get Your Current IP Address
1. Go to https://www.whatismyip.com/
2. Copy your IP address

### Step 2: Add IP to MongoDB Atlas Whitelist

1. **Login to MongoDB Atlas:**
   - Go to https://cloud.mongodb.com/
   - Login to your account

2. **Navigate to Network Access:**
   - Click on your project
   - Go to **Security** → **Network Access** (left sidebar)

3. **Add IP Address:**
   - Click **"Add IP Address"** button
   - Choose one of these options:
     - **Add Current IP Address** (recommended) - automatically adds your current IP
     - **Add IP Address** - manually enter your IP
     - **Allow Access from Anywhere** - `0.0.0.0/0` (⚠️ Less secure, only for testing)

4. **Save:**
   - Click **"Confirm"**
   - Wait 1-2 minutes for changes to take effect

### Step 3: Verify Connection String

Make sure your `.env` file has the correct MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Important:**
- Replace `username` with your MongoDB username
- Replace `password` with your MongoDB password
- Replace `cluster` with your cluster name
- Replace `database` with your database name

### Step 4: Restart Server

After whitelisting your IP:
```bash
npm run server
```

## Alternative: Use Local MongoDB

If you want to use local MongoDB instead:

1. **Install MongoDB locally:**
   - Download from https://www.mongodb.com/try/download/community

2. **Update .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bookingEmployees
   ```

3. **Start MongoDB service:**
   - Windows: MongoDB should start automatically as a service
   - Or run: `mongod` in terminal

## Troubleshooting

### Still can't connect?
1. Check if your IP changed (if using dynamic IP)
2. Verify connection string is correct
3. Check MongoDB Atlas cluster is running
4. Try "Allow Access from Anywhere" temporarily for testing

### Connection Timeout?
- Check your internet connection
- Verify firewall isn't blocking MongoDB ports
- Try connecting from different network
