import mongoose, { Schema, Document } from 'mongoose';

export interface ICanteen extends Document {
  name: string;
  description: string;
  location: string;
  image: string;
  ownerId: mongoose.Types.ObjectId;
  openingHours: {
    open: string;
    close: string;
  };
  isActive: boolean;
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const canteenSchema = new Schema<ICanteen>(
  {
    name: {
      type: String,
      required: [true, 'Canteen name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    openingHours: {
      open: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
      close: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (name already indexed via `unique: true`)
canteenSchema.index({ ownerId: 1 });
canteenSchema.index({ isActive: 1 });

export default mongoose.model<ICanteen>('Canteen', canteenSchema);
