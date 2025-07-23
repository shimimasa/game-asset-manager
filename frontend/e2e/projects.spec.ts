import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';
import { APIHelper } from './helpers/api';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await registerUser(page);
    
    // Navigate to projects page
    await page.goto('/projects');
  });

  test('should display empty state initially', async ({ page }) => {
    await expect(page.locator('text=No projects yet')).toBeVisible();
    await expect(page.locator('text=Create your first project to organize your game assets')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("New Project")');
    
    // Fill project form
    await page.fill('input[label="Project Name"]', 'My Fantasy RPG');
    await page.fill('textarea[label="Description"]', 'A fantasy role-playing game with dragons and magic');
    
    // Create
    await page.click('button:has-text("Create")');
    
    // Should redirect to project detail page
    await expect(page.url()).toMatch(/\/projects\/[a-zA-Z0-9-]+$/);
    await expect(page.locator('h4:has-text("My Fantasy RPG")')).toBeVisible();
  });

  test('should add assets to project', async ({ page, request }) => {
    // Create project and assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Test Project',
      description: 'For testing asset addition',
    });
    
    const asset1 = await apiHelper.createAsset(headers, { tags: 'character' });
    const asset2 = await apiHelper.createAsset(headers, { tags: 'background' });
    
    // Navigate to project detail
    await page.goto(`/projects/${project.id}`);
    
    // Click add assets button
    await page.click('button:has-text("Add Assets")');
    
    // Select assets
    await page.click(`[data-testid="asset-selector-${asset1.id}"]`);
    await page.click(`[data-testid="asset-selector-${asset2.id}"]`);
    
    // Confirm selection
    await page.click('button:has-text("Add 2 Assets")');
    
    // Assets should appear in project
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(2);
  });

  test('should remove asset from project', async ({ page, request }) => {
    // Create project with asset via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Test Project',
    });
    
    const asset = await apiHelper.createAsset(headers, { tags: 'test' });
    
    // Add asset to project
    await request.post(`http://localhost:3000/api/projects/${project.id}/assets`, {
      headers,
      data: { assetId: asset.id },
    });
    
    // Navigate to project detail
    await page.goto(`/projects/${project.id}`);
    
    // Remove asset
    await page.click('[data-testid="asset-card"] button[aria-label="delete"]');
    
    // Confirm removal
    await expect(page.locator('text=Remove Asset from Project')).toBeVisible();
    await page.click('button:has-text("Remove")');
    
    // Asset should be removed
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(0);
    await expect(page.locator('text=No assets in this project')).toBeVisible();
  });

  test('should export project assets', async ({ page, request }) => {
    // Create project with assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Export Test Project',
    });
    
    const asset1 = await apiHelper.createAsset(headers, { tags: 'asset1' });
    const asset2 = await apiHelper.createAsset(headers, { tags: 'asset2' });
    
    // Add assets to project
    await request.post(`http://localhost:3000/api/projects/${project.id}/assets`, {
      headers,
      data: { assetId: asset1.id },
    });
    await request.post(`http://localhost:3000/api/projects/${project.id}/assets`, {
      headers,
      data: { assetId: asset2.id },
    });
    
    // Navigate to project detail
    await page.goto(`/projects/${project.id}`);
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Should navigate to export page
    await expect(page.url()).toContain(`/export/project/${project.id}`);
    
    // Select specific assets
    await page.click(`[data-testid="export-asset-${asset1.id}"]`);
    
    // Click export button
    await page.click('button:has-text("Export 1 Asset")');
    
    // Should show export dialog
    await expect(page.locator('text=Export Assets')).toBeVisible();
    
    // Select format
    await page.click('text=ZIP Archive');
    
    // Export
    await page.click('button:has-text("Export")');
    
    // Should show success and redirect
    await expect(page.locator('text=Export started successfully')).toBeVisible();
    await page.waitForURL('/exports', { timeout: 3000 });
  });

  test('should edit project details', async ({ page, request }) => {
    // Create project via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Original Name',
      description: 'Original description',
    });
    
    // Navigate to project detail
    await page.goto(`/projects/${project.id}`);
    
    // Click edit button
    await page.click('button:has-text("Edit")');
    
    // Update project
    await page.fill('input[label="Project Name"]', 'Updated Name');
    await page.fill('textarea[label="Description"]', 'Updated description with more details');
    
    // Save
    await page.click('button:has-text("Update")');
    
    // Should show updated details
    await expect(page.locator('h4:has-text("Updated Name")')).toBeVisible();
    await expect(page.locator('text=Updated description with more details')).toBeVisible();
  });

  test('should duplicate a project', async ({ page, request }) => {
    // Create project with assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Original Project',
      description: 'To be duplicated',
    });
    
    const asset = await apiHelper.createAsset(headers, { tags: 'test' });
    
    // Add asset to project
    await request.post(`http://localhost:3000/api/projects/${project.id}/assets`, {
      headers,
      data: { assetId: asset.id },
    });
    
    // Navigate to projects page
    await page.goto('/projects');
    
    // Duplicate project
    await page.click(`[data-testid="project-card-${project.id}"] button[aria-label="duplicate"]`);
    
    // Should create a copy
    await expect(page.locator('text=Original Project (Copy)')).toBeVisible();
    
    // Verify both projects exist
    await expect(page.locator('[data-testid^="project-card"]')).toHaveCount(2);
  });

  test('should delete a project', async ({ page, request }) => {
    // Create project via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    await apiHelper.createProject(headers, {
      name: 'To Delete',
      description: 'Will be deleted',
    });
    
    // Refresh page
    await page.reload();
    
    // Delete project
    await page.click('[data-testid^="project-card"] button[aria-label="delete"]');
    
    // Confirm deletion
    await expect(page.locator('text=Delete Project')).toBeVisible();
    await page.click('button:has-text("Delete")');
    
    // Project should be removed
    await expect(page.locator('text=To Delete')).not.toBeVisible();
    await expect(page.locator('text=No projects yet')).toBeVisible();
  });

  test('should search projects', async ({ page, request }) => {
    // Create projects via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    await apiHelper.createProject(headers, {
      name: 'Dragon Quest',
      description: 'RPG with dragons',
    });
    
    await apiHelper.createProject(headers, {
      name: 'Space Adventure',
      description: 'Sci-fi game',
    });
    
    // Refresh page
    await page.reload();
    
    // Search for 'dragon'
    await page.fill('input[placeholder="Search projects..."]', 'dragon');
    await page.press('input[placeholder="Search projects..."]', 'Enter');
    
    // Should show filtered results
    await expect(page.locator('text=Dragon Quest')).toBeVisible();
    await expect(page.locator('text=Space Adventure')).not.toBeVisible();
  });

  test('should navigate between project list and detail', async ({ page, request }) => {
    // Create project via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    const project = await apiHelper.createProject(headers, {
      name: 'Navigation Test',
    });
    
    // Refresh page
    await page.reload();
    
    // Click on project card
    await page.click('[data-testid^="project-card"]');
    
    // Should navigate to detail page
    await expect(page.url()).toContain(`/projects/${project.id}`);
    await expect(page.locator('h4:has-text("Navigation Test")')).toBeVisible();
    
    // Navigate back using breadcrumb
    await page.click('a:has-text("Projects")');
    
    // Should be back on projects list
    await expect(page.url()).toMatch(/\/projects$/);
    await expect(page.locator('[data-testid^="project-card"]')).toBeVisible();
  });
});