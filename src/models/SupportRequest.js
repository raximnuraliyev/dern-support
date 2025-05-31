import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  serviceMethod: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  urgency: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  attachment: {
    type: String, // file path or filename
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Cancelled'],
    default: 'Pending',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  jobNotes: {
    type: String,
    trim: true,
  },
  resolution: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

export default SupportRequest;
