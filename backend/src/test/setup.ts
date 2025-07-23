import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Test user data
export const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!@#',
};

// Helper to create authenticated user
export async function createAuthenticatedUser() {
  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  
  const user = await prisma.user.create({
    data: {
      username: testUser.username,
      email: testUser.email,
      password: hashedPassword,
    },
  });

  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { user, accessToken, refreshToken };
}

// Setup test database
export async function setupTestDatabase() {
  try {
    // Reset database
    await execAsync('npx prisma db push --force-reset --skip-generate');
    console.log('Test database reset successfully');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

// Cleanup test database
export async function cleanupTestDatabase() {
  const deleteUsers = prisma.user.deleteMany();
  const deleteAssets = prisma.asset.deleteMany();
  const deletePrompts = prisma.prompt.deleteMany();
  const deleteProjects = prisma.project.deleteMany();
  const deleteGenerations = prisma.generation.deleteMany();
  const deleteExports = prisma.export.deleteMany();
  
  await prisma.$transaction([
    deleteExports,
    deleteGenerations,
    deleteProjects,
    deletePrompts,
    deleteAssets,
    deleteUsers,
  ]);
}

// Global setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Global cleanup
afterAll(async () => {
  await prisma.$disconnect();
});

// Cleanup after each test
afterEach(async () => {
  await cleanupTestDatabase();
});