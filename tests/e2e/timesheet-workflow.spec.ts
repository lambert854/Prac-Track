import { test, expect } from '@playwright/test'

test.describe('Timesheet Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('Complete timesheet workflow: Student → Supervisor → Faculty', async ({ page }) => {
    // Step 1: Student logs in and adds hours
    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')

    // Click "Add Hours" quick action on dashboard
    await page.click('button:has-text("Add Hours")')
    
    // Verify modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Add Hours')

    // Fill timesheet entry form
    await page.fill('input[type="number"]', '8')
    await page.selectOption('select', 'DIRECT')
    await page.fill('textarea', 'Conducted client interviews and completed assessments')
    await page.click('button:has-text("Add Entry")')

    // Verify success toast appears
    await expect(page.locator('text=Hours logged successfully')).toBeVisible()

    // Verify modal closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Navigate to timesheets page to submit week
    await page.click('a[href="/timesheets"]')
    await expect(page.locator('text=8h')).toBeVisible()
    await expect(page.locator('text=Direct Practice')).toBeVisible()

    // Submit the week
    await page.click('button:has-text("Submit Week")')
    
    // Verify status changes to pending
    await expect(page.locator('text=Pending')).toBeVisible()

    // Step 2: Supervisor logs in and approves
    await page.click('button:has-text("Sign Out")')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'supervisor1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Should redirect to supervisor dashboard
    await expect(page).toHaveURL('/dashboard')

    // Navigate to timesheets for approval
    await page.click('a[href="/timesheets"]')

    // Find the timesheet entry and approve it
    await expect(page.locator('text=8h')).toBeVisible()
    await page.click('button:has-text("Approve")')

    // Verify success toast
    await expect(page.locator('text=Timesheet approved successfully')).toBeVisible()

    // Step 3: Faculty logs in and does final approval
    await page.click('button:has-text("Sign Out")')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'faculty1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Should redirect to faculty dashboard
    await expect(page).toHaveURL('/dashboard')

    // Navigate to faculty timesheets
    await page.click('a[href="/faculty/timesheets"]')

    // Find the timesheet entry and approve it
    await expect(page.locator('text=8h')).toBeVisible()
    await page.click('button:has-text("Approve")')

    // Verify success toast
    await expect(page.locator('text=Timesheet approved successfully')).toBeVisible()

    // Step 4: Student logs back in to verify final status
    await page.click('button:has-text("Sign Out")')
    await page.goto('/login')

    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Check dashboard shows updated progress
    await expect(page.locator('text=Hours Completed')).toBeVisible()
    await expect(page.locator('text=8 /')).toBeVisible() // Should show 8 approved hours

    // Navigate to reports to verify data
    await page.click('a[href="/reports/my-hours"]')
    await expect(page.locator('text=8')).toBeVisible() // Should show 8 hours in reports
  })

  test('Form validation works correctly', async ({ page }) => {
    // Student logs in
    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Click "Add Hours" quick action
    await page.click('button:has-text("Add Hours")')
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Add Entry")')

    // Verify validation errors appear
    await expect(page.locator('text=Date is required')).toBeVisible()
    await expect(page.locator('text=Hours must be greater than 0')).toBeVisible()

    // Fill invalid hours (over 24)
    await page.fill('input[type="number"]', '25')
    await page.click('button:has-text("Add Entry")')

    // Verify validation error for hours
    await expect(page.locator('text=Hours cannot exceed 24')).toBeVisible()
  })

  test('Supervisor can reject with notes', async ({ page }) => {
    // Supervisor logs in
    await page.fill('input[type="email"]', 'supervisor1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Navigate to timesheets
    await page.click('a[href="/timesheets"]')

    // Find a timesheet entry and click reject
    await page.click('button:has-text("Reject")')

    // Fill rejection reason
    await page.fill('textarea', 'Hours seem inaccurate based on student description')

    // Submit rejection
    await page.click('button:has-text("Reject")')

    // Verify success toast
    await expect(page.locator('text=Timesheet rejected successfully')).toBeVisible()
  })

  test('Keyboard navigation works in modals', async ({ page }) => {
    // Student logs in
    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Click "Add Hours" quick action
    await page.click('button:has-text("Add Hours")')
    
    // Test escape key closes modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Reopen modal
    await page.click('button:has-text("Add Hours")')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate through form fields
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(focusedElement)
  })

  test('Mobile responsive design works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Student logs in
    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Verify dashboard is responsive
    await expect(page.locator('h1')).toBeVisible()
    
    // Click "Add Hours" quick action
    await page.click('button:has-text("Add Hours")')
    
    // Verify modal is responsive
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Modal should be scrollable on mobile
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toHaveCSS('max-height', '90vh')
    await expect(modal).toHaveCSS('overflow-y', 'auto')
  })
})
