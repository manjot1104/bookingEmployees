# SendGrid Configuration - Ready to Use!

## Your SendGrid API Key
You've successfully created your API key: `sendbookmail`

## Add to .env File

Add these lines to your `.env` file:

```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here

# Admin Email (who receives booking notifications)
ADMIN_EMAIL=your-admin-email@yourcompany.com
```

## Important Notes:

1. **SMTP_USER** must be exactly: `apikey` (lowercase, no spaces)
2. **SMTP_PASS** is your SendGrid API Key (the one you just created)
3. **ADMIN_EMAIL** - Replace with the email address that should receive booking notifications

## Next Steps:

1. **Verify Sender Email** (if not done already):
   - Go to SendGrid Dashboard → Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter the email you want to send from
   - Verify it via email

2. **Add credentials to .env file** (as shown above)

3. **Set ADMIN_EMAIL** to your coordinator's email address

4. **Restart your server**

5. **Test it**: Create a booking and check both email inboxes!

## What Happens:

When a booking is created:
- ✅ User receives confirmation email
- ✅ Admin receives notification email

When payment is confirmed:
- ✅ User receives updated confirmation email
- ✅ Admin receives payment notification

## Troubleshooting:

If emails don't send:
- Check server console for "✅ Email service connected successfully"
- Verify your API key is correct
- Make sure sender email is verified in SendGrid
- Check SendGrid Activity → Email Activity for delivery status

