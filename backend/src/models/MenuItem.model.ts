import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  canteenId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages' | 'Desserts';
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    canteenId: {
      type: Schema.Types.ObjectId,
      ref: 'Canteen',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'],
    },
    isVeg: {
      type: Boolean,
      required: true,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      required: true,
      min: [1, 'Preparation time must be at least 1 minute'],
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for canteen + category queries
menuItemSchema.index({ canteenId: 1, category: 1 });
menuItemSchema.index({ canteenId: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
