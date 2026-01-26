# Quick Guide: Switch from SendGrid to Gmail

## 🚀 Fastest Way to Send Emails (5 Minutes)

### Step 1: Enable Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other (Custom name)"**
5. Type: **"Booking Platform"**
6. Click **"Generate"**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update Your `.env` File

Replace your current SendGrid settings with Gmail settings:

**Remove these lines:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.1-mVv5ZmSM-dY5uhC3yu8w...
```

**Add these lines instead:**
```env
# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- Keep `ADMIN_EMAIL=nonavi080@gmail.com` as is

### Step 3: Restart Your Server

```bash
npm run dev
```

You should see:
```
✅ Email service connected successfully
   Using: smtp.gmail.com
```

### Step 4: Test It!

Create a test booking and check:
- ✅ User receives confirmation email
- ✅ Admin (`nonavi080@gmail.com`) receives notification

---

## ✅ That's It!

You're now using Gmail instead of SendGrid. No code changes needed!

**Gmail Limits:**
- 500 emails per day (free)
- Perfect for testing and small projects

---

## 🔄 Want to Switch Back to SendGrid?

Just change your `.env` back to:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.1-mVv5ZmSM-dY5uhC3yu8w...
```

Restart server and you're back to SendGrid!


