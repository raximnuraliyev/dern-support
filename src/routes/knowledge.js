import express from 'express';
import KnowledgeArticle from '../models/KnowledgeArticle.js';
import { checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// View all knowledge articles
router.get('/', async (req, res) => {
  try {
    const articles = await KnowledgeArticle.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'name');
    
    res.render('pages/knowledge-base', {
      title: 'Knowledge Base',
      articles
    });
  } catch (error) {
    console.error('Knowledge base error:', error);
    req.flash('error', 'Error loading knowledge base');
    res.redirect('/dashboard');
  }
});

// Search knowledge articles
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.redirect('/knowledge');
    }

    const articles = await KnowledgeArticle.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'name');
    
    res.render('pages/knowledge-base', {
      title: `Search Results: ${query}`,
      articles,
      searchQuery: query
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    req.flash('error', 'Error searching knowledge base');
    res.redirect('/knowledge');
  }
});

// View specific article
router.get('/article/:id', async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id)
      .populate('author', 'name');
    
    if (!article) {
      req.flash('error', 'Article not found');
      return res.redirect('/knowledge');
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.render('pages/knowledge-article', {
      title: article.title,
      article
    });
  } catch (error) {
    console.error('Knowledge article error:', error);
    req.flash('error', 'Error loading article');
    res.redirect('/knowledge');
  }
});

// Admin: New article form
router.get('/new', checkAdmin, (req, res) => {
  res.render('pages/knowledge-new', {
    title: 'Create Knowledge Article'
  });
});

// Admin: Create new article
router.post('/new', checkAdmin, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;

    // Validation
    if (!title || !category || !content) {
      req.flash('error', 'Please provide all required information');
      return res.redirect('/knowledge/new');
    }

    // Create new article
    const article = new KnowledgeArticle({
      title,
      category,
      content,
      author: req.session.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    await article.save();

    req.flash('success', 'Knowledge article created successfully');
    res.redirect('/knowledge');
  } catch (error) {
    console.error('Create article error:', error);
    req.flash('error', 'Error creating article');
    res.redirect('/knowledge/new');
  }
});

// Admin: Edit article form
router.get('/edit/:id', checkAdmin, async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id);
    
    if (!article) {
      req.flash('error', 'Article not found');
      return res.redirect('/knowledge');
    }

    res.render('pages/knowledge-edit', {
      title: 'Edit Knowledge Article',
      article
    });
  } catch (error) {
    console.error('Edit article error:', error);
    req.flash('error', 'Error loading article');
    res.redirect('/knowledge');
  }
});

// Admin: Update article
router.post('/edit/:id', checkAdmin, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    
    // Validation
    if (!title || !category || !content) {
      req.flash('error', 'Please provide all required information');
      return res.redirect(`/knowledge/edit/${req.params.id}`);
    }

    const article = await KnowledgeArticle.findById(req.params.id);
    
    if (!article) {
      req.flash('error', 'Article not found');
      return res.redirect('/knowledge');
    }

    // Update fields
    article.title = title;
    article.category = category;
    article.content = content;
    article.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    await article.save();

    req.flash('success', 'Article updated successfully');
    res.redirect(`/knowledge/article/${article._id}`);
  } catch (error) {
    console.error('Update article error:', error);
    req.flash('error', 'Error updating article');
    res.redirect(`/knowledge/edit/${req.params.id}`);
  }
});

// Admin: Delete article
router.delete('/article/:id', checkAdmin, async (req, res) => {
  try {
    await KnowledgeArticle.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'Article deleted successfully');
    res.redirect('/knowledge');
  } catch (error) {
    console.error('Delete article error:', error);
    req.flash('error', 'Error deleting article');
    res.redirect('/knowledge');
  }
});

export default router;