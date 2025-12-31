const mongoose = require('mongoose')

const tierSystemSchema = new mongoose.Schema({
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true,
    unique: true
  },
  profitSettings: {
    minSaleDiscountRate: { type: Number, default: 1, min: 0, max: 1 }
  },
  roleModules: [mongoose.Schema.Types.Mixed],
  authorizedAccounts: [mongoose.Schema.Types.Mixed],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

tierSystemSchema.index({ manufacturerId: 1 }, { unique: true })

module.exports = mongoose.model('TierSystem', tierSystemSchema)
