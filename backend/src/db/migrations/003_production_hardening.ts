import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // ─── Add updatedAt columns ──────────────────────────────────────────────
    const tablesNeedingUpdatedAt = [
      'users', 'products', 'orders', 'reviews',
      'customization_requests', 'notifications', 'addresses',
      'boutique_profiles', 'designer_profiles', 'tailors',
      'portfolio_items', 'tailor_requirements',
    ];
    for (const table of tablesNeedingUpdatedAt) {
      await queryInterface.addColumn(table, 'updatedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }

    // ─── Add soft-delete (deletedAt) to users and products ──────────────────
    await queryInterface.addColumn('users', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    }, { transaction });

    await queryInterface.addColumn('products', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    }, { transaction });

    // ─── New performance indexes ─────────────────────────────────────────────
    await queryInterface.addIndex('products', ['gender'],
      { name: 'products_gender_idx', transaction });
    await queryInterface.addIndex('products', ['price'],
      { name: 'products_price_idx', transaction });
    await queryInterface.addIndex('products', ['stockStatus'],
      { name: 'products_stock_status_idx', transaction });
    await queryInterface.addIndex('products', ['paused'],
      { name: 'products_paused_idx', transaction });
    await queryInterface.addIndex('products', ['rating'],
      { name: 'products_rating_idx', transaction });
    await queryInterface.addIndex('products', ['discount'],
      { name: 'products_discount_idx', transaction });

    await queryInterface.addIndex('orders', ['paymentStatus'],
      { name: 'orders_payment_status_idx', transaction });
    await queryInterface.addIndex('orders', ['paymentMethod'],
      { name: 'orders_payment_method_idx', transaction });

    await queryInterface.addIndex('users', ['role'],
      { name: 'users_role_idx', transaction });
    await queryInterface.addIndex('users', ['createdAt'],
      { name: 'users_created_at_idx', transaction });

    // Composite index for notifications (most common query pattern)
    await queryInterface.addIndex('notifications', ['userId', 'read'],
      { name: 'notifications_user_read_composite_idx', transaction });

    await transaction.commit();
    console.log('Migration 003: Added updatedAt, deletedAt columns and performance indexes.');
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // Remove indexes
    const indexesToRemove = [
      ['products', 'products_gender_idx'],
      ['products', 'products_price_idx'],
      ['products', 'products_stock_status_idx'],
      ['products', 'products_paused_idx'],
      ['products', 'products_rating_idx'],
      ['products', 'products_discount_idx'],
      ['orders', 'orders_payment_status_idx'],
      ['orders', 'orders_payment_method_idx'],
      ['users', 'users_role_idx'],
      ['users', 'users_created_at_idx'],
      ['notifications', 'notifications_user_read_composite_idx'],
    ];
    for (const [table, name] of indexesToRemove) {
      await queryInterface.removeIndex(table, name, { transaction });
    }

    // Remove columns
    await queryInterface.removeColumn('users', 'deletedAt', { transaction });
    await queryInterface.removeColumn('products', 'deletedAt', { transaction });

    const tablesWithUpdatedAt = [
      'users', 'products', 'orders', 'reviews',
      'customization_requests', 'notifications', 'addresses',
      'boutique_profiles', 'designer_profiles', 'tailors',
      'portfolio_items', 'tailor_requirements',
    ];
    for (const table of tablesWithUpdatedAt) {
      await queryInterface.removeColumn(table, 'updatedAt', { transaction });
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
