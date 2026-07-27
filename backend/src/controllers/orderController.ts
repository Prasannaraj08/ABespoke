import { Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db/database';
import { 
  Address as AddressModel, 
  Order as OrderModel, 
  Coupon as CouponModel, 
  Product as ProductModel, 
  User as UserModel, 
  Notification as NotificationModel, 
  Cart as CartModel 
} from '../db/models';
import { AuthenticatedRequest } from '../middleware/auth';

// --- ADDRESS CRUDS ---

export async function getAddresses(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const addresses = await AddressModel.findAll({ where: { userId } });
    res.status(200).json(addresses.map(a => a.get({ plain: true })));
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error fetching addresses' });
  }
}

export async function addAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone, street, city, state, pincode, isDefault } = req.body;
    if (!name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const newAddress = await sequelize.transaction(async (t) => {
      // If setting as default, unset other defaults
      if (isDefault) {
        await AddressModel.update({ isDefault: false }, { where: { userId }, transaction: t });
      }

      const existingCount = await AddressModel.count({ where: { userId }, transaction: t });
      const finalDefault = isDefault || existingCount === 0;

      return await AddressModel.create({
        id: `addr_${Date.now()}`,
        userId,
        name,
        phone,
        street,
        city,
        state,
        pincode,
        isDefault: finalDefault
      }, { transaction: t });
    });

    res.status(201).json(newAddress.get({ plain: true }));
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error adding address' });
  }
}

export async function updateAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone, street, city, state, pincode, isDefault } = req.body;

    const updated = await sequelize.transaction(async (t) => {
      const address = await AddressModel.findOne({ where: { id, userId }, transaction: t });
      if (!address) return null;

      if (isDefault) {
        await AddressModel.update({ isDefault: false }, { where: { userId, id: { [Op.ne]: id } }, transaction: t });
      }

      await address.update({
        name: name || address.name,
        phone: phone || address.phone,
        street: street || address.street,
        city: city || address.city,
        state: state || address.state,
        pincode: pincode || address.pincode,
        isDefault: isDefault !== undefined ? !!isDefault : address.isDefault
      }, { transaction: t });

      return address;
    });

    if (!updated) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json(updated.get({ plain: true }));
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error updating address' });
  }
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const deleted = await sequelize.transaction(async (t) => {
      const toDelete = await AddressModel.findOne({ where: { id, userId }, transaction: t });
      if (!toDelete) return false;

      const wasDefault = toDelete.isDefault;
      await toDelete.destroy({ transaction: t });

      // If we deleted the default one, set the next available one as default
      if (wasDefault) {
        const nextAddress = await AddressModel.findOne({ where: { userId }, transaction: t });
        if (nextAddress) {
          await nextAddress.update({ isDefault: true }, { transaction: t });
        }
      }
      return true;
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error deleting address' });
  }
}

// --- COUPON SYSTEM ---

export async function applyCoupon(req: AuthenticatedRequest, res: Response) {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal === undefined) {
      return res.status(400).json({ message: 'Coupon code and subtotal are required' });
    }

    const coupon = await CouponModel.findByPk(code.toUpperCase());
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    // Check expiry
    const expiryDate = new Date(coupon.expiryDate);
    const currentDate = new Date();
    if (currentDate > expiryDate) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Check min order amount
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount to apply this coupon is Rs. ${coupon.minOrderAmount}`
      });
    }

    // Calculate discount
    let discount = Math.round(subtotal * (coupon.discountPercent / 100));
    if (discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    res.status(200).json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: discount
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Server error applying coupon' });
  }
}

// --- ORDER SYSTEM ---

export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'))));
    const { count, rows: orders } = await OrderModel.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: ['id', 'userId', 'addressId', 'paymentMethod', 'paymentStatus', 'orderStatus', 'items', 'summary', 'createdAt'],
    });
    return res.status(200).json({
      orders: orders.map(o => o.get({ plain: true })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const order = await OrderModel.findByPk(id);
    if (!order || (order.userId !== userId && req.user?.role !== 'admin')) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const address = await AddressModel.findByPk(order.addressId);

    res.status(200).json({
      order: order.get({ plain: true }),
      address: address ? address.get({ plain: true }) : null
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ message: 'Server error fetching order details' });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      addressId,
      paymentMethod,
      items,
      couponCode,
      summary
    } = req.body;

    if (!addressId || !paymentMethod || !items || !items.length || !summary) {
      return res.status(400).json({ message: 'Missing order parameters' });
    }

    const orderId = `ORD_${Date.now()}`;
    const newOrder = {
      id: orderId,
      userId,
      addressId,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Success',
      orderStatus: 'Placed' as const,
      items,
      summary,
      createdAt: new Date().toISOString()
    };

    // Execute checkout inside database transaction for consistent state
    await sequelize.transaction(async (t) => {
      // 1. Verify and deduct stock
      for (const item of items) {
        const product = await ProductModel.findByPk(item.productId, { transaction: t });
        if (!product) {
          throw new Error(`Product ${item.title} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.title}`);
        }

        // Decrement stock in-db
        await product.decrement('stock', { by: item.quantity, transaction: t });
        const updatedStock = product.stock - item.quantity;

        // 2. Real-time Stock notifications (asynchronous but inside transactional context for consistency)
        try {
          const brandName = product.brand;
          const boutiqueUser = await UserModel.findOne({
            where: { name: brandName, role: 'boutique' },
            transaction: t
          });
          
          if (boutiqueUser) {
            if (updatedStock === 0) {
              await NotificationModel.create({
                id: `notif_st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                userId: boutiqueUser.id,
                type: 'inventory',
                title: 'Out of Stock Alert',
                message: `Your style "${product.title}" is now out of stock!`,
                read: false
              }, { transaction: t });
            } else if (updatedStock <= 3) {
              await NotificationModel.create({
                id: `notif_st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                userId: boutiqueUser.id,
                type: 'inventory',
                title: 'Low Stock Alert',
                message: `Your style "${product.title}" has only ${updatedStock} units remaining.`,
                read: false
              }, { transaction: t });
            }
          }
        } catch (stErr) {
          console.error('Failed to trigger stock alert:', stErr);
        }
      }

      // 3. Create Order
      await OrderModel.create(newOrder, { transaction: t });

      // 4. Dispatch Boutique New Order Notifications
      try {
        const boutiqueUsers = await UserModel.findAll({
          where: { role: 'boutique' },
          transaction: t
        });

        for (const boutique of boutiqueUsers) {
          await NotificationModel.create({
            id: `notif_ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: boutique.id,
            type: 'order',
            title: 'New Order Received',
            message: `Order #${orderId} for a total of Rs. ${summary.total} was placed by a customer.`,
            read: false
          }, { transaction: t });
        }
      } catch (nErr) {
        console.error('Failed to dispatch boutique order notifications:', nErr);
      }

      // 5. Clear cart
      await CartModel.update(
        { items: [] },
        { where: { userId }, transaction: t }
      );
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message || 'Server error creating order' });
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Placed':          ['Shipped', 'Cancelled'],
  'Shipped':         ['Out for Delivery', 'Cancelled'],
  'Out for Delivery':['Delivered'],
  'Delivered':       [],
  'Cancelled':       [],
};

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Order status required' });
    }

    const order = await OrderModel.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowedNext = VALID_TRANSITIONS[order.orderStatus] || [];
    if (!allowedNext.includes(status) && req.user?.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.orderStatus}' to '${status}'`,
        errorCode: 4001,
      });
    }

    const updates: any = { orderStatus: status };
    if (status === 'Delivered') {
      updates.paymentStatus = 'Success';
    }

    await order.update(updates);
    res.status(200).json(order.get({ plain: true }));
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
}

export async function downloadInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await OrderModel.findByPk(id);
    if (!order || (order.userId !== req.user?.id && req.user?.role !== 'admin')) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const address = await AddressModel.findByPk(order.addressId);
    
    // Generate clean HTML printable invoice
    const htmlInvoice = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { width: 45%; }
          .info-block h3 { margin-top: 0; color: #777; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9f9f9; text-align: left; padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .summary { display: flex; justify-content: flex-end; }
          .summary-table { width: 300px; }
          .summary-table td { border: none; padding: 6px 12px; }
          .summary-table .total { font-size: 18px; font-weight: bold; border-top: 1px solid #eee; padding-top: 12px; }
          .footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ABespoke</div>
            <div>Order ID: ${order.id}</div>
          </div>
          <div style="text-align: right;">
            <strong>INVOICE</strong><br>
            Date: ${new Date(order.createdAt).toLocaleDateString()}<br>
            Payment: ${order.paymentMethod} (${order.paymentStatus})
          </div>
        </div>
        <div class="info">
          <div class="info-block">
            <h3>Billed To:</h3>
            <strong>${address?.name || 'Customer'}</strong><br>
            ${address?.street || ''},<br>
            ${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}<br>
            Phone: ${address?.phone || ''}
          </div>
          <div class="info-block" style="text-align: right;">
            <h3>Shipped From:</h3>
            <strong>ABespoke Warehouses</strong><br>
            Industrial Phase 2, Sector 54,<br>
            New Delhi, Delhi - 110001<br>
            support@abespoke.com
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Details</th>
              <th>Size</th>
              <th>Color</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td><strong>${item.brand}</strong> - ${item.title}</td>
                <td>${item.size}</td>
                <td>${item.color}</td>
                <td style="text-align: right;">Rs. ${item.price}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">Rs. ${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">Rs. ${order.summary.subtotal}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right; color: green;">- Rs. ${order.summary.discount}</td>
            </tr>
            <tr>
              <td>Tax:</td>
              <td style="text-align: right;">Rs. ${order.summary.tax}</td>
            </tr>
            <tr>
              <td>Shipping:</td>
              <td style="text-align: right;">${order.summary.shipping === 0 ? 'FREE' : `Rs. ${order.summary.shipping}`}</td>
            </tr>
            <tr class="total">
              <td>Total Amount:</td>
              <td style="text-align: right;">Rs. ${order.summary.total}</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          Thank you for shopping with ABespoke! This is a computer-generated invoice.
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlInvoice);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ message: 'Server error generating invoice' });
  }
}
