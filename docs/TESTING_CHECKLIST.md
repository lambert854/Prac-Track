# Testing Checklist for Workflow Changes

**Purpose:** Comprehensive checklist to ensure nothing breaks during workflow migrations  
**Last Updated:** October 9, 2025

---

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Database Testing](#database-testing)
3. [API Endpoint Testing](#api-endpoint-testing)
4. [UI Component Testing](#ui-component-testing)
5. [Role-Based Access Testing](#role-based-access-testing)
6. [Workflow Integration Testing](#workflow-integration-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Browser & Device Testing](#browser--device-testing)
10. [Regression Testing](#regression-testing)

---

## Pre-Testing Setup

### Environment Setup
- [ ] Test database created and seeded with test data
- [ ] Test environment variables configured
- [ ] Feature flags configured for testing
- [ ] Test user accounts created for all roles
- [ ] Backup of production database available
- [ ] Test email service configured (or console logging enabled)
- [ ] Logging and monitoring active

### Test Data Preparation
- [ ] Create test students (at least 3)
- [ ] Create test faculty (at least 2)
- [ ] Create test supervisors (at least 2)
- [ ] Create test sites/agencies (at least 5)
- [ ] Create test placements in various statuses
- [ ] Create test timesheets in various statuses
- [ ] Create test pending supervisors
- [ ] Create test learning contracts

### Test Accounts
Document test credentials:
```
Admin: test-admin@example.com / [password]
Faculty: test-faculty@example.com / [password]
Supervisor: test-supervisor@example.com / [password]
Student: test-student@example.com / [password]
```

---

## Database Testing

### Schema Validation
- [ ] All migrations run successfully
- [ ] No breaking changes to existing tables
- [ ] All foreign key constraints valid
- [ ] All indexes created
- [ ] All unique constraints working
- [ ] Enum values correctly defined
- [ ] Default values set correctly

### Data Integrity
- [ ] Existing data still accessible
- [ ] No orphaned records created
- [ ] Cascade deletes working correctly
- [ ] Required fields have values
- [ ] Optional fields handle nulls
- [ ] Date/time fields in correct format
- [ ] Numeric fields within valid ranges

### Query Performance
- [ ] Common queries run in < 100ms
- [ ] Index usage verified with EXPLAIN
- [ ] No N+1 query problems
- [ ] Batch operations efficient
- [ ] Large datasets handled properly

### Data Migration
- [ ] Old data converted to new format
- [ ] No data loss during migration
- [ ] Data transformation logic correct
- [ ] Rollback restores original data
- [ ] Migration script idempotent (can run multiple times safely)

---

## API Endpoint Testing

### Authentication & Authorization

#### Login/Logout
- [ ] Valid credentials accepted
- [ ] Invalid credentials rejected
- [ ] Session created correctly
- [ ] Session expires after timeout
- [ ] Logout clears session

#### Role-Based Access
- [ ] Admin can access admin routes
- [ ] Faculty can access faculty routes
- [ ] Supervisor can access supervisor routes
- [ ] Student can access student routes
- [ ] Unauthorized access returns 403
- [ ] Unauthenticated access returns 401

### Site/Agency Endpoints

#### GET /api/sites
- [ ] Returns all sites for admin/faculty
- [ ] Returns only active sites for students
- [ ] Filters work correctly
- [ ] Pagination works (if implemented)
- [ ] Sorting works correctly
- [ ] Includes related data (supervisors, contracts)

#### POST /api/sites
- [ ] Creates site with valid data
- [ ] Rejects invalid data (400)
- [ ] Validates required fields
- [ ] Sets default values correctly
- [ ] Returns created site with ID
- [ ] Only faculty/admin can create

#### PUT /api/sites/[id]
- [ ] Updates site with valid data
- [ ] Rejects invalid data
- [ ] Partial updates work
- [ ] Cannot update to invalid status
- [ ] Only faculty/admin can update

#### DELETE /api/sites/[id]
- [ ] Deletes site if no dependencies
- [ ] Prevents deletion if placements exist
- [ ] Returns appropriate error messages
- [ ] Only admin can delete

#### POST /api/sites/send-learning-contract
- [ ] Creates learning contract record
- [ ] Generates valid token
- [ ] Sets 30-day expiry
- [ ] Updates site status
- [ ] Creates notification
- [ ] Only faculty/admin can send

### Supervisor Endpoints

#### GET /api/admin/supervisors
- [ ] Returns all supervisors
- [ ] Returns pending supervisors
- [ ] Includes site information
- [ ] Includes placement counts
- [ ] Only faculty/admin can access

#### POST /api/admin/supervisors
- [ ] Creates supervisor account
- [ ] Creates supervisor profile
- [ ] Links to site
- [ ] Hashes password
- [ ] Email must be unique
- [ ] Only faculty/admin can create

#### POST /api/pending-supervisors/[id]/approve
- [ ] Creates supervisor account
- [ ] Updates pending status
- [ ] Links to placement
- [ ] Email uniqueness validated
- [ ] Only faculty/admin can approve

#### POST /api/pending-supervisors/[id]/reject
- [ ] Updates pending status
- [ ] Records rejection reason
- [ ] Notifies student (if implemented)
- [ ] Only faculty/admin can reject

### Placement Endpoints

#### GET /api/placements
- [ ] Students see only their placements
- [ ] Faculty see all placements
- [ ] Supervisors see their assigned placements
- [ ] Includes all related data
- [ ] Status filters work

#### POST /api/placements
- [ ] Students can create placement requests
- [ ] Faculty/admin can create for students
- [ ] Creates placement with PENDING status
- [ ] Creates pending supervisor if requested
- [ ] Prevents duplicate active placements
- [ ] Validates date ranges
- [ ] Validates required hours

#### POST /api/placements/[id]/approve
- [ ] Requires cell policy uploaded
- [ ] Updates status to APPROVED_PENDING_CHECKLIST
- [ ] Records approval timestamp and approver
- [ ] Sends notification to student
- [ ] Only faculty/admin can approve
- [ ] Cannot approve non-PENDING placements

#### POST /api/placements/[id]/activate
- [ ] Requires APPROVED_PENDING_CHECKLIST status
- [ ] Updates status to ACTIVE
- [ ] Checklist no longer required
- [ ] Only faculty/admin can activate

#### POST /api/placements/[id]/decline
- [ ] Records decline reason
- [ ] Updates status to DECLINED
- [ ] Notifies student
- [ ] Only faculty/admin can decline

#### POST /api/placements/[id]/documents
- [ ] Accepts PDF files only
- [ ] Validates file size
- [ ] Saves to correct directory
- [ ] Updates placement record
- [ ] Students can upload to their placements
- [ ] Faculty/admin can upload to any placement

### Timesheet Endpoints

#### GET /api/placements/[id]/timesheets
- [ ] Returns all entries for placement
- [ ] Filters by status work
- [ ] Filters by date range work
- [ ] Includes journal entries
- [ ] Access control enforced

#### POST /api/placements/[id]/timesheets
- [ ] Creates timesheet entry
- [ ] Validates hours (decimal, positive)
- [ ] Validates category enum
- [ ] Status defaults to DRAFT
- [ ] Students can create for their placements
- [ ] Placement must be ACTIVE

#### POST /api/placements/[id]/timesheets/submit-week
- [ ] Validates entries exist
- [ ] Updates status to PENDING_SUPERVISOR
- [ ] Sets submittedAt timestamp
- [ ] Prevents editing after submission
- [ ] Creates notification for supervisor

#### POST /api/placements/[id]/timesheets/approve (Supervisor)
- [ ] Validates PENDING_SUPERVISOR status
- [ ] Can approve multiple entries
- [ ] Updates status to PENDING_FACULTY
- [ ] Records supervisor approval
- [ ] Can reject with reason
- [ ] Rejected entries status = REJECTED
- [ ] Creates notification for faculty/student

#### POST /api/faculty/[id]/timesheets/approve (Faculty)
- [ ] Validates PENDING_FACULTY status
- [ ] Can approve multiple entries
- [ ] Updates status to APPROVED
- [ ] Locks approved entries
- [ ] Can reject with reason
- [ ] Creates notification for student

### Evaluation Endpoints

#### POST /api/evaluations/send
- [ ] Creates evaluation record
- [ ] Creates student submission (PENDING)
- [ ] Creates supervisor submission (PENDING)
- [ ] Sets evaluation type (MIDTERM/FINAL)
- [ ] Prevents duplicate type per placement
- [ ] Creates notifications
- [ ] Only faculty/admin can send

#### GET /api/evaluations/submissions/[id]
- [ ] Returns submission for authorized user
- [ ] Student sees only their submission
- [ ] Supervisor sees only their submission
- [ ] Faculty sees all submissions
- [ ] Cannot see other party's answers until both locked

#### POST /api/evaluations/submissions/[id]/save
- [ ] Saves partial progress
- [ ] Updates status to IN_PROGRESS
- [ ] Validates answer format
- [ ] Updates lastSavedAt timestamp
- [ ] Cannot save if locked

#### POST /api/evaluations/submissions/[id]/lock
- [ ] Updates status to LOCKED
- [ ] Sets lockedAt timestamp
- [ ] Cannot unlock after locking
- [ ] Cannot edit after locking
- [ ] Notifies other party (if both locked)

---

## UI Component Testing

### Site Management Components

#### Site Browser (Student View)
- [ ] Displays active sites only
- [ ] Shows site details correctly
- [ ] Search/filter functionality works
- [ ] Practice areas displayed
- [ ] Contact information visible
- [ ] Can navigate to placement request
- [ ] Responsive on mobile

#### Site Management (Faculty/Admin)
- [ ] Lists all sites
- [ ] Status badges display correctly
- [ ] Can create new site
- [ ] Can edit existing site
- [ ] Can send learning contract
- [ ] Can approve/reject sites
- [ ] Learning contract status visible
- [ ] Can view learning contract details

#### Site Form
- [ ] All required fields marked
- [ ] Validation messages display
- [ ] Can save partial progress
- [ ] Can submit complete form
- [ ] Date pickers work correctly
- [ ] Dropdown selections work
- [ ] Address fields autocomplete (if implemented)

### Supervisor Management Components

#### Supervisor List (Faculty/Admin)
- [ ] Displays all approved supervisors
- [ ] Displays pending supervisors separately
- [ ] Shows site assignments
- [ ] Shows active placements count
- [ ] Can create new supervisor
- [ ] Can edit supervisor details
- [ ] Can approve pending supervisors
- [ ] Can reject pending supervisors

#### Supervisor Dashboard
- [ ] Shows assigned students
- [ ] Shows pending timesheets count
- [ ] Shows pending forms count
- [ ] Can navigate to student details
- [ ] Can navigate to timesheet approval
- [ ] Can navigate to evaluation forms

### Placement Components

#### Placement Request Form (Student)
- [ ] Site selection dropdown populated
- [ ] Supervisor selection (existing or new)
- [ ] New supervisor fields conditional
- [ ] Date range validation
- [ ] Required hours validation
- [ ] Class selection dropdown
- [ ] Can save draft
- [ ] Can submit request
- [ ] Validation errors display

#### Placement Application View
- [ ] Shows all placement details
- [ ] Shows document upload status
- [ ] Can upload documents
- [ ] Shows approval status
- [ ] Shows pending supervisor (if applicable)
- [ ] Faculty can approve/decline
- [ ] Faculty can activate
- [ ] Status timeline visible

#### Placement Management (Faculty)
- [ ] Lists all placements
- [ ] Status filters work
- [ ] Student search works
- [ ] Site filter works
- [ ] Can view placement details
- [ ] Can approve placements
- [ ] Can activate placements
- [ ] Can archive placements

### Timesheet Components

#### Timesheet Entry Form
- [ ] Date picker works
- [ ] Hours input accepts decimals
- [ ] Category dropdown populated
- [ ] Notes field optional
- [ ] Can save entry
- [ ] Can edit draft entries
- [ ] Cannot edit submitted entries
- [ ] Validation errors display

#### Timesheet List (Student)
- [ ] Shows all entries
- [ ] Groups by week
- [ ] Shows status badges
- [ ] Can create new entry
- [ ] Can edit draft entries
- [ ] Can submit week
- [ ] Shows approval history
- [ ] Shows rejection reasons

#### Timesheet Approval (Supervisor)
- [ ] Shows pending entries
- [ ] Can select multiple entries
- [ ] Can approve batch
- [ ] Can reject with reason
- [ ] Shows student information
- [ ] Shows entry details
- [ ] Approval confirmation modal

#### Timesheet Approval (Faculty)
- [ ] Shows supervisor-approved entries
- [ ] Can filter by student
- [ ] Can filter by date
- [ ] Can approve batch
- [ ] Can reject with reason
- [ ] Shows complete approval chain

### Evaluation Components

#### Evaluation Form
- [ ] Loads questions correctly
- [ ] Can select ratings
- [ ] Can enter text responses
- [ ] Progress indicator visible
- [ ] Can save progress
- [ ] Can lock submission
- [ ] Confirmation before locking
- [ ] Cannot edit after locking

#### Evaluation Results (Faculty)
- [ ] Shows both submissions side-by-side
- [ ] Student answers visible
- [ ] Supervisor answers visible
- [ ] Can export to PDF
- [ ] Competency ratings highlighted
- [ ] Discrepancies highlighted

---

## Role-Based Access Testing

### Student Access
- [ ] Can view own profile
- [ ] Can browse active sites
- [ ] Can request placements
- [ ] Can upload placement documents
- [ ] Can log timesheet hours
- [ ] Can view own timesheets
- [ ] Can complete evaluations
- [ ] Cannot access admin routes
- [ ] Cannot access faculty routes
- [ ] Cannot access other students' data

### Supervisor Access
- [ ] Can view own dashboard
- [ ] Can view assigned students
- [ ] Can approve timesheets for assigned students
- [ ] Can complete evaluations for assigned students
- [ ] Cannot access admin routes
- [ ] Cannot access faculty routes
- [ ] Cannot view unassigned students
- [ ] Cannot modify placement details

### Faculty Access
- [ ] Can view all students
- [ ] Can view all placements
- [ ] Can create/edit sites
- [ ] Can send learning contracts
- [ ] Can approve/decline placements
- [ ] Can activate placements
- [ ] Can approve timesheets (final approval)
- [ ] Can send evaluations
- [ ] Can view all evaluation results
- [ ] Can create supervisors
- [ ] Can approve pending supervisors
- [ ] Cannot access admin-only features

### Admin Access
- [ ] Has all faculty permissions
- [ ] Can create/edit/delete users
- [ ] Can create/edit classes
- [ ] Can reset passwords
- [ ] Can change user roles
- [ ] Can access all system areas
- [ ] Can view audit logs
- [ ] Can configure system settings

---

## Workflow Integration Testing

### End-to-End: Site Creation & Learning Contract

#### Test Case 1: New Site with Immediate Activation
1. [ ] Faculty creates new site
2. [ ] Site status = ACTIVE
3. [ ] Site visible to students immediately
4. [ ] Students can request placements
5. [ ] No learning contract required

#### Test Case 2: New Site with Learning Contract
1. [ ] Faculty creates new site
2. [ ] Faculty sends learning contract
3. [ ] Site status = PENDING_LEARNING_CONTRACT
4. [ ] Token generated and stored
5. [ ] Agency receives link (or console log)
6. [ ] Agency opens link with valid token
7. [ ] Agency completes contract form
8. [ ] Uploads resume and promotional materials
9. [ ] Submits contract
10. [ ] Supervisor account auto-created (if field instructor provided)
11. [ ] Site status = PENDING_APPROVAL
12. [ ] Faculty receives notification
13. [ ] Faculty reviews and approves contract
14. [ ] Site status = ACTIVE (or custom status)
15. [ ] Site visible to students

### End-to-End: Supervisor Creation

#### Test Case 3: Direct Supervisor Creation
1. [ ] Faculty navigates to supervisor management
2. [ ] Clicks "Add Supervisor"
3. [ ] Fills in supervisor details
4. [ ] Selects site
5. [ ] Submits form
6. [ ] Supervisor account created immediately
7. [ ] Supervisor can login
8. [ ] Supervisor linked to site
9. [ ] Supervisor appears in site's supervisor list

#### Test Case 4: Pending Supervisor Request
1. [ ] Student requests placement
2. [ ] Selects "New Supervisor"
3. [ ] Fills in supervisor details
4. [ ] Submits placement request
5. [ ] Placement created with PENDING status
6. [ ] PendingSupervisor created
7. [ ] Faculty receives notification
8. [ ] Faculty reviews pending supervisor
9. [ ] Faculty approves supervisor
10. [ ] Supervisor account created
11. [ ] Supervisor linked to placement
12. [ ] Placement updated with supervisorId

### End-to-End: Student Placement Lifecycle

#### Test Case 5: Complete Placement Workflow
1. [ ] Student browses available sites
2. [ ] Student selects site
3. [ ] Student selects existing supervisor
4. [ ] Student fills in placement details
5. [ ] Student submits placement request
6. [ ] Placement status = PENDING
7. [ ] Faculty receives notification
8. [ ] Student uploads cell phone policy
9. [ ] Faculty reviews request
10. [ ] Faculty approves placement
11. [ ] Placement status = APPROVED_PENDING_CHECKLIST
12. [ ] Student receives notification
13. [ ] Faculty activates placement
14. [ ] Placement status = ACTIVE
15. [ ] Student can log hours
16. [ ] Supervisor can approve hours
17. [ ] Faculty can see progress

### End-to-End: Timesheet Approval Chain

#### Test Case 6: Timesheet Submission & Approval
1. [ ] Student logs hours (multiple days)
2. [ ] Entries status = DRAFT
3. [ ] Student can edit draft entries
4. [ ] Student submits week
5. [ ] Entries status = PENDING_SUPERVISOR
6. [ ] Student cannot edit submitted entries
7. [ ] Supervisor receives notification
8. [ ] Supervisor reviews timesheets
9. [ ] Supervisor approves entries
10. [ ] Entries status = PENDING_FACULTY
11. [ ] Faculty receives notification
12. [ ] Faculty reviews timesheets
13. [ ] Faculty approves entries
14. [ ] Entries status = APPROVED
15. [ ] Entries locked
16. [ ] Student receives notification
17. [ ] Hours count toward total

#### Test Case 7: Timesheet Rejection
1. [ ] Student submits hours
2. [ ] Supervisor rejects with reason
3. [ ] Entry status = REJECTED
4. [ ] Student notified with reason
5. [ ] Student creates new entry
6. [ ] Student resubmits corrected hours

### End-to-End: Evaluation Process

#### Test Case 8: Midterm Evaluation
1. [ ] Faculty sends midterm evaluation
2. [ ] Evaluation record created
3. [ ] Student submission created (PENDING)
4. [ ] Supervisor submission created (PENDING)
5. [ ] Both parties receive notifications
6. [ ] Student opens evaluation form
7. [ ] Student completes questions
8. [ ] Student saves progress (IN_PROGRESS)
9. [ ] Student locks submission (LOCKED)
10. [ ] Supervisor opens evaluation form
11. [ ] Supervisor cannot see student answers yet
12. [ ] Supervisor completes questions
13. [ ] Supervisor locks submission (LOCKED)
14. [ ] Both can now see each other's answers
15. [ ] Faculty can view both submissions
16. [ ] Faculty can export to PDF

---

## Performance Testing

### Load Testing
- [ ] 10 concurrent users - response time < 200ms
- [ ] 50 concurrent users - response time < 500ms
- [ ] 100 concurrent users - response time < 1s
- [ ] 500 concurrent users - system remains stable

### Database Performance
- [ ] Complex queries execute < 100ms
- [ ] Bulk operations handle 1000+ records
- [ ] No memory leaks during extended use
- [ ] Connection pool properly managed

### File Upload Performance
- [ ] PDF uploads < 10MB process quickly
- [ ] Multiple simultaneous uploads handled
- [ ] Large files don't block other operations
- [ ] Progress indicators accurate

---

## Security Testing

### Authentication
- [ ] Password complexity enforced
- [ ] Passwords hashed with bcrypt
- [ ] Session tokens expire correctly
- [ ] Cannot reuse expired tokens
- [ ] Cannot access API without authentication

### Authorization
- [ ] Users can only access their own data
- [ ] Role checks enforced on all routes
- [ ] Cannot escalate privileges
- [ ] Direct API calls blocked without proper role

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload types validated
- [ ] File sizes limited
- [ ] Malicious filenames handled

### Data Protection
- [ ] Sensitive data not logged
- [ ] Passwords never exposed in responses
- [ ] Email addresses protected from enumeration
- [ ] Error messages don't leak system info

---

## Browser & Device Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile responsive design works

### Screen Sizes
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)
- [ ] Large desktop (1920px+)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast WCAG AA compliant
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Form labels properly associated

---

## Regression Testing

### Previously Working Features
- [ ] Login/logout still works
- [ ] User profile editing works
- [ ] Password reset works
- [ ] Notifications still sent
- [ ] Email logs recorded (if implemented)
- [ ] Existing placements still accessible
- [ ] Old timesheets still viewable
- [ ] Completed evaluations still accessible
- [ ] Reports still generate correctly
- [ ] CSV exports still work

### Data Migration Impact
- [ ] Old placements display correctly
- [ ] Old timesheets have correct totals
- [ ] Old evaluations remain accessible
- [ ] Historical data intact
- [ ] No broken relationships

---

## Final Checklist

### Before Deployment
- [ ] All tests passed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Monitoring configured
- [ ] Feature flags set correctly

### After Deployment
- [ ] Smoke test in production
- [ ] Monitor error rates (< 1%)
- [ ] Monitor response times (< 500ms p95)
- [ ] Check logs for unexpected errors
- [ ] Verify notifications working
- [ ] Collect user feedback
- [ ] Document any issues

### If Issues Found
- [ ] Assess severity
- [ ] Disable feature flag (if critical)
- [ ] Create bug tickets
- [ ] Notify users (if impacted)
- [ ] Apply hotfix or rollback
- [ ] Post-mortem analysis

---

## Testing Sign-off

### Test Lead
**Name:** ________________  
**Date:** ________________  
**All critical tests passed:** [ ] Yes [ ] No

### Development Lead
**Name:** ________________  
**Date:** ________________  
**Approved for deployment:** [ ] Yes [ ] No

### Product Owner
**Name:** ________________  
**Date:** ________________  
**Business requirements met:** [ ] Yes [ ] No

---

**Checklist Version:** 1.0  
**Last Updated:** October 9, 2025


