import mongoose, { Schema, Document } from 'mongoose'

export interface IBuyingServiceRequest extends Document {
  user: mongoose.Types.ObjectId | string
  userName: string
  userPhone: string
  serviceType: 'standard' | 'expert'
  scheduledDate: Date
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const buyingServiceRequestSchema = new Schema<IBuyingServiceRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
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

export default mongoose.model<IBuyingServiceRequest>('BuyingServiceRequest', buyingServiceRequestSchema)
