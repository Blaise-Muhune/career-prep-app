import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const neon = new Pool(neonConfig);
const adapter = new PrismaNeon(neon);
export const prisma = new PrismaClient({ adapter }); 