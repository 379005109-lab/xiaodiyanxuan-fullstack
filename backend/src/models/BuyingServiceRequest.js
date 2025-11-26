const mongoose = require('mongoose')

const buyingServiceRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: false,
    },
    serviceType: {
      type: String,
      enum: ['standard', 'expert'],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('BuyingServiceRequest', buyingServiceRequestSchema)
