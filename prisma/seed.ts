// prisma/seed.ts
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

// Prefer the direct URL for seeding if provided
if (process.env.DIRECT_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL
}

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@demo.edu'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'
const ADMIN_FIRST = process.env.ADMIN_FIRST ?? 'Admin'
const ADMIN_LAST = process.env.ADMIN_LAST ?? 'User'

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  // Adjust field names if your User model differs
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      firstName: ADMIN_FIRST,
      lastName: ADMIN_LAST,
      role: 'ADMIN',
      active: true,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: ADMIN_FIRST,
      lastName: ADMIN_LAST,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log(`✅ Seeded/updated admin: ${admin.email}`)
  console.log(`➡️  Password: ${ADMIN_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })