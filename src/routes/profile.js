import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// View profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/dashboard');
    }

    res.render('pages/profile', {
      title: 'My Profile',
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    req.flash('error', 'Error loading profile');
    res.redirect('/dashboard');
  }
});

// Update profile
router.post('/', async (req, res) => {
  try {
    const { name, email, accountType } = req.body;
    
    // Validation
    if (!name || !email) {
      req.flash('error', 'Please provide all required information');
      return res.redirect('/profile');
    }

    const user = await User.findById(req.session.user.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/dashboard');
    }

    // Check if email is being changed and already exists
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error', 'Email is already in use');
        return res.redirect('/profile');
      }
    }

    // Update fields
    user.name = name;
    user.email = email;
    if (!user.isAdmin) {
      user.accountType = accountType || user.accountType;
    }

    await user.save();

    // Update session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      isAdmin: user.isAdmin,
    };

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error', 'Error updating profile');
    res.redirect('/profile');
  }
});

// Change password form
router.get('/change-password', (req, res) => {
  res.render('pages/change-password', {
    title: 'Change Password'
  });
});

// Change password process
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'Please provide all required information');
      return res.redirect('/profile/change-password');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/profile/change-password');
    }

    if (newPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/profile/change-password');
    }

    const user = await User.findById(req.session.user.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/dashboard');
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/profile/change-password');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Password change error:', error);
    req.flash('error', 'Error changing password');
    res.redirect('/profile/change-password');
  }
});

export default router;