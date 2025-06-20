const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await db.member.upsert({
    where: { email: 'goodforgood.social@gmail.com' },
    update: {
      password: hashedPassword,
      accountStatus: 'active',
      trusteeRole: 'PRESIDENT'
    },
    create: {
      email: 'goodforgood.social@gmail.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '1234567890',
      joinDate: new Date(),
      accountStatus: 'active',
      trusteeRole: 'PRESIDENT',
      permissions: {}
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  }); 