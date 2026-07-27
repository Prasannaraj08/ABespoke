import 'dotenv/config';
import sequelize from './database';
import { QueryInterface, DataTypes } from 'sequelize';

import { up as migration001Up, down as migration001Down } from './migrations/001_create_initial_tables';
import { up as migration002Up, down as migration002Down } from './migrations/002_add_db_indexes';
import { up as migration003Up, down as migration003Down } from './migrations/003_production_hardening';

interface Migration {
  name: string;
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: '001_create_initial_tables',
    up: migration001Up,
    down: migration001Down
  },
  {
    name: '002_add_db_indexes',
    up: migration002Up,
    down: migration002Down
  },
  {
    name: '003_production_hardening',
    up: migration003Up,
    down: migration003Down
  }
];

/**
 * Runs all pending migrations.
 */
export async function runMigrations(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();

  // Create meta table to track migrations if not exists
  await queryInterface.createTable('sequelize_meta', {
    name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    }
  });

  const appliedRows: any[] = await sequelize.query('SELECT name FROM sequelize_meta', {
    type: 'SELECT' as any
  });
  const appliedNames = new Set<string>(appliedRows.map((row: any) => row.name));

  console.log('Checking for pending database migrations...');

  for (const migration of migrations) {
    if (!appliedNames.has(migration.name)) {
      console.log(`Running pending migration: ${migration.name}`);
      const transaction = await sequelize.transaction();
      try {
        await migration.up(queryInterface);
        await sequelize.query('INSERT INTO sequelize_meta (name) VALUES (?)', {
          replacements: [migration.name],
          transaction
        });
        await transaction.commit();
        console.log(`Successfully completed migration: ${migration.name}`);
      } catch (err) {
        await transaction.rollback();
        console.error(`Migration ${migration.name} failed. Database changes rolled back.`, err);
        throw err;
      }
    }
  }
  console.log('Database schema migrations are up to date.');
}

/**
 * Rolls back the last applied migration.
 */
export async function rollbackMigrations(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();

  const appliedRows: any[] = await sequelize.query('SELECT name FROM sequelize_meta ORDER BY name DESC', {
    type: 'SELECT' as any
  });

  if (appliedRows.length === 0) {
    console.log('No applied migrations found to roll back.');
    return;
  }

  const lastAppliedName = appliedRows[0].name;
  const migration = migrations.find(m => m.name === lastAppliedName);

  if (!migration) {
    throw new Error(`Migration files mismatch: Applied migration '${lastAppliedName}' not found in registered script runner.`);
  }

  console.log(`Rolling back migration: ${migration.name}`);
  const transaction = await sequelize.transaction();
  try {
    await migration.down(queryInterface);
    await sequelize.query('DELETE FROM sequelize_meta WHERE name = ?', {
      replacements: [migration.name],
      transaction
    });
    await transaction.commit();
    console.log(`Successfully rolled back migration: ${migration.name}`);
  } catch (err) {
    await transaction.rollback();
    console.error(`Rollback of migration ${migration.name} failed:`, err);
    throw err;
  }
}

// Enable direct terminal invocation
if (require.main === module) {
  const command = process.argv[2];
  if (command === 'up') {
    runMigrations()
      .then(() => {
        console.log('Migration command finished successfully.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Migration command encountered a crash:', err);
        process.exit(1);
      });
  } else if (command === 'down') {
    rollbackMigrations()
      .then(() => {
        console.log('Rollback command finished successfully.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Rollback command encountered a crash:', err);
        process.exit(1);
      });
  } else {
    console.log('Usage: ts-node migrate.ts <up|down>');
  }
}
