
# Push Notifications Implementation Summary

## ✅ What Has Been Implemented

### 1. Database Schema ✅
- **push_tokens** table: Stores Expo push tokens for each user/device
- **chat_read_status** table: Tracks when users last read messages in each job
- Both tables have RLS policies enabled for security

### 2. Edge Function ✅
- **send-chat-notification**: Processes new messages and sends push notifications
- Fetches job details, sender info, and recipient list
- Sends notifications via Expo Push API
- Handles errors gracefully

### 3. Database Trigger ✅
- Trigger function: `notify_new_chat_message()`
- Automatically calls edge function when new message is inserted
- Uses `pg_net` extension for async HTTP requests

### 4. Frontend Implementation ✅

#### Push Notifications Hook (`hooks/usePushNotifications.ts`)
- Requests notification permissions on app startup
- Registers device and gets Expo push token
- Saves token to database
- Handles notification taps → navigates to job chat
- Handles notifications received while app is open

#### Chat Read Status (`components/job/ChatTab.tsx`)
- Marks messages as read when chat is opened
- Updates read status when new messages arrive while viewing
- Prevents duplicate notifications for already-seen messages

#### Unread Badges (`app/(tabs)/(home)/index.tsx`)
- Shows unread message count on each job card
- Queries messages created after last read time
- Excludes user's own messages from count
- Updates in real-time

### 5. App Configuration ✅
- Added `expo-notifications` plugin to `app.json`
- Configured notification icon and settings
- Android notification channel configured

## ⚠️ Manual Setup Required

**CRITICAL**: You must configure a Database Webhook in Supabase Dashboard:

1. Go to: **Supabase Dashboard** → **Database** → **Webhooks**
2. Create webhook:
   - Name: `send-chat-notification`
   - Table: `chat_messages`
   - Event: INSERT
   - URL: `https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification`
   - Headers: Include Authorization with service role key

See `PUSH_NOTIFICATIONS_QUICK_START.md` for detailed steps.

## 📱 How It Works

### Notification Flow:
```
1. User A sends message in Job X
   ↓
2. Database trigger fires
   ↓
3. Edge function determines recipients:
   - Job creator
   - All invited users
   - Excludes sender (User A)
   ↓
4. Edge function fetches push tokens
   ↓
5. Sends notifications via Expo Push API
   ↓
6. User B receives notification on device
   ↓
7. User B taps notification
   ↓
8. App navigates to Job X chat
   ↓
9. Chat marks messages as read
```

### Unread Badge Logic:
```
1. User opens jobs list
   ↓
2. For each job, query:
   - Get last_read_at from chat_read_status
   - Count messages created after last_read_at
   - Exclude user's own messages
   ↓
3. Display count as badge on job card
   ↓
4. User opens chat
   ↓
5. Update last_read_at to now()
   ↓
6. Badge clears on next refresh
```

## 🧪 Testing

### Prerequisites:
- Physical device (push notifications don't work on simulators)
- Two user accounts
- At least one job with both users invited

### Test Steps:
1. **Token Registration**
   - Open app on Device A
   - Grant notification permissions
   - Check console: "Push token saved successfully"
   - Verify in database: `SELECT * FROM push_tokens;`

2. **Notification Delivery**
   - User A sends message in Job X
   - User B should receive notification
   - Check edge function logs for success

3. **Navigation**
   - User B taps notification
   - App should open to Job X chat
   - Check console for navigation logs

4. **Read Status**
   - User B opens Job X chat
   - Check console: "Messages marked as read"
   - Verify in database: `SELECT * FROM chat_read_status;`

5. **Unread Badges**
   - User A sends another message
   - User B should see badge on Job X card
   - User B opens chat
   - Badge should clear

## 📊 Database Queries for Debugging

```sql
-- Check push tokens
SELECT user_id, expo_push_token, device_id, created_at 
FROM push_tokens 
ORDER BY created_at DESC;

-- Check read status
SELECT u.display_name, j.job_name, c.last_read_at
FROM chat_read_status c
JOIN user_profiles u ON u.user_id = c.user_id
JOIN jobs j ON j.id = c.job_id
ORDER BY c.updated_at DESC;

-- Check recent messages
SELECT 
  cm.message_text,
  u.display_name as sender,
  j.job_name,
  cm.created_at
FROM chat_messages cm
JOIN user_profiles u ON u.user_id = cm.user_id
JOIN jobs j ON j.id = cm.job_id
ORDER BY cm.created_at DESC
LIMIT 10;

-- Check unread count for a specific user/job
SELECT COUNT(*) as unread_count
FROM chat_messages cm
LEFT JOIN chat_read_status crs ON crs.job_id = cm.job_id AND crs.user_id = '[USER_ID]'
WHERE cm.job_id = '[JOB_ID]'
  AND cm.user_id != '[USER_ID]'
  AND (crs.last_read_at IS NULL OR cm.created_at > crs.last_read_at);
```

## 🔧 Troubleshooting

### No Notifications Received
1. Check webhook is configured in Supabase Dashboard
2. Check edge function logs for errors
3. Verify push token exists in database
4. Check device notification permissions
5. Ensure using physical device, not simulator

### Notifications Don't Navigate
1. Check notification data includes `jobId`
2. Verify router path is correct
3. Check console logs when tapping notification

### Unread Badges Not Showing
1. Verify `chat_read_status` is being updated
2. Check the unread count query
3. Ensure job list refreshes after navigation

### Edge Function Errors
1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify service role key is correct
3. Check database permissions

## 📚 Documentation Files

- `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Complete technical documentation
- `PUSH_NOTIFICATIONS_QUICK_START.md` - Quick setup guide
- `PUSH_NOTIFICATIONS_SUMMARY.md` - This file

## 🚀 Next Steps

1. **Configure Webhook** (Required)
   - Follow steps in PUSH_NOTIFICATIONS_QUICK_START.md

2. **Test on Physical Devices**
   - Install app on 2+ devices
   - Test notification delivery
   - Verify navigation and badges

3. **Monitor Edge Function**
   - Check logs for errors
   - Monitor Expo push notification status

4. **Optional Enhancements**
   - Add notification preferences
   - Implement quiet hours
   - Add notification grouping
   - Support web push notifications

## 📦 Dependencies

All required dependencies are already installed:
- `expo-notifications`: ^0.32.13
- `expo-device`: ^8.0.9
- `@supabase/supabase-js`: ^2.84.0

## ✨ Features

- ✅ Real-time push notifications
- ✅ Unread message badges
- ✅ Tap to navigate to chat
- ✅ Read status tracking
- ✅ Multi-device support
- ✅ Excludes sender from notifications
- ✅ Works on iOS and Android
- ✅ Secure with RLS policies
- ✅ Graceful error handling
- ✅ Automatic token management

## 🎉 Ready to Use!

Once you configure the webhook in Supabase Dashboard, the push notification system will be fully operational!
