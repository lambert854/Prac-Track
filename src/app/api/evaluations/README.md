# Evaluation Module - Implementation Guide

## Overview

The Evaluation Module manages Mid-Term and Final evaluations for field placements, supporting both Student Self-Evaluations and Supervisor Evaluations of students.

## Architecture

### Database Models

- **Evaluation**: Represents an evaluation instance for a placement (one per type per placement)
- **EvaluationSubmission**: Individual submission for each role (STUDENT or SUPERVISOR)

### Key Features

1. **Schema-Driven Forms**: Evaluations are defined in `src/config/evaluations.schema.json`
2. **Auto-Save**: Forms auto-save every 15 seconds (configurable)
3. **Multi-Page**: Forms are broken into pages for better UX
4. **Progress Tracking**: Visual progress bar shows completion status
5. **Lock/Unlock**: Submissions lock when finalized, admin can unlock
6. **Notifications**: Recipients notified when evaluations are sent and completed
7. **Audit Trail**: All actions logged for compliance

## API Endpoints

### Send Evaluations
```
POST /api/evaluations/send
Body: { type: 'MIDTERM' | 'FINAL', studentMsg?: string, supervisorMsg?: string }
```

### Load Submission
```
GET /api/evaluations/submissions/[id]
```

### Save Progress (Auto-Save)
```
PATCH /api/evaluations/submissions/[id]/save
Body: { answers: Record<string, number | string>, pageId?: string }
```

### Lock Submission (Final Submit)
```
POST /api/evaluations/submissions/[id]/lock
```

### Unlock Submission (Admin Only)
```
POST /api/evaluations/submissions/[id]/unlock
```

### Get Placement Evaluations
```
GET /api/placements/[id]/evaluations?role=STUDENT|SUPERVISOR
```

## Frontend Components

### Faculty Components
- `EvaluationSendButtons`: Two-button interface for sending evaluations
- `EvaluationSendModal`: Modal for customizing messages to recipients
- `StudentEvaluationBadges`: Badges showing completed student self-evals
- `SupervisorEvaluationBadges`: Badges showing completed supervisor evals

### Form Components
- `SchemaForm`: Multi-page form renderer with auto-save
- Form Page: `/forms/evaluations/[submissionId]`

## Configuration

Edit `src/config/evaluation.config.ts`:

```typescript
{
  AUTOSAVE_MS: 15000,              // Auto-save interval
  SHOW_PRINT_BUTTON: true,         // Show print button on locked forms
  REQUIRE_ALL_PAGES: true,         // Validate all pages before submit
  ACTIVE_STATUS: 'ACTIVE',         // Placement status filter
  BADGE_TEXT: { ... },             // Badge display text
  BADGE_STYLES: { ... },           // Tailwind classes for badges
}
```

## Evaluation Schema

Edit `src/config/evaluations.schema.json` to modify:
- Competencies
- Rating scales
- Field labels
- Required fields
- Page structure

The schema supports:
- **single-select**: Radio button groups with numeric values
- **textarea**: Multi-line text input with optional character limits

## Workflow

### 1. Faculty Sends Evaluations

```
Faculty Dashboard → Send Mid-Term/Final Evaluations
  ↓
Faculty enters optional messages
  ↓
System creates Evaluation + EvaluationSubmissions for active placements
  ↓
Notifications sent to students and supervisors
```

### 2. Recipients Complete Forms

```
Student/Supervisor receives notification
  ↓
Opens evaluation form
  ↓
Completes multi-page form (auto-saves every 15s)
  ↓
Reviews all pages
  ↓
Clicks "Submit & Lock"
  ↓
System validates all required fields
  ↓
Form locks and becomes read-only
  ↓
Faculty notified of completion
```

### 3. Faculty Reviews

```
Faculty Dashboard → My Students
  ↓
Sees badges (e.g., "Mid Self", "Final Eval")
  ↓
Clicks badge to view locked evaluation (read-only)
```

## Permissions

- **Send**: FACULTY, ADMIN
- **Complete**: Assigned STUDENT or SUPERVISOR only
- **View Own**: STUDENT (self-eval only), SUPERVISOR (their eval only)
- **View All for Placement**: FACULTY (assigned), ADMIN
- **Unlock**: ADMIN only

## Deduplication Logic

When sending evaluations:
1. Checks if Evaluation exists for (placementId, type)
2. Checks if submissions exist for each role
3. Only creates new submissions if none exist OR existing ones are LOCKED
4. Reuses PENDING or IN_PROGRESS submissions
5. Returns counts of created vs. reused

## Notifications

### Types
- `EVALUATION_SENT`: Sent to recipients when evaluation is assigned
- `EVALUATION_SUBMITTED`: Sent to submitter and faculty when locked

### Display
- Recipients see message in notification
- Click notification → opens evaluation form
- Badge shows on faculty views when locked

## Audit Logging

All actions logged with:
- `EVALUATION_ISSUED`: When faculty sends evaluations
- `EVALUATION_SAVED`: When user saves progress
- `EVALUATION_SUBMITTED`: When user locks submission
- `EVALUATION_UNLOCKED`: When admin unlocks

## Testing

### Unit Tests (TODO)
- Deduplication logic
- Permission checks
- Validation logic
- Answer merging

### E2E Tests (TODO)
- Faculty send flow
- Student completion flow
- Supervisor completion flow
- Auto-save functionality
- Lock/unlock admin actions

## Extending

### Adding New Competencies

Edit `src/config/evaluations.schema.json`:

```json
{
  "id": "competency10",
  "title": "New Competency",
  "fields": [
    {
      "id": "c10_item1",
      "type": "single-select",
      "label": "Your question...",
      "required": true,
      "options": [
        { "value": 0, "label": "Has not met expectations" },
        { "value": 1, "label": "Met expectations" },
        ...
      ]
    }
  ]
}
```

### Custom Rating Scales

Modify the `options` array:
```json
"options": [
  { "value": 1, "label": "Needs Improvement" },
  { "value": 2, "label": "Satisfactory" },
  { "value": 3, "label": "Excellent" }
]
```

### Badge Customization

Edit `src/config/evaluation.config.ts`:
```typescript
BADGE_TEXT: {
  student: {
    MIDTERM: 'Custom Mid Text',
    FINAL: 'Custom Final Text',
  },
  ...
}
```

## Known Limitations

1. Cannot reopen LOCKED submissions without admin unlock
2. Placement must be ACTIVE to receive evaluations
3. Schema changes require careful testing of existing submissions
4. Print/PDF relies on browser print dialog

## Future Enhancements

- PDF generation server-side
- Email delivery of locked evaluations
- Progress reminders for incomplete evaluations
- Faculty comments on locked submissions
- Comparison views (midterm vs. final)
- Bulk export for program assessment
