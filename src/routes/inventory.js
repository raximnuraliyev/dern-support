import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import { checkAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../public/uploads/inventory');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// View all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await InventoryItem.find({}).sort({ name: 1 });
    
    res.render('pages/inventory-list', {
      title: 'Inventory Management',
      items
    });
  } catch (error) {
    console.error('Inventory list error:', error);
    req.flash('error', 'Error loading inventory');
    res.redirect('/dashboard');
  }
});

// View specific inventory item
router.get('/item/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/inventory');
    }

    res.render('pages/inventory-details', {
      title: item.name,
      item
    });
  } catch (error) {
    console.error('Inventory item error:', error);
    req.flash('error', 'Error loading inventory item');
    res.redirect('/inventory');
  }
});

// Admin: New inventory item form
router.get('/new', checkAdmin, (req, res) => {
  res.render('pages/inventory-new', {
    title: 'Add Inventory Item'
  });
});

// Admin: Create new inventory item
router.post('/new', checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, category, quantity, price } = req.body;

    // Validation
    if (!name || !description || !category || !quantity || price === undefined) {
      req.flash('error', 'Please provide all required information');
      return res.redirect('/inventory/new');
    }

    // Create new inventory item
    const item = new InventoryItem({
      name,
      description,
      category,
      quantity,
      price,
      imageUrl: req.file ? `/uploads/inventory/${req.file.filename}` : '/images/default-item.png',
    });

    await item.save();

    req.flash('success', 'Inventory item added successfully');
    res.redirect('/inventory');
  } catch (error) {
    console.error('Add inventory error:', error);
    req.flash('error', 'Error adding inventory item');
    res.redirect('/inventory/new');
  }
});

// Admin: Edit inventory item form
router.get('/edit/:id', checkAdmin, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/inventory');
    }

    res.render('pages/inventory-edit', {
      title: `Edit: ${item.name}`,
      item
    });
  } catch (error) {
    console.error('Edit inventory error:', error);
    req.flash('error', 'Error loading inventory item');
    res.redirect('/inventory');
  }
});

// Admin: Update inventory item
router.post('/edit/:id', checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, category, quantity, price } = req.body;

    // Validation
    if (!name || !description || !category || !quantity || price === undefined) {
      req.flash('error', 'Please provide all required information');
      return res.redirect(`/inventory/edit/${req.params.id}`);
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/inventory');
    }

    // Update fields
    item.name = name;
    item.description = description;
    item.category = category;
    item.quantity = quantity;
    item.price = price;
    item.lastRestocked = new Date();

    if (req.file) {
      item.imageUrl = `/uploads/inventory/${req.file.filename}`;
    }

    await item.save();

    req.flash('success', 'Inventory item updated successfully');
    res.redirect(`/inventory/item/${item._id}`);
  } catch (error) {
    console.error('Update inventory error:', error);
    req.flash('error', 'Error updating inventory item');
    res.redirect(`/inventory/edit/${req.params.id}`);
  }
});

// Admin: Delete inventory item
router.delete('/item/:id', checkAdmin, async (req, res) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'Inventory item deleted successfully');
    res.redirect('/inventory');
  } catch (error) {
    console.error('Delete inventory error:', error);
    req.flash('error', 'Error deleting inventory item');
    res.redirect('/inventory');
  }
});

export default router;