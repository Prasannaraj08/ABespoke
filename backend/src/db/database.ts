import { Sequelize } from 'sequelize';
import path from 'path';

const dbUri = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (isProduction && !dbUri) {
  console.error('FATAL: DATABASE_URL / POSTGRES_URL environment variable is missing in production!');
  throw new Error('FATAL: DATABASE_URL environment variable must be set in production mode. SQLite fallback is disabled in production.');
}

const config: any = dbUri
  ? {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
        max: isProduction ? 2 : 5, // Serverless concurrency optimization: 1-2 per lambda prevents Neon pool exhaustion
        min: 0,                   // Release idle connections immediately
        acquire: 20000,           // Fail fast on connection congestion
        idle: 5000,               // Idle connection timeout 5s
        evict: 1000,              // Evict every second
      },
      logging: false,
    }
  : {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../data/clara.sqlite'),
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
      },
      logging: false,
    };

const sequelize = dbUri
  ? new Sequelize(dbUri, config)
  : new Sequelize(config);

/**
 * Attempts to authenticate connection with database using exponential backoff retry.
 */
export async function connectWithRetry(retries = 5, delay = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      const dialect = sequelize.getDialect();
      console.log(`Successfully connected to ${dialect} database.`);
      return;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} of ${retries} failed:`, err);
      if (i === retries - 1) {
        throw new Error('Could not establish database connection after multiple retries.');
      }
      console.log(`Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export default sequelize;
