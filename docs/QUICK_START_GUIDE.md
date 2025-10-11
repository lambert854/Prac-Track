# Quick Start Guide: Planning Workflow Changes

**For:** Developers planning to modify agency, supervisor, or placement workflows  
**Last Updated:** October 9, 2025

---

## 🎯 Before You Start

**Read this if:**
- Faculty has requested workflow changes
- You need to modify agency/site approval process
- You need to change supervisor creation/approval
- You need to modify placement workflows
- You're worried about breaking existing functionality

**Time Investment:**
- Reading documentation: 30-60 minutes
- Planning a change: 2-4 hours
- Implementation: Varies by complexity

---

## 📖 Step-by-Step Guide

### Step 1: Understand What Currently Exists (15-30 min)

Open `CURRENT_WORKFLOWS.md` and read the sections relevant to your change:

**If changing agency/site workflows:**
- Read: "Agency/Site Workflow"
- Read: "Learning Contract Workflow"
- Note: Current issues section

**If changing supervisor workflows:**
- Read: "Supervisor Workflow"
- Read: Both Path A (direct) and Path B (pending)
- Note: How learning contracts create supervisors

**If changing placement workflows:**
- Read: "Student Placement Workflow"
- Note: All status transitions
- Note: Document requirements

**Action Items:**
- [ ] Identify which database tables are involved
- [ ] Identify which API endpoints will be affected
- [ ] Identify which UI components will need changes
- [ ] List current issues this change will address

---

### Step 2: Document Faculty Requirements (30-60 min)

**Schedule a meeting with faculty to clarify:**

1. **What's the problem?**
   - What isn't working with the current workflow?
   - Who is affected? (students, supervisors, faculty, admin)
   - How often does this problem occur?

2. **What's the desired outcome?**
   - What should happen instead?
   - Walk through the ideal workflow step-by-step
   - What new information needs to be collected?
   - What new approvals are needed?

3. **What are the edge cases?**
   - What happens if someone rejects/declines?
   - What happens to existing data?
   - What if someone tries to bypass the process?
   - How do we handle errors?

4. **What's the priority?**
   - Is this blocking other work?
   - When does this need to be live?
   - Can we do this in phases?

**Document the conversation:**
```
Problem: [Describe the issue]
Current Workflow: [How it works now]
Desired Workflow: [How it should work]
Stakeholders: [Who's affected]
Priority: [HIGH/MEDIUM/LOW]
Deadline: [Date if applicable]
```

---

### Step 3: Create a Migration Plan (2-4 hours)

1. **Copy the template:**
   ```bash
   cp docs/MIGRATION_PLAN_TEMPLATE.md docs/migration-[descriptive-name].md
   ```
   
   Example:
   ```bash
   cp docs/MIGRATION_PLAN_TEMPLATE.md docs/migration-require-agency-approval.md
   ```

2. **Fill out EVERY section** (don't skip!)

   **Critical sections to complete:**
   - [ ] Executive Summary (2-3 sentences)
   - [ ] Current Behavior (detailed description)
   - [ ] Desired Behavior (step-by-step workflow)
   - [ ] Database Changes (SQL for tables/columns)
   - [ ] API Changes (all affected endpoints)
   - [ ] UI Changes (all affected components)
   - [ ] Rollback Strategy (exact steps to revert)
   - [ ] Testing Strategy (how to validate)
   - [ ] Risk Assessment (what could go wrong)

3. **Get team review:**
   - Share with at least 2 other developers
   - Discuss potential issues
   - Revise based on feedback

4. **Get stakeholder sign-off:**
   - Walk through plan with faculty
   - Confirm this meets their needs
   - Get written approval to proceed

---

### Step 4: Set Up Safe Implementation (30 min)

**Create a feature flag:**

1. Add to environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_NEW_AGENCY_WORKFLOW=false
   ```

2. Add to feature flags file:
   ```typescript
   // lib/feature-flags.ts (create if doesn't exist)
   export const FEATURE_FLAGS = {
     NEW_AGENCY_WORKFLOW: {
       enabled: process.env.NEXT_PUBLIC_NEW_AGENCY_WORKFLOW === 'true',
       description: 'New agency approval workflow requiring learning contracts',
     },
   };
   ```

3. Use in code:
   ```typescript
   import { FEATURE_FLAGS } from '@/lib/feature-flags';
   
   if (FEATURE_FLAGS.NEW_AGENCY_WORKFLOW.enabled) {
     // New workflow
   } else {
     // Old workflow (keep this working!)
   }
   ```

**Create a feature branch:**
```bash
git checkout -b feature/agency-workflow-changes
```

---

### Step 5: Implement Changes (Time varies)

**Order of implementation:**

1. **Database first** (if schema changes needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name add_agency_approval_status
   npx prisma generate
   ```

2. **API endpoints second**
   - Create new endpoints (e.g., `/api/v2/...`) OR
   - Modify existing with feature flag checks
   - Add comprehensive error handling
   - Add validation with Zod schemas

3. **UI components last**
   - Update forms
   - Update lists/tables
   - Update status displays
   - Add loading states
   - Add error messages

**Best practices:**
- ✅ Keep old code working (feature flag OFF)
- ✅ Add logging for debugging
- ✅ Write tests as you go
- ✅ Commit frequently with clear messages
- ✅ Update migration plan if you deviate

---

### Step 6: Test Thoroughly (4-8 hours)

**Use the testing checklist:**
Open `TESTING_CHECKLIST.md` and work through relevant sections.

**Minimum testing required:**

1. **Old workflow (flag OFF):**
   - [ ] Everything works exactly as before
   - [ ] No new bugs introduced
   - [ ] All existing features functional

2. **New workflow (flag ON):**
   - [ ] Happy path works end-to-end
   - [ ] Error cases handled gracefully
   - [ ] Validation prevents bad data
   - [ ] Notifications sent appropriately
   - [ ] All roles can perform their tasks

3. **Role-based access:**
   - [ ] Students can do student things
   - [ ] Supervisors can do supervisor things
   - [ ] Faculty can do faculty things
   - [ ] Admin has full access
   - [ ] Nobody can do unauthorized things

4. **Edge cases:**
   - [ ] What if someone tries to skip steps?
   - [ ] What if required data is missing?
   - [ ] What if someone tries to access unauthorized data?
   - [ ] What if a network request fails?

**Testing sign-off:**
- [ ] All tests pass locally
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Ready for deployment

---

### Step 7: Deploy Safely (1-2 hours)

**Deployment checklist:**

1. **Pre-deployment:**
   - [ ] Create database backup
   - [ ] Test rollback procedure
   - [ ] Notify team of deployment
   - [ ] Schedule during low-traffic time (if possible)

2. **Deploy with flag OFF:**
   ```bash
   git push origin feature/agency-workflow-changes
   # Deploy to production
   # Keep NEXT_PUBLIC_NEW_AGENCY_WORKFLOW=false
   ```
   
3. **Smoke test:**
   - [ ] Site loads correctly
   - [ ] Login works
   - [ ] Existing workflows work
   - [ ] No errors in logs

4. **Enable for testing:**
   - Change env var to `true` for your account only (if possible)
   - OR enable for 10% of users
   - Test thoroughly in production environment

5. **Gradual rollout:**
   - Day 1: 10% of users
   - Day 3: 25% of users
   - Day 5: 50% of users
   - Day 7: 100% of users

6. **Monitor closely:**
   - Error rates
   - Response times
   - User feedback
   - Support tickets

---

### Step 8: Complete Migration (1-2 weeks)

**After successful rollout:**

1. **Monitor for 1-2 weeks:**
   - Watch for unexpected issues
   - Collect user feedback
   - Address any bugs

2. **Once stable, remove old code:**
   ```typescript
   // Remove feature flag checks
   // Delete old workflow code
   // Simplify logic
   ```

3. **Update documentation:**
   - Update `CURRENT_WORKFLOWS.md` with new workflow
   - Archive migration plan as completed
   - Update user guides

4. **Retrospective:**
   - What went well?
   - What could be improved?
   - Document lessons learned

---

## 🚨 When Things Go Wrong

### If you discover issues in production:

**Minor issues (bugs, display problems):**
1. Create bug ticket
2. Fix in feature branch
3. Deploy fix
4. Continue rollout

**Major issues (data corruption, system down):**
1. **IMMEDIATELY disable feature flag**
   ```bash
   export NEXT_PUBLIC_NEW_AGENCY_WORKFLOW=false
   ```
2. Notify team and stakeholders
3. Roll back using documented rollback procedure
4. Investigate root cause
5. Fix issues
6. Retest thoroughly
7. Try again when ready

### Rollback procedure:

Follow the "Rollback Strategy" section in your migration plan exactly.

**General rollback steps:**
1. Set feature flag to `false`
2. Revert code to previous version
3. Restore database from backup (if needed)
4. Verify system operational
5. Notify users of temporary issue

---

## 💡 Pro Tips

### 1. Start Small
Don't try to change everything at once. Break large changes into smaller pieces:
- Phase 1: Change database schema
- Phase 2: Update API endpoints
- Phase 3: Update UI components

### 2. Communicate Often
Keep faculty in the loop:
- Weekly progress updates
- Demo new features early
- Get feedback before it's "done"

### 3. Test with Real Data
Use a copy of production data for testing:
```bash
# Copy production database to staging
# Test migration with real data volumes
# Validate performance
```

### 4. Write Tests First
Test-driven development prevents bugs:
1. Write test for new behavior
2. Run test (it should fail)
3. Write code to make test pass
4. Refactor
5. Repeat

### 5. Document as You Go
Don't wait until the end:
- Update docs when you make decisions
- Explain why you chose certain approaches
- Future you will thank you

---

## 📋 Quick Reference

### Where to find information:

| I need to... | Look at... |
|--------------|------------|
| Understand current workflow | `CURRENT_WORKFLOWS.md` |
| Plan a new workflow | `MIGRATION_PLAN_TEMPLATE.md` |
| Test my changes | `TESTING_CHECKLIST.md` |
| Get general guidance | `README.md` |
| Quick overview | `QUICK_START_GUIDE.md` (this file) |

### Common commands:

```bash
# Database
npx prisma migrate dev --name migration_name
npx prisma generate
npx prisma studio

# Development
npm run dev
npm run build
npm run lint

# Testing
npm run test
npm run test:e2e

# Git
git checkout -b feature/workflow-name
git add .
git commit -m "Descriptive message"
git push origin feature/workflow-name
```

---

## ✅ Checklist: Am I Ready to Start?

Before writing any code, verify:

- [ ] I've read the relevant sections of `CURRENT_WORKFLOWS.md`
- [ ] I've talked to faculty and understand their requirements
- [ ] I've filled out `MIGRATION_PLAN_TEMPLATE.md` completely
- [ ] I've gotten team review on my plan
- [ ] I've gotten stakeholder sign-off
- [ ] I've created a feature flag
- [ ] I've created a feature branch
- [ ] I have 1-2 hours of uninterrupted time to start coding

If you checked all boxes, you're ready to start! 🚀

If not, go back and complete the missing items. Planning prevents pain!

---

## 🆘 Need Help?

**Questions about:**
- Current workflows → Read `CURRENT_WORKFLOWS.md` more carefully
- How to plan → Re-read `MIGRATION_PLAN_TEMPLATE.md` instructions
- How to test → Use `TESTING_CHECKLIST.md` systematically
- General approach → Ask team member for guidance

**Stuck on:**
- Database design → Discuss with team, review schema carefully
- API design → Check existing patterns, follow conventions
- UI components → Look at existing components, maintain consistency

**Remember:** It's better to ask questions and get clarity than to make assumptions and break things!

---

**Good luck with your workflow changes! 🎉**

*Remember: Slow and steady wins the race. Take time to plan, test thoroughly, and deploy carefully.*


