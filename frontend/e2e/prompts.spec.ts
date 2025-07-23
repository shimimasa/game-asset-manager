import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';
import { APIHelper } from './helpers/api';

test.describe('Prompt Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await registerUser(page);
    
    // Navigate to prompts page
    await page.goto('/prompts');
  });

  test('should display empty state initially', async ({ page }) => {
    await expect(page.locator('text=No prompts created yet')).toBeVisible();
    await expect(page.locator('text=Create your first prompt template')).toBeVisible();
  });

  test('should create a new prompt', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Prompt")');
    
    // Fill prompt form
    await page.fill('input[name="name"]', 'Fantasy Character Generator');
    await page.fill('textarea[name="content"]', 'Create a fantasy character with magical abilities');
    await page.fill('input[name="description"]', 'Generates unique fantasy characters');
    
    // Select type
    await page.click('div[role="button"]:has-text("Select type")');
    await page.click('li[role="option"]:has-text("Image")');
    
    // Select category
    await page.click('div[role="button"]:has-text("Select category")');
    await page.click('li[role="option"]:has-text("Character")');
    
    // Add parameters
    await page.click('button:has-text("Add Parameter")');
    await page.fill('input[placeholder="Parameter name"]', 'style');
    await page.fill('input[placeholder="Default value"]', 'realistic');
    
    // Save
    await page.click('button:has-text("Create")');
    
    // Should show new prompt in list
    await expect(page.locator('text=Fantasy Character Generator')).toBeVisible();
    await expect(page.locator('text=Image')).toBeVisible();
    await expect(page.locator('text=Character')).toBeVisible();
  });

  test('should edit an existing prompt', async ({ page, request }) => {
    // Create prompt via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    await apiHelper.createPrompt(headers, {
      name: 'Original Prompt',
      content: 'Original content',
      type: 'IMAGE',
      category: 'CHARACTER',
    });
    
    // Refresh page
    await page.reload();
    
    // Click edit button
    await page.click('[data-testid="prompt-card"] button[aria-label="edit"]');
    
    // Update prompt
    await page.fill('input[name="name"]', 'Updated Prompt');
    await page.fill('textarea[name="content"]', 'Updated content with more details');
    
    // Save
    await page.click('button:has-text("Update")');
    
    // Should show updated prompt
    await expect(page.locator('text=Updated Prompt')).toBeVisible();
    await expect(page.locator('text=Original Prompt')).not.toBeVisible();
  });

  test('should execute a prompt', async ({ page, request }) => {
    // Create prompt via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    const prompt = await apiHelper.createPrompt(headers, {
      name: 'Test Execution Prompt',
      content: 'Generate a test image',
      type: 'IMAGE',
      parameters: {
        size: '1024x1024',
        quality: 'standard',
      },
    });
    
    // Refresh page
    await page.reload();
    
    // Click execute button
    await page.click('[data-testid="prompt-card"] button[aria-label="execute"]');
    
    // Should show execution dialog
    await expect(page.locator('text=Execute Prompt')).toBeVisible();
    await expect(page.locator('text=Test Execution Prompt')).toBeVisible();
    
    // Modify parameters
    await page.fill('input[name="quality"]', 'hd');
    
    // Execute
    await page.click('button:has-text("Execute")');
    
    // Should show execution status
    await expect(page.locator('text=Execution started')).toBeVisible();
    
    // Should redirect to execution view
    await expect(page.url()).toContain('/prompts/execution');
  });

  test('should view execution history', async ({ page, request }) => {
    // Create and execute prompt via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    const prompt = await apiHelper.createPrompt(headers, {
      name: 'History Test Prompt',
      content: 'Test prompt for history',
      type: 'IMAGE',
    });
    
    // Execute the prompt
    await request.post(`http://localhost:3000/api/prompts/${prompt.id}/execute`, {
      headers,
      data: { parameters: {} },
    });
    
    // Navigate to prompts page
    await page.goto('/prompts');
    
    // Click on execution history tab
    await page.click('button[role="tab"]:has-text("Execution History")');
    
    // Should show execution in history
    await expect(page.locator('text=History Test Prompt')).toBeVisible();
    await expect(page.locator('text=pending').or(page.locator('text=processing'))).toBeVisible();
  });

  test('should filter prompts by type', async ({ page, request }) => {
    // Create prompts via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    await apiHelper.createPrompt(headers, {
      name: 'Image Prompt',
      content: 'Generate image',
      type: 'IMAGE',
    });
    
    await apiHelper.createPrompt(headers, {
      name: 'Audio Prompt',
      content: 'Generate audio',
      type: 'AUDIO',
    });
    
    // Refresh page
    await page.reload();
    
    // Filter by Image type
    await page.click('text=All Types');
    await page.click('li:has-text("Image")');
    
    // Should show only image prompts
    await expect(page.locator('text=Image Prompt')).toBeVisible();
    await expect(page.locator('text=Audio Prompt')).not.toBeVisible();
    
    // Filter by Audio type
    await page.click('text=Image');
    await page.click('li:has-text("Audio")');
    
    // Should show only audio prompts
    await expect(page.locator('text=Audio Prompt')).toBeVisible();
    await expect(page.locator('text=Image Prompt')).not.toBeVisible();
  });

  test('should delete a prompt', async ({ page, request }) => {
    // Create prompt via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    await apiHelper.createPrompt(headers, {
      name: 'To Delete',
      content: 'Will be deleted',
      type: 'IMAGE',
    });
    
    // Refresh page
    await page.reload();
    
    // Click delete button
    await page.click('[data-testid="prompt-card"] button[aria-label="delete"]');
    
    // Confirm deletion
    await expect(page.locator('text=Delete Prompt')).toBeVisible();
    await page.click('button:has-text("Delete")');
    
    // Prompt should be removed
    await expect(page.locator('text=To Delete')).not.toBeVisible();
    await expect(page.locator('text=No prompts created yet')).toBeVisible();
  });

  test('should validate prompt form', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Prompt")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create")');
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Content is required')).toBeVisible();
    
    // Fill name but leave content empty
    await page.fill('input[name="name"]', 'Test Name');
    await page.click('button:has-text("Create")');
    
    // Should still show content error
    await expect(page.locator('text=Name is required')).not.toBeVisible();
    await expect(page.locator('text=Content is required')).toBeVisible();
  });

  test('should search prompts', async ({ page, request }) => {
    // Create prompts via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    await apiHelper.createPrompt(headers, {
      name: 'Dragon Generator',
      content: 'Create a dragon',
      type: 'IMAGE',
    });
    
    await apiHelper.createPrompt(headers, {
      name: 'Castle Builder',
      content: 'Build a castle',
      type: 'IMAGE',
    });
    
    // Refresh page
    await page.reload();
    
    // Search for 'dragon'
    await page.fill('input[placeholder="Search prompts..."]', 'dragon');
    await page.press('input[placeholder="Search prompts..."]', 'Enter');
    
    // Should show filtered results
    await expect(page.locator('text=Dragon Generator')).toBeVisible();
    await expect(page.locator('text=Castle Builder')).not.toBeVisible();
  });
});