import mongoose from 'mongoose';

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Add text index for search functionality
knowledgeArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

export default KnowledgeArticle;