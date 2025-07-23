import { test, expect } from '@playwright/test';
import { testUser, registerUser, loginUser, logoutUser, expectAuthenticated, expectUnauthenticated } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh
    await page.goto('/');
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="email"]', 'new@example.com');
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expectAuthenticated(page);
    
    // Check username is displayed
    await page.click('[aria-label="account of current user"]');
    await expect(page.locator('text=newuser')).toBeVisible();
  });

  test('should login with username', async ({ page }) => {
    // First register a user
    await registerUser(page);
    
    // Logout
    await logoutUser(page);
    
    // Login again
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expectAuthenticated(page);
  });

  test('should login with email', async ({ page }) => {
    // First register a user
    await registerUser(page);
    
    // Logout
    await logoutUser(page);
    
    // Login with email
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expectAuthenticated(page);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid username or password')).toBeVisible();
    
    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await registerUser(page);
    
    // Logout
    await logoutUser(page);
    
    // Should be on login page
    await expectUnauthenticated(page);
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expectUnauthenticated(page);
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access protected routes without authentication
    const protectedRoutes = ['/dashboard', '/assets', '/prompts', '/projects'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expectUnauthenticated(page);
    }
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Username is required')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    
    // Test weak password
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should persist authentication on page refresh', async ({ page }) => {
    // Login
    await registerUser(page);
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expectAuthenticated(page);
    
    // Should still be on dashboard
    expect(page.url()).toContain('/dashboard');
  });
});