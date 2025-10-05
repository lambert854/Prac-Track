# Email Notification System Setup

## Overview
The notification system is now fully implemented and ready for use! In development mode, emails are logged to the console instead of being sent. In production, you can enable real email sending.

## Features Implemented

### ✅ Core Components
- **Email Service** (`src/lib/email-service.ts`) - Handles email sending/logging
- **Notification Triggers** (`src/lib/notification-triggers.ts`) - Easy-to-use functions for common events
- **Database Models** - `Notification` and `EmailLog` tables for tracking
- **API Endpoints** - For managing notifications and email logs
- **UI Component** - Notification bell in navigation with real-time updates

### ✅ Notification Types
- Placement approved/rejected
- Supervisor approved/rejected  
- Site approved/rejected
- Document uploaded
- Timesheet approved/rejected
- Agreement expiring/expired

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_ENABLED=false                    # Set to true in production to send real emails
APP_BASE_URL=http://localhost:3000    # Base URL for email links
```

## How to Use

### 1. Trigger Notifications in Your Code

```typescript
import { NotificationTriggers } from '@/lib/notification-triggers'

// Example: When a placement is approved
await NotificationTriggers.placementApproved(
  placementId,
  studentId, 
  siteName
)

// Example: When a supervisor is rejected
await NotificationTriggers.supervisorRejected(
  placementId,
  studentId,
  supervisorName,
  "Reason for rejection"
)
```

### 2. View Notifications

- **Notification Bell** - Click the bell icon in the navigation to see recent notifications
- **API Endpoints**:
  - `GET /api/notifications` - Get user notifications
  - `POST /api/notifications/[id]/read` - Mark notification as read
  - `POST /api/notifications/mark-all-read` - Mark all notifications as read

### 3. Admin Email Logs

- **API Endpoint**: `GET /api/admin/email-logs` - View all email logs (admin only)

## Development Mode

In development mode (when `EMAIL_ENABLED=false`):
- Emails are logged to the console with full formatting
- All email attempts are stored in the database
- No real emails are sent

Example console output:
```
📧 EMAIL SIMULATION (Development Mode)
==================================================
To: student@example.com
From: noreply@prac-track.edu
Subject: [PRAC-TRACK] Placement Approved
Body (HTML):
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div class="container">
      <div class="header">
        <h1>PRAC-TRACK Notification</h1>
        <span class="priority-badge">⚠️ HIGH</span>
      </div>
      <div class="content">
        <h2>Hello John,</h2>
        <p>Your placement at Children's Home Society has been approved...</p>
      </div>
    </div>
  </body>
</html>
==================================================
📧 End Email Simulation
```

## Production Setup

When ready for production:

1. **Set Environment Variables**:
   ```env
   EMAIL_ENABLED=true
   APP_BASE_URL=https://your-domain.com
   ```

2. **Integrate Real Email Service**:
   - Update `src/lib/email-service.ts` to use SendGrid, AWS SES, or another service
   - Replace the TODO comment in the `sendEmail` method

3. **Example SendGrid Integration**:
   ```typescript
   import sgMail from '@sendgrid/mail'
   
   // In sendEmail method:
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
   const msg = {
     to: template.to,
     from: template.from,
     subject: template.subject,
     html: template.html,
     text: template.text,
   }
   await sgMail.send(msg)
   ```

## Database Tables

### Notifications Table
- Stores all notifications with read/unread status
- Links to users and related entities
- Includes priority and metadata

### Email Logs Table  
- Tracks all email attempts (sent, failed, pending)
- Useful for debugging and monitoring
- Includes error details for failed sends

## Next Steps

You can now go through your workflow and I'll help you connect the notification system to specific events throughout the application. The system is ready to use!

## Example Integration Points

Here are some places where you might want to add notifications:

1. **Placement Workflow**:
   - ✅ Placement approved (already implemented)
   - Placement rejected
   - Placement activated
   - Document uploaded

2. **Supervisor Workflow**:
   - Supervisor approved/rejected
   - Supervisor account created

3. **Site Management**:
   - Site approved/rejected
   - Agreement expiring/expired

4. **Timesheet Workflow**:
   - Timesheet submitted
   - Timesheet approved/rejected

5. **Form Submissions**:
   - Form submitted
   - Form approved/rejected

Just let me know which workflow you'd like to start with, and I'll help you integrate the notifications!
