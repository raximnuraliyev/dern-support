import express from 'express';
import User from '../models/User.js';
import { checkUserNotAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('pages/index', { title: 'Welcome to Dern-Support', layout: 'layouts/home' });
});

// Login page
router.get('/login', checkUserNotAuthenticated, (req, res) => {
  res.render('pages/login', { title: 'Login' });
});

// Login process
router.post('/login', checkUserNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      req.flash('error', 'Please provide an email and password');
      return res.redirect('/login');
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Set user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      isAdmin: user.isAdmin,
    };

    req.flash('success', 'You are now logged in');
    
    // Redirect based on user role
    if (user.isAdmin) {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
});

// Register page
router.get('/register', checkUserNotAuthenticated, (req, res) => {
  res.render('pages/register', { title: 'Register' });
});

// Register process
router.post('/register', checkUserNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, accountType } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      req.flash('error', 'Please fill in all fields');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email is already registered');
      return res.redirect('/register');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      accountType: accountType || 'Individual',
      isAdmin: false, // Default to regular user
    });

    await user.save();

    req.flash('success', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'An error occurred during registration');
    res.redirect('/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/login');
  });
});

export default router;