import express from 'express';
import { checkAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import SupportRequest from '../models/SupportRequest.js';
import Feedback from '../models/Feedback.js';
import InventoryItem from '../models/InventoryItem.js';

const router = express.Router();

// Apply admin check to all routes in this router
router.use(checkAdmin);

// Admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts for dashboard
    const userCount = await User.countDocuments();
    const pendingSupport = await SupportRequest.countDocuments({ status: 'Pending' });
    const inProgressSupport = await SupportRequest.countDocuments({ status: 'In Progress' });
    const resolvedSupport = await SupportRequest.countDocuments({ status: 'Resolved' });
    const feedbackCount = await Feedback.countDocuments();
    const lowStockItems = await InventoryItem.countDocuments({ quantity: { $lt: 5 } });

    // Get recent support requests
    const recentRequests = await SupportRequest.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    // Get recent feedback
    const recentFeedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('user', 'name email');

    res.render('pages/admin-dashboard', {
      title: 'Admin Dashboard',
      stats: {
        userCount,
        pendingSupport,
        inProgressSupport,
        resolvedSupport,
        feedbackCount,
        lowStockItems,
      },
      recentRequests,
      recentFeedback,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Error loading admin dashboard');
    res.redirect('/dashboard');
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    res.render('pages/admin-users', {
      title: 'User Management',
      users
    });
  } catch (error) {
    console.error('Admin users error:', error);
    req.flash('error', 'Error loading users');
    res.redirect('/admin/dashboard');
  }
});

// View specific user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Get user's support requests
    const supportRequests = await SupportRequest.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.render('pages/admin-user-details', {
      title: `User: ${user.name}`,
      user,
      supportRequests
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    req.flash('error', 'Error loading user details');
    res.redirect('/admin/users');
  }
});

// Update user (PUT)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, accountType, status } = req.body;
    await User.findByIdAndUpdate(
      req.params.id,
      { name, email, accountType, status },
      { new: true, runValidators: true }
    );
    req.flash('success', 'User updated successfully');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (error) {
    console.error('Update user error:', error);
    req.flash('error', 'Error updating user');
    res.redirect(`/admin/users/${req.params.id}`);
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    req.flash('error', 'Error deleting user');
    res.redirect('/admin/users');
  }
});

// Reset user password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect(`/admin/users/${req.params.id}`);
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    user.password = password;
    await user.save();
    req.flash('success', 'Password reset successfully');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'Error resetting password');
    res.redirect(`/admin/users/${req.params.id}`);
  }
});

// Change user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      req.flash('error', 'Invalid status');
      return res.redirect(`/admin/users/${req.params.id}`);
    }
    await User.findByIdAndUpdate(req.params.id, { status });
    req.flash('success', 'User status updated');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (error) {
    console.error('Change status error:', error);
    req.flash('error', 'Error updating status');
    res.redirect(`/admin/users/${req.params.id}`);
  }
});

// Impersonate user (sets session, then redirects to dashboard as that user)
router.get('/users/:id/impersonate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    req.session.userId = user._id;
    req.session.isImpersonating = true;
    req.flash('success', `Now impersonating ${user.name}`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Impersonate user error:', error);
    req.flash('error', 'Error impersonating user');
    res.redirect('/admin/users');
  }
});

// View all feedback
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    res.render('pages/admin-feedback', {
      title: 'Feedback Management',
      feedback
    });
  } catch (error) {
    console.error('Admin feedback error:', error);
    req.flash('error', 'Error loading feedback');
    res.redirect('/admin/dashboard');
  }
});

// Delete feedback
router.delete('/feedback/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'Feedback deleted successfully');
    res.redirect('/admin/feedback');
  } catch (error) {
    console.error('Delete feedback error:', error);
    req.flash('error', 'Error deleting feedback');
    res.redirect('/admin/feedback');
  }
});

// Analytics page
router.get('/analytics', async (req, res) => {
  try {
    // Get support request statistics
    const totalRequests = await SupportRequest.countDocuments();
    const statusCounts = [
      await SupportRequest.countDocuments({ status: 'Pending' }),
      await SupportRequest.countDocuments({ status: 'In Progress' }),
      await SupportRequest.countDocuments({ status: 'Resolved' }),
      await SupportRequest.countDocuments({ status: 'Cancelled' })
    ];

    // Get device type breakdown
    const deviceTypes = await SupportRequest.aggregate([
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly request counts for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyData = await SupportRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // --- New analytics for advanced dashboard ---
    // Average job completion time (in hours)
    const completedJobs = await SupportRequest.find({ status: 'Resolved', completedAt: { $exists: true } }, 'createdAt completedAt');
    let avgCompletionTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => sum + ((job.completedAt - job.createdAt) / 36e5), 0); // ms to hours
      avgCompletionTime = (totalTime / completedJobs.length).toFixed(2);
    }

    // Customer satisfaction (example: from Feedback model, assuming rating 4-5 is satisfied)
    // Ensure satisfactionData has a fallback if no feedback exists
    const satisfied = await Feedback.countDocuments({ rating: { $gte: 4 } }) || 0;
    const unsatisfied = await Feedback.countDocuments({ rating: { $lt: 4 } }) || 0;
    const satisfactionData = [satisfied, unsatisfied];

    // Daily job count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyData = await SupportRequest.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1, '_id.day': 1 } }
    ]);

    // Common issues (top 5 by subject/category)
    const issueData = await SupportRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Jobs by location (top 5)
    const locationData = await SupportRequest.aggregate([
      { $group: { _id: '$address', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Spare parts usage (example: top 5 by part name, if available)
    const sparePartsData = await SupportRequest.aggregate([
      { $unwind: '$spareParts' },
      { $group: { _id: '$spareParts', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.render('pages/analytics', {
      title: 'Analytics',
      totalRequests,
      statusCounts,
      deviceTypes,
      monthlyData,
      avgCompletionTime,
      satisfactionData,
      dailyData,
      issueData,
      locationData,
      sparePartsData,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    req.flash('error', 'Error loading analytics');
    res.redirect('/admin/dashboard');
  }
});

export default router;