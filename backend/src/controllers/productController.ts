import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db/database';
import {
  Product as ProductModel,
  Review as ReviewModel
} from '../db/models';
import { AuthenticatedRequest } from '../middleware/auth';
import { cache, TTL } from '../cache/memoryCache';

const isPostgres = sequelize.getDialect() === 'postgres';

/** Minimal product fields for list views — avoids transferring heavy TEXT columns */
const PRODUCT_LIST_ATTRS = [
  'id', 'title', 'brand', 'price', 'discount', 'rating', 'reviewsCount',
  'images', 'sizes', 'colors', 'category', 'gender', 'stock', 'stockStatus',
  'trending', 'fabric', 'fit', 'occasion', 'pattern', 'sleeve', 'paused', 'createdAt',
];

export async function getProducts(req: Request, res: Response) {
  try {
    const {
      q, gender, category, brand, size, color, fabric, sleeve, fit,
      occasion, pattern, minPrice, maxPrice, minDiscount, minRating,
      sort, page = '1', limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));

    // Cache key built from the full query string
    const cacheKey = `products:list:${JSON.stringify(req.query)}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const likeOp = isPostgres ? Op.iLike : Op.like;
    const where: any = { paused: false };

    if (q) {
      const searchLike = `%${q}%`;
      where[Op.or] = [
        { title: { [likeOp]: searchLike } },
        { description: { [likeOp]: searchLike } },
        { brand: { [likeOp]: searchLike } },
        { category: { [likeOp]: searchLike } },
      ];
    }
    if (gender) where.gender = String(gender).toLowerCase();
    if (category) {
      const cats = String(category).split(',').map(c => c.trim());
      where.category = { [Op.in]: cats };
    }
    if (brand) {
      const brands = String(brand).split(',').map(b => b.trim());
      where.brand = { [Op.in]: brands };
    }
    if (size) {
      const requestedSizes = String(size).split(',').map(s => s.trim());
      const sizeConditions = requestedSizes.map(s => ({ sizes: { [likeOp]: `%"${s}"%` } }));
      where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: sizeConditions }] : [{ [Op.or]: sizeConditions }];
    }
    if (color) {
      const requestedColors = String(color).split(',').map(c => c.trim());
      const colorConditions = requestedColors.map(c => ({ colors: { [likeOp]: `%"${c}"%` } }));
      where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: colorConditions }] : [{ [Op.or]: colorConditions }];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    if (minDiscount) where.discount = { [Op.gte]: Number(minDiscount) };
    if (minRating) where.rating = { [Op.gte]: Number(minRating) };

    const scalarFilters = { fabric, sleeve, fit, occasion, pattern };
    for (const [key, value] of Object.entries(scalarFilters)) {
      if (value) {
        const vals = String(value).split(',').map(v => v.trim());
        where[key] = { [Op.in]: vals };
      }
    }

    let orderList: any[] = [];
    switch (sort) {
      case 'price-low-to-high': orderList = [['price', 'ASC']]; break;
      case 'price-high-to-low': orderList = [['price', 'DESC']]; break;
      case 'customer-rating': orderList = [['rating', 'DESC']]; break;
      case 'new-arrivals': orderList = [['createdAt', 'DESC']]; break;
      case 'discount-desc': orderList = [['discount', 'DESC']]; break;
      default: orderList = [['trending', 'DESC'], ['rating', 'DESC']]; break;
    }

    const offset = (pageNum - 1) * limitNum;
    const { rows: products, count: totalCount } = await ProductModel.findAndCountAll({
      where,
      attributes: PRODUCT_LIST_ATTRS,
      order: orderList,
      limit: limitNum,
      offset,
    });

    const response = {
      products: products.map(p => p.get({ plain: true })),
      pagination: { total: totalCount, page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCount / limitNum) },
    };

    cache.set(cacheKey, response, TTL.PRODUCTS_LIST);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching products', errorCode: 5000 });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const cacheKey = `products:detail:${id}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const product = await ProductModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found', errorCode: 4040 });
    }

    const reviews = await ReviewModel.findAll({
      where: { productId: id },
      attributes: ['id', 'userId', 'userName', 'rating', 'comment', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const response = {
      product: product.get({ plain: true }),
      reviews: reviews.map(r => r.get({ plain: true })),
    };

    cache.set(cacheKey, response, TTL.PRODUCTS_LIST);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get product details error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching product details', errorCode: 5000 });
  }
}

export async function getCategoriesAndBrands(req: Request, res: Response) {
  try {
    const cacheKey = 'products:meta';
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const products = await ProductModel.findAll({
      attributes: ['category', 'brand', 'colors', 'sizes', 'fabric', 'fit', 'occasion', 'pattern'],
      raw: true,
    });

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
    const colors = Array.from(new Set(products.flatMap(p => {
      try { const c = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors; return Array.isArray(c) ? c : []; }
      catch { return []; }
    }).filter(Boolean)));
    const sizes = Array.from(new Set(products.flatMap(p => {
      try { const s = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; return Array.isArray(s) ? s : []; }
      catch { return []; }
    }).filter(Boolean)));
    const fabrics = Array.from(new Set(products.map(p => p.fabric).filter(Boolean)));
    const fits = Array.from(new Set(products.map(p => p.fit).filter(Boolean)));
    const occasions = Array.from(new Set(products.map(p => p.occasion).filter(Boolean)));
    const patterns = Array.from(new Set(products.map(p => p.pattern).filter(Boolean)));

    const response = { categories, brands, colors, sizes, fabrics, fits, occasions, patterns };
    cache.set(cacheKey, response, TTL.PRODUCTS_META);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get metadata error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching filter metadata', errorCode: 5000 });
  }
}

export async function addProductReview(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.email.split('@')[0] || 'User';

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required', errorCode: 4001 });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 4011 });
    }

    const product = await ProductModel.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found', errorCode: 4040 });
    }

    const newReview = await ReviewModel.create({
      id: `r_${Date.now()}`,
      productId,
      userId,
      userName,
      rating: Number(rating),
      comment,
    });

    const statsResult: any = await ReviewModel.findAll({
      where: { productId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
      ],
      raw: true,
    });

    const reviewsCount = Number(statsResult[0]?.count || 0);
    const ratingAvg = Number(Number(statsResult[0]?.average || 5.0).toFixed(1));

    await ProductModel.update({ reviewsCount, rating: ratingAvg }, { where: { id: productId } });

    // Invalidate detail cache for this product
    cache.del(`products:detail:${productId}`);

    return res.status(201).json({
      success: true,
      data: {
        review: newReview.get({ plain: true }),
        productRating: ratingAvg,
        productReviewsCount: reviewsCount,
      },
    });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding review', errorCode: 5000 });
  }
}

/** Called by admin controller after create/update/delete to bust product caches */
export function invalidateProductCache(productId?: string) {
  cache.delPattern('products:list:');
  cache.del('products:meta');
  if (productId) cache.del(`products:detail:${productId}`);
}
