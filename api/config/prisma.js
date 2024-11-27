import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, NeonConfig } from '@neondatabase/serverless';

const neonConfig = {
    webSocketMode: true,
    connectionString: process.env.POSTGRES_PRISMA_URL,
};
const neon = new Pool(neonConfig);
const adapter = new PrismaNeon(neon);
export const prisma = new PrismaClient({ adapter }); 