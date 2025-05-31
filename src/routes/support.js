import express from 'express';
import SupportRequest from '../models/SupportRequest.js';
import { checkUserAuthenticated } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: path.join('public', 'uploads', 'support'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = express.Router();

// Show support request form
router.get('/new', checkUserAuthenticated, (req, res) => {
  res.render('pages/support-form', {
    title: 'Request IT Support',
    user: req.session.user
  });
});

// Create support request (updated for new fields)
router.post('/new', checkUserAuthenticated, upload.single('attachment'), async (req, res) => {
  try {
    const { subject, category, description, serviceMethod, address, urgency, department } = req.body;
    if (!subject || !description || !serviceMethod) {
      req.flash('error', 'Please provide all required information');
      return res.redirect('/support/new');
    }
    const supportRequest = new SupportRequest({
      user: req.session.user.id,
      subject,
      category,
      description,
      serviceMethod,
      address,
      urgency,
      department,
      attachment: req.file ? req.file.filename : undefined
    });
    await supportRequest.save();
    req.flash('success', 'Support request submitted successfully');
    res.redirect('/support/history');
  } catch (error) {
    console.error('Support request error:', error);
    req.flash('error', 'Error submitting support request');
    res.redirect('/support/new');
  }
});

// View support history (user's tickets)
router.get('/history', checkUserAuthenticated, async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.render('pages/support-history', {
      title: 'My Support History',
      supportRequests
    });
  } catch (error) {
    console.error('Support history error:', error);
    req.flash('error', 'Error loading support history');
    res.redirect('/dashboard');
  }
});

// View specific support request
router.get('/:id', checkUserAuthenticated, async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findById(req.params.id).populate('user', 'name email accountType');
    if (!supportRequest) {
      req.flash('error', 'Support request not found');
      return res.redirect('/support/history');
    }
    if (supportRequest.user._id.toString() !== req.session.user.id && !req.session.user.isAdmin) {
      req.flash('error', 'Not authorized to view this request');
      return res.redirect('/support/history');
    }
    res.render('pages/support-request', {
      title: 'Support Request Details',
      supportRequest,
      user: req.session.user
    });
  } catch (error) {
    console.error('Support request details error:', error);
    req.flash('error', 'Error loading support request details');
    res.redirect('/support/history');
  }
});

// Admin: Update support request
router.post('/:id/update', checkUserAuthenticated, async (req, res) => {
  try {
    // Only allow admin
    if (!req.session.user.isAdmin) {
      req.flash('error', 'Not authorized');
      return res.redirect('/support/' + req.params.id);
    }
    const { status, jobNotes, resolution } = req.body;
    const supportRequest = await SupportRequest.findById(req.params.id);
    if (!supportRequest) {
      req.flash('error', 'Support request not found');
      return res.redirect('/support/history');
    }
    supportRequest.status = status || supportRequest.status;
    supportRequest.jobNotes = jobNotes || supportRequest.jobNotes;
    supportRequest.resolution = resolution || supportRequest.resolution;
    await supportRequest.save();
    req.flash('success', 'Support request updated successfully');
    res.redirect('/support/' + req.params.id);
  } catch (error) {
    console.error('Admin update support request error:', error);
    req.flash('error', 'Error updating support request');
    res.redirect('/support/' + req.params.id);
  }
});

// View all support requests (admin panel)
router.get('/admin/requests', checkUserAuthenticated, async (req, res) => {
  try {
    if (!req.session.user.isAdmin) {
      req.flash('error', 'Not authorized');
      return res.redirect('/dashboard');
    }
    const supportRequests = await SupportRequest.find({})
      .populate('user', 'name email accountType')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.render('pages/admin/support-requests', {
      title: 'All Support Requests',
      supportRequests,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin support requests error:', error);
    req.flash('error', 'Error loading support requests');
    res.redirect('/dashboard');
  }
});

// Alias route for admin to view all support requests at /support/admin/all
router.get('/admin/all', checkUserAuthenticated, async (req, res) => {
  try {
    if (!req.session.user.isAdmin) {
      req.flash('error', 'Not authorized');
      return res.redirect('/dashboard');
    }
    const supportRequests = await SupportRequest.find({})
      .populate('user', 'name email accountType')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.render('pages/admin/support-requests', {
      title: 'All Support Requests',
      supportRequests,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin support requests error:', error);
    req.flash('error', 'Error loading support requests');
    res.redirect('/dashboard');
  }
});

export default router;
