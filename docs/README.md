# Documentation Directory

This directory contains comprehensive documentation for planning and implementing workflow changes safely.

## 📚 Documentation Files

### 1. [CURRENT_WORKFLOWS.md](./CURRENT_WORKFLOWS.md)
**Purpose:** Complete documentation of all existing system workflows

**Contents:**
- Visual workflow diagrams for all major processes
- Agency/Site workflow
- Supervisor workflow (direct and pending approval)
- Student placement workflow
- Learning contract workflow
- Timesheet approval workflow
- Evaluation workflow
- Database relationships and constraints
- Current issues and limitations

**Use this document to:**
- Understand how the system currently works
- Identify what will be impacted by changes
- Reference during migration planning
- Onboard new team members

---

### 2. [MIGRATION_PLAN_TEMPLATE.md](./MIGRATION_PLAN_TEMPLATE.md)
**Purpose:** Structured template for planning any workflow migration

**Contents:**
- Current behavior documentation
- Desired behavior specification
- Database changes (tables, columns, enums)
- API changes (new, modified, deprecated endpoints)
- UI changes (new, modified, removed components)
- Feature flag strategy
- Testing strategy
- Execution plan with step-by-step instructions
- Rollback strategy
- Risk assessment
- Communication plan
- Timeline and sign-off sections

**Use this document to:**
- Plan each workflow change systematically
- Ensure nothing is overlooked
- Communicate changes to stakeholders
- Document decisions and rationale
- Track progress through migration phases

---

### 3. [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
**Purpose:** Comprehensive checklist to ensure nothing breaks

**Contents:**
- Pre-testing setup requirements
- Database testing checklist
- API endpoint testing (all routes)
- UI component testing
- Role-based access testing
- End-to-end workflow testing
- Performance testing
- Security testing
- Browser & device compatibility
- Regression testing
- Final deployment checklist

**Use this document to:**
- Verify all functionality before deployment
- Ensure comprehensive test coverage
- Validate role-based access controls
- Test complete user workflows
- Sign-off on readiness for production

---

## 🔄 Workflow Change Process

### Step 1: Understand Current State
1. Read `CURRENT_WORKFLOWS.md` thoroughly
2. Identify which workflows will be affected
3. Document dependencies between workflows
4. Note any current issues that might complicate changes

### Step 2: Plan the Migration
1. Copy `MIGRATION_PLAN_TEMPLATE.md` to a new file (e.g., `migration-agency-approval-workflow.md`)
2. Fill in all sections completely
3. Be specific about database, API, and UI changes
4. Document rollback strategy
5. Get review from team members
6. Get sign-off from stakeholders

### Step 3: Implement Changes
1. Create feature branch: `git checkout -b feature/workflow-name`
2. Implement database migrations first
3. Create/modify API endpoints
4. Update UI components
5. Add feature flags for gradual rollout
6. Write comprehensive tests
7. Update documentation as you go

### Step 4: Test Thoroughly
1. Use `TESTING_CHECKLIST.md` to guide testing
2. Test with feature flag OFF (old workflow)
3. Test with feature flag ON (new workflow)
4. Test edge cases and error scenarios
5. Test with realistic data volumes
6. Get QA sign-off

### Step 5: Deploy Safely
1. Deploy to staging environment first
2. Run full test suite
3. Enable feature flag for internal testing
4. Get user acceptance testing (UAT)
5. Deploy to production with flag OFF
6. Gradually enable feature flag (10% → 50% → 100%)
7. Monitor error rates and performance

### Step 6: Complete Migration
1. Monitor for 1-2 weeks
2. Collect feedback
3. Address any issues
4. Once stable, remove old code
5. Remove feature flag
6. Update documentation
7. Conduct retrospective

---

## 🛡️ Safety Principles

### 1. Never Change Everything at Once
- Break large changes into smaller, testable pieces
- Deploy one change at a time
- Validate each change before moving to the next

### 2. Always Have a Rollback Plan
- Document exact steps to revert changes
- Test rollback procedure before deploying
- Keep old code functional during transition

### 3. Use Feature Flags
- Toggle between old and new workflows
- Enable for specific users first
- Quick disable if issues arise

### 4. Test in Isolation
- Use separate test accounts
- Create test data that won't affect production
- Test all roles and edge cases

### 5. Communicate Changes
- Notify team before deployment
- Inform users of new features
- Document breaking changes clearly

---

## 📝 Example: Planning a New Workflow

Let's say faculty wants to require learning contracts before students can request placements:

### 1. Read Current Workflow
From `CURRENT_WORKFLOWS.md`, we learn:
- Sites can be ACTIVE immediately without learning contracts
- Students can see all ACTIVE sites
- Learning contracts are currently optional

### 2. Create Migration Plan
Copy `MIGRATION_PLAN_TEMPLATE.md` to `migration-require-learning-contracts.md` and fill in:

**Current Behavior:**
- Sites marked ACTIVE immediately
- Learning contracts optional
- Students see all ACTIVE sites

**Desired Behavior:**
- Sites must complete learning contract before students can see them
- Add new status: `APPROVED_WITH_CONTRACT`
- Students only see sites with this status

**Database Changes:**
- Modify Site status enum to include `APPROVED_WITH_CONTRACT`
- Add index on learningContractStatus for faster queries

**API Changes:**
- Modify `GET /api/sites` to filter by contract status for students
- Modify learning contract approval to set site status to `APPROVED_WITH_CONTRACT`

**UI Changes:**
- Update site management to show contract requirement
- Add banner to site browser explaining requirement

**Feature Flag:**
```typescript
REQUIRE_LEARNING_CONTRACTS: process.env.NEXT_PUBLIC_REQUIRE_CONTRACTS === 'true'
```

### 3. Test Everything
Use `TESTING_CHECKLIST.md` to test:
- [ ] Students cannot see sites without completed contracts
- [ ] Faculty can still see all sites
- [ ] Learning contract approval updates status correctly
- [ ] Old workflow still works with flag OFF

---

## 🚨 Common Pitfalls to Avoid

### 1. Skipping Documentation
**Problem:** No record of why changes were made  
**Solution:** Fill out migration plan completely before coding

### 2. Modifying Existing APIs Without Versioning
**Problem:** Breaks existing code  
**Solution:** Create v2 endpoints, deprecate v1 gradually

### 3. Not Testing Rollback
**Problem:** Can't revert when issues arise  
**Solution:** Test rollback procedure before deploying

### 4. Changing Database Without Migration Path
**Problem:** Existing data becomes inaccessible  
**Solution:** Write data migration scripts, test with production copy

### 5. No Feature Flags
**Problem:** All-or-nothing deployment  
**Solution:** Implement feature flags for gradual rollout

### 6. Insufficient Testing
**Problem:** Bugs discovered in production  
**Solution:** Use comprehensive testing checklist

---

## 📞 Getting Help

### Questions About Workflows
- Reference: `CURRENT_WORKFLOWS.md`
- Ask: "How does X currently work?"

### Planning a Change
- Reference: `MIGRATION_PLAN_TEMPLATE.md`
- Ask: "What sections should I fill out for this change?"

### Testing Coverage
- Reference: `TESTING_CHECKLIST.md`
- Ask: "What tests do I need for this change?"

### Team Review
- Schedule: Code review session
- Share: Completed migration plan
- Discuss: Risks and rollback strategy

---

## 📊 Success Metrics

Track these metrics to ensure smooth migrations:

- **Deployment Success Rate:** % of deployments without rollback
- **Test Coverage:** % of code covered by tests
- **Time to Recovery:** How quickly can we rollback if needed
- **User Impact:** Number of users affected by issues
- **Documentation Completeness:** All sections of migration plan filled out

**Target Metrics:**
- 95%+ deployment success rate
- 80%+ test coverage
- < 30 minutes time to recovery
- < 1% users impacted by issues
- 100% documentation completeness

---

## 🔄 Document Maintenance

### When to Update CURRENT_WORKFLOWS.md
- After each successful workflow change
- When discovering undocumented behavior
- When fixing bugs that reveal incorrect documentation

### When to Create New Migration Plans
- For each distinct workflow change
- When changing database schema
- When modifying user-facing workflows

### When to Update Testing Checklist
- When adding new features to test
- When discovering gaps in test coverage
- After bugs that could have been caught by testing

---

## 📅 Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 9, 2025 | Initial documentation created |

---

**Remember:** Good documentation prevents bad deployments. Take the time to document thoroughly, and future you will be grateful!


