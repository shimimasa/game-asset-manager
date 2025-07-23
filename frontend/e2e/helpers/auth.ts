import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export const testUser: TestUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123!',
};

export async function registerUser(page: Page, user: TestUser = testUser) {
  await page.goto('/register');
  
  await page.fill('input[name="username"]', user.username);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

export async function loginUser(page: Page, user: Partial<TestUser> = testUser) {
  await page.goto('/login');
  
  await page.fill('input[name="username"]', user.username || user.email || '');
  await page.fill('input[name="password"]', user.password || '');
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

export async function logoutUser(page: Page) {
  // Click on user avatar
  await page.click('[aria-label="account of current user"]');
  
  // Click logout in dropdown
  await page.click('text=Logout');
  
  // Wait for redirect to login
  await page.waitForURL('/login');
}

export async function expectAuthenticated(page: Page) {
  // Check if we're on an authenticated page
  await expect(page.locator('[aria-label="account of current user"]')).toBeVisible();
}

export async function expectUnauthenticated(page: Page) {
  // Check if we're redirected to login
  expect(page.url()).toContain('/login');
}