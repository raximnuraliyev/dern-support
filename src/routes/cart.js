// src/routes/cart.js
import express from 'express';
import InventoryItem from '../models/InventoryItem.js';

const router = express.Router();

// Middleware to ensure cart exists in session
function ensureCart(req, res, next) {
  if (!req.session.cart) req.session.cart = [];
  next();
}

// Add item to cart
router.post('/add', ensureCart, async (req, res) => {
  const { itemId, quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const item = await InventoryItem.findById(itemId);
  if (!item || item.quantity < qty) {
    req.flash('error', 'Not enough stock or item not found.');
    return res.redirect(`/inventory/item/${itemId}`);
  }
  // Check if already in cart
  const existing = req.session.cart.find(i => i.itemId === itemId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, item.quantity);
  } else {
    req.session.cart.push({
      itemId,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price || 0,
      quantity: qty,
      max: item.quantity
    });
  }
  req.flash('success', 'Added to cart!');
  res.redirect(`/inventory/item/${itemId}`);
});

// View cart
router.get('/', ensureCart, (req, res) => {
  res.render('pages/cart', { cart: req.session.cart || [] });
});

// Update cart item quantity
router.post('/update', ensureCart, (req, res) => {
  const { itemId, quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const item = req.session.cart.find(i => i.itemId === itemId);
  if (item) item.quantity = qty;
  res.redirect('/cart');
});

// Remove item from cart
router.post('/remove', ensureCart, (req, res) => {
  req.session.cart = req.session.cart.filter(i => i.itemId !== req.body.itemId);
  res.redirect('/cart');
});

export default router;
