// Turns off two-factor login for one account, from the server's command line.
// For when the superadmin loses their phone AND their recovery codes (nobody above them can reset it in the app).
//   npm run reset-2fa -- someone@example.com
import "dotenv/config";
import { Prisma } from "@prisma/client";
import prisma from "./client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run reset-2fa -- <email>");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account with the email ${email}`);
    process.exit(1);
  }
  if (!user.twoFactorEnabledAt) {
    console.log(`Two-factor login is already off for ${email}`);
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabledAt: null, twoFactorSecret: null, twoFactorRecoveryCodes: Prisma.DbNull, tokenVersion: { increment: 1 } },
  });
  console.log(`Two-factor login is now off for ${email}. They can log in with their password and turn it on again.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
