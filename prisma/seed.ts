import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const hashedPassword = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmacia.com' },
    update: {},
    create: {
      email: 'admin@farmacia.com',
      name: 'Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
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
    await prisma.$disconnect();
  });
