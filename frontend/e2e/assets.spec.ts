import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';
import { APIHelper } from './helpers/api';
import path from 'path';

test.describe('Asset Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await registerUser(page);
    
    // Navigate to assets page
    await page.goto('/assets');
  });

  test('should display empty state initially', async ({ page }) => {
    await expect(page.locator('text=No assets uploaded yet')).toBeVisible();
    await expect(page.locator('text=Upload your first asset')).toBeVisible();
  });

  test('should upload an image asset', async ({ page }) => {
    // Click upload button
    await page.click('button:has-text("Upload Asset")');
    
    // Wait for dialog
    await expect(page.locator('text=Upload Asset')).toBeVisible();
    
    // Create a test image file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Drop files here or click to browse');
    const fileChooser = await fileChooserPromise;
    
    // Create a minimal PNG file
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');
    await fileChooser.setFiles([{
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
    }]);
    
    // Add tags
    await page.fill('input[placeholder="Add tags..."]', 'test, image');
    
    // Select category
    await page.click('div[role="button"]:has-text("Select category")');
    await page.click('li[role="option"]:has-text("CHARACTER")');
    
    // Upload
    await page.click('button:has-text("Upload")');
    
    // Wait for upload to complete
    await expect(page.locator('text=test-image.png')).toBeVisible({ timeout: 10000 });
    
    // Verify asset appears in list
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(1);
  });

  test('should search assets', async ({ page, request }) => {
    // Create test assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    await apiHelper.createAsset(headers, { tags: 'character,hero' });
    await apiHelper.createAsset(headers, { tags: 'background,forest' });
    await apiHelper.createAsset(headers, { tags: 'music,theme' });
    
    // Refresh page to see assets
    await page.reload();
    
    // Search for 'character'
    await page.fill('input[placeholder="Search assets..."]', 'character');
    await page.press('input[placeholder="Search assets..."]', 'Enter');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(1);
    await expect(page.locator('text=character')).toBeVisible();
  });

  test('should filter by file type', async ({ page, request }) => {
    // Create test assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    // Create different types of assets
    await apiHelper.createAsset(headers, { tags: 'image1' });
    await apiHelper.createAsset(headers, { tags: 'image2' });
    
    // Refresh page
    await page.reload();
    
    // Filter by Images
    await page.click('text=All Types');
    await page.click('li:has-text("Images")');
    
    // Should show only image assets
    const assetCards = page.locator('[data-testid="asset-card"]');
    await expect(assetCards).toHaveCount(2);
  });

  test('should view asset details', async ({ page, request }) => {
    // Create test asset via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    const asset = await apiHelper.createAsset(headers, { 
      tags: 'test,detail',
      category: 'CHARACTER' 
    });
    
    // Refresh page
    await page.reload();
    
    // Click on asset card
    await page.click('[data-testid="asset-card"]');
    
    // Should show asset details dialog
    await expect(page.locator('text=Asset Details')).toBeVisible();
    await expect(page.locator(`text=${asset.filename}`)).toBeVisible();
    await expect(page.locator('text=CHARACTER')).toBeVisible();
    await expect(page.locator('text=test')).toBeVisible();
    await expect(page.locator('text=detail')).toBeVisible();
  });

  test('should delete an asset', async ({ page, request }) => {
    // Create test asset via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    await apiHelper.createAsset(headers, { tags: 'to-delete' });
    
    // Refresh page
    await page.reload();
    
    // Click delete button on asset card
    await page.click('[data-testid="asset-card"] button[aria-label="delete"]');
    
    // Confirm deletion
    await expect(page.locator('text=Delete Asset')).toBeVisible();
    await page.click('button:has-text("Delete")');
    
    // Asset should be removed
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(0);
    await expect(page.locator('text=No assets uploaded yet')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Click upload button
    await page.click('button:has-text("Upload Asset")');
    
    // Try to upload without selecting a file
    await page.click('button:has-text("Upload")');
    
    // Should show error
    await expect(page.locator('text=Please select at least one file')).toBeVisible();
  });

  test('should support drag and drop upload', async ({ page }) => {
    // Create a data transfer object for drag and drop
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    
    // Create a file
    await page.evaluate(dt => {
      const file = new File(['test content'], 'drag-drop.txt', { type: 'text/plain' });
      dt.items.add(file);
    }, dataTransfer);
    
    // Trigger drag and drop
    const dropZone = page.locator('text=Drop files here or click to browse');
    await dropZone.dispatchEvent('drop', { dataTransfer });
    
    // File should be selected
    await expect(page.locator('text=drag-drop.txt')).toBeVisible();
  });

  test('should paginate assets', async ({ page, request }) => {
    // Create many test assets via API
    const apiHelper = new APIHelper(request);
    const { headers } = await apiHelper.createAuthenticatedUser();
    
    // Create 15 assets (assuming 12 per page)
    for (let i = 0; i < 15; i++) {
      await apiHelper.createAsset(headers, { tags: `asset${i}` });
    }
    
    // Refresh page
    await page.reload();
    
    // Should show first page with 12 items
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(12);
    
    // Should show pagination
    await expect(page.locator('[aria-label="pagination navigation"]')).toBeVisible();
    
    // Go to page 2
    await page.click('button[aria-label="Go to page 2"]');
    
    // Should show remaining 3 items
    await expect(page.locator('[data-testid="asset-card"]')).toHaveCount(3);
  });
});