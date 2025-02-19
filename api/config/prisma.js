import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';

// Create a singleton Prisma client
if (!global.prisma) {
    const connectionString = process.env.POSTGRES_URL;
    const directConnectionString = process.env.POSTGRES_URL_NON_POOLING;
    
    if (!connectionString || !directConnectionString) {
        throw new Error('Database connection URLs are not set');
    }

    // Create connection pool
    const pool = new Pool({
        connectionString: connectionString,
        maxSize: 10,
        connectionTimeoutMillis: 15000, // 15 seconds
        idleTimeoutMillis: 10000, // 10 seconds
    });

    global.prisma = new PrismaClient({
        datasources: {
            db: {
                url: connectionString
            }
        },
        log: ['query', 'error', 'warn']
    });

    // Add event listeners for better error handling
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    // Attach pool to global prisma instance for reference
    global.prisma.$pool = pool;
}

export const prisma = global.prisma; 