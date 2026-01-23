# Quick Setup Guide

## Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. MongoDB will run on `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` file with your connection string

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookingEmployees
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a random secure string in production!

## Step 4: Start the Application

### Development Mode (Both server and client)
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend app on http://localhost:3000

### Or Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Step 5: Access the Application

1. Open http://localhost:3000 in your browser
2. Register a new account or login
3. Browse employees and make bookings!

## Dummy Data

The system automatically seeds 7 employees with dummy data when you first start the server. You can see them in the employee listing page.

## Testing the API

You can test the API endpoints using:
- Postman
- curl
- Browser (for GET requests)

Example:
```bash
# Health check
curl http://localhost:5000/api/health

# Get employees
curl http://localhost:5000/api/employees
```

## Next Steps

1. **Replace Dummy Data:** When you have real employee data, update `server/utils/seedData.js`
2. **Customize Design:** Edit CSS files in `client/src/components/` and `client/src/App.css`
3. **WordPress Integration:** Follow `wordpress-integration.md` guide
4. **Production Deployment:** See README.md for deployment instructions

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check Node.js version (should be v14+)

### CORS Errors
- Update CORS settings in `server/index.js`
- Add your frontend URL to allowed origins

## Need Help?

Check the main README.md for detailed documentation.
