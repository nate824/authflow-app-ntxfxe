
# FieldFlow Chat Processing Pipeline - Setup Guide

## Overview

The FieldFlow chat processing pipeline automatically analyzes chat messages and updates job summaries using AI. This document explains how the system works and how to set up automated processing.

## System Architecture

### Components

1. **Database Trigger** (`update_job_processing_schedule`)
   - Automatically fires when a new chat message is inserted
   - Schedules the job for processing 2 minutes after the last message
   - Sets `processing_status` to 'scheduled'

2. **Edge Function** (`process-chat-batch`)
   - Processes scheduled jobs or can be manually triggered
   - Classifies messages using OpenAI GPT-4o-mini
   - Updates job overview, issues, questions, actions, risks, timelines, and dependencies
   - Maintains a complete audit trail in the changelog

3. **Frontend UI**
   - Displays processing status badges (idle, scheduled, running, completed, failed)
   - Provides manual "Process Chat Now" button
   - Shows last processed timestamp

### Database Schema

The `jobs` table includes these processing-related columns:

```sql
- last_processed_at: TIMESTAMPTZ          -- When messages were last processed
- processing_scheduled_for: TIMESTAMPTZ   -- When processing is scheduled to run
- processing_status: TEXT                 -- Current status: idle, scheduled, running, completed, failed
```

## Processing Flow

1. **User sends chat message** → Trigger fires → Job marked as 'scheduled' (2 min delay)
2. **Scheduled time arrives** → Edge function processes messages → Status changes to 'running'
3. **Processing completes** → Job data updated → Status changes to 'idle' or 'completed'
4. **If error occurs** → Status changes to 'failed' → Job remains scheduled for retry

## Setup Options

### Option 1: Manual Processing (Current Implementation)

**Status:** ✅ Fully Implemented

Users can manually trigger processing by clicking the "Process Chat Now" button in the Summary tab.

**Pros:**
- No additional setup required
- Works immediately
- Full control over when processing happens

**Cons:**
- Requires manual intervention
- Not truly automated

### Option 2: Supabase Cron Jobs (Recommended)

**Status:** ⚠️ Requires Setup

Supabase projects on Pro plan and above can use pg_cron to schedule automatic processing.

#### Setup Steps:

1. **Enable pg_cron extension** (if not already enabled):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. **Create a cron job to run every minute**:
   ```sql
   SELECT cron.schedule(
     'process-chat-batch',           -- Job name
     '* * * * *',                     -- Every minute
     $$
     SELECT
       net.http_post(
         url := 'https://aidftnnusaeckhfambep.supabase.co/functions/v1/process-chat-batch',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
         ),
         body := '{}'::jsonb
       ) AS request_id;
     $$
   );
   ```

3. **Store the service role key** (required for cron to call edge functions):
   ```sql
   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
   ```

4. **Verify the cron job**:
   ```sql
   SELECT * FROM cron.job;
   ```

5. **Check cron job history**:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```

**Pros:**
- Fully automated
- Runs every minute
- Native Supabase integration
- Reliable and scalable

**Cons:**
- Requires Pro plan or higher
- Needs manual SQL setup

### Option 3: External Cron Service

**Status:** ⚠️ Requires External Setup

Use an external service like GitHub Actions, Vercel Cron, or Render Cron to call the edge function.

#### Example: GitHub Actions

Create `.github/workflows/process-chat.yml`:

```yaml
name: Process Chat Messages

on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:      # Allow manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://aidftnnusaeckhfambep.supabase.co/functions/v1/process-chat-batch \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

**Pros:**
- Works on any Supabase plan
- Free with GitHub
- Easy to monitor and debug

**Cons:**
- Requires external service
- Slightly higher latency
- Needs secrets management

### Option 4: Client-Side Polling

**Status:** ⚠️ Not Recommended

The app could poll for scheduled jobs and trigger processing from the client.

**Pros:**
- No server-side setup

**Cons:**
- Unreliable (requires app to be open)
- Wastes battery and bandwidth
- Not truly automated
- Security concerns

## Monitoring and Debugging

### Check Processing Status

```sql
SELECT 
  id,
  job_name,
  processing_status,
  processing_scheduled_for,
  last_processed_at,
  CASE 
    WHEN processing_scheduled_for < NOW() AND processing_status = 'scheduled' 
    THEN 'OVERDUE'
    ELSE 'OK'
  END as status_check
FROM jobs
WHERE processing_status != 'idle'
ORDER BY processing_scheduled_for DESC;
```

### View Recent Processing Activity

```sql
SELECT 
  j.job_name,
  jsonb_array_length(j.ai_changelog) as total_changes,
  j.last_processed_at,
  j.processing_status
FROM jobs j
ORDER BY j.last_processed_at DESC NULLS LAST
LIMIT 10;
```

### Check Edge Function Logs

Use the Supabase Dashboard:
1. Go to Edge Functions
2. Select `process-chat-batch`
3. View Logs tab

Or use the CLI:
```bash
supabase functions logs process-chat-batch
```

### Manually Trigger Processing for a Specific Job

```bash
curl -X POST \
  https://aidftnnusaeckhfambep.supabase.co/functions/v1/process-chat-batch \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "your-job-id-here"}'
```

## Troubleshooting

### Jobs Stuck in 'scheduled' Status

**Cause:** Edge function not being called automatically

**Solutions:**
1. Check if cron job is set up (Option 2)
2. Manually trigger processing using the UI button
3. Check edge function logs for errors
4. Verify OPENAI_API_KEY is set in Supabase secrets

### Processing Fails with OpenAI Error

**Cause:** Invalid API key or rate limit exceeded

**Solutions:**
1. Verify OPENAI_API_KEY in Supabase Dashboard → Edge Functions → Secrets
2. Check OpenAI account for rate limits
3. Consider upgrading OpenAI plan for higher limits

### Messages Not Being Classified Correctly

**Cause:** AI model needs better context or prompts

**Solutions:**
1. Review the classification prompts in the edge function
2. Add more specific examples to the system prompt
3. Increase temperature for more creative classifications
4. Consider using gpt-4o instead of gpt-4o-mini for better accuracy

### Database Trigger Not Firing

**Cause:** Trigger may have been dropped or disabled

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'chat_message_processing_trigger';

-- Recreate trigger if needed
CREATE OR REPLACE FUNCTION update_job_processing_schedule()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs SET 
    processing_scheduled_for = NOW() + INTERVAL '2 minutes',
    processing_status = 'scheduled'
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_message_processing_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_job_processing_schedule();
```

## Performance Considerations

### Message Volume

- The system processes all unprocessed messages in a single batch
- For high-volume jobs (100+ messages), consider:
  - Increasing the debounce delay (currently 2 minutes)
  - Processing in smaller batches
  - Using a more powerful OpenAI model

### Cost Optimization

- **Current model:** gpt-4o-mini (~$0.15 per 1M input tokens)
- **Estimated cost:** ~$0.01 per 100 messages processed
- **Monthly estimate:** For 10 jobs with 50 messages/day each = ~$15/month

### Rate Limits

- OpenAI free tier: 3 requests/minute
- OpenAI paid tier: 500 requests/minute
- Consider implementing exponential backoff for rate limit errors

## Security Notes

1. **Service Role Key:** Never expose in client-side code
2. **Edge Function Auth:** Always verify JWT tokens
3. **RLS Policies:** Ensure proper row-level security on all tables
4. **API Keys:** Store in Supabase secrets, never in code

## Future Enhancements

- [ ] Add retry logic with exponential backoff
- [ ] Implement batch size limits for large message volumes
- [ ] Add webhook notifications when processing completes
- [ ] Create admin dashboard for monitoring all jobs
- [ ] Add support for custom classification categories per job
- [ ] Implement A/B testing for different AI prompts
- [ ] Add cost tracking and budget alerts

## Support

For issues or questions:
1. Check the edge function logs
2. Review this documentation
3. Check Supabase status page
4. Contact support with job ID and timestamp
