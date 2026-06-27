import { prisma } from "@/lib/db";
import { resetDemoData } from "@/lib/services/reset-demo";

async function main() {
  await resetDemoData(prisma);
  console.log("Demo data reset.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
