
# Chat Processing Pipeline - Implementation Guide

## Overview

The FieldFlow chat processing pipeline is a comprehensive AI-powered system that analyzes chat messages and automatically updates job summary tabs. This document explains how the system works and how it maintains data integrity.

## Architecture

### Core Components

1. **Database Trigger** (`update_job_processing_schedule`)
   - Fires on every new chat message insert
   - Schedules processing 2 minutes in the future
   - Prevents duplicate scheduling if already scheduled or running

2. **Edge Function: `process-chat-batch`**
   - Main processing engine
   - Runs every minute via scheduled task
   - Processes jobs with `processing_status = 'scheduled'`
   - Can be manually triggered for specific jobs

3. **Edge Function: `classify-messages`**
   - Standalone classifier (can be used independently)
   - Categorizes messages into summary categories

4. **Edge Function: `process-scope`**
   - Processes initial scope documents
   - Establishes baseline job overview
   - Creates foundation for all future updates

## Processing Flow

### 1. Message Buffering (2-Minute Timer)

```
User sends message → Insert into chat_messages → Trigger fires → 
Set processing_scheduled_for = NOW() + 2 minutes → 
Set processing_status = 'scheduled'
```

### 2. Batch Processing Trigger

Every minute, the scheduled task checks for jobs where:
- `processing_status = 'scheduled'`
- `processing_scheduled_for <= NOW()`

### 3. Classification Phase

Messages are sent to OpenAI GPT-4o-mini with a comprehensive prompt that categorizes them into:

- **overview_relevant**: Information affecting high-level job status
- **new_issues**: Problems, blockers, broken items
- **resolved_issues**: Messages indicating issue resolution
- **new_questions**: Questions needing answers
- **answered_questions**: Answers to previous questions
- **new_actions**: Tasks or action items
- **completed_actions**: Completed task notifications
- **new_risks**: Potential problems, warnings
- **timeline_changes**: Schedule changes, delays, deadlines
- **new_dependencies**: Things crew is waiting on
- **cleared_dependencies**: Resolved dependencies
- **noise**: Casual chat with no actionable content

### 4. Update Phase

Each summary tab has a dedicated updater function:

#### Job Overview Updater
**Special Behavior**: The Job Overview is REWRITTEN, not appended.

```typescript
updateJobOverview(
  baselineScope,      // From scope_documents table
  currentOverview,    // Current job_overview
  overviewRelevant,   // Classified messages
  allMessages,        // Fallback if no relevant messages
  currentState,       // All summary tab states
  jobContext          // Job name
)
```

**Key Features**:
- Always maintains baseline scope document information
- Integrates chat updates naturally
- Stays under 250 words
- Provides mile-high view of current status
- Never grows indefinitely

#### Other Updaters

- **updateOpenIssues**: Adds new issues, resolves existing ones
- **updateQuestions**: Adds questions, moves answered to resolved
- **updateActions**: Adds actions, marks completed
- **updateRisks**: Adds new risks
- **updateTimelines**: Adds timeline updates
- **updateDependencies**: Adds dependencies, clears resolved ones

### 5. ChangeLog Generation

Every change produces a ChangeLog entry with:

```typescript
{
  timestamp: ISO string,
  section: 'job_overview' | 'open_issues' | etc.,
  change_type: 'created' | 'updated' | 'resolved' | 'completed' | 'cleared',
  previous_value: object | null,
  new_value: object | null,
  message_id: string,
  message_text: string,
  reason: string
}
```

## System of Record

### Summary Tabs are the Source of Truth

All summary data lives in the `jobs` table JSONB columns:
- `job_overview` (text)
- `open_issues` (jsonb[])
- `unanswered_questions` (jsonb[])
- `resolved_questions` (jsonb[])
- `next_actions` (jsonb[])
- `completed_items` (jsonb[])
- `warnings_and_risks` (jsonb[])
- `deadlines_and_timelines` (jsonb[])
- `dependencies` (jsonb[])
- `ai_changelog` (jsonb[])

Chat messages are processed IN CONTEXT of these existing summaries.

## Job Overview Behavior

### Baseline Preservation

When a scope document is uploaded:
1. AI generates a concise summary (< 200 words)
2. Summary is stored in `scope_documents.summary`
3. Summary is set as `jobs.job_overview` (baseline)
4. ChangeLog entry marks it as baseline

### Chat Integration

When chat messages are processed:
1. Baseline scope is fetched from `scope_documents`
2. AI receives:
   - Baseline scope (must preserve)
   - Current overview
   - New chat messages
   - Current state of all tabs
3. AI rewrites overview to:
   - Maintain core baseline information
   - Integrate latest updates
   - Stay concise and readable
   - Provide current status

### Never Empty

The Job Overview should NEVER be empty once a scope document exists:
- Initial scope processing sets baseline
- Chat processing maintains baseline
- If no new messages but baseline exists, overview is generated from baseline
- Manual processing can regenerate from baseline

## Processing Status States

```
idle       → No processing needed
scheduled  → Processing scheduled (2-min timer)
running    → Currently processing
completed  → Recently completed (temporary state)
failed     → Processing failed (manual retry needed)
```

## Manual Processing

Users can manually trigger processing via the "Process Chat Now" button:

```typescript
await supabase.functions.invoke('process-chat-batch', {
  body: { job_id: jobId }
});
```

This bypasses the scheduled check and processes immediately.

## Error Handling

### Graceful Degradation

- If OpenAI fails, processing status set to 'failed'
- Existing data remains intact
- User can retry manually
- Logs capture full error details

### Data Integrity

- All updates are atomic (single database transaction)
- If any updater fails, entire batch fails
- No partial updates
- ChangeLog always reflects actual changes

## Performance Optimization

### Batching Strategy

- 2-minute buffer reduces API calls
- Multiple messages processed together
- Cost-effective (GPT-4o-mini)

### Parallel Execution

- All updaters run in sequence (not parallel) to maintain consistency
- Classification happens once per batch
- Single database update at end

## Frontend Integration

### Real-time Updates

Components use:
- `useFocusEffect` to refresh on screen focus
- Pull-to-refresh for manual updates
- Status badges show processing state

### Optimistic UI

- Chat messages show immediately (optimistic)
- Replaced with real message on confirmation
- Processing status updates in real-time

## Testing the Pipeline

### Manual Test Flow

1. Upload scope document → Check job_overview populated
2. Send chat message → Check processing_status = 'scheduled'
3. Wait 2 minutes → Check processing_status = 'running' then 'idle'
4. Check job_overview updated with chat context
5. Check relevant summary tabs updated
6. Check ai_changelog has entries

### Verification Queries

```sql
-- Check processing status
SELECT id, job_name, processing_status, processing_scheduled_for, last_processed_at
FROM jobs
WHERE id = 'your-job-id';

-- Check job overview
SELECT job_overview
FROM jobs
WHERE id = 'your-job-id';

-- Check baseline scope
SELECT summary, created_at
FROM scope_documents
WHERE job_id = 'your-job-id'
ORDER BY created_at DESC
LIMIT 1;

-- Check changelog
SELECT jsonb_array_length(ai_changelog) as change_count
FROM jobs
WHERE id = 'your-job-id';

-- View recent changes
SELECT jsonb_array_elements(ai_changelog) as change
FROM jobs
WHERE id = 'your-job-id'
LIMIT 10;
```

## Troubleshooting

### Job Overview Not Updating

1. Check if scope document exists
2. Check processing_status (should cycle through scheduled → running → idle)
3. Check edge function logs for errors
4. Manually trigger processing
5. Verify OpenAI API key is set

### Processing Stuck in 'scheduled'

1. Check if scheduled task is running
2. Manually trigger: `invoke('process-chat-batch', { job_id })`
3. Check edge function logs
4. Verify database trigger is active

### Overview Keeps Growing

This should NOT happen. If it does:
1. Check `updateJobOverview` function
2. Verify baseline scope is being passed
3. Check AI prompt includes "REWRITE, not append"
4. Review recent changelog entries

## Future Enhancements

### Potential Improvements

1. **Smart Scheduling**: Adjust timer based on message frequency
2. **Priority Processing**: High-priority jobs process faster
3. **Batch Optimization**: Group multiple jobs in single processing run
4. **Caching**: Cache baseline scope to reduce queries
5. **Webhooks**: Notify external systems of updates
6. **Analytics**: Track processing metrics and AI costs

## API Reference

### Edge Functions

#### process-chat-batch
```typescript
POST /functions/v1/process-chat-batch
Body: { job_id?: string }  // Optional, processes all scheduled if omitted
Returns: { processed: number, results: ProcessingResult[] }
```

#### classify-messages
```typescript
POST /functions/v1/classify-messages
Body: { messages: Message[], job_context: string }
Returns: { classification: ClassificationResult }
```

#### process-scope
```typescript
POST /functions/v1/process-scope
Body: { jobId: string, content: string, fileName?: string }
Returns: { success: boolean, summary: string, documentId: string }
```

## Conclusion

The chat processing pipeline is a robust, AI-powered system that maintains job summaries automatically. By treating summary tabs as the system of record and always preserving the baseline scope, it ensures data integrity while providing real-time insights into job status.

The key principles are:
1. **Baseline Preservation**: Scope document forms the foundation
2. **Rewrite, Not Append**: Overview stays concise
3. **Comprehensive Context**: All tabs evaluated together
4. **Complete Audit Trail**: Every change logged
5. **Graceful Degradation**: Errors don't corrupt data
