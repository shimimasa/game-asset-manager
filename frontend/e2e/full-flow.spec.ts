import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';
import path from 'path';

test.describe('Full User Flow', () => {
  test('should complete full asset generation workflow', async ({ page }) => {
    // Step 1: Register and login
    await registerUser(page, {
      username: 'gamedev',
      email: 'gamedev@example.com',
      password: 'GameDev123!',
    });
    
    // Should be on dashboard
    await expect(page.locator('h4:has-text("Dashboard")')).toBeVisible();
    
    // Step 2: Create a project
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[label="Project Name"]', 'Epic Fantasy Game');
    await page.fill('textarea[label="Description"]', 'An epic fantasy adventure game');
    await page.click('button:has-text("Create")');
    
    // Should be on project detail page
    const projectUrl = page.url();
    await expect(page.locator('h4:has-text("Epic Fantasy Game")')).toBeVisible();
    
    // Step 3: Upload an asset
    await page.goto('/assets');
    await page.click('button:has-text("Upload Asset")');
    
    // Upload a test image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Drop files here or click to browse');
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles([{
      name: 'hero-character.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
    }]);
    
    await page.fill('input[placeholder="Add tags..."]', 'hero, character, fantasy');
    await page.click('div[role="button"]:has-text("Select category")');
    await page.click('li[role="option"]:has-text("CHARACTER")');
    await page.click('button:has-text("Upload")');
    
    // Wait for upload to complete
    await expect(page.locator('text=hero-character.png')).toBeVisible({ timeout: 10000 });
    
    // Step 4: Create a prompt template
    await page.goto('/prompts');
    await page.click('button:has-text("Create Prompt")');
    
    await page.fill('input[name="name"]', 'Fantasy Character Variations');
    await page.fill('textarea[name="content"]', 'Create variations of a fantasy character in different poses and expressions, maintaining consistent design');
    await page.fill('input[name="description"]', 'Generates character variations for game sprites');
    
    await page.click('div[role="button"]:has-text("Select type")');
    await page.click('li[role="option"]:has-text("Image")');
    
    await page.click('div[role="button"]:has-text("Select category")');
    await page.click('li[role="option"]:has-text("Character")');
    
    // Add parameters
    await page.click('button:has-text("Add Parameter")');
    await page.fill('input[placeholder="Parameter name"]', 'art_style');
    await page.fill('input[placeholder="Default value"]', 'pixel art');
    
    await page.click('button:has-text("Create")');
    
    // Should see the new prompt
    await expect(page.locator('text=Fantasy Character Variations')).toBeVisible();
    
    // Step 5: Add asset to project
    await page.goto(projectUrl);
    await page.click('button:has-text("Add Assets")');
    
    // Wait for asset selector to load
    await expect(page.locator('text=Select Assets')).toBeVisible();
    
    // Select the uploaded asset
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("Add 1 Asset")');
    
    // Asset should appear in project
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(1);
    
    // Step 6: Export project assets
    await page.click('button:has-text("Export")');
    
    // Should be on export page
    await expect(page.url()).toContain('/export/project/');
    await expect(page.locator('text=Select Assets to Export')).toBeVisible();
    
    // Export all assets
    await page.click('button:has-text("Export All Assets")');
    
    // Select ZIP format
    await expect(page.locator('text=Export Assets')).toBeVisible();
    await page.click('button:has-text("Export")');
    
    // Should show success message
    await expect(page.locator('text=Export started successfully')).toBeVisible();
    
    // Should redirect to exports page
    await page.waitForURL('/exports');
    await expect(page.locator('h4:has-text("Exports")')).toBeVisible();
    
    // Verify export appears in history
    await expect(page.locator('text=pending').or(page.locator('text=processing'))).toBeVisible();
    
    // Step 7: Check dashboard for overview
    await page.goto('/dashboard');
    
    // Should show counts
    await expect(page.locator('text=Total Assets')).toBeVisible();
    await expect(page.locator('text=Projects')).toBeVisible();
    await expect(page.locator('text=Prompts')).toBeVisible();
    
    // Verify counts
    const assetCount = await page.locator('[data-testid="asset-count"]').textContent();
    expect(Number(assetCount)).toBeGreaterThanOrEqual(1);
    
    const projectCount = await page.locator('[data-testid="project-count"]').textContent();
    expect(Number(projectCount)).toBeGreaterThanOrEqual(1);
    
    const promptCount = await page.locator('[data-testid="prompt-count"]').textContent();
    expect(Number(promptCount)).toBeGreaterThanOrEqual(1);
  });

  test('should handle errors gracefully throughout the flow', async ({ page }) => {
    await registerUser(page);
    
    // Test network error handling
    await page.route('**/api/projects', route => {
      route.abort('internetdisconnected');
    });
    
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[label="Project Name"]', 'Test Project');
    await page.click('button:has-text("Create")');
    
    // Should show error message
    await expect(page.locator('text=Failed to create project').or(page.locator('text=Network error'))).toBeVisible();
    
    // Restore network
    await page.unroute('**/api/projects');
    
    // Test validation errors
    await page.goto('/assets');
    await page.click('button:has-text("Upload Asset")');
    await page.click('button:has-text("Upload")'); // Try to upload without file
    
    // Should show validation error
    await expect(page.locator('text=Please select at least one file')).toBeVisible();
  });
});