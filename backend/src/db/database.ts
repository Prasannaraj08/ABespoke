import { Sequelize } from 'sequelize';
import path from 'path';

const dbUri = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

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
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    }
  : {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../data/clara.sqlite'),
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000,
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
