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

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

    if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid order parameters: addressId, paymentMethod, and non-empty items are required.' });
    }

    // Verify address exists and belongs to user
    const address = await AddressModel.findOne({ where: { id: addressId, userId } });
    if (!address) {
      return res.status(400).json({ message: 'Delivery address not found or does not belong to you.' });
    }

    const orderId = `ORD_${Date.now()}`;
    let authoritativeOrder: any = null;

    // Execute checkout inside database transaction for consistent state
    await sequelize.transaction(async (t) => {
      let authoritativeSubtotal = 0;
      const verifiedItems: any[] = [];

      // 1. Verify products, lock rows, calculate server-authoritative prices, and deduct stock
      for (const item of items) {
        const qty = parseInt(String(item.quantity), 10);
        if (isNaN(qty) || qty < 1) {
          throw new Error(`Invalid quantity ${item.quantity} for product ${item.title || item.productId}. Quantity must be at least 1.`);
        }

        const product = await ProductModel.findByPk(item.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!product) {
          throw new Error(`Product ${item.title || item.productId} not found in inventory.`);
        }
        
        const isPaused = Boolean(product.get('paused') ?? product.getDataValue('paused'));
        if (isPaused) {
          throw new Error(`Product "${product.get('title') || item.productId}" is currently unavailable for purchase.`);
        }

        const currentStock = Number(product.get('stock') ?? product.getDataValue('stock') ?? 0);
        if (currentStock < qty) {
          throw new Error(`Insufficient stock for product "${product.get('title') || item.productId}". Only ${currentStock} available.`);
        }

        // Authoritative server-side price calculation (never trust client-provided item.price)
        const basePrice = Number(product.get('price') ?? product.getDataValue('price') ?? 0);
        const discountPercent = Number(product.get('discount') ?? product.getDataValue('discount') ?? 0);
        const effectiveUnitPrice = Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)));
        const itemTotal = effectiveUnitPrice * qty;
        authoritativeSubtotal += itemTotal;

        const productTitle = String(product.get('title') ?? product.getDataValue('title') ?? 'Fashion Item');
        const productBrand = String(product.get('brand') ?? product.getDataValue('brand') ?? '');
        const productImages = product.get('images') ?? product.getDataValue('images');

        verifiedItems.push({
          productId: product.id,
          title: productTitle,
          brand: productBrand,
          price: basePrice,
          effectivePrice: effectiveUnitPrice,
          discount: discountPercent,
          quantity: qty,
          size: String(item.size || 'Standard'),
          color: String(item.color || 'Standard'),
          image: Array.isArray(productImages) && productImages.length > 0 ? productImages[0] : (item.image || '')
        });

        // Decrement stock in-db
        await product.decrement('stock', { by: qty, transaction: t });
        const updatedStock = currentStock - qty;

        // 2. Real-time Stock notifications (safe check for brand)
        try {
          if (productBrand) {
            const boutiqueUser = await UserModel.findOne({
              where: { name: productBrand, role: 'boutique' },
              transaction: t
            });
            
            if (boutiqueUser && boutiqueUser.id) {
              if (updatedStock === 0) {
                await NotificationModel.create({
                  id: `notif_st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  userId: boutiqueUser.id,
                  type: 'inventory',
                  title: 'Out of Stock Alert',
                  message: `Your style "${productTitle}" is now out of stock!`,
                  read: false
                }, { transaction: t });
              } else if (updatedStock <= 3) {
                await NotificationModel.create({
                  id: `notif_st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  userId: boutiqueUser.id,
                  type: 'inventory',
                  title: 'Low Stock Alert',
                  message: `Your style "${productTitle}" has only ${updatedStock} units remaining.`,
                  read: false
                }, { transaction: t });
              }
            }
          }
        } catch (stErr) {
          console.error('Failed to trigger stock alert:', stErr);
        }
      }

      // 3. Authoritative Coupon Verification & Discount Calculation
      let couponDiscount = 0;
      let appliedCouponCode: string | null = null;
      if (couponCode && String(couponCode).trim()) {
        const cleanCode = String(couponCode).trim().toUpperCase();
        const coupon = await CouponModel.findOne({
          where: { code: cleanCode },
          transaction: t
        });

        if (coupon) {
          const now = new Date();
          const expiryDate = new Date(coupon.expiryDate);
          const isNotExpired = isNaN(expiryDate.getTime()) || expiryDate >= now;
          const meetsMinOrder = authoritativeSubtotal >= (coupon.minOrderAmount || 0);

          if (isNotExpired && meetsMinOrder) {
            couponDiscount = Math.round(authoritativeSubtotal * (Number(coupon.discountPercent) / 100));
            if (coupon.maxDiscount && couponDiscount > Number(coupon.maxDiscount)) {
              couponDiscount = Number(coupon.maxDiscount);
            }
            appliedCouponCode = coupon.code;
          }
        }
      }

      // 4. Authoritative Shipping and Final Payable Total
      const shippingFee = authoritativeSubtotal >= 999 ? 0 : 99;
      const authoritativeTotal = Math.max(0, authoritativeSubtotal - couponDiscount + shippingFee);

      const authoritativeSummary = {
        subtotal: authoritativeSubtotal,
        discount: couponDiscount,
        shippingFee,
        total: authoritativeTotal,
        couponApplied: appliedCouponCode,
        computedAt: new Date().toISOString()
      };

      const newOrderData = {
        id: orderId,
        userId,
        addressId,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Success',
        orderStatus: 'Placed' as const,
        items: verifiedItems,
        summary: authoritativeSummary,
        createdAt: new Date().toISOString()
      };

      // 5. Create Order with authoritative amounts
      const createdOrder = await OrderModel.create(newOrderData, { transaction: t });
      authoritativeOrder = createdOrder.get({ plain: true });

      // 6. Dispatch Boutique New Order Notifications
      try {
        const boutiqueUsers = await UserModel.findAll({
          where: { role: 'boutique' },
          transaction: t
        });

        for (const boutique of boutiqueUsers) {
          const bId = boutique.getDataValue('id') ?? boutique.get('id');
          if (!bId) continue;

          await NotificationModel.create({
            id: `notif_ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: bId,
            type: 'order',
            title: 'New Order Received',
            message: `Order #${orderId} for a total of Rs. ${authoritativeTotal} was placed by a customer.`,
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
      order: authoritativeOrder
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
    
    // Issue 6 Fix: Generate HTML printable invoice with escaped user input fields
    const htmlInvoice = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${escapeHtml(order.id)}</title>
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
            <div>Order ID: ${escapeHtml(order.id)}</div>
          </div>
          <div style="text-align: right;">
            <strong>INVOICE</strong><br>
            Date: ${escapeHtml(new Date(order.createdAt).toLocaleDateString())}<br>
            Payment: ${escapeHtml(order.paymentMethod)} (${escapeHtml(order.paymentStatus)})
          </div>
        </div>
        <div class="info">
          <div class="info-block">
            <h3>Billed To:</h3>
            <strong>${escapeHtml(address?.name || 'Customer')}</strong><br>
            ${escapeHtml(address?.street || '')},<br>
            ${escapeHtml(address?.city || '')}, ${escapeHtml(address?.state || '')} - ${escapeHtml(address?.pincode || '')}<br>
            Phone: ${escapeHtml(address?.phone || '')}
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
                <td><strong>${escapeHtml(item.brand)}</strong> - ${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.size)}</td>
                <td>${escapeHtml(item.color)}</td>
                <td style="text-align: right;">Rs. ${Number(item.price)}</td>
                <td style="text-align: right;">${Number(item.quantity)}</td>
                <td style="text-align: right;">Rs. ${Number(item.price) * Number(item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">Rs. ${Number(order.summary.subtotal)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right; color: green;">- Rs. ${Number(order.summary.discount)}</td>
            </tr>
            <tr>
              <td>Tax:</td>
              <td style="text-align: right;">Rs. ${Number(order.summary.tax)}</td>
            </tr>
            <tr>
              <td>Shipping:</td>
              <td style="text-align: right;">${order.summary.shipping === 0 ? 'FREE' : `Rs. ${Number(order.summary.shipping)}`}</td>
            </tr>
            <tr class="total">
              <td>Total Amount:</td>
              <td style="text-align: right;">Rs. ${Number(order.summary.total)}</td>
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
