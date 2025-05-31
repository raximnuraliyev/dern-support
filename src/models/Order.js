import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      }
    }],
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      default: 'Pending',
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    businessInfo: {
      companyName: String,
      department: String,
      contactPerson: String,
      purchaseOrderNumber: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    notes: String,
    trackingNumber: String,
    statusHistory: [{
      status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        required: true,
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      note: String,
    }],
    refundStatus: {
      type: String,
      enum: ['None', 'Requested', 'Approved', 'Rejected', 'Refunded'],
      default: 'None',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    downloadLinks: [{
      url: String,
      label: String,
    }],
    attachments: [{
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;