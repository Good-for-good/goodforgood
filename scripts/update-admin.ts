import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the admin password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Update admin user
  const admin = await prisma.member.update({
    where: { email: 'admin@example.com' },
    data: {
      email: 'goodforgood.social@gmail.com',
      password: hashedPassword,
      accountStatus: 'active',
      trusteeRole: 'PRESIDENT'
    },
  });

  console.log('Admin account updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 