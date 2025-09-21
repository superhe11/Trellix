import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@trellix.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "12345678";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Администратор";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await hashPassword(adminPassword),
        fullName: adminName,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Создан администратор ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`Администратор ${adminEmail} уже существует`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

