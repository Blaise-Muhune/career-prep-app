import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllData() {
  try {
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});
    console.log('Notifications deleted.');

    console.log('Deleting skills...');
    await prisma.skill.deleteMany({});
    console.log('Skills deleted.');

    console.log('Deleting tasks...');
    await prisma.task.deleteMany({});
    console.log('Tasks deleted.');

    console.log('Deleting career analyses...');
    await prisma.careerAnalysis.deleteMany({});
    console.log('Career analyses deleted.');

    console.log('Deleting step progress...');
    await prisma.stepProgress.deleteMany({});
    console.log('Step progress deleted.');

    console.log('Deleting profiles...');
    await prisma.profile.deleteMany({});
    console.log('Profiles deleted.');

    console.log('Deleting users...');
    await prisma.user.deleteMany({});
    console.log('Users deleted.');

    console.log('All data deleted successfully.');
  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllData();