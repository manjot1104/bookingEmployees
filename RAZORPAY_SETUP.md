# Razorpay Integration Setup

## Step 1: Get Razorpay Keys

1. Go to https://razorpay.com and create an account
2. Login to Razorpay Dashboard
3. Go to Settings → API Keys
4. Generate Test/Live API Keys
5. Copy your **Key ID** and **Key Secret**

## Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Important:** 
- For testing, use **Test Keys** (starts with `rzp_test_`)
- For production, use **Live Keys** (starts with `rzp_live_`)
- Never commit your `.env` file to git!

## Step 3: Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies (if not already installed)
cd client
npm install
```

## Step 4: Test Payment Flow

1. Start the server: `npm run dev`
2. Go to booking page
3. Click "MAKE PAYMENT"
4. Razorpay checkout will open
5. Use test card details:
   - **Card Number:** 4111 1111 1111 1111
   - **CVV:** Any 3 digits (e.g., 123)
   - **Expiry:** Any future date (e.g., 12/25)
   - **Name:** Any name

## Payment Flow

1. User clicks "MAKE PAYMENT"
2. Booking is created in database (status: Pending)
3. Razorpay order is created
4. Razorpay checkout opens
5. User completes payment
6. Payment is verified on backend
7. Booking status updated to "Confirmed"
8. User redirected to home page

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
Body: { bookingId, amount }
Response: { orderId, amount, currency, key }
```

### Verify Payment
```
POST /api/payments/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
Response: { success, message, booking }
```

## Security Notes

- Payment signature is verified on backend
- Never expose Key Secret to frontend
- Always verify payment on backend before confirming booking
- Use HTTPS in production

## Troubleshooting

### Payment not working?
1. Check if Razorpay keys are in `.env` file
2. Verify keys are correct (no extra spaces)
3. Check browser console for errors
4. Check server logs for payment errors

### Test Mode
- Use test keys for development
- Test cards work only with test keys
- No real money is charged in test mode

## Production Checklist

- [ ] Switch to Live API Keys
- [ ] Update `.env` with production keys
- [ ] Enable HTTPS
- [ ] Test payment flow thoroughly
- [ ] Set up webhook for payment notifications (optional)
