import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // 1. Products indexes
    await queryInterface.addIndex('products', ['category'], { name: 'products_category_idx', transaction });
    await queryInterface.addIndex('products', ['brand'], { name: 'products_brand_idx', transaction });
    await queryInterface.addIndex('products', ['createdAt'], { name: 'products_created_at_idx', transaction });
    await queryInterface.addIndex('products', ['trending'], { name: 'products_trending_idx', transaction });

    // 2. Reviews indexes
    await queryInterface.addIndex('reviews', ['productId'], { name: 'reviews_product_id_idx', transaction });
    await queryInterface.addIndex('reviews', ['userId'], { name: 'reviews_user_id_idx', transaction });

    // 3. Addresses indexes
    await queryInterface.addIndex('addresses', ['userId'], { name: 'addresses_user_id_idx', transaction });

    // 4. Orders indexes
    await queryInterface.addIndex('orders', ['userId'], { name: 'orders_user_id_idx', transaction });
    await queryInterface.addIndex('orders', ['orderStatus'], { name: 'orders_order_status_idx', transaction });
    await queryInterface.addIndex('orders', ['createdAt'], { name: 'orders_created_at_idx', transaction });

    // 5. Notifications indexes
    await queryInterface.addIndex('notifications', ['userId'], { name: 'notifications_user_id_idx', transaction });
    await queryInterface.addIndex('notifications', ['read'], { name: 'notifications_read_idx', transaction });
    await queryInterface.addIndex('notifications', ['createdAt'], { name: 'notifications_created_at_idx', transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeIndex('products', 'products_category_idx', { transaction });
    await queryInterface.removeIndex('products', 'products_brand_idx', { transaction });
    await queryInterface.removeIndex('products', 'products_created_at_idx', { transaction });
    await queryInterface.removeIndex('products', 'products_trending_idx', { transaction });

    await queryInterface.removeIndex('reviews', 'reviews_product_id_idx', { transaction });
    await queryInterface.removeIndex('reviews', 'reviews_user_id_idx', { transaction });

    await queryInterface.removeIndex('addresses', 'addresses_user_id_idx', { transaction });

    await queryInterface.removeIndex('orders', 'orders_user_id_idx', { transaction });
    await queryInterface.removeIndex('orders', 'orders_order_status_idx', { transaction });
    await queryInterface.removeIndex('orders', 'orders_created_at_idx', { transaction });

    await queryInterface.removeIndex('notifications', 'notifications_user_id_idx', { transaction });
    await queryInterface.removeIndex('notifications', 'notifications_read_idx', { transaction });
    await queryInterface.removeIndex('notifications', 'notifications_created_at_idx', { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
