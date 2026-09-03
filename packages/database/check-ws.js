const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const ws = await prisma.workspace.findFirst({ include: { members: true } });
  console.log(JSON.stringify(ws, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
