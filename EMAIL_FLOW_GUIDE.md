# Email Flow Guide - What Happens & What You'll Receive

## 📧 Email Flow Overview

When a user books a session, **TWO emails are sent automatically**:

1. **User Confirmation Email** → Sent to the user who made the booking
2. **Admin Notification Email** → Sent to `nonavi080@gmail.com` (your admin email)

---

## 🎯 Step-by-Step: What You Need to Do

### Step 1: Restart Your Server
```bash
npm run dev
```

When the server starts, you should see:
```
✅ Email service connected successfully
   Using: smtp.sendgrid.net
```

### Step 2: Verify SendGrid Sender Email
1. Go to SendGrid Dashboard: https://app.sendgrid.com
2. Navigate to **Settings** → **Sender Authentication**
3. Make sure you have verified at least one sender email
4. This is the email address that will **send** the emails (the "From" address)

### Step 3: Test It!
Create a test booking on your platform to trigger the emails.

---

## 📬 What Emails You'll Receive

### Email 1: User Confirmation Email
**Sent to:** The user who made the booking (their email address)

**Subject:** `Booking Confirmation - Session with [Therapist Name]`

**Contains:**
- ✅ Booking confirmation message
- ✅ Therapist name and title
- ✅ Booking date and time
- ✅ Session type (Online/In-person)
- ✅ Duration (45 minutes)
- ✅ Amount/Price
- ✅ Booking status
- ✅ Payment status
- ✅ Any notes the user added

**When it's sent:**
- ✅ Immediately when booking is created
- ✅ Again when payment is confirmed

---

### Email 2: Admin Notification Email
**Sent to:** `nonavi080@gmail.com` (your admin email from `.env`)

**Subject:** `New Booking Received - [User Name] with [Therapist Name]`

**Contains:**
- ✅ Booking ID
- ✅ User information (name, email, phone if available)
- ✅ Therapist information (name, title)
- ✅ Booking date and time
- ✅ Session type
- ✅ Duration
- ✅ Amount/Price
- ✅ Booking status
- ✅ Payment status
- ✅ User notes (if any)

**When it's sent:**
- ✅ Immediately when booking is created
- ✅ Again when payment is confirmed

---

## 🔄 Complete Email Flow

### Scenario 1: User Creates a Booking
```
User books a session
    ↓
Booking created in database
    ↓
📧 Email 1 → User receives confirmation
📧 Email 2 → Admin (nonavi080@gmail.com) receives notification
```

### Scenario 2: User Completes Payment
```
User completes Razorpay payment
    ↓
Payment verified
    ↓
📧 Email 1 → User receives updated confirmation (with payment status)
📧 Email 2 → Admin receives payment confirmation notification
```

---

## ✅ How to Verify Emails Are Working

### Check 1: Server Console
When you create a booking, check your server console for:
```
✅ Email sent successfully: [message-id]
```

If you see errors:
```
❌ Error sending email: [error message]
```
Check your SendGrid configuration.

### Check 2: SendGrid Dashboard
1. Go to SendGrid Dashboard
2. Navigate to **Activity** → **Email Activity**
3. You'll see all sent emails with delivery status

### Check 3: Email Inboxes
- **User's email inbox** → Should receive confirmation
- **Admin email inbox** (`nonavi080@gmail.com`) → Should receive notification

---

## 🎯 Quick Test Checklist

1. ✅ Server is running with email service connected
2. ✅ SendGrid sender email is verified
3. ✅ Create a test booking
4. ✅ Check user's email inbox
5. ✅ Check admin email inbox (`nonavi080@gmail.com`)
6. ✅ Check SendGrid Activity dashboard

---

## 📋 Email Recipients Summary

| Event | User Email | Admin Email |
|-------|-----------|-------------|
| Booking Created | ✅ Confirmation | ✅ Notification |
| Payment Confirmed | ✅ Updated Confirmation | ✅ Payment Notification |

---

## ⚠️ Troubleshooting

### No emails received?

1. **Check server console** for email errors
2. **Verify SendGrid sender** is authenticated
3. **Check SendGrid Activity** dashboard for delivery status
4. **Check spam folder** - emails might be filtered
5. **Verify `.env` file** has correct `ADMIN_EMAIL`

### Emails going to spam?

- SendGrid might need domain authentication for better deliverability
- Check SendGrid dashboard for delivery issues
- Verify sender email is properly authenticated

---

## 🎉 Summary

**After restarting your server:**
- ✅ Every booking triggers **2 emails** automatically
- ✅ User gets confirmation
- ✅ Admin (`nonavi080@gmail.com`) gets notification
- ✅ Both emails sent again when payment is confirmed

**No manual action needed** - it's all automated! 🚀


