const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.log('Workspaces:', await prisma.workspace.count());
  console.log('Projects:', await prisma.project.count());
  console.log('Issues:', await prisma.issue.count());
}
run().catch(console.error).finally(() => prisma.$disconnect());
