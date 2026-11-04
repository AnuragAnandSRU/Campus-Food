import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  studentId: mongoose.Types.ObjectId;
  canteenId: mongoose.Types.ObjectId;
  items: Array<{
    menuItemId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  deliveryAddress: {
    hostelBlock: string;
    roomNumber: string;
  };
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  rating?: number;
  review?: string;
  ratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    canteenId: {
      type: Schema.Types.ObjectId,
      ref: 'Canteen',
      required: true,
    },
    items: [
      {
        menuItemId: {
          type: Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      hostelBlock: {
        type: String,
        required: true,
      },
      roomNumber: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'online'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    specialInstructions: {
      type: String,
      maxlength: 500,
    },
    estimatedDeliveryTime: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    ratedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Generate the human-readable order ID before validation. This must run on
// `validate` (not `save`): Mongoose validates *before* save hooks fire, and
// orderId is `required`, so generating it in a pre-save hook is too late.
orderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderId = `ORD-${dateStr}-${random}`;
  }
  next();
});

// Indexes for efficient queries (orderId already indexed via `unique: true`)
orderSchema.index({ studentId: 1, createdAt: -1 });
orderSchema.index({ canteenId: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);
