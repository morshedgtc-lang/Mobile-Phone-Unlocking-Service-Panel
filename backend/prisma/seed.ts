import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@unlock.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456!';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  const defaultGroup = await prisma.clientGroup.findFirst();
  if (!defaultGroup) {
    await prisma.clientGroup.create({ data: { name: 'DEFAULT', description: 'Default client group' } });
    console.log('Default client group created');
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
