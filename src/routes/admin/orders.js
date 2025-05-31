import express from 'express';
import Order from '../../models/Order.js';
import { checkAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Admin: View all orders
router.get('/', checkAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email accountType')
      .populate('items.item')
      .sort({ createdAt: -1 });

    res.render('pages/admin/orders', {
      title: 'Order Management',
      orders
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    req.flash('error', 'Error loading orders');
    res.redirect('/admin/dashboard');
  }
});

// Admin: Update order status
router.post('/:id/update', checkAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    order.status = status || order.status;
    order.paymentStatus = paymentStatus || order.paymentStatus;
    await order.save();

    req.flash('success', 'Order updated successfully');
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Update order error:', error);
    req.flash('error', 'Error updating order');
    res.redirect('/admin/orders');
  }
});

export default router;