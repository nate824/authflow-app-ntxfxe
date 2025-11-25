
# Chat Processing Pipeline - Quick Reference

## 🚀 Quick Start

### Upload Scope Document
```typescript
// From ScopeUploadModal.tsx
const { data, error } = await supabase.functions.invoke('process-scope', {
  body: {
    jobId: job.id,
    content: extractedText,
    fileName: result.name,
    fileType: result.mimeType,
    fileUri: result.uri,
  }
});
```

### Send Chat Message
```typescript
// From ChatTab.tsx
const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    job_id: jobId,
    user_id: currentUserId,
    message_text: message,
    message_type: 'text',
  });
// Trigger fires automatically, schedules processing in 2 minutes
```

### Manual Processing
```typescript
// From SummaryTab.tsx
const { data, error } = await supabase.functions.invoke('process-chat-batch', {
  body: { job_id: jobId }
});
```

## 📊 Data Flow

```
Chat Message → Trigger → Schedule (2 min) → Classify → Update Tabs → ChangeLog
                                                ↓
                                         Baseline Scope
                                         (always preserved)
```

## 🔑 Key Tables

### jobs
```sql
- job_overview (text)              -- Rewritten with each batch
- open_issues (jsonb[])            -- Add/resolve
- unanswered_questions (jsonb[])   -- Add/answer
- resolved_questions (jsonb[])     -- Answered questions
- next_actions (jsonb[])           -- Add/complete
- completed_items (jsonb[])        -- Completed work
- warnings_and_risks (jsonb[])     -- Add risks
- deadlines_and_timelines (jsonb[]) -- Add timelines
- dependencies (jsonb[])           -- Add/clear
- ai_changelog (jsonb[])           -- Audit trail
- processing_status (text)         -- idle/scheduled/running/failed
- processing_scheduled_for (timestamptz)
- last_processed_at (timestamptz)
```

### scope_documents
```sql
- job_id (uuid)
- raw_content (text)    -- Original document
- summary (text)        -- AI-generated baseline
- file_name (text)
- uploaded_by (uuid)
- created_at (timestamptz)
```

### chat_messages
```sql
- job_id (uuid)
- user_id (uuid)
- message_text (text)
- message_type (text)   -- text/image/voice
- created_at (timestamptz)
```

## 🎯 Processing States

| State | Meaning | Next Action |
|-------|---------|-------------|
| `idle` | No processing needed | Wait for new messages |
| `scheduled` | Processing in 2 min | Automatic processing |
| `running` | Currently processing | Wait for completion |
| `completed` | Recently processed | Auto-resets to idle |
| `failed` | Processing error | Manual retry needed |

## 🔧 Common Tasks

### Check Processing Status
```typescript
const { data } = await supabase
  .from('jobs')
  .select('processing_status, processing_scheduled_for, last_processed_at')
  .eq('id', jobId)
  .single();
```

### Get Job Overview
```typescript
const { data } = await supabase
  .from('jobs')
  .select('job_overview')
  .eq('id', jobId)
  .single();
```

### Get Baseline Scope
```typescript
const { data } = await supabase
  .from('scope_documents')
  .select('summary, raw_content')
  .eq('job_id', jobId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### View Recent Changes
```typescript
const { data } = await supabase
  .from('jobs')
  .select('ai_changelog')
  .eq('id', jobId)
  .single();

// ai_changelog is an array of change objects
const recentChanges = data.ai_changelog.slice(0, 10);
```

## 🐛 Debugging

### Check Edge Function Logs
```bash
# In Supabase Dashboard
Functions → process-chat-batch → Logs

# Look for:
- "Classification complete"
- "Saving updated state..."
- "Successfully processed job"
```

### Common Issues

**Overview not updating?**
- Check if scope document exists
- Verify processing_status cycles correctly
- Check OpenAI API key is set
- Review edge function logs

**Processing stuck?**
- Manually trigger: `invoke('process-chat-batch', { job_id })`
- Check database trigger is active
- Verify scheduled task is running

**Overview growing too long?**
- Should NOT happen (rewrite, not append)
- Check baseline scope is being passed
- Review AI prompt in edge function

## 📝 ChangeLog Entry Structure

```typescript
{
  timestamp: "2024-01-15T10:30:00Z",
  section: "open_issues",
  change_type: "created",
  previous_value: null,
  new_value: {
    id: "uuid",
    title: "Issue title",
    description: "Issue description",
    created_at: "2024-01-15T10:30:00Z"
  },
  message_id: "chat-message-uuid",
  message_text: "Original chat message",
  reason: "New issue identified from chat"
}
```

## 🎨 UI Components

### SummaryTab.tsx
- Displays all summary cards
- Shows processing status badge
- Manual "Process Chat Now" button
- Pull-to-refresh

### ChatTab.tsx
- Real-time chat interface
- Optimistic message updates
- Triggers processing on send

### Overview.tsx
- Displays job_overview
- Shows baseline scope if overview empty
- Quick stats from all tabs

## 🔐 Security

### RLS Policies
All tables have Row Level Security enabled:
- Users can only access jobs they're invited to
- Chat messages filtered by job access
- Scope documents filtered by job access

### Edge Function Auth
All edge functions verify JWT:
```typescript
verify_jwt: true
```

## 📊 Performance

### API Costs (Estimated)
- Classification: ~$0.001 per batch (10 messages)
- Overview generation: ~$0.002 per update
- Total: ~$0.003 per processing cycle

### Processing Time
- Classification: 2-5 seconds
- All updaters: < 1 second
- Database update: < 1 second
- **Total: 3-7 seconds per batch**

## 🚨 Error Handling

### Edge Function Errors
```typescript
try {
  // Processing logic
} catch (error) {
  console.error('Error:', error);
  await supabase
    .from('jobs')
    .update({ processing_status: 'failed' })
    .eq('id', job.id);
}
```

### Frontend Errors
```typescript
if (error) {
  console.error('Processing error:', error);
  Alert.alert('Error', 'Failed to process. Please try again.');
}
```

## 📚 Related Files

### Edge Functions
- `supabase/functions/process-chat-batch/index.ts`
- `supabase/functions/classify-messages/index.ts`
- `supabase/functions/process-scope/index.ts`

### Frontend Components
- `components/job/SummaryTab.tsx`
- `components/job/ChatTab.tsx`
- `app/job-details/overview.tsx`
- `app/job-details/issues.tsx`
- `app/job-details/questions.tsx`
- `app/job-details/actions.tsx`
- `app/job-details/completed.tsx`
- `app/job-details/warnings.tsx`
- `app/job-details/deadlines.tsx`
- `app/job-details/dependencies.tsx`
- `app/job-details/changelog.tsx`

### Database
- Migration: `add_chat_processing_columns`
- Trigger: `update_job_processing_schedule`
- Function: `update_job_processing_schedule()`

## 🎓 Best Practices

1. **Always preserve baseline scope** in job_overview
2. **Rewrite, don't append** overview updates
3. **Log every change** in ai_changelog
4. **Handle errors gracefully** - don't corrupt data
5. **Use optimistic UI** for better UX
6. **Batch messages** to reduce costs
7. **Monitor processing status** in UI
8. **Test with real data** before deploying

## 🔗 Useful Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [PostgreSQL JSONB Docs](https://www.postgresql.org/docs/current/datatype-json.html)
