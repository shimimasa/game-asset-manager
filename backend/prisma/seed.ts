import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: hashedPassword,
    },
  });
  console.log('Created test user:', testUser.username);

  // Create sample prompts
  const imagePrompt = await prisma.prompt.create({
    data: {
      title: 'Fantasy Character Generator',
      content: 'A brave warrior with magical armor, fantasy art style, highly detailed',
      type: 'IMAGE',
      parameters: {
        style: 'fantasy',
        quality: 'high',
        resolution: '1024x1024',
      },
      category: 'Characters',
      userId: testUser.id,
    },
  });

  const audioPrompt = await prisma.prompt.create({
    data: {
      title: 'Battle Theme Music',
      content: 'Epic orchestral battle music, intense drums, heroic melody',
      type: 'AUDIO',
      parameters: {
        duration: 120,
        genre: 'orchestral',
        mood: 'epic',
      },
      category: 'Music',
      userId: testUser.id,
    },
  });
  console.log('Created sample prompts');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'My First Game',
      description: 'A fantasy RPG adventure game',
      userId: testUser.id,
    },
  });
  console.log('Created sample project:', project.name);

  // Create sample assets
  const imageAsset = await prisma.asset.create({
    data: {
      filename: 'warrior_01.png',
      originalName: 'warrior_character.png',
      fileType: 'IMAGE',
      mimeType: 'image/png',
      fileSize: 1048576, // 1MB
      storageUrl: 's3://bucket/assets/warrior_01.png',
      thumbnailUrl: 's3://bucket/thumbnails/warrior_01_thumb.png',
      metadata: {
        width: 1024,
        height: 1024,
        format: 'PNG',
      },
      tags: ['character', 'warrior', 'fantasy'],
      category: 'Characters',
      userId: testUser.id,
      promptId: imagePrompt.id,
    },
  });

  const audioAsset = await prisma.asset.create({
    data: {
      filename: 'battle_theme_01.mp3',
      originalName: 'epic_battle_music.mp3',
      fileType: 'AUDIO',
      mimeType: 'audio/mpeg',
      fileSize: 3145728, // 3MB
      storageUrl: 's3://bucket/assets/battle_theme_01.mp3',
      metadata: {
        duration: 120,
        bitrate: 320,
        format: 'MP3',
      },
      tags: ['music', 'battle', 'epic'],
      category: 'Music',
      userId: testUser.id,
      promptId: audioPrompt.id,
    },
  });
  console.log('Created sample assets');

  // Link assets to project
  await prisma.projectAsset.create({
    data: {
      projectId: project.id,
      assetId: imageAsset.id,
    },
  });

  await prisma.projectAsset.create({
    data: {
      projectId: project.id,
      assetId: audioAsset.id,
    },
  });
  console.log('Linked assets to project');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });