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

  // ─── Create demo owner ───────────────────────────────────────────────────────
  const ownerHash = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: ownerHash,
    },
  })

  // ─── Create admin user ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminHash,
    },
  })

  // ─── Create member user ──────────────────────────────────────────────────────
  const memberHash = await bcrypt.hash('member123', 10)
  const memberUser = await prisma.user.create({
    data: {
      email: 'member@example.com',
      passwordHash: memberHash,
    },
  })

  // ─── Create workspace with members ──────────────────────────────────────────
  await prisma.workspace.create({
    data: {
      name: 'Beta Release Workspace',
      ownerId: owner.id,
      members: {
        create: [
          { userId: owner.id, role: 'owner' },
          { userId: adminUser.id, role: 'admin' },
          { userId: memberUser.id, role: 'member' },
        ],
      },
      projects: {
        create: {
          name: 'AI Content Planner',
          description: 'Getting the product ready for beta release',
          tasks: {
            create: [
              { title: 'Setup Neon DB connection', status: 'DONE', assigneeId: owner.id },
              { title: 'Create Prisma seed script', status: 'DONE', assigneeId: owner.id },
              { title: 'Migrate middleware to proxy', status: 'DONE', assigneeId: owner.id },
              { title: 'Integrate frontend with new APIs', status: 'IN_PROGRESS', assigneeId: adminUser.id },
              { title: 'Test generated content formats', status: 'BACKLOG', assigneeId: memberUser.id },
            ],
          },
        },
      },
    },
  })

  console.log('Database has been seeded. 🌱')
  console.log('─────────────────────────────────────')
  console.log('Superuser : super@example.com        / superpassword123')
  console.log('Owner     : demo@example.com         / password123')
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
