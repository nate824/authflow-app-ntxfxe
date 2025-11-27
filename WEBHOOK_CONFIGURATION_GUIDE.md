
# Database Webhook Configuration Guide

## Why This Is Needed

The push notification system requires a **Database Webhook** to automatically trigger the edge function when new chat messages are inserted. Without this webhook, notifications will not be sent.

## Step-by-Step Configuration

### 1. Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **aidftnnusaeckhfambep**
3. Navigate to: **Database** → **Webhooks** (in the left sidebar)

### 2. Create New Webhook

Click the **"Create a new hook"** button (or **"Enable Webhooks"** if this is your first webhook)

### 3. Configure Webhook Settings

Fill in the following fields:

#### Basic Settings:
- **Name**: `send-chat-notification`
- **Table**: `chat_messages`
- **Events**: Check **INSERT** only (uncheck UPDATE and DELETE)

#### HTTP Request Settings:
- **Type**: `HTTP Request`
- **HTTP Method**: `POST`
- **URL**: 
  ```
  https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification
  ```

#### HTTP Headers:
Click **"Add header"** and add these two headers:

1. **Header 1:**
   - Name: `Content-Type`
   - Value: `application/json`

2. **Header 2:**
   - Name: `Authorization`
   - Value: `Bearer [YOUR_SERVICE_ROLE_KEY]`

**To get your service role key:**
1. Go to: **Settings** → **API** (in the left sidebar)
2. Find the **service_role** key (under "Project API keys")
3. Click the eye icon to reveal it
4. Copy the entire key
5. Paste it after `Bearer ` in the Authorization header

⚠️ **IMPORTANT**: Make sure there's a space after `Bearer` and before the key!

Example:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGZ0bm51c2FlY2toZmFtYmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjg1NjAwMCwiZXhwIjoyMDI4NDMyMDAwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Payload (Optional):
Leave the default payload template. It should look something like:
```json
{
  "type": "{{ .Type }}",
  "table": "{{ .Table }}",
  "record": {{ .Record }},
  "schema": "{{ .Schema }}",
  "old_record": {{ .OldRecord }}
}
```

### 4. Save Webhook

1. Review all settings
2. Click **"Create webhook"** or **"Save"**
3. The webhook should now appear in your webhooks list with status **"Active"**

### 5. Test the Webhook

#### Option A: Send a Test Message
1. Open your app on a physical device
2. Send a message in any job
3. Check if notifications are received on other users' devices

#### Option B: Manual Test via Dashboard
1. In the webhooks list, find your webhook
2. Click the **"..."** menu → **"Test webhook"**
3. This will send a test payload to your edge function

#### Option C: Check Edge Function Logs
1. Go to: **Edge Functions** → **send-chat-notification** → **Logs**
2. Send a message in the app
3. You should see log entries showing the function was called

## Verification Checklist

- [ ] Webhook created with name `send-chat-notification`
- [ ] Table set to `chat_messages`
- [ ] INSERT event is checked
- [ ] URL is correct: `https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification`
- [ ] Content-Type header is `application/json`
- [ ] Authorization header includes `Bearer [service_role_key]`
- [ ] Webhook status shows as **Active**
- [ ] Test message triggers notification

## Troubleshooting

### Webhook Not Firing

**Check webhook status:**
- Go to Database → Webhooks
- Ensure status is "Active" (not "Inactive" or "Error")

**Check webhook logs:**
- Click on the webhook name
- View the "Logs" or "History" tab
- Look for delivery attempts and errors

**Common issues:**
- Missing or incorrect Authorization header
- Typo in the URL
- Edge function is not deployed
- Service role key is expired or incorrect

### Edge Function Not Receiving Requests

**Check edge function logs:**
1. Go to: Edge Functions → send-chat-notification → Logs
2. Look for incoming requests
3. If no requests appear, the webhook is not firing

**Verify edge function is deployed:**
1. Go to: Edge Functions
2. Ensure `send-chat-notification` shows status "Active"
3. Check the version number (should be 2 or higher)

### Notifications Still Not Sent

**Check edge function logs for errors:**
- Database connection errors
- Missing push tokens
- Expo API errors

**Verify push tokens exist:**
```sql
SELECT * FROM push_tokens;
```

**Check job invitations:**
```sql
SELECT * FROM job_invitations WHERE job_id = '[JOB_ID]';
```

## Alternative: Using Database Trigger (Current Fallback)

If you cannot configure the webhook, the system will fall back to using a database trigger with `pg_net`. However, this requires the edge function to accept unauthenticated requests, which is less secure.

The trigger is already created and will attempt to call the edge function, but it may fail due to authentication requirements.

## Security Notes

⚠️ **Keep your service role key secure!**
- Never commit it to version control
- Never share it publicly
- Only use it in secure server-side contexts
- Rotate it periodically

The service role key bypasses Row Level Security (RLS) policies, so it should only be used in trusted contexts like webhooks and edge functions.

## Need Help?

If you encounter issues:
1. Check the webhook logs in Supabase Dashboard
2. Check the edge function logs
3. Verify all settings match this guide
4. Try deleting and recreating the webhook
5. Contact Supabase support if issues persist

## Success!

Once configured correctly, you should see:
- ✅ Webhook shows "Active" status
- ✅ Edge function logs show incoming requests
- ✅ Push notifications are delivered to devices
- ✅ Unread badges appear on job cards

The push notification system is now fully operational! 🎉
