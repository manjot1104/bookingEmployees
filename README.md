# Employee Booking Platform

A full-stack booking platform designed for booking appointments with employees. This platform can be integrated into WordPress.

## Features

- User authentication (Login/Register)
- Employee listing with filters (Center, Expertise, Languages, Price, Gender)
- Booking system with slot management
- User dashboard for managing bookings
- Responsive design
- WordPress integration ready

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing

### Frontend
- React.js
- Axios for API calls
- CSS3 for styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
cd bookingEmployees
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookingEmployees
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Run the application**
```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Employees
- `GET /api/employees` - Get all employees (with filters)
- `GET /api/employees/:id` - Get single employee
- `GET /api/employees/:id/slots` - Get available slots

### Bookings
- `POST /api/bookings` - Create booking (requires auth)
- `GET /api/bookings/my-bookings` - Get user's bookings (requires auth)
- `GET /api/bookings/:id` - Get single booking (requires auth)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (requires auth)

## Dummy Data

The system comes with 7 pre-seeded employees:
1. Dr. Lavanya P Sharma - Psychiatrist (10+ years)
2. Dr. Ramakrishna Bhavanishankar - Psychiatrist (20+ years)
3. Dr. Elvin Lukose - Psychiatrist (6+ years)
4. Dr. Aakriti Peshion - Child and Youth Psychiatrist (8+ years)
5. Dr. Sharon Sankeshwar - Therapist (3+ years)
6. Dr. Aditya Mahindru - Psychiatrist (4+ years)
7. Dr. Divya Sharma - Therapist (5+ years)

## WordPress Integration

### Method 1: Iframe Embed
1. Build the React app:
```bash
cd client
npm run build
```

2. Upload the `build` folder to your WordPress server

3. Add this shortcode or HTML to your WordPress page:
```html
<iframe src="https://yourdomain.com/booking-app/index.html" 
        width="100%" 
        height="800px" 
        frameborder="0">
</iframe>
```

### Method 2: Direct Integration
1. Build the React app
2. Copy the built files to your WordPress theme directory
3. Enqueue the scripts in your theme's `functions.php`
4. Add a shortcode or page template to display the app

### Method 3: WordPress Plugin
Create a custom WordPress plugin that loads the React app. See `wordpress-integration.md` for detailed instructions.

## Project Structure

```
bookingEmployees/
├── server/
│   ├── index.js              # Express server
│   ├── models/               # MongoDB models
│   │   ├── User.js
│   │   ├── Employee.js
│   │   └── Booking.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── employees.js
│   │   └── bookings.js
│   ├── middleware/           # Middleware
│   │   └── auth.js
│   └── utils/                # Utilities
│       └── seedData.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Production Deployment

1. Set proper environment variables
2. Use a production MongoDB instance (MongoDB Atlas recommended)
3. Build the React app: `npm run build`
4. Serve the built files using a web server (nginx, Apache, etc.)
5. Use PM2 or similar for Node.js process management

## Future Enhancements

- Email notifications for bookings
- Payment integration
- Calendar sync
- Video call integration
- Admin dashboard
- Analytics and reporting

## License

ISC

## Support

For issues and questions, please contact the development team.
