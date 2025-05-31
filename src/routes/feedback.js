import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// Feedback form
router.get('/', (req, res) => {
  res.render('pages/feedback-form', {
    title: 'Submit Feedback'
  });
});

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { message, rating } = req.body;

    // Validation
    if (!message) {
      req.flash('error', 'Please provide feedback message');
      return res.redirect('/feedback');
    }

    // Create new feedback
    const feedback = new Feedback({
      user: req.session.user.id,
      message,
      rating: rating || null,
    });

    await feedback.save();

    req.flash('success', 'Thank you for your feedback!');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Feedback submission error:', error);
    req.flash('error', 'Error submitting feedback');
    res.redirect('/feedback');
  }
});

// Show all feedback (admin or for user)
router.get('/all', async (req, res) => {
  try {
    // For admin: show all feedback, for user: show only their feedback
    let feedbacks;
    if (req.session.user && req.session.user.role === 'admin') {
      feedbacks = await Feedback.find().populate('user', 'username email').sort({ createdAt: -1 });
    } else {
      feedbacks = await Feedback.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    }
    res.render('pages/feedback-list', {
      title: 'All Feedback',
      feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    req.flash('error', 'Could not load feedback');
    res.redirect('/dashboard');
  }
});

export default router;