
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import morgan from 'morgan';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import expressEjsLayouts from 'express-ejs-layouts';

import connectDB from './config/database.js';
import { checkUserAuthenticated } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import supportRoutes from './routes/support.js';
import knowledgeRoutes from './routes/knowledge.js';
import inventoryRoutes from './routes/inventory.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';
import profileRoutes from './routes/profile.js';
import cartRoutes from './routes/cart.js'; // Import cart routes

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get current file path (__dirname equivalent in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Flash messages
app.use(flash());

// EJS setup
app.use(expressEjsLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layouts/main');

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  if (typeof res.locals.title === 'undefined') {
    res.locals.title = 'Dern-Support';
  }
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', checkUserAuthenticated, dashboardRoutes);
app.use('/support', checkUserAuthenticated, supportRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/inventory', checkUserAuthenticated, inventoryRoutes);
app.use('/admin', checkUserAuthenticated, adminRoutes);
app.use('/feedback', checkUserAuthenticated, feedbackRoutes);
app.use('/profile', checkUserAuthenticated, profileRoutes);
app.use('/cart', checkUserAuthenticated, cartRoutes); // Register cart routes

// 404 Route
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: 'Server Error',
    message: 'Something went wrong on the server.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});