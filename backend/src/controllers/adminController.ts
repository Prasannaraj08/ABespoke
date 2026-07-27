import { Response } from 'express';
import { Op } from 'sequelize';
import { 
  Order as OrderModel, 
  Product as ProductModel, 
  User as UserModel, 
  Coupon as CouponModel 
} from '../db/models';
import { AuthenticatedRequest } from '../middleware/auth';
import { cache, TTL } from '../cache/memoryCache';
import { invalidateProductCache } from './productController';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const cacheKey = 'admin:dashboard:stats';
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // Use SQL aggregates instead of loading all records into memory
    const [totalOrders, totalCustomers, lowStockProducts, recentOrdersDb] = await Promise.all([
      OrderModel.count(),
      UserModel.count({ where: { role: 'user' } }),
      ProductModel.findAll({
        where: { stock: { [Op.lt]: 15 } },
        attributes: ['id', 'title', 'brand', 'stock'],
        order: [['stock', 'ASC']],
        limit: 10,
        raw: true,
      }),
      OrderModel.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'userId', 'summary', 'paymentStatus', 'paymentMethod', 'orderStatus', 'createdAt'],
      }),
    ]);

    // Revenue: sum from recent 1000 orders only (avoid full table scan)
    const revenueOrders = await OrderModel.findAll({
      attributes: ['summary', 'paymentStatus', 'paymentMethod', 'items'],
      order: [['createdAt', 'DESC']],
      limit: 1000,
      raw: true,
    });
    const totalRevenue = revenueOrders
      .filter((o: any) => o.paymentStatus === 'Success' || o.paymentMethod === 'COD')
      .reduce((sum: number, o: any) => {
        const s = typeof o.summary === 'string' ? JSON.parse(o.summary) : o.summary;
        return sum + (s?.total || 0);
      }, 0);

    // Category stats from recent orders
    const productIds = Array.from(new Set(
      revenueOrders.flatMap((o: any) => {
        try {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
          return items.map((i: any) => i.productId);
        } catch { return []; }
      })
    )).slice(0, 200);

    const products = productIds.length > 0 ? await ProductModel.findAll({
      where: { id: { [Op.in]: productIds as string[] } },
      attributes: ['id', 'category'],
      raw: true,
    }) : [];

    const categoryMap = new Map(products.map((p: any) => [p.id, p.category]));
    const categorySales: Record<string, number> = {};
    revenueOrders.forEach((order: any) => {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        items.forEach((item: any) => {
          const cat = categoryMap.get(item.productId) || 'Other';
          categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
        });
      } catch { /* skip */ }
    });
    const categoryStats = Object.entries(categorySales)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Enrich recent orders with customer names
    const customerIds = recentOrdersDb.map(o => o.userId);
    const recentCustomers = await UserModel.findAll({
      where: { id: { [Op.in]: customerIds } },
      attributes: ['id', 'name', 'email'],
    });
    const recentOrders = recentOrdersDb.map(o => {
      const customer = recentCustomers.find(u => u.id === o.userId);
      const summaryObj = typeof o.summary === 'string' ? JSON.parse(o.summary) : o.summary;
      return {
        id: o.id,
        customerName: customer?.name || 'Guest User',
        customerEmail: customer?.email || '',
        total: summaryObj?.total || 0,
        status: o.orderStatus,
        createdAt: o.createdAt,
      };
    });

    const result = {
      metrics: { totalRevenue, totalOrders, totalCustomers, lowStockCount: lowStockProducts.length },
      lowStockProducts,
      categoryStats,
      recentOrders,
    };

    cache.set(cacheKey, result, TTL.DASHBOARD_STATS);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating dashboard statistics', errorCode: 5000 });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const productData = req.body;
    
    if (!productData.title || !productData.brand || !productData.price || !productData.category || !productData.gender) {
      return res.status(400).json({ message: 'Title, brand, price, category, and gender are required' });
    }

    const newProduct = await ProductModel.create({
      id: `p_${Date.now()}`,
      title: productData.title,
      brand: productData.brand,
      description: productData.description || 'Premium product from ABespoke.',
      price: Number(productData.price),
      discount: Number(productData.discount || 0),
      rating: 5.0,
      reviewsCount: 0,
      sizes: productData.sizes || ['M', 'L'],
      colors: productData.colors || ['Black'],
      images: productData.images || ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'],
      category: productData.category,
      gender: productData.gender,
      stock: Number(productData.stock || 50),
      fabric: productData.fabric || 'Premium Blend',
      sleeve: productData.sleeve,
      fit: productData.fit || 'Regular',
      occasion: productData.occasion || 'Casual',
      pattern: productData.pattern || 'Solid',
      trending: !!productData.trending,
      createdAt: new Date().toISOString()
    });

    invalidateProductCache();
    cache.del('admin:dashboard:stats');
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct.get({ plain: true })
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await ProductModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({
      ...updateData,
      price: updateData.price !== undefined ? Number(updateData.price) : product.price,
      discount: updateData.discount !== undefined ? Number(updateData.discount) : product.discount,
      stock: updateData.stock !== undefined ? Number(updateData.stock) : product.stock,
      trending: updateData.trending !== undefined ? !!updateData.trending : product.trending
    });

    invalidateProductCache(id);
    cache.del('admin:dashboard:stats');
    res.status(200).json({
      message: 'Product updated successfully',
      product: product.get({ plain: true })
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deletedCount = await ProductModel.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    invalidateProductCache(id);
    cache.del('admin:dashboard:stats');
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
}

export async function getAllOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const orders = await OrderModel.findAll({
      order: [['createdAt', 'DESC']]
    });

    const userIds = orders.map(o => o.userId);
    const users = await UserModel.findAll({
      where: { id: { [Op.in]: userIds } }
    });

    const detailedOrders = orders.map(o => {
      const customer = users.find(u => u.id === o.userId);
      return {
        ...o.get({ plain: true }),
        customerName: customer?.name || 'Guest User',
        customerEmail: customer?.email || ''
      };
    });

    res.status(200).json(detailedOrders);
  } catch (error) {
    console.error('Admin get all orders error:', error);
    res.status(500).json({ message: 'Server error fetching all orders' });
  }
}

export async function getAllCoupons(req: AuthenticatedRequest, res: Response) {
  try {
    const coupons = await CouponModel.findAll();
    res.status(200).json(coupons.map(c => c.get({ plain: true })));
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({ message: 'Server error fetching coupons' });
  }
}

export async function createCoupon(req: AuthenticatedRequest, res: Response) {
  try {
    const { code, discountPercent, maxDiscount, minOrderAmount, expiryDate } = req.body;

    if (!code || !discountPercent || !maxDiscount || !minOrderAmount || !expiryDate) {
      return res.status(400).json({ message: 'All coupon fields are required' });
    }

    const couponCode = code.toUpperCase();
    const exists = await CouponModel.findByPk(couponCode);
    if (exists) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const newCoupon = await CouponModel.create({
      code: couponCode,
      discountPercent: Number(discountPercent),
      maxDiscount: Number(maxDiscount),
      minOrderAmount: Number(minOrderAmount),
      expiryDate
    });

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: newCoupon.get({ plain: true })
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error creating coupon' });
  }
}

export async function deleteCoupon(req: AuthenticatedRequest, res: Response) {
  try {
    const { code } = req.params;
    const deletedCount = await CouponModel.destroy({
      where: { code }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error deleting coupon' });
  }
}
