import express from 'express';
import Order from '../models/Order.js';
import InventoryItem from '../models/InventoryItem.js';
import { checkUserAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// User: List their orders
router.get('/', checkUserAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .populate('items.item')
      .sort({ createdAt: -1 });

    res.render('pages/orders', {
      title: 'My Orders',
      orders
    });
  } catch (error) {
    console.error('Orders error:', error);
    req.flash('error', 'Error loading orders');
    res.redirect('/dashboard');
  }
});

// Create new order from cart
router.post('/new', checkUserAuthenticated, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) {
      req.flash('error', 'Your cart is empty.');
      return res.redirect('/cart');
    }
    // Validate and fetch inventory
    let totalAmount = 0;
    const orderItems = [];
    for (const cartItem of cart) {
      const inventoryItem = await InventoryItem.findById(cartItem.itemId);
      if (!inventoryItem || inventoryItem.quantity < cartItem.quantity) {
        req.flash('error', `Insufficient stock for ${inventoryItem ? inventoryItem.name : 'item'}`);
        return res.redirect('/cart');
      }
      orderItems.push({
        item: inventoryItem._id,
        quantity: cartItem.quantity,
        price: inventoryItem.price || 0
      });
      totalAmount += (inventoryItem.price || 0) * cartItem.quantity;
      // Update inventory
      inventoryItem.quantity -= cartItem.quantity;
      await inventoryItem.save();
    }
    // Parse shipping address and business info from flat req.body
    const shippingAddress = {
      street: req.body['shippingAddress[street]'],
      city: req.body['shippingAddress[city]'],
      state: req.body['shippingAddress[state]'],
      zipCode: req.body['shippingAddress[zipCode]'],
      country: req.body['shippingAddress[country]']
    };
    let businessInfo;
    if (req.session.user.accountType === 'Business') {
      businessInfo = {
        companyName: req.body['businessInfo[companyName]'],
        department: req.body['businessInfo[department]'],
        contactPerson: req.body['businessInfo[contactPerson]'],
        purchaseOrderNumber: req.body['businessInfo[purchaseOrderNumber]']
      };
    }
    const order = new Order({
      user: req.session.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      businessInfo: businessInfo || undefined
    });
    await order.save();
    req.session.cart = [];
    req.flash('success', 'Order placed successfully');
    res.redirect('/orders');
  } catch (error) {
    console.error('Create order from cart error:', error);
    req.flash('error', 'Error creating order');
    res.redirect('/cart');
  }
});

// User: Order details
router.get('/:id', checkUserAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user.id
    }).populate('items.item');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/orders');
    }

    res.render('pages/order-details', {
      title: 'Order Details',
      order
    });
  } catch (error) {
    console.error('Order details error:', error);
    req.flash('error', 'Error loading order details');
    res.redirect('/orders');
  }
});

// Admin: All orders
router.get('/admin/all', isAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user').populate('items.item');
  res.render('pages/admin/orders', { orders });
});

// Admin: Update order status/payment
router.post('/:id/status', isAdmin, async (req, res) => {
  const { status, paymentStatus } = req.body;
  await Order.findByIdAndUpdate(req.params.id, { status, paymentStatus });
  res.redirect('/admin/orders');
});

export default router;