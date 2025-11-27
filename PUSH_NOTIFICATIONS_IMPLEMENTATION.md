
# Push Notifications Implementation Guide

This document describes the complete push notification system for unread chat messages.

## Overview

The push notification system sends real-time notifications to users when new chat messages are posted in jobs they have access to. The system uses:

- **Expo Push Notifications** for cross-platform delivery (iOS & Android)
- **Supabase Edge Functions** for notification processing
- **Database Triggers** for automatic notification dispatch
- **Client-side hooks** for token management and notification handling

## Architecture

```
New Chat Message
    ↓
Database Trigger (chat_messages INSERT)
    ↓
Edge Function (send-chat-notification)
    ↓
Expo Push API
    ↓
User's Device
```

## Database Schema

### 1. push_tokens Table
Stores Expo push tokens for each user's device.

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
ON push_tokens FOR ALL USING (auth.uid() = user_id);
```

### 2. chat_read_status Table
Tracks when each user last read messages in each job.

```sql
CREATE TABLE chat_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE chat_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own read status"
ON chat_read_status FOR ALL USING (auth.uid() = user_id);
```

## Edge Function: send-chat-notification

Located at: `supabase/functions/send-chat-notification/index.ts`

### Functionality:
1. Receives webhook payload when new chat message is inserted
2. Fetches job details and sender information
3. Determines recipients (job creator + invited users, excluding sender)
4. Retrieves Expo push tokens for all recipients
5. Sends push notifications via Expo Push API

### Notification Format:
```json
{
  "to": "ExponentPushToken[...]",
  "sound": "default",
  "title": "Job Name",
  "body": "Sender Name: Message preview...",
  "data": {
    "jobId": "uuid",
    "messageId": "uuid",
    "type": "chat_message"
  },
  "priority": "high",
  "channelId": "chat-messages"
}
```

## Database Trigger Setup

⚠️ **IMPORTANT: Manual Configuration Required**

The database trigger has been created, but you need to configure a **Database Webhook** in the Supabase Dashboard to make it work properly:

### Steps to Configure Webhook:

1. Go to **Supabase Dashboard** → Your Project → **Database** → **Webhooks**
2. Click **Create a new hook**
3. Configure the webhook:
   - **Name**: `send-chat-notification`
   - **Table**: `chat_messages`
   - **Events**: Check `INSERT`
   - **Type**: `HTTP Request`
   - **HTTP Method**: `POST`
   - **URL**: `https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification`
   - **HTTP Headers**: 
     ```
     Content-Type: application/json
     Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]
     ```
   - **Payload**: Use the default payload template

4. Click **Create webhook**

### Alternative: Using pg_net (Current Implementation)

The current implementation uses a database trigger with `pg_net` to call the edge function. However, this requires the edge function to accept unauthenticated requests from the database.

**Current Trigger:**
```sql
CREATE OR REPLACE FUNCTION notify_new_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'chat_messages',
      'record', row_to_json(NEW),
      'old_record', NULL
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send push notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Frontend Implementation

### 1. Push Notifications Hook

File: `hooks/usePushNotifications.ts`

**Features:**
- Requests notification permissions on app startup
- Registers device for push notifications
- Saves Expo push token to database
- Handles notifications received while app is open
- Handles notification taps to navigate to job chat

**Usage:**
```typescript
// Already integrated in app/_layout.tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

function RootLayoutNav() {
  usePushNotifications(); // Initialize on app startup
  // ...
}
```

### 2. Chat Read Status Tracking

File: `components/job/ChatTab.tsx`

**Features:**
- Automatically marks messages as read when chat is opened
- Updates `chat_read_status` table with current timestamp
- Prevents notifications for messages the user has already seen

**Implementation:**
```typescript
const markMessagesAsRead = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('chat_read_status')
    .upsert({
      user_id: user.id,
      job_id: jobId,
      last_read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,job_id',
    });
};
```

### 3. Unread Message Badges

File: `app/(tabs)/(home)/index.tsx`

**Features:**
- Shows unread message count on each job card
- Queries messages created after last read time
- Excludes user's own messages from count

**Query Logic:**
```typescript
const getUnreadMessageCount = async (jobId: string): Promise<number> => {
  // Get last read timestamp
  const { data: readStatus } = await supabase
    .from('chat_read_status')
    .select('last_read_at')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .single();

  // Count unread messages
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .gt('created_at', readStatus?.last_read_at || '1970-01-01')
    .neq('user_id', user.id);

  return count || 0;
};
```

## Testing

### 1. Test Push Token Registration

1. Open the app on a physical device (push notifications don't work on simulators)
2. Grant notification permissions when prompted
3. Check the console logs for: `"Push token saved successfully"`
4. Verify in Supabase Dashboard → Database → `push_tokens` table

### 2. Test Notification Delivery

1. Have two users logged in on different devices
2. User A sends a message in a job
3. User B should receive a push notification
4. Tap the notification to verify navigation to the job chat

### 3. Test Read Status

1. Open a job's chat screen
2. Check the console logs for: `"Messages marked as read for job: [jobId]"`
3. Verify in Supabase Dashboard → Database → `chat_read_status` table
4. Send a new message from another user
5. Verify the unread badge appears on the job card

### 4. Test Edge Function

You can manually test the edge function using curl:

```bash
curl -X POST \
  https://aidftnnusaeckhfambep.supabase.co/functions/v1/send-chat-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]" \
  -d '{
    "record": {
      "id": "test-message-id",
      "job_id": "[VALID_JOB_ID]",
      "user_id": "[VALID_USER_ID]",
      "message_text": "Test notification message"
    }
  }'
```

## Troubleshooting

### Notifications Not Received

1. **Check push token registration:**
   - Look for console log: `"Expo push token: ExponentPushToken[...]"`
   - Verify token exists in `push_tokens` table

2. **Check edge function logs:**
   - Go to Supabase Dashboard → Edge Functions → `send-chat-notification` → Logs
   - Look for errors or "No push tokens found" messages

3. **Check webhook configuration:**
   - Verify webhook is enabled in Supabase Dashboard
   - Check webhook logs for delivery status

4. **Check device permissions:**
   - iOS: Settings → [App Name] → Notifications
   - Android: Settings → Apps → [App Name] → Notifications

### Notifications Received But Not Navigating

1. Check the notification data payload includes `jobId`
2. Verify the router navigation path is correct
3. Check console logs when tapping notification

### Unread Badges Not Updating

1. Verify `chat_read_status` is being updated when opening chat
2. Check the unread count query logic
3. Ensure the job list is refreshing after navigation

## Performance Considerations

1. **Token Cleanup**: Periodically remove expired or invalid push tokens
2. **Batch Notifications**: The system already batches notifications per message
3. **Rate Limiting**: Expo has rate limits - monitor usage in production
4. **Database Indexes**: Ensure indexes exist on frequently queried columns:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_chat_messages_job_created 
   ON chat_messages(job_id, created_at);
   
   CREATE INDEX IF NOT EXISTS idx_chat_read_status_user_job 
   ON chat_read_status(user_id, job_id);
   ```

## Security

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Token Privacy**: Push tokens are only accessible to the token owner
3. **Service Role**: Edge function uses service role for database access
4. **Webhook Authentication**: Webhook should use service role key

## Future Enhancements

1. **Notification Preferences**: Allow users to customize notification settings
2. **Quiet Hours**: Implement do-not-disturb schedules
3. **Notification Grouping**: Group multiple messages from same job
4. **Rich Notifications**: Add images, action buttons, etc.
5. **Web Push**: Add support for web push notifications
6. **Email Fallback**: Send email if push notification fails

## Dependencies

- `expo-notifications`: ^0.32.13
- `expo-device`: ^8.0.9
- `@supabase/supabase-js`: ^2.84.0

## Configuration Files

- `app.json`: Expo notifications plugin configuration
- `hooks/usePushNotifications.ts`: Client-side notification handling
- `components/job/ChatTab.tsx`: Read status tracking
- `app/(tabs)/(home)/index.tsx`: Unread badge display

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Check Expo push notification status: https://expo.dev/notifications
3. Review this documentation
4. Check the Expo notifications documentation: https://docs.expo.dev/push-notifications/overview/
