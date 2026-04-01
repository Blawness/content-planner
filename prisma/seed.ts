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

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash,
    },
  })

  // Create personal workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Beta Release Workspace',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'owner',
        },
      },
      projects: {
        create: {
          name: 'AI Content Planner',
          description: 'Getting the product ready for beta release',
          tasks: {
            create: [
              { title: 'Setup Neon DB connection', status: 'DONE', assigneeId: user.id },
              { title: 'Create Prisma seed script', status: 'DONE', assigneeId: user.id },
              { title: 'Migrate middleware to proxy', status: 'DONE', assigneeId: user.id },
              { title: 'Integrate frontend with new APIs', status: 'IN_PROGRESS', assigneeId: user.id },
              { title: 'Test generated content formats', status: 'BACKLOG' },
            ],
          },
        },
      },
    },
  })

  console.log(`Database has been seeded. 🌱`)
  console.log(`Demo User: demo@example.com`)
  console.log(`Password : password123`)
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
