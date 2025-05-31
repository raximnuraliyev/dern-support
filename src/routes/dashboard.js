import express from 'express';
import SupportRequest from '../models/SupportRequest.js';
import KnowledgeArticle from '../models/KnowledgeArticle.js';

const router = express.Router();

// User dashboard
router.get('/', async (req, res) => {
  try {
    // Get user's recent support requests
    const supportRequests = await SupportRequest.find({ 
      user: req.session.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(5);

    // Get popular knowledge articles
    const knowledgeArticles = await KnowledgeArticle.find({})
      .sort({ viewCount: -1 })
      .limit(3);

    res.render('pages/dashboard', {
      title: 'Dashboard',
      supportRequests,
      knowledgeArticles
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/');
  }
});

export default router;