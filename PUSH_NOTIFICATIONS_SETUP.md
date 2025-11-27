
# Push Notifications Setup Guide

This guide explains how to complete the push notification setup for unread chat messages.

## Overview

The push notification system has been implemented with the following components:

### 1. Database Tables ✅ (Created)
- **`push_tokens`**: Stores Expo push tokens for each user
- **`chat_read_status`**: Tracks the last read time for each user in each job

### 2. Edge Function ✅ (Deployed)
- **`send-chat-notification`**: Sends push notifications via Expo Push API when new messages are created

### 3. Frontend Components ✅ (Implemented)
- **`hooks/usePushNotifications.ts`**: Manages push notification permissions and token registration
- **`app/_layout.tsx`**: Initializes push notifications on app startup
- **`components/job/ChatTab.tsx`**: Marks messages as read when chat is opened
- **`app/(tabs)/(home)/index.tsx`**: Displays unread message counts on job cards

## Required Manual Setup

### Step 1: Configure Database Webhook

You need to create a database webhook in the Supabase Dashboard to trigger the Edge Function when new chat messages are inserted.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/aidftnnusaeckhfambep
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new hook**
4. Configure the webhook:
   - **Name**: `send_chat_notification_hook`
   - **Table**: `chat_messages`
   - **Events**: Check only **Insert**
   - **Type**: Select **HTTP Request**
   - **Method**: `POST`
   - **URL**: `https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification`
   - **HTTP Headers**: 
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_ANON_KEY
     ```
     (Replace `YOUR_ANON_KEY` with your project's anon key from Settings → API)
5. Click **Create webhook**

### Step 2: Test Push Notifications

1. **On a physical device** (push notifications don't work on simulators):
   - Install the app
   - Log in with a user account
   - Grant notification permissions when prompted
   - The app will automatically register the push token

2. **Send a test message**:
   - Have another user send a message in a job
   - You should receive a push notification with:
     - Title: Job name
     - Body: Sender name + message preview
     - Tap the notification to navigate to the job's chat

3. **Check unread counts**:
   - On the home screen, job cards will show a red badge with the unread message count
   - Opening the chat will mark messages as read and clear the badge

## How It Works

### Message Flow

1. **User sends a message** → Inserted into `chat_messages` table
2. **Database webhook triggers** → Calls `send-chat-notification` Edge Function
3. **Edge Function**:
   - Fetches job details and sender profile
   - Finds all users with access to the job (via `job_invitations` and job creator)
   - Excludes the sender from recipients
   - Fetches push tokens for all recipients
   - Sends notifications via Expo Push API
4. **Expo Push Service** → Delivers notifications to devices
5. **User taps notification** → App navigates to the job's chat
6. **Chat opens** → Updates `chat_read_status` with current timestamp

### Unread Count Calculation

```sql
SELECT COUNT(*) FROM chat_messages 
WHERE job_id = ? 
AND created_at > (SELECT last_read_at FROM chat_read_status WHERE user_id = ? AND job_id = ?)
AND user_id != ?
```

This query counts messages:
- In the specific job
- Created after the user's last read time
- Not sent by the user themselves

## Troubleshooting

### No notifications received

1. **Check device permissions**: Ensure notifications are enabled in device settings
2. **Check push token**: Look for "Push token saved successfully" in console logs
3. **Check webhook**: Verify the webhook is active in Supabase Dashboard
4. **Check Edge Function logs**: Go to Edge Functions → `send-chat-notification` → Logs
5. **Test on physical device**: Simulators don't support push notifications

### Notifications not navigating to chat

- Check that the notification data includes `jobId` and `type: 'chat_message'`
- Verify the router is properly configured in `usePushNotifications.ts`

### Unread counts not updating

- Check that `chat_read_status` is being updated when chat opens
- Verify the SQL query in `getUnreadMessageCount` is correct
- Check console logs for any errors

## Environment Variables

The Edge Function uses these environment variables (automatically available):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

## Security Notes

- Push tokens are stored per user with RLS policies
- Only the token owner can manage their tokens
- The Edge Function uses service role key to query all users (required for notifications)
- Notification content is limited to job name, sender name, and message preview

## Future Enhancements

Potential improvements:
- Add notification preferences (mute specific jobs, quiet hours, etc.)
- Support for notification channels (mentions, replies, etc.)
- Rich notifications with images/actions
- Notification history/inbox
- Web push notifications support
