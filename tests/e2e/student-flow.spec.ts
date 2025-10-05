import { test, expect } from '@playwright/test'

test.describe('Student Flow', () => {
  test('should allow student to log hours, submit week, and see progress', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Login as student
    await page.fill('input[type="email"]', 'student1@demo.edu')
    await page.fill('input[type="password"]', 'Passw0rd!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome back')

    // Navigate to timesheets
    await page.click('a[href="/timesheets"]')
    await expect(page).toHaveURL('/timesheets')

    // Should see active placement
    await expect(page.locator('text=Active Placement')).toBeVisible()

    // Add hours for today
    await page.click('button:has-text("Add Hours")')
    
    // Fill timesheet entry form
    await page.fill('input[type="number"]', '8')
    await page.selectOption('select', 'DIRECT')
    await page.fill('textarea', 'Conducted client interviews and completed assessments')
    await page.click('button:has-text("Add Entry")')

    // Should see the entry in the weekly view
    await expect(page.locator('text=8h')).toBeVisible()
    await expect(page.locator('text=Direct Practice')).toBeVisible()

    // Submit the week
    await page.click('button:has-text("Submit Week")')
    
    // Should see status change to pending
    await expect(page.locator('text=Pending')).toBeVisible()

    // Navigate back to dashboard to see progress
    await page.click('a[href="/dashboard"]')
    await expect(page).toHaveURL('/dashboard')

    // Should see updated progress
    await expect(page.locator('text=Hours Completed')).toBeVisible()
    await expect(page.locator('text=8 / 900 hours')).toBeVisible()
  })
})
