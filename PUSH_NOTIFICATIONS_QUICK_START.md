
# Push Notifications Quick Start

## ⚠️ CRITICAL: Manual Setup Required

**You MUST configure a Database Webhook in Supabase Dashboard for push notifications to work!**

### Setup Steps (5 minutes):

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/aidftnnusaeckhfambep
   - Click: **Database** → **Webhooks**

2. **Create New Webhook**
   - Click: **Create a new hook**
   - **Name**: `send-chat-notification`
   - **Table**: `chat_messages`
   - **Events**: ✅ INSERT
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification`
   - **Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]
     ```
     *(Get service role key from: Settings → API → service_role)*

3. **Save & Test**
   - Click **Create webhook**
   - Send a test message in the app
   - Check Edge Function logs for activity

## What's Already Implemented

✅ Database tables (`push_tokens`, `chat_read_status`)
✅ Edge function (`send-chat-notification`)
✅ Frontend hook (`usePushNotifications`)
✅ Read status tracking in ChatTab
✅ Unread badges on job cards
✅ Notification tap navigation

## Testing Checklist

- [ ] Webhook configured in Supabase Dashboard
- [ ] App installed on physical device (not simulator)
- [ ] Notification permissions granted
- [ ] Push token saved to database (check console logs)
- [ ] Send message from User A
- [ ] User B receives notification
- [ ] Tap notification navigates to correct job
- [ ] Unread badge appears on job card
- [ ] Badge clears when chat is opened

## Quick Verification

```bash
# Check if push token was saved
SELECT * FROM push_tokens WHERE user_id = '[YOUR_USER_ID]';

# Check read status
SELECT * FROM chat_read_status WHERE user_id = '[YOUR_USER_ID]';

# Check recent messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5;
```

## Common Issues

**"No notifications received"**
→ Check webhook is configured and enabled

**"Push token not saved"**
→ Must use physical device, not simulator

**"Notification received but doesn't navigate"**
→ Check console logs when tapping notification

**"Unread badge not showing"**
→ Verify chat_read_status is being updated

## Documentation

See `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` for complete details.
