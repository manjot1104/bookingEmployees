# Email Alternatives - Send Emails Without SendGrid

Yes! You can use **any SMTP email service**. Your system is already set up to work with any provider.

---

## 🎯 Quick Switch Guide

Just update your `.env` file with different SMTP settings. No code changes needed!

---

## Option 1: Gmail (Easiest & Free)

**Best for:** Testing, development, small projects

### Setup Steps:

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Booking Platform"
   - Copy the 16-character password

3. **Update `.env` file**:
```env
# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Admin email
ADMIN_EMAIL=nonavi080@gmail.com
```

**Limitations:**
- 500 emails/day free
- May have deliverability issues for bulk emails

---

## Option 2: Mailgun (Best Free Tier)

**Best for:** Production, high volume

**Free Tier:** 5,000 emails/month free

### Setup Steps:

1. **Sign up** at https://www.mailgun.com
2. **Get SMTP credentials**:
   - Go to Sending → Domain Settings
   - Copy SMTP credentials

3. **Update `.env` file**:
```env
# Mailgun SMTP Settings
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password

# Admin email
ADMIN_EMAIL=nonavi080@gmail.com
```

**Advantages:**
- Better deliverability than Gmail
- 5,000 free emails/month
- Good for production

---

## Option 3: AWS SES (Amazon)

**Best for:** High volume, enterprise

**Free Tier:** 62,000 emails/month (if on EC2)

### Setup Steps:

1. **Sign up** for AWS account
2. **Create SES credentials**:
   - Go to AWS SES Console
   - Create SMTP credentials

3. **Update `.env` file**:
```env
# AWS SES SMTP Settings
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Your region
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password

# Admin email
ADMIN_EMAIL=nonavi080@gmail.com
```

**Advantages:**
- Very high volume
- Excellent deliverability
- Pay-as-you-go pricing

---

## Option 4: Outlook/Hotmail

**Best for:** Personal use, testing

### Setup Steps:

1. **Enable 2-Step Verification**
2. **Generate App Password**

3. **Update `.env` file**:
```env
# Outlook SMTP Settings
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password

# Admin email
ADMIN_EMAIL=nonavi080@gmail.com
```

---

## Option 5: Custom SMTP Server

**Best for:** Corporate email, custom domains

If you have your own email server or corporate email:

```env
# Custom SMTP Settings
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourcompany.com
SMTP_PASS=your-password

# Admin email
ADMIN_EMAIL=nonavi080@gmail.com
```

---

## 🔄 How to Switch

### Step 1: Choose Your Provider
Pick one from the options above.

### Step 2: Get Credentials
Follow the setup steps for your chosen provider.

### Step 3: Update `.env` File
Replace the SendGrid settings with your new provider's settings:

**Current (SendGrid):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.1-mVv5ZmSM-dY5uhC3yu8w...
```

**New (Example - Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Restart Server
```bash
npm run dev
```

You should see:
```
✅ Email service connected successfully
   Using: smtp.gmail.com  (or your new provider)
```

---

## 📊 Comparison Table

| Provider | Free Tier | Setup Time | Best For |
|----------|-----------|------------|----------|
| **Gmail** | 500/day | 5 min | Testing, small projects |
| **Mailgun** | 5,000/month | 10 min | Production |
| **SendGrid** | 100/day | 10 min | Production |
| **AWS SES** | 62,000/month* | 15 min | High volume |
| **Outlook** | 300/day | 5 min | Personal use |

*If running on EC2

---

## ✅ Recommendation

**For Development/Testing:**
- Use **Gmail** (easiest setup)

**For Production:**
- Use **Mailgun** (best free tier: 5,000/month)
- Or **AWS SES** (if you need more volume)

---

## 🧪 Testing After Switch

1. Restart your server
2. Create a test booking
3. Check both email inboxes:
   - User email
   - Admin email (`nonavi080@gmail.com`)

---

## ⚠️ Important Notes

1. **No code changes needed** - just update `.env` file
2. **Keep `ADMIN_EMAIL`** - this stays the same
3. **Restart server** after changing `.env`
4. **Test immediately** to verify it works

---

## 🎉 Summary

**You can switch anytime!** Just update your `.env` file with different SMTP settings. The system works with any SMTP provider.

**Easiest option:** Gmail (5 minutes setup)
**Best free tier:** Mailgun (5,000 emails/month)


