import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if we already have data
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log('Database already seeded')
    return
  }

  console.log('Seeding database...')

  // ─── Create default app settings ────────────────────────────────────────────
  await prisma.appSetting.createMany({
    data: [
      { key: 'openrouter_model', value: 'google/gemini-2.5-flash' },
      { key: 'ai_enabled', value: 'true' },
    ],
    skipDuplicates: true,
  })

  // ─── Create superuser ────────────────────────────────────────────────────────
  const superHash = await bcrypt.hash('superpassword123', 10)
  await prisma.user.create({
    data: {
      email: 'super@example.com',
      passwordHash: superHash,
      isSuperuser: true,
    },
  })

  // ─── Create demo user ───────────────────────────────────────────────────────
  const demoHash = await bcrypt.hash('password123', 10)
  await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: demoHash,
    },
  })

  // ─── Create admin user ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      isAdmin: true,
    },
  })

  // ─── Create member user ──────────────────────────────────────────────────────
  const memberHash = await bcrypt.hash('member123', 10)
  await prisma.user.create({
    data: {
      email: 'member@example.com',
      passwordHash: memberHash,
    },
  })

  console.log('Database has been seeded. 🌱')
  console.log('─────────────────────────────────────')
  console.log('Superuser : super@example.com        / superpassword123')
  console.log('Demo      : demo@example.com         / password123')
  console.log('Admin     : admin@example.com        / admin123')
  console.log('Member    : member@example.com       / member123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
