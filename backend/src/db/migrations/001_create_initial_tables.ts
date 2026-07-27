import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // 1. Users
    await queryInterface.createTable('users', {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    // 2. Products
    await queryInterface.createTable('products', {
      id: { type: DataTypes.STRING, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      brand: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.INTEGER, allowNull: false },
      discount: { type: DataTypes.INTEGER, defaultValue: 0 },
      rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
      reviewsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      sizes: { type: DataTypes.JSON, allowNull: false },
      colors: { type: DataTypes.JSON, allowNull: false },
      images: { type: DataTypes.JSON, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      gender: { type: DataTypes.STRING, allowNull: false },
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      fabric: { type: DataTypes.STRING, allowNull: false },
      sleeve: { type: DataTypes.STRING, allowNull: true },
      fit: { type: DataTypes.STRING, allowNull: false },
      occasion: { type: DataTypes.STRING, allowNull: false },
      pattern: { type: DataTypes.STRING, allowNull: false },
      trending: { type: DataTypes.BOOLEAN, defaultValue: false },
      sku: { type: DataTypes.STRING, allowNull: true },
      deliveryTime: { type: DataTypes.STRING, allowNull: true },
      careInstructions: { type: DataTypes.TEXT, allowNull: true },
      returnPolicy: { type: DataTypes.TEXT, allowNull: true },
      paused: { type: DataTypes.BOOLEAN, defaultValue: false },
      stockStatus: { type: DataTypes.STRING, defaultValue: 'in_stock' },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    // 3. Reviews
    await queryInterface.createTable('reviews', {
      id: { type: DataTypes.STRING, primaryKey: true },
      productId: { type: DataTypes.STRING, allowNull: false },
      userId: { type: DataTypes.STRING, allowNull: false },
      userName: { type: DataTypes.STRING, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    // 4. Addresses
    await queryInterface.createTable('addresses', {
      id: { type: DataTypes.STRING, primaryKey: true },
      userId: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      street: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      pincode: { type: DataTypes.STRING, allowNull: false },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, { transaction });

    // 5. Carts
    await queryInterface.createTable('carts', {
      userId: { type: DataTypes.STRING, primaryKey: true },
      items: { type: DataTypes.JSON, defaultValue: [] }
    }, { transaction });

    // 6. Wishlists
    await queryInterface.createTable('wishlists', {
      userId: { type: DataTypes.STRING, primaryKey: true },
      productIds: { type: DataTypes.JSON, defaultValue: [] }
    }, { transaction });

    // 7. Orders
    await queryInterface.createTable('orders', {
      id: { type: DataTypes.STRING, primaryKey: true },
      userId: { type: DataTypes.STRING, allowNull: false },
      addressId: { type: DataTypes.STRING, allowNull: false },
      paymentMethod: { type: DataTypes.STRING, allowNull: false },
      paymentStatus: { type: DataTypes.STRING, allowNull: false },
      orderStatus: { type: DataTypes.STRING, defaultValue: 'Placed' },
      items: { type: DataTypes.JSON, allowNull: false },
      summary: { type: DataTypes.JSON, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    // 8. Coupons
    await queryInterface.createTable('coupons', {
      code: { type: DataTypes.STRING, primaryKey: true },
      discountPercent: { type: DataTypes.INTEGER, allowNull: false },
      maxDiscount: { type: DataTypes.INTEGER, allowNull: false },
      minOrderAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
      expiryDate: { type: DataTypes.STRING, allowNull: false }
    }, { transaction });

    // 9. Boutique Profiles
    await queryInterface.createTable('boutique_profiles', {
      userId: { type: DataTypes.STRING, primaryKey: true },
      boutiqueName: { type: DataTypes.STRING, allowNull: false },
      logoUrl: { type: DataTypes.STRING, allowNull: true },
      bannerUrl: { type: DataTypes.STRING, allowNull: true },
      about: { type: DataTypes.TEXT, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      contactNumber: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      socialLinks: { type: DataTypes.JSON, defaultValue: {} },
      businessHours: { type: DataTypes.STRING, allowNull: false },
      experienceYears: { type: DataTypes.INTEGER, defaultValue: 0 },
      specialization: { type: DataTypes.STRING, allowNull: false },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      deliveryOptions: { type: DataTypes.STRING, allowNull: false },
      pricingPolicy: { type: DataTypes.STRING, allowNull: false },
      followersCount: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, { transaction });

    // 10. Designer Profiles
    await queryInterface.createTable('designer_profiles', {
      userId: { type: DataTypes.STRING, primaryKey: true },
      designerName: { type: DataTypes.STRING, allowNull: false },
      portfolioImages: { type: DataTypes.JSON, defaultValue: [] },
      exclusiveCollections: { type: DataTypes.JSON, defaultValue: [] },
      about: { type: DataTypes.TEXT, allowNull: false },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      customizationTerms: { type: DataTypes.TEXT, allowNull: false }
    }, { transaction });

    // 11. Customization Requests
    await queryInterface.createTable('customization_requests', {
      id: { type: DataTypes.STRING, primaryKey: true },
      designerId: { type: DataTypes.STRING, allowNull: false },
      customerId: { type: DataTypes.STRING, allowNull: false },
      customerName: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      referenceImage: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, defaultValue: 'pending' },
      reply: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    // 12. Tailors
    await queryInterface.createTable('tailors', {
      id: { type: DataTypes.STRING, primaryKey: true },
      boutiqueId: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      photoUrl: { type: DataTypes.STRING, allowNull: false },
      experience: { type: DataTypes.STRING, allowNull: false },
      specialization: { type: DataTypes.STRING, allowNull: false },
      certifications: { type: DataTypes.JSON, defaultValue: [] },
      workingHours: { type: DataTypes.STRING, allowNull: false },
      languages: { type: DataTypes.JSON, defaultValue: [] },
      bio: { type: DataTypes.TEXT, allowNull: false },
      rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
      projectsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, { transaction });

    // 13. Portfolio Items
    await queryInterface.createTable('portfolio_items', {
      id: { type: DataTypes.STRING, primaryKey: true },
      boutiqueId: { type: DataTypes.STRING, allowNull: false },
      images: { type: DataTypes.JSON, defaultValue: [] },
      designName: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      fabric: { type: DataTypes.STRING, allowNull: false },
      stitchingType: { type: DataTypes.STRING, allowNull: false },
      completionTime: { type: DataTypes.STRING, allowNull: false },
      customerReview: { type: DataTypes.TEXT, allowNull: true }
    }, { transaction });

    // 14. Tailor Requirements
    await queryInterface.createTable('tailor_requirements', {
      id: { type: DataTypes.STRING, primaryKey: true },
      boutiqueId: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      skills: { type: DataTypes.JSON, defaultValue: [] },
      experience: { type: DataTypes.STRING, allowNull: false },
      employmentType: { type: DataTypes.STRING, allowNull: false },
      salaryRange: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      vacancies: { type: DataTypes.INTEGER, defaultValue: 1 },
      closingDate: { type: DataTypes.STRING, allowNull: false }
    }, { transaction });

    // 15. Notifications
    await queryInterface.createTable('notifications', {
      id: { type: DataTypes.STRING, primaryKey: true },
      userId: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    }, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tables = [
      'notifications', 'tailor_requirements', 'portfolio_items', 'tailors',
      'customization_requests', 'designer_profiles', 'boutique_profiles',
      'coupons', 'orders', 'wishlists', 'carts', 'addresses', 'reviews',
      'products', 'users'
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table, { transaction });
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
