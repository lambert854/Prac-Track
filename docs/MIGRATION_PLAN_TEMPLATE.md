# Migration Plan Template

**Migration Name:** [Descriptive name of the workflow change]  
**Created:** [Date]  
**Status:** [PLANNING | IN_PROGRESS | TESTING | COMPLETE | ROLLED_BACK]  
**Priority:** [LOW | MEDIUM | HIGH | CRITICAL]  
**Estimated Effort:** [Hours/Days]  
**Assigned To:** [Team member(s)]

---

## Executive Summary

**What are we changing?**
[2-3 sentence summary of the migration]

**Why are we changing it?**
[Brief explanation of the problem being solved or requirement being met]

**What's the risk level?**
[LOW | MEDIUM | HIGH with brief justification]

**Dependencies:**
- [ ] Other migrations that must complete first
- [ ] External systems or services
- [ ] Third-party integrations

---

## Current Behavior

### Current Workflow Description
[Detailed description of how the system currently works]

```
[Flow diagram or step-by-step process]
Step 1: [Action]
  → Result: [What happens]
  → Data: [What's stored/modified]
  
Step 2: [Action]
  → Result: [What happens]
  → Data: [What's stored/modified]
```

### Current Database Schema
```sql
-- Relevant table structures
-- Example:
Table: sites
  - id: String (PK)
  - status: SiteStatus
  - active: Boolean
  - learningContractStatus: LearningContractStatus?
```

### Current API Endpoints
- **Endpoint:** `[METHOD] /api/path/to/endpoint`
  - **Purpose:** [What it does]
  - **Auth Required:** [Role(s)]
  - **Request:** [Body/params]
  - **Response:** [Response format]
  - **Side Effects:** [What else happens]

### Current UI Components
- **Component:** `[ComponentName.tsx]`
  - **Location:** `[path]`
  - **Purpose:** [What it does]
  - **Used By:** [Other components/pages]

### Current Business Rules
1. Rule: [Description]
   - Enforced in: [Code location]
   - Validation: [How it's validated]

2. Rule: [Description]
   - Enforced in: [Code location]
   - Validation: [How it's validated]

### Issues with Current Approach
1. **Issue:** [Description]
   - **Impact:** [Who/what is affected]
   - **Frequency:** [How often this occurs]
   - **Workarounds:** [Current mitigation strategies]

2. **Issue:** [Description]
   - **Impact:** [Who/what is affected]
   - **Frequency:** [How often this occurs]
   - **Workarounds:** [Current mitigation strategies]

---

## Desired Behavior

### New Workflow Description
[Detailed description of how the system should work after migration]

```
[Flow diagram or step-by-step process]
Step 1: [Action]
  → Result: [What happens]
  → Data: [What's stored/modified]
  → NEW: [What's different from current behavior]
  
Step 2: [Action]
  → Result: [What happens]
  → Data: [What's stored/modified]
  → NEW: [What's different from current behavior]
```

### New Business Rules
1. Rule: [Description]
   - Enforcement: [Where it will be enforced]
   - Validation: [How it will be validated]
   - Impact: [What happens if violated]

2. Rule: [Description]
   - Enforcement: [Where it will be enforced]
   - Validation: [How it will be validated]
   - Impact: [What happens if violated]

### User Experience Changes

#### For Students
- **Change:** [What's different]
- **Impact:** [How it affects them]
- **Training Needed:** [Yes/No - what training]

#### For Supervisors
- **Change:** [What's different]
- **Impact:** [How it affects them]
- **Training Needed:** [Yes/No - what training]

#### For Faculty
- **Change:** [What's different]
- **Impact:** [How it affects them]
- **Training Needed:** [Yes/No - what training]

#### For Admins
- **Change:** [What's different]
- **Impact:** [How it affects them]
- **Training Needed:** [Yes/No - what training]

### Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

---

## Database Changes

### New Tables
```sql
-- Table: [table_name]
CREATE TABLE [table_name] (
  -- Column definitions
  id TEXT PRIMARY KEY,
  -- Add all columns
);
```

**Purpose:** [Why this table is needed]  
**Relationships:** [Foreign keys and relations]  
**Indexes:** [What indexes are needed]

### Modified Tables
```sql
-- Table: [table_name]
ALTER TABLE [table_name]
  ADD COLUMN [column_name] [type] [constraints];
  
ALTER TABLE [table_name]
  MODIFY COLUMN [column_name] [new_type] [new_constraints];
```

**Migration Strategy:**
- [ ] Can be done with `prisma migrate`
- [ ] Requires custom migration script
- [ ] Requires data transformation

**Data Transformation:**
```javascript
// Pseudocode for data migration
// Example:
await prisma.site.updateMany({
  where: { status: 'ACTIVE' },
  data: { newField: 'default_value' }
});
```

### Removed Tables/Columns
```sql
-- Table/Column: [name]
DROP TABLE [table_name];
-- OR
ALTER TABLE [table_name] DROP COLUMN [column_name];
```

**Safety Check:**
- [ ] No existing data relies on this table/column
- [ ] All code references removed
- [ ] Backup created before removal

### New Enums
```typescript
enum NewEnumName {
  VALUE_1,
  VALUE_2,
  VALUE_3
}
```

**Usage:** [Where this enum will be used]  
**Migration:** [How existing data will map to new enum values]

### Migration Steps
1. **Step 1:** [Description]
   ```bash
   # Commands to run
   npx prisma migrate dev --name migration_name
   ```

2. **Step 2:** [Description]
   ```bash
   # Commands to run
   npm run custom:migration:script
   ```

3. **Step 3:** [Description]
   ```bash
   # Commands to run
   npx prisma generate
   ```

---

## API Changes

### New API Endpoints

#### Endpoint 1
- **Route:** `[METHOD] /api/path/to/endpoint`
- **Purpose:** [What it does]
- **Auth:** [Required role(s)]
- **Request:**
  ```typescript
  {
    field1: string,
    field2: number,
    // ...
  }
  ```
- **Response:**
  ```typescript
  {
    success: boolean,
    data: {
      // response structure
    }
  }
  ```
- **Validation:** [Zod schema or validation rules]
- **Side Effects:** [What else happens]
- **Error Handling:** [What errors can occur]

### Modified API Endpoints

#### Endpoint 1
- **Route:** `[METHOD] /api/path/to/endpoint`
- **Changes:** [What's different]
- **Breaking Changes:** [Yes/No - describe if yes]
- **Backward Compatibility:** [How it's maintained]
- **Migration Path:** [How existing clients should adapt]

### Deprecated API Endpoints

#### Endpoint 1
- **Route:** `[METHOD] /api/path/to/endpoint`
- **Deprecation Date:** [Date]
- **Removal Date:** [Date]
- **Replacement:** [New endpoint to use]
- **Migration Guide:** [How to migrate]

### API Testing Checklist
- [ ] All new endpoints have unit tests
- [ ] All modified endpoints have updated tests
- [ ] Integration tests pass
- [ ] Error cases covered
- [ ] Authentication/authorization tested
- [ ] Rate limiting tested (if applicable)
- [ ] Performance tested under load

---

## UI Changes

### New Components

#### Component 1
- **Name:** `[ComponentName.tsx]`
- **Location:** `[path]`
- **Purpose:** [What it does]
- **Props:**
  ```typescript
  interface ComponentProps {
    prop1: string;
    prop2?: number;
  }
  ```
- **State Management:** [How state is managed]
- **API Calls:** [What APIs it calls]
- **Dependencies:** [Other components it uses]

### Modified Components

#### Component 1
- **Name:** `[ComponentName.tsx]`
- **Location:** `[path]`
- **Changes:** [What's different]
- **Breaking Changes:** [Impact on parent components]
- **Migration:** [How to update usage]

### Removed Components

#### Component 1
- **Name:** `[ComponentName.tsx]`
- **Location:** `[path]`
- **Reason:** [Why it's being removed]
- **Replacement:** [What to use instead]
- **Impact:** [What breaks without it]

### New Pages/Routes

#### Route 1
- **Path:** `/path/to/page`
- **Component:** `[page.tsx]`
- **Auth Required:** [Role(s)]
- **Purpose:** [What it's for]
- **Links From:** [Where users access it]

### UI Testing Checklist
- [ ] Component unit tests pass
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass (WCAG AA)
- [ ] Mobile responsive on all screen sizes
- [ ] Works in all supported browsers
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled

---

## Feature Flags

### Flag Configuration
```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  NEW_WORKFLOW_NAME: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_NEW_WORKFLOW === 'true',
    description: '[Description of what this enables]',
    rolloutPercentage: 0, // 0-100, for gradual rollout
  }
};
```

### Usage Pattern
```typescript
// Example usage in code
if (FEATURE_FLAGS.NEW_WORKFLOW_NAME.enabled) {
  // New workflow code
} else {
  // Old workflow code
}
```

### Rollout Plan
1. **Phase 1:** Internal testing (0% users)
2. **Phase 2:** Beta testing (10% users or specific accounts)
3. **Phase 3:** Gradual rollout (25% → 50% → 75%)
4. **Phase 4:** Full rollout (100%)
5. **Phase 5:** Remove old code and feature flag

---

## Testing Strategy

### Unit Tests
**Location:** `[test file paths]`

- [ ] Test new database operations
- [ ] Test new API endpoints
- [ ] Test new business logic
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Test edge cases

### Integration Tests
**Location:** `[test file paths]`

- [ ] Test complete workflows end-to-end
- [ ] Test interaction between new and old code
- [ ] Test data migration scripts
- [ ] Test rollback procedures

### Manual Test Cases

#### Test Case 1: [Test Name]
**Purpose:** [What we're testing]  
**Preconditions:** [Setup required]  
**Steps:**
1. [Action]
2. [Action]
3. [Action]

**Expected Result:** [What should happen]  
**Actual Result:** [To be filled during testing]  
**Status:** [PASS | FAIL | BLOCKED]

#### Test Case 2: [Test Name]
[Repeat structure]

### User Acceptance Testing (UAT)
**Participants:** [Who will test]  
**Duration:** [How long]  
**Scenarios:** [Real-world use cases to test]

- [ ] Scenario 1: [Description]
- [ ] Scenario 2: [Description]
- [ ] Scenario 3: [Description]

### Performance Testing
- [ ] Response time under normal load
- [ ] Response time under peak load
- [ ] Database query performance
- [ ] Memory usage
- [ ] API rate limit impact

### Security Testing
- [ ] Authorization checks
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Sensitive data handling

---

## Migration Execution Plan

### Pre-Migration Checklist
- [ ] All code reviewed and approved
- [ ] All tests passing
- [ ] Database backup created
- [ ] Rollback plan documented and tested
- [ ] Feature flag configured
- [ ] Monitoring/alerting configured
- [ ] Documentation updated
- [ ] Team briefed on migration
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)

### Execution Steps

#### Step 1: Database Migration
**Time Estimate:** [Duration]  
**Responsible:** [Person]  
**Commands:**
```bash
# Example commands
npx prisma migrate deploy
npm run custom:migration:script
```
**Verification:**
```bash
# How to verify success
npx prisma studio
# Check specific records
```

#### Step 2: Deploy Backend Changes
**Time Estimate:** [Duration]  
**Responsible:** [Person]  
**Commands:**
```bash
# Example commands
git push origin feature/branch-name
# Trigger deployment
```
**Verification:**
```bash
# API health check
curl https://api.example.com/health
```

#### Step 3: Deploy Frontend Changes
**Time Estimate:** [Duration]  
**Responsible:** [Person]  
**Commands:**
```bash
# Example commands
npm run build
npm run deploy
```
**Verification:**
- [ ] Load homepage
- [ ] Test new workflow
- [ ] Check browser console for errors

#### Step 4: Enable Feature Flag
**Time Estimate:** [Duration]  
**Responsible:** [Person]  
**Actions:**
1. Set environment variable
2. Restart services (if needed)
3. Verify flag is active

#### Step 5: Monitor & Validate
**Duration:** [How long to monitor]  
**Metrics to Watch:**
- [ ] Error rate
- [ ] Response times
- [ ] User feedback/support tickets
- [ ] Database performance
- [ ] Memory/CPU usage

### Post-Migration Checklist
- [ ] All systems operational
- [ ] No increase in error rates
- [ ] User feedback collected
- [ ] Metrics within acceptable ranges
- [ ] Documentation updated
- [ ] Team debriefed
- [ ] Stakeholders notified of completion

---

## Rollback Strategy

### Rollback Triggers
Initiate rollback if:
- [ ] Error rate exceeds [threshold]%
- [ ] Critical bug discovered
- [ ] Database corruption detected
- [ ] Performance degradation beyond [threshold]%
- [ ] Security vulnerability identified

### Rollback Steps

#### Step 1: Disable Feature Flag
**Time Estimate:** [Duration]  
**Commands:**
```bash
# Disable feature immediately
export NEXT_PUBLIC_ENABLE_NEW_WORKFLOW=false
# Restart services
```

#### Step 2: Revert Code Changes
**Time Estimate:** [Duration]  
**Commands:**
```bash
# Revert to previous commit
git revert [commit-hash]
git push origin main
# Redeploy
```

#### Step 3: Rollback Database (if needed)
**Time Estimate:** [Duration]  
**Commands:**
```bash
# Restore from backup
npx prisma migrate reset
# Restore backup data
psql [database] < backup.sql
```

#### Step 4: Verify Rollback
- [ ] System functional with old workflow
- [ ] No data loss
- [ ] Error rates normal
- [ ] Users can continue working

### Data Preservation
**During Rollback:**
- [ ] New data preserved and accessible
- [ ] No data corruption
- [ ] Audit trail maintained
- [ ] Users notified of temporary issues (if any)

### Post-Rollback Actions
- [ ] Root cause analysis
- [ ] Fix identified issues
- [ ] Update migration plan
- [ ] Retest thoroughly
- [ ] Reschedule migration

---

## Communication Plan

### Internal Communication

#### Before Migration
**Audience:** Development team  
**Channel:** [Slack/Email/Meeting]  
**Message:** [Summary of migration and what to watch for]

**Audience:** QA team  
**Channel:** [Slack/Email/Meeting]  
**Message:** [Testing requirements and timeline]

#### During Migration
**Audience:** Operations team  
**Channel:** [Slack/Email/Alert system]  
**Message:** [Real-time status updates]

#### After Migration
**Audience:** All staff  
**Channel:** [Email/Announcement]  
**Message:** [Completion notice and any action items]

### External Communication

#### Before Migration
**Audience:** [Users/Stakeholders]  
**Channel:** [Email/In-app notification]  
**Message:** [What's changing and when]  
**Advance Notice:** [Duration before migration]

#### During Migration (if downtime)
**Audience:** [Users]  
**Channel:** [Status page/Banner]  
**Message:** [System maintenance notice]

#### After Migration
**Audience:** [Users]  
**Channel:** [Email/In-app notification]  
**Message:** [What's new and how to use it]  
**Training Resources:** [Links to guides/videos]

---

## Training & Documentation

### User Documentation
- [ ] Updated user guide
- [ ] Screen recording/video tutorial
- [ ] FAQ section
- [ ] Quick reference card
- [ ] Release notes

### Developer Documentation
- [ ] API documentation updated
- [ ] Code comments added
- [ ] Architecture diagrams updated
- [ ] Database schema documentation
- [ ] Migration guide for other developers

### Training Sessions
**Session 1:** [Target audience]  
**Duration:** [Length]  
**Content:** [Topics covered]  
**Date:** [When]

**Session 2:** [Target audience]  
**Duration:** [Length]  
**Content:** [Topics covered]  
**Date:** [When]

---

## Risk Assessment

### Identified Risks

#### Risk 1: [Description]
**Probability:** [LOW | MEDIUM | HIGH]  
**Impact:** [LOW | MEDIUM | HIGH]  
**Overall Risk:** [LOW | MEDIUM | HIGH | CRITICAL]

**Mitigation:**
- [Strategy to prevent]
- [Strategy to detect early]
- [Strategy to respond if occurs]

**Contingency:**
- [Backup plan if mitigation fails]

#### Risk 2: [Description]
[Repeat structure]

### Dependencies & Blockers
- **Dependency 1:** [What we're waiting for]
  - **Status:** [BLOCKED | IN_PROGRESS | COMPLETE]
  - **Impact if delayed:** [Description]
  - **Workaround:** [Alternative approach]

---

## Success Metrics

### Quantitative Metrics
- **Metric 1:** [e.g., Response time]
  - **Current:** [Value]
  - **Target:** [Value]
  - **Measurement:** [How it's measured]

- **Metric 2:** [e.g., Error rate]
  - **Current:** [Value]
  - **Target:** [Value]
  - **Measurement:** [How it's measured]

### Qualitative Metrics
- **Metric 1:** [e.g., User satisfaction]
  - **Measurement:** [Survey, feedback, etc.]
  - **Target:** [Desired outcome]

### Business Metrics
- **Metric 1:** [e.g., Process completion time]
  - **Current:** [Value]
  - **Target:** [Value]
  - **Impact:** [Business value]

---

## Timeline

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|------------|----------|--------|
| Planning | [Days] | [Date] | [Date] | [ ] |
| Development | [Days] | [Date] | [Date] | [ ] |
| Code Review | [Days] | [Date] | [Date] | [ ] |
| Testing | [Days] | [Date] | [Date] | [ ] |
| UAT | [Days] | [Date] | [Date] | [ ] |
| Deployment | [Hours] | [Date] | [Date] | [ ] |
| Monitoring | [Days] | [Date] | [Date] | [ ] |
| Cleanup | [Days] | [Date] | [Date] | [ ] |

**Total Estimated Duration:** [Duration]

---

## Notes & Lessons Learned

### During Planning
- [Note or insight]

### During Development
- [Note or insight]

### During Testing
- [Note or insight]

### During Deployment
- [Note or insight]

### After Deployment
- [Note or insight]

### Retrospective
- **What went well:**
  - [Point]
  
- **What could be improved:**
  - [Point]
  
- **Action items for next time:**
  - [Point]

---

## Sign-off

### Planning Phase
- [ ] **Technical Lead:** [Name] - [Date]
- [ ] **Product Owner:** [Name] - [Date]
- [ ] **QA Lead:** [Name] - [Date]

### Execution Phase
- [ ] **Code Review:** [Name] - [Date]
- [ ] **Testing Complete:** [Name] - [Date]
- [ ] **Deployment Approved:** [Name] - [Date]

### Post-Deployment
- [ ] **Validation Complete:** [Name] - [Date]
- [ ] **Stakeholder Approval:** [Name] - [Date]

---

**Template Version:** 1.0  
**Last Updated:** October 9, 2025


