import 'dotenv/config';
import { seedDatabase } from './seed';
import sequelize from './database';

async function main() {
  console.log('Starting standalone database seeding...');
  try {
    // Authenticate and execute transaction-bound database seeder
    await sequelize.authenticate();
    await seedDatabase();
    console.log('Database seeding process finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding process crashed:', err);
    process.exit(1);
  }
}

main();
