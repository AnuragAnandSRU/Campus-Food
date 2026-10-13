import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'staff' | 'owner' | 'admin';
  phone: string;
  hostelBlock?: string;
  roomNumber?: string;
  canteenId?: mongoose.Types.ObjectId;
  staffDuties: ('kitchen' | 'delivery')[];
  permissions: ('manage_menu' | 'view_analytics')[];
  isVerified: boolean;
  isActive: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  invitationToken?: string;
  invitationExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'staff', 'owner', 'admin'],
      default: 'student',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    hostelBlock: {
      type: String,
      required: function (this: IUser) {
        return this.role === 'student';
      },
    },
    roomNumber: {
      type: String,
      required: function (this: IUser) {
        return this.role === 'student';
      },
    },
    canteenId: {
      type: Schema.Types.ObjectId,
      ref: 'Canteen',
      required: function (this: IUser) {
        return this.role === 'staff' || this.role === 'owner';
      },
    },
    // What a staff member does on the floor. Backfilled to BOTH for accounts
    // that predate this field; new staff always get explicit duties at
    // provisioning (see user.validator — at least one is required).
    staffDuties: {
      type: [String],
      enum: ['kitchen', 'delivery'],
      default: function (this: IUser) {
        return this.role === 'staff' ? ['kitchen', 'delivery'] : [];
      },
    },
    // Extra powers an owner grants a staff member. Owners implicitly have every
    // power for their own canteen, so this only ever matters for staff.
    permissions: {
      type: [String],
      enum: ['manage_menu', 'view_analytics'],
      default: () => [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    invitationToken: String,
    invitationExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for faster queries (email already indexed via `unique: true`)
userSchema.index({ role: 1 });
userSchema.index({ canteenId: 1 });

export default mongoose.model<IUser>('User', userSchema);
