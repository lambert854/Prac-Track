# Current Workflows Documentation

**Last Updated:** October 9, 2025  
**Purpose:** Complete documentation of all current system workflows to serve as baseline for planned changes

---

## Table of Contents
1. [Agency/Site Workflow](#agencysite-workflow)
2. [Supervisor Workflow](#supervisor-workflow)
3. [Student Placement Workflow](#student-placement-workflow)
4. [Learning Contract Workflow](#learning-contract-workflow)
5. [Timesheet Approval Workflow](#timesheet-approval-workflow)
6. [Evaluation Workflow](#evaluation-workflow)
7. [Key Database Relationships](#key-database-relationships)

---

## Agency/Site Workflow

### Overview
Sites (agencies) can be created by faculty/admin and made available for student placements.

### Current Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENCY/SITE WORKFLOW                                            │
└─────────────────────────────────────────────────────────────────┘

[Faculty/Admin Creates Site]
         │
         ├─► Site.status = ACTIVE
         ├─► Site.active = true
         ├─► Site.learningContractStatus = null
         │
         ▼
[Site Immediately Visible to Students]
         │
         └─► Students can browse and request placements
         
┌─────────────────────────────────────────────────────────────────┐
│ OPTIONAL: LEARNING CONTRACT PATH                                │
└─────────────────────────────────────────────────────────────────┘

[Faculty Sends Learning Contract]
         │
         ├─► AgencyLearningContract created
         ├─► Token generated (30-day expiry)
         ├─► Site.status = PENDING_LEARNING_CONTRACT
         ├─► Site.learningContractStatus = SENT
         │
         ▼
[Agency Receives Email with Token Link]
         │
         └─► Link: /agency-learning-contract/{token}
         
[Agency Fills Out Contract Form]
         │
         ├─► Detailed agency information
         ├─► Field instructor details
         ├─► Resume upload (optional)
         ├─► Program information
         │
         ▼
[Contract Submitted]
         │
         ├─► AgencyLearningContract.status = SUBMITTED
         ├─► Site.status = PENDING_APPROVAL
         ├─► Site.learningContractStatus = SUBMITTED
         ├─► Notifications sent to all Faculty/Admin
         │
         └─► Auto-creates Supervisor if field instructor info provided
                 ├─► Creates User (role: SUPERVISOR)
                 ├─► Creates SupervisorProfile
                 └─► Generates temp password
         
[Faculty Reviews Contract]
         │
         ├─► Approve → Site.learningContractStatus = APPROVED
         └─► Reject → Site.learningContractStatus = REJECTED
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/sites/route.ts` - Create/list sites
  - `src/app/api/sites/[id]/route.ts` - Update/delete site
  - `src/app/api/sites/send-learning-contract/route.ts` - Send contract
  - `src/app/api/agency-learning-contract/[id]/submit/route.ts` - Submit contract
  
- **Components:**
  - `src/components/admin/site-form.tsx` - Site creation/editing
  - `src/components/admin/sites-management.tsx` - Site management

- **Database Models:**
  - `Site` - Main site/agency record
  - `AgencyLearningContract` - Learning contract data

### Current Status Values

**Site.status (SiteStatus enum):**
- `ACTIVE` - Ready for placements
- `PENDING_APPROVAL` - Awaiting faculty review
- `PENDING_LEARNING_CONTRACT` - Contract sent, awaiting completion
- `REJECTED` - Site not approved

**Site.learningContractStatus (LearningContractStatus enum):**
- `null` - No contract process started
- `PENDING` - Initial state
- `SENT` - Contract link sent to agency
- `SUBMITTED` - Agency completed contract
- `APPROVED` - Faculty approved contract
- `REJECTED` - Faculty rejected contract

### Business Rules
1. ✅ Sites can be created without learning contracts
2. ✅ Sites with status ACTIVE are visible to students immediately
3. ✅ Learning contracts are OPTIONAL
4. ✅ Learning contracts can be sent at any time
5. ✅ Submitting a learning contract automatically creates supervisor account if field instructor info is provided
6. ⚠️ **ISSUE:** Students can see sites that haven't completed learning contracts

---

## Supervisor Workflow

### Overview
Supervisors can be created via two paths: direct creation by faculty or pending approval from student placement requests.

### Path A: Direct Creation by Faculty/Admin

```
┌─────────────────────────────────────────────────────────────────┐
│ DIRECT SUPERVISOR CREATION (Faculty/Admin)                      │
└─────────────────────────────────────────────────────────────────┘

[Faculty/Admin Creates Supervisor]
         │
         ├─► Choose existing site
         ├─► Enter supervisor details:
         │   ├─► Name, email, phone
         │   ├─► Title
         │   ├─► License info (licensedSW, licenseNumber)
         │   └─► Degree (highestDegree, otherDegree)
         │
         ▼
[User Account Created]
         │
         ├─► User.role = SUPERVISOR
         ├─► Password hashed
         ├─► SupervisorProfile created
         ├─► Linked to Site
         │
         └─► Supervisor IMMEDIATELY ACTIVE
                 └─► Can be assigned to placements
```

### Path B: Student-Requested Supervisor (Pending Approval)

```
┌─────────────────────────────────────────────────────────────────┐
│ PENDING SUPERVISOR WORKFLOW (Student Request)                   │
└─────────────────────────────────────────────────────────────────┘

[Student Creates Placement Request]
         │
         ├─► Selects site
         ├─► Option: "New Supervisor" or "Existing Supervisor"
         │
         └─► If NEW SUPERVISOR:
                 │
                 ├─► Enters supervisor details
                 ├─► PendingSupervisor created
                 ├─► PendingSupervisor.status = PENDING
                 ├─► Placement.supervisorId = null
                 └─► Notification sent to Faculty/Admin
         
[Faculty Reviews Pending Supervisor]
         │
         ├─► View pending supervisor details
         ├─► Check credentials, license info
         │
         ├─► APPROVE
         │   │
         │   ├─► Creates User account
         │   ├─► Creates SupervisorProfile
         │   ├─► Generates temp password
         │   ├─► PendingSupervisor.status = APPROVED
         │   ├─► Placement.supervisorId = newSupervisor.id
         │   └─► TODO: Email supervisor with credentials
         │
         └─► REJECT
             │
             ├─► PendingSupervisor.status = REJECTED
             ├─► Reason recorded
             └─► Student notified (TODO)
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/admin/supervisors/route.ts` - Create/list supervisors
  - `src/app/api/pending-supervisors/[id]/approve/route.ts` - Approve pending
  - `src/app/api/pending-supervisors/[id]/reject/route.ts` - Reject pending

- **Components:**
  - `src/components/admin/admin-supervisors-management.tsx` - Supervisor management
  - `src/components/admin/edit-supervisor-form.tsx` - Supervisor editing

- **Database Models:**
  - `User` (role: SUPERVISOR)
  - `SupervisorProfile` - Supervisor details
  - `PendingSupervisor` - Pending approval requests

### Current Status Values

**PendingSupervisorStatus enum:**
- `PENDING` - Awaiting faculty approval
- `APPROVED` - Faculty approved, account created
- `REJECTED` - Faculty rejected request

### Business Rules
1. ✅ Faculty can create supervisors instantly (no approval needed)
2. ✅ Students can request new supervisors during placement requests
3. ✅ Pending supervisors require faculty approval
4. ✅ One pending supervisor per placement (unique constraint)
5. ✅ Email must not already exist as a user
6. ⚠️ **ISSUE:** No email notification system for supervisor credentials
7. ⚠️ **ISSUE:** Temp passwords logged to console only

---

## Student Placement Workflow

### Overview
Students request placements at sites, which go through a multi-stage approval process.

### Current Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT PLACEMENT WORKFLOW                                       │
└─────────────────────────────────────────────────────────────────┘

[Student Browses Available Sites]
         │
         └─► Can see all sites with status = ACTIVE
         
[Student Requests Placement]
         │
         ├─► Selects site
         ├─► Selects existing supervisor OR requests new one
         ├─► Selects class/cohort
         ├─► Sets date range
         ├─► Sets required hours
         │
         ▼
[Placement Created]
         │
         ├─► Placement.status = PENDING
         ├─► If new supervisor: PendingSupervisor created
         ├─► Notification sent to faculty
         │
         ▼
[Student Uploads Documents]
         │
         ├─► Cell Phone Policy (PDF) - REQUIRED
         ├─► Learning Contract (PDF) - Optional
         └─► Checklist (PDF) - Optional
         
[Faculty Reviews Placement Request]
         │
         ├─► Checks site suitability
         ├─► Verifies documents uploaded
         ├─► Reviews pending supervisor (if applicable)
         │
         ├─► APPROVE
         │   │
         │   ├─► Validates cellPolicy exists
         │   ├─► Placement.status = APPROVED_PENDING_CHECKLIST
         │   ├─► Placement.approvedAt = now
         │   ├─► Placement.approvedBy = facultyId
         │   └─► Notification sent to student
         │
         ├─► DECLINE
         │   │
         │   ├─► Placement.status = DECLINED
         │   ├─► Placement.declinedAt = now
         │   └─► Notification sent to student
         │
         └─► REJECT
             │
             ├─► Similar to decline
             └─► Allows rejection reason
         
[Faculty Activates Placement]
         │
         ├─► Placement must be in APPROVED_PENDING_CHECKLIST
         ├─► No longer requires checklist to be uploaded
         │   (Checklist now due Week 2 after activation)
         │
         ▼
[Placement Activated]
         │
         ├─► Placement.status = ACTIVE
         ├─► Student can now:
         │   ├─► Log timesheet hours
         │   ├─► Submit journals
         │   ├─► Complete evaluations
         │   └─► Upload additional documents
         │
         ▼
[Ongoing Activities]
         │
         ├─► Student logs hours weekly
         ├─► Supervisor approves timesheets
         ├─► Faculty monitors progress
         ├─► Midterm evaluation (when scheduled)
         └─► Final evaluation (when scheduled)
         
[Placement Completion]
         │
         ├─► All hours completed
         ├─► All evaluations submitted
         ├─► Placement.status = COMPLETE
         │
         └─► OR Archive: Placement.status = ARCHIVED
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/placements/route.ts` - Create/list placements
  - `src/app/api/placements/[id]/route.ts` - Get placement details
  - `src/app/api/placements/[id]/approve/route.ts` - Approve placement
  - `src/app/api/placements/[id]/activate/route.ts` - Activate placement
  - `src/app/api/placements/[id]/decline/route.ts` - Decline placement
  - `src/app/api/placements/[id]/reject/route.ts` - Reject placement
  - `src/app/api/placements/[id]/archive/route.ts` - Archive placement
  - `src/app/api/placements/[id]/documents/route.ts` - Upload documents

- **Components:**
  - `src/components/placements/placement-browser.tsx` - Browse sites
  - `src/components/placements/placement-request-form.tsx` - Request placement
  - `src/components/placements/placement-pending-application.tsx` - View pending
  - `src/components/admin/placements-management.tsx` - Faculty management

- **Database Models:**
  - `Placement` - Main placement record
  - `PendingSupervisor` - If new supervisor requested

### Current Status Values

**PlacementStatus enum:**
- `DRAFT` - Initial creation (not used in current flow)
- `PENDING` - Awaiting faculty approval
- `APPROVED` - Faculty approved (legacy)
- `APPROVED_PENDING_CHECKLIST` - Approved, awaiting activation
- `ACTIVE` - Currently active placement
- `COMPLETE` - Placement finished successfully
- `DECLINED` - Faculty declined request
- `ARCHIVED` - Archived for record keeping

### Business Rules
1. ✅ Students can only request placements at ACTIVE sites
2. ✅ Cell phone policy REQUIRED before approval
3. ✅ Checklist no longer required for activation (due Week 2)
4. ✅ One active placement per student at a time
5. ✅ Faculty must approve before activation
6. ✅ Two-step approval: APPROVE → ACTIVATE
7. ⚠️ **ISSUE:** Students can request placements at sites without completed learning contracts

---

## Learning Contract Workflow

### Overview
Agencies fill out detailed learning contracts via secure token links.

### Current Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENCY LEARNING CONTRACT WORKFLOW                               │
└─────────────────────────────────────────────────────────────────┘

[Faculty Sends Learning Contract]
         │
         ├─► From Site Management page
         ├─► Enter agency contact email
         ├─► Enter contact name
         │
         ▼
[Contract Link Generated]
         │
         ├─► Token: 32-byte hex string
         ├─► Expires: 30 days
         ├─► Status: SENT
         ├─► Site.status = PENDING_LEARNING_CONTRACT
         │
         └─► TODO: Email sent with link
                 Link: /agency-learning-contract/{token}
         
[Agency Opens Link]
         │
         ├─► Validates token not expired
         ├─► Validates status = SENT (not already submitted)
         │
         ▼
[Agency Completes Form]
         │
         ├─► Section 1: Agency Information
         │   ├─► Name, address, contact info
         │   └─► Director name
         │
         ├─► Section 2: Field Instructor Details
         │   ├─► Name (first/last)
         │   ├─► Degree information
         │   ├─► License number (if applicable)
         │   └─► Resume upload (optional)
         │
         ├─► Section 3: Program Information
         │   ├─► Resources available
         │   ├─► Services provided
         │   ├─► Learning plan
         │   ├─► Learning opportunities
         │   ├─► Supervision arrangement
         │   ├─► Instruction methods
         │   └─► Orientation arrangements
         │
         ├─► Section 4: Additional Information
         │   ├─► Special requirements
         │   ├─► Handicap accommodations
         │   ├─► Promotional materials upload
         │   └─► Comments
         │
         └─► Section 5: Signature
             ├─► Completed by name
             └─► Completed by title
         
[Form Submitted]
         │
         ├─► Files saved to: uploads/learning-contracts/{id}/
         ├─► Status: SUBMITTED
         ├─► Site.status = PENDING_APPROVAL
         ├─► Notifications sent to all Faculty/Admin
         │
         └─► AUTO-CREATE SUPERVISOR (if field instructor provided)
             │
             ├─► Check if supervisor email exists
             │
             ├─► If NEW:
             │   ├─► Create User (role: SUPERVISOR)
             │   ├─► Create SupervisorProfile
             │   ├─► Link to site
             │   ├─► Set license/degree info
             │   ├─► Generate temp password
             │   └─► Log credentials to console
             │
             └─► If EXISTS:
                 └─► Skip creation
         
[Faculty Reviews Contract]
         │
         ├─► View all submitted information
         ├─► Review uploaded documents
         ├─► Check field instructor qualifications
         │
         ├─► APPROVE
         │   │
         │   ├─► Site.learningContractStatus = APPROVED
         │   └─► Site can accept placements
         │
         └─► REJECT
             │
             ├─► Site.learningContractStatus = REJECTED
             └─► Site cannot accept placements
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/sites/send-learning-contract/route.ts` - Send contract link
  - `src/app/api/agency-learning-contract/[id]/submit/route.ts` - Submit contract

- **Components:**
  - `src/app/agency-learning-contract/page.tsx` - Contract form
  - `src/components/admin/learning-contract-view.tsx` - Faculty review

- **Database Models:**
  - `AgencyLearningContract` - Contract data
  - `Site` - Linked agency

### Important Features
- ✅ Token-based secure access
- ✅ 30-day expiration
- ✅ Pre-populated with site data
- ✅ File uploads for resume and promotional materials
- ✅ Automatic supervisor account creation
- ⚠️ **ISSUE:** Temp password only logged to console
- ⚠️ **ISSUE:** No email notification system implemented

---

## Timesheet Approval Workflow

### Overview
Students log hours which go through a two-stage approval process: supervisor → faculty.

### Current Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ TIMESHEET APPROVAL WORKFLOW                                      │
└─────────────────────────────────────────────────────────────────┘

[Student Logs Hours]
         │
         ├─► Select date
         ├─► Enter hours (decimal)
         ├─► Select category:
         │   ├─► DIRECT - Direct client contact
         │   ├─► INDIRECT - Case management, documentation
         │   ├─► TRAINING - Professional development
         │   └─► ADMIN - Administrative tasks
         ├─► Add notes (optional)
         │
         ▼
[Timesheet Entry Created]
         │
         ├─► TimesheetEntry.status = DRAFT
         ├─► Belongs to active placement
         └─► Student can edit/delete
         
[Student Submits Week]
         │
         ├─► Groups entries by week
         ├─► Validates entries exist
         │
         ▼
[Entries Submitted]
         │
         ├─► TimesheetEntry.status = PENDING_SUPERVISOR
         ├─► TimesheetEntry.submittedAt = now
         ├─► Notification to supervisor
         └─► Student can no longer edit
         
[Supervisor Reviews Timesheets]
         │
         ├─► Views all PENDING_SUPERVISOR entries
         ├─► Reviews hours, categories, notes
         ├─► Can select multiple entries
         │
         ├─► APPROVE
         │   │
         │   ├─► TimesheetEntry.status = PENDING_FACULTY
         │   ├─► TimesheetEntry.supervisorApprovedAt = now
         │   ├─► TimesheetEntry.supervisorApprovedBy = supervisorId
         │   └─► Notification to faculty
         │
         └─► REJECT
             │
             ├─► TimesheetEntry.status = REJECTED
             ├─► TimesheetEntry.rejectedAt = now
             ├─► TimesheetEntry.rejectedBy = supervisorId
             ├─► TimesheetEntry.rejectionReason = reason
             └─► Notification to student
         
[Faculty Reviews Timesheets]
         │
         ├─► Views all PENDING_FACULTY entries
         ├─► Reviews approved hours
         ├─► Can select multiple entries
         │
         ├─► APPROVE
         │   │
         │   ├─► TimesheetEntry.status = APPROVED
         │   ├─► TimesheetEntry.facultyApprovedAt = now
         │   ├─► TimesheetEntry.facultyApprovedBy = facultyId
         │   ├─► TimesheetEntry.locked = true
         │   └─► Notification to student
         │
         └─► REJECT
             │
             ├─► TimesheetEntry.status = REJECTED
             ├─► TimesheetEntry.rejectedAt = now
             ├─► TimesheetEntry.rejectedBy = facultyId
             ├─► TimesheetEntry.rejectionReason = reason
             └─► Notification to student
         
[Rejected Entries]
         │
         ├─► Student notified of rejection
         ├─► Can view rejection reason
         └─► Must create new entry (cannot edit rejected)
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/placements/[id]/timesheets/route.ts` - Create/list timesheets
  - `src/app/api/placements/[id]/timesheets/submit-week/route.ts` - Submit week
  - `src/app/api/placements/[id]/timesheets/approve/route.ts` - Supervisor approve
  - `src/app/api/faculty/[id]/timesheets/approve/route.ts` - Faculty approve

- **Components:**
  - `src/components/timesheets/timesheet-entry-form.tsx` - Log hours
  - `src/components/timesheets/timesheet-list.tsx` - View entries
  - `src/components/supervisor/timesheet-approval.tsx` - Supervisor review
  - `src/components/faculty/timesheet-approval.tsx` - Faculty review

- **Database Models:**
  - `TimesheetEntry` - Individual hour entries
  - `TimesheetJournal` - Weekly reflection journals

### Current Status Values

**TimesheetStatus enum:**
- `DRAFT` - Student editing
- `PENDING_SUPERVISOR` - Awaiting supervisor approval
- `PENDING_FACULTY` - Awaiting faculty approval
- `APPROVED` - Fully approved and locked
- `REJECTED` - Rejected by supervisor or faculty

**TimesheetCategory enum:**
- `DIRECT` - Direct client contact
- `INDIRECT` - Indirect service (case management, documentation)
- `TRAINING` - Professional development, training
- `ADMIN` - Administrative tasks

### Business Rules
1. ✅ Two-stage approval: supervisor → faculty
2. ✅ Students can only edit DRAFT entries
3. ✅ Submitted entries cannot be edited
4. ✅ Rejected entries cannot be edited (must create new)
5. ✅ Approved entries are locked
6. ✅ Entries organized by week for submission
7. ✅ Decimal hours supported (e.g., 1.5, 2.25)

---

## Evaluation Workflow

### Overview
Students and supervisors complete evaluations at midterm and final stages.

### Current Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ EVALUATION WORKFLOW                                              │
└─────────────────────────────────────────────────────────────────┘

[Faculty Sends Evaluation]
         │
         ├─► Select placement
         ├─► Choose type: MIDTERM or FINAL
         ├─► Optional: Add messages to student/supervisor
         │
         ▼
[Evaluation Created]
         │
         ├─► Evaluation record created
         ├─► Two EvaluationSubmissions created:
         │   ├─► Student submission (status: PENDING)
         │   └─► Supervisor submission (status: PENDING)
         ├─► Notifications sent to both parties
         │
         └─► Student and supervisor work independently
         
[Student Completes Their Section]
         │
         ├─► Opens evaluation form
         ├─► Answers competency questions
         ├─► Can save progress (status: IN_PROGRESS)
         ├─► Can lock when complete (status: LOCKED)
         │
         └─► Cannot view supervisor's answers
         
[Supervisor Completes Their Section]
         │
         ├─► Opens evaluation form
         ├─► Answers competency questions
         ├─► Rates student performance
         ├─► Can save progress (status: IN_PROGRESS)
         ├─► Can lock when complete (status: LOCKED)
         │
         └─► Cannot view student's answers
         
[Both Sections Locked]
         │
         ├─► Student can now view supervisor ratings
         ├─► Supervisor can view student self-assessment
         │
         └─► Faculty notified evaluation complete
         
[Faculty Reviews Evaluation]
         │
         ├─► Views both submissions side-by-side
         ├─► Compares self-assessment with supervisor ratings
         ├─► Can provide feedback
         │
         └─► Marks as reviewed/approved
```

### Key Files Involved
- **API Routes:**
  - `src/app/api/evaluations/send/route.ts` - Send evaluation
  - `src/app/api/evaluations/submissions/[id]/route.ts` - Get submission
  - `src/app/api/evaluations/submissions/[id]/save/route.ts` - Save progress
  - `src/app/api/evaluations/submissions/[id]/lock/route.ts` - Lock submission

- **Components:**
  - `src/components/admin/evaluation-sender.tsx` - Faculty sends evaluation
  - `src/components/evaluations/evaluation-form.tsx` - Complete evaluation

- **Configuration:**
  - `src/config/evaluation.config.ts` - Evaluation questions/competencies
  - `src/config/evaluations.schema.json` - Evaluation JSON schema

- **Database Models:**
  - `Evaluation` - Main evaluation record
  - `EvaluationSubmission` - Individual submissions (student/supervisor)

### Current Status Values

**EvaluationType enum:**
- `MIDTERM` - Mid-placement evaluation
- `FINAL` - End-of-placement evaluation

**EvaluationStatus enum:**
- `PENDING` - Not started
- `IN_PROGRESS` - Partially completed, saved
- `LOCKED` - Completed and submitted

**EvaluationRole enum:**
- `STUDENT` - Student self-assessment
- `SUPERVISOR` - Supervisor assessment

### Business Rules
1. ✅ One evaluation per placement per type (unique constraint)
2. ✅ Student and supervisor work independently
3. ✅ Cannot view other party's answers until both locked
4. ✅ Can save progress multiple times
5. ✅ Once locked, cannot edit
6. ✅ Faculty can view anytime
7. ✅ Competency-based evaluation system

---

## Key Database Relationships

### Core Entity Relationships

```
User (role: STUDENT)
  ├─► StudentProfile (1:1)
  ├─► Placement[] (1:many) as student
  └─► FacultyAssignment[] (1:many) as student

User (role: SUPERVISOR)
  ├─► SupervisorProfile (1:1)
  │   └─► Site (many:1)
  ├─► Placement[] (1:many) as supervisor
  └─► TimesheetEntry[] (many) as approver

User (role: FACULTY/ADMIN)
  ├─► FacultyProfile (1:1)
  ├─► Class[] (1:many) as instructor
  ├─► Placement[] (1:many) as faculty advisor
  ├─► FacultyAssignment[] (1:many) as faculty
  └─► TimesheetEntry[] (many) as approver

Site (Agency)
  ├─► SupervisorProfile[] (1:many) - supervisors at this site
  ├─► Placement[] (1:many) - placements at this site
  ├─► PendingSupervisor[] (1:many) - pending supervisors
  └─► AgencyLearningContract (1:1) - optional

Placement
  ├─► Student (many:1)
  ├─► Supervisor (many:1) optional
  ├─► Faculty (many:1)
  ├─► Site (many:1)
  ├─► Class (many:1)
  ├─► PendingSupervisor (1:1) optional
  ├─► TimesheetEntry[] (1:many)
  ├─► TimesheetJournal[] (1:many)
  ├─► Evaluation[] (1:many)
  └─► FormSubmission[] (1:many)
```

### Critical Constraints

1. **One active placement per student:** Students should not have multiple ACTIVE placements simultaneously
2. **One pending supervisor per placement:** `PendingSupervisor.placementId` is unique
3. **One evaluation per type per placement:** Unique constraint on `[placementId, type]`
4. **Supervisor must belong to site:** `SupervisorProfile.siteId` links supervisor to specific site
5. **Placement supervisor must match site:** `Placement.supervisorId` should be a supervisor at `Placement.siteId`

---

## Summary of Current Issues & Limitations

### 🔴 Critical Issues
1. **No email system:** All notifications rely on in-app notifications; critical communications (supervisor credentials, contract links) not sent via email
2. **Temp passwords logged to console:** Security issue - passwords should be sent via secure email
3. **Students can see unapproved sites:** Sites become visible immediately without learning contract completion

### 🟡 Workflow Issues
4. **Learning contracts are optional:** Sites can accept placements without completing detailed learning contracts
5. **No supervisor vetting for direct creation:** Faculty can create supervisors without approval workflow
6. **Limited site approval workflow:** Sites can be marked ACTIVE without formal approval process
7. **No rollback for rejected learning contracts:** Once rejected, no clear path to resubmit

### 🟢 Enhancement Opportunities
8. **Batch operations:** No bulk approval/rejection for timesheets or placements
9. **Reporting gaps:** Limited analytics on placement outcomes, site performance, supervisor workload
10. **Mobile optimization:** Some complex forms could be simplified for mobile use
11. **Document versioning:** No version control for uploaded documents
12. **Audit trail:** Limited audit logging for sensitive operations

---

## Next Steps

Before making changes, consider:

1. ✅ **Document desired workflows** - Get detailed requirements from faculty
2. ✅ **Create migration plan** - Plan database changes, API changes, UI changes
3. ✅ **Test with feature flags** - Allow toggling between old/new workflows
4. ✅ **Parallel implementation** - Create v2 routes alongside existing routes
5. ✅ **Comprehensive testing** - Test all edge cases before removing old code
6. ✅ **Data migration strategy** - Handle existing data in old format
7. ✅ **Rollback plan** - Ability to revert if issues arise

---

**Document Maintenance:**
- Update this document when workflows change
- Document all deviations from current behavior
- Keep track of technical debt and workarounds


