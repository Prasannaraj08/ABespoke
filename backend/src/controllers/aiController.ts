import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db/database';
import { 
  Product as ProductModel, 
  Order as OrderModel 
} from '../db/models';
import { AuthenticatedRequest } from '../middleware/auth';
import { cache, TTL } from '../cache/memoryCache';

const isPostgres = sequelize.getDialect() === 'postgres';

export async function getPersonalizedRecommendations(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const viewedIdsStr = req.query.viewedIds as string;
    const cacheKey = `ai:personalized:${userId || 'guest'}:${viewedIdsStr || ''}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }
    const likeOp = isPostgres ? Op.iLike : Op.like;

    // 1. Gather signals from purchase history
    const userOrders = userId ? await OrderModel.findAll({
      where: { userId },
      attributes: ['items'],
      raw: true
    }) : [];

    const purchasedProductIds = new Set<string>();
    const purchasedCategories = new Set<string>();
    const purchasedBrands = new Set<string>();

    userOrders.forEach((o: any) => {
      let items: any[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch {
        items = [];
      }
      items.forEach((item: any) => {
        purchasedProductIds.add(item.productId);
      });
    });

    if (purchasedProductIds.size > 0) {
      const purchasedProducts = await ProductModel.findAll({
        where: { id: { [Op.in]: Array.from(purchasedProductIds) } },
        attributes: ['category', 'brand'],
        raw: true
      });
      purchasedProducts.forEach(p => {
        purchasedCategories.add(p.category);
        purchasedBrands.add(p.brand);
      });
    }

    // 2. Gather signals: viewing history
    const viewedIds = viewedIdsStr ? viewedIdsStr.split(',').filter(Boolean) : [];
    const viewedCategories = new Set<string>();
    const viewedBrands = new Set<string>();

    if (viewedIds.length > 0) {
      const viewedProducts = await ProductModel.findAll({
        where: { id: { [Op.in]: viewedIds } },
        attributes: ['category', 'brand'],
        raw: true
      });
      viewedProducts.forEach(p => {
        viewedCategories.add(p.category);
        viewedBrands.add(p.brand);
      });
    }

    // 3. Build a query to fetch candidates matching the user's categories or brands
    const candidateWhere: any = {
      id: { [Op.notIn]: Array.from(purchasedProductIds).concat(viewedIds) }
    };

    const orConditions: any[] = [];
    if (purchasedCategories.size > 0) orConditions.push({ category: { [Op.in]: Array.from(purchasedCategories) } });
    if (viewedCategories.size > 0) orConditions.push({ category: { [Op.in]: Array.from(viewedCategories) } });
    if (purchasedBrands.size > 0) orConditions.push({ brand: { [Op.in]: Array.from(purchasedBrands) } });
    if (viewedBrands.size > 0) orConditions.push({ brand: { [Op.in]: Array.from(viewedBrands) } });

    if (orConditions.length > 0) {
      candidateWhere[Op.or] = orConditions;
    }

    const candidateProducts = await ProductModel.findAll({
      where: candidateWhere,
      limit: 50 // cap selection for in-memory scoring
    });

    // Score candidates in memory
    const scoredProducts = candidateProducts.map(p => {
      let score = 0;
      if (purchasedCategories.has(p.category)) score += 5;
      if (viewedCategories.has(p.category)) score += 3;
      if (purchasedBrands.has(p.brand)) score += 4;
      if (viewedBrands.has(p.brand)) score += 2.5;
      if (p.trending) score += 2;
      score += p.rating / 2;
      return { product: p.get({ plain: true }), score };
    });

    scoredProducts.sort((a, b) => b.score - a.score);
    const recommendations = scoredProducts.slice(0, 10).map(sp => sp.score > 0 ? sp.product : null).filter((p): p is any => p !== null);

    // Fallback if not enough recommendations
    if (recommendations.length < 4) {
      const excludeIds = recommendations.map(r => r.id).concat(Array.from(purchasedProductIds));
      const fallback = await ProductModel.findAll({
        where: { id: { [Op.notIn]: excludeIds } },
        order: [
          ['trending', 'DESC'],
          ['rating', 'DESC']
        ],
        limit: 10 - recommendations.length
      });
      recommendations.push(...fallback.map(f => f.get({ plain: true })));
    }

    cache.set(cacheKey, recommendations, TTL.AI_PERSONALIZED);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ message: 'Server error generating personalized recommendations' });
  }
}

export async function getSimilarProducts(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cacheKey = `ai:similar:${id}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }
    const targetProduct = await ProductModel.findByPk(id);

    if (!targetProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Similar criteria: Same category and gender. Exclude target product.
    const similar = await ProductModel.findAll({
      where: {
        id: { [Op.ne]: id },
        category: targetProduct.category,
        gender: targetProduct.gender
      },
      limit: 12
    });

    // Score based on brand match and price proximity in-memory
    const scored = similar.map(p => {
      let score = 0;
      if (p.brand === targetProduct.brand) score += 3;
      
      const priceDiff = Math.abs(p.price - targetProduct.price) / targetProduct.price;
      score += Math.max(0, 5 - priceDiff * 5);
      score += p.rating;
      return { product: p.get({ plain: true }), score };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, 6).map(s => s.product);

    // Pad with products from the same gender if not enough
    if (results.length < 4) {
      const pad = await ProductModel.findAll({
        where: {
          id: { [Op.notIn]: [id, ...results.map(r => r.id)] },
          gender: targetProduct.gender
        },
        limit: 6 - results.length
      });
      results.push(...pad.map(p => p.get({ plain: true })));
    }

    cache.set(cacheKey, results, TTL.AI_SIMILAR);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(results);
  } catch (error) {
    console.error('Similar products error:', error);
    res.status(500).json({ message: 'Server error generating similar products' });
  }
}

export async function getFrequentlyBoughtTogether(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cacheKey = `ai:bundle:${id}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }
    const targetProduct = await ProductModel.findByPk(id);

    if (!targetProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Define rules for cross-sell recommendations
    let crossSellCategories: string[] = [];
    switch (targetProduct.category) {
      case 'Shirts':
      case 'Hoodies':
      case 'Blazers':
        crossSellCategories = ['Jeans', 'Pants'];
        break;
      case 'Jeans':
      case 'Pants':
        crossSellCategories = ['Shirts', 'Hoodies', 'Blazers'];
        break;
      case 'Sarees':
      case 'Lehengas':
      case 'Half Sarees':
      case 'Kurtis':
        crossSellCategories = ['Sarees', 'Lehengas', 'Half Sarees', 'Kurtis'];
        break;
      default:
        crossSellCategories = ['Shirts', 'Jeans', 'Kurtis'];
        break;
    }

    // Filter by cross-sell categories and same gender, sort by rating/trending
    const bundleItems = await ProductModel.findAll({
      where: {
        id: { [Op.ne]: id },
        gender: targetProduct.gender,
        category: { [Op.in]: crossSellCategories }
      },
      order: [
        ['trending', 'DESC'],
        ['rating', 'DESC']
      ],
      limit: 2
    });

    const result = bundleItems.map(p => p.get({ plain: true }));
    cache.set(cacheKey, result, TTL.AI_BUNDLE);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(result);
  } catch (error) {
    console.error('Frequently bought together error:', error);
    res.status(500).json({ message: 'Server error generating bundle items' });
  }
}

export async function getSmartSearchSuggestions(req: Request, res: Response) {
  try {
    const { q = '' } = req.query;
    const cacheKey = `ai:search:${q}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }
    const likeOp = isPostgres ? Op.iLike : Op.like;

    // Default trending searches if query is empty
    if (!q) {
      const trendingProducts = await ProductModel.findAll({
        where: { trending: true },
        limit: 5
      });
      
      const brandsRaw = await ProductModel.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']
        ],
        limit: 3,
        raw: true
      }) as any[];

      const trending = trendingProducts.map(p => p.title);
      const brands = brandsRaw.map(b => b.brand);

      const result = {
        suggestions: [...trending, ...brands],
        trendingSearches: ['Oxford Shirts', 'Cashmere Hoodie', 'Silk Saree', 'Velvet Lehenga', 'Selvedge Jeans']
      };
      cache.set(cacheKey, result, TTL.AI_SEARCH);
      res.setHeader('X-Cache', 'MISS');
      return res.status(200).json(result);
    }

    const searchVal = String(q).toLowerCase();
    const searchLike = `%${searchVal}%`;

    const products = await ProductModel.findAll({
      where: {
        [Op.or]: [
          { title: { [likeOp]: searchLike } },
          { brand: { [likeOp]: searchLike } },
          { category: { [likeOp]: searchLike } }
        ]
      },
      limit: 24,
      attributes: ['title', 'brand', 'category'],
      raw: true
    });

    const titleMatches = products
      .filter(p => p.title.toLowerCase().includes(searchVal))
      .map(p => p.title);

    const brandMatches = Array.from(new Set(products
      .filter(p => p.brand.toLowerCase().includes(searchVal))
      .map(p => p.brand)));

    const catMatches = Array.from(new Set(products
      .filter(p => p.category.toLowerCase().includes(searchVal))
      .map(p => p.category)));

    const allSuggestions = Array.from(new Set([...brandMatches, ...catMatches, ...titleMatches])).slice(0, 8);

    const result = {
      suggestions: allSuggestions,
      trendingSearches: ['Oxford Shirts', 'Cashmere Hoodie', 'Silk Saree', 'Velvet Lehenga', 'Selvedge Jeans']
    };
    cache.set(cacheKey, result, TTL.AI_SEARCH);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(result);
  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({ message: 'Server error generating search suggestions' });
  }
}
