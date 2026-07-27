import { Response } from 'express';
import { Op } from 'sequelize';
import { 
  Cart as CartModel, 
  Wishlist as WishlistModel, 
  Product as ProductModel 
} from '../db/models';
import { AuthenticatedRequest } from '../middleware/auth';

// --- CART CONTROLLER ---

export async function getCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let userCart = await CartModel.findByPk(userId);
    if (!userCart) {
      userCart = await CartModel.create({ userId, items: [] });
    }

    const items = userCart.items || [];
    const productIds = items.map((item: any) => item.productId);

    // Fetch products in one batch query
    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    const detailedItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product ? {
          id: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: product.stock,
          category: product.category
        } : null
      };
    }).filter((item: any) => item.product !== null);

    res.status(200).json({ items: detailedItems });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
}

export async function updateCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid cart payload' });
    }

    const validatedItems = items.map(item => ({
      productId: String(item.productId),
      size: String(item.size),
      color: String(item.color),
      quantity: Math.max(1, Number(item.quantity))
    }));

    await CartModel.upsert({
      userId,
      items: validatedItems
    });
    
    // Fetch products in one batch query to return detailed cart items
    const productIds = validatedItems.map(item => item.productId);
    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    const detailedItems = validatedItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product ? {
          id: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: product.stock,
          category: product.category
        } : null
      };
    }).filter(item => item.product !== null);

    res.status(200).json({ items: detailedItems });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
}

// --- WISHLIST CONTROLLER ---

export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let userWishlist = await WishlistModel.findByPk(userId);
    if (!userWishlist) {
      userWishlist = await WishlistModel.create({ userId, productIds: [] });
    }

    const productIds = userWishlist.productIds || [];
    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    res.status(200).json({ products: products.map(p => p.get({ plain: true })) });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error fetching wishlist' });
  }
}

export async function toggleWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    let userWishlist = await WishlistModel.findByPk(userId);
    let productIds: string[] = [];

    if (!userWishlist) {
      productIds = [productId];
      await WishlistModel.create({ userId, productIds });
    } else {
      productIds = userWishlist.productIds || [];
      const index = productIds.indexOf(productId);
      if (index === -1) {
        productIds.push(productId);
      } else {
        productIds.splice(index, 1);
      }
      await WishlistModel.update(
        { productIds },
        { where: { userId } }
      );
    }
    
    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    res.status(200).json({ products: products.map(p => p.get({ plain: true })) });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Server error toggling wishlist' });
  }
}
