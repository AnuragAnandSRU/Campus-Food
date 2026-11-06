import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.model';
import type { IOrder } from '../models/Order.model';
import MenuItem from '../models/MenuItem.model';
import Canteen from '../models/Canteen.model';
import User from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitNewOrder, emitOrderStatusUpdate } from '../config/socket';

interface OrderLineInput {
  menuItemId: string;
  quantity: number;
}

/**
 * The order lifecycle, as a forward-only state machine. Each status may only
 * advance to the ones listed; cancellation is handled separately (cancelOrder).
 * Keeping this here — not scattered across handlers — makes the flow auditable.
 */
const FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Statuses a staff member/owner may still cancel from (before it's handed over).
const STAFF_CANCELLABLE = ['pending', 'confirmed', 'preparing', 'ready'];
// A student may only cancel while the kitchen hasn't committed effort yet.
const STUDENT_CANCELLABLE = ['pending', 'confirmed'];

/**
 * POST /api/orders  (student)
 * Places a cash-on-delivery order. Prices, names and images are read from the
 * database — never from the request — so the client cannot tamper with the
 * total. Availability and canteen ownership are re-checked at order time.
 */
// Helper to determine if a canteen is open in Indian Standard Time (IST, UTC+5:30)
function isCanteenOpenNow(hours?: { open: string; close: string }): boolean {
  if (!hours?.open || !hours?.close) return true;
  const now = new Date();
  const istTimeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const [hStr, mStr] = istTimeStr.split(':');
  const cur = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (Number.isNaN(openMin) || Number.isNaN(closeMin)) return true;

  return closeMin <= openMin
    ? cur >= openMin || cur < closeMin
    : cur >= openMin && cur < closeMin;
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthRequest).user!;

  // Verify that student's email has been confirmed before accepting orders.
  const student = await User.findById(userId).select('isVerified');
  if (!student?.isVerified) {
    throw new AppError('Please verify your email address before placing an order.', 403);
  }

  const { canteenId, items, deliveryAddress, paymentMethod, specialInstructions } =
    req.body as {
      canteenId: string;
      items: OrderLineInput[];
      deliveryAddress: { hostelBlock: string; roomNumber: string };
      paymentMethod?: string;
      specialInstructions?: string;
    };

  // 1. Canteen must exist, be active, and open for business.
  const canteen = await Canteen.findById(canteenId);
  if (!canteen || !canteen.isActive) {
    throw new AppError('This canteen is not available right now', 400);
  }

  if (!isCanteenOpenNow(canteen.openingHours)) {
    const open = canteen.openingHours?.open ?? 'N/A';
    const close = canteen.openingHours?.close ?? 'N/A';
    throw new AppError(
      `This canteen is currently closed. Operating hours: ${open} to ${close}`,
      400
    );
  }

  // 2. Consolidate duplicate incoming lines for the same dish, summing quantities.
  const consolidated = new Map<string, number>();
  for (const item of items) {
    consolidated.set(item.menuItemId, (consolidated.get(item.menuItemId) || 0) + item.quantity);
  }

  const consolidatedLines: OrderLineInput[] = [];
  for (const [menuItemId, quantity] of consolidated.entries()) {
    if (quantity > 50) {
      throw new AppError('Each item quantity cannot exceed 50', 400);
    }
    consolidatedLines.push({ menuItemId, quantity });
  }

  // 3. Load the referenced items, scoped to THIS canteen (prevents ordering
  //    another canteen's items through this one).
  const menuItemIds = consolidatedLines.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, canteenId });
  const byId = new Map(menuItems.map((m) => [String(m._id), m] as const));

  // 4. Rebuild every line from trusted DB data and compute the total ourselves.
  const orderItems = consolidatedLines.map((line) => {
    const menuItem = byId.get(line.menuItemId);
    if (!menuItem) {
      throw new AppError('One or more items are not on this canteen’s menu', 400);
    }
    if (!menuItem.isAvailable) {
      throw new AppError(`“${menuItem.name}” is currently unavailable`, 400);
    }
    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: line.quantity,
      image: menuItem.image,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 4. Create the order. orderId is generated by the model's pre-save hook.
  const order = await Order.create({
    studentId: userId,
    canteenId,
    items: orderItems,
    totalAmount,
    deliveryAddress,
    paymentMethod: paymentMethod === 'cash_on_delivery' ? paymentMethod : 'cash_on_delivery',
    specialInstructions: specialInstructions?.trim() || undefined,
  });

  // Notify the canteen's staff/owner in real time.
  emitNewOrder(order);

  res.status(201).json({ success: true, data: order });
});

/**
 * GET /api/orders/my-orders  (student)
 * The signed-in student's orders, newest first.
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthRequest).user!;
  const orders = await Order.find({ studentId: userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

/**
 * GET /api/orders/:id  (authenticated)
 * A student may read their own orders; staff/owner may read orders for their
 * canteen; admins may read any. Everyone else is refused.
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Order not found', 404);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const { userId, role } = (req as AuthRequest).user!;

  if (role === 'admin') {
    // full access
  } else if (order.studentId.toString() === userId) {
    // the student who placed it
  } else if (role === 'staff' || role === 'owner') {
    const me = await User.findById(userId).select('canteenId');
    if (!me?.canteenId || me.canteenId.toString() !== order.canteenId.toString()) {
      throw new AppError('You do not have access to this order', 403);
    }
  } else {
    throw new AppError('You do not have access to this order', 403);
  }

  let data: any = order;
  if (role === 'staff' && order.studentId.toString() !== userId) {
    data = order.toObject();
    delete data.deliveryPin;
  }
  res.json({ success: true, data });
});

/**
 * GET /api/orders/canteen/:canteenId  (staff / owner / admin)
 * The live order book for a canteen. Staff and owners may only read their own
 * canteen; admins may read any. `?status=active` returns everything still in
 * progress; `?status=<value>` filters to one status; omitted returns all.
 */
export const getCanteenOrders = asyncHandler(async (req: Request, res: Response) => {
  const { canteenId } = req.params;
  const { userId, role } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(canteenId)) {
    throw new AppError('Canteen not found', 404);
  }

  if (role !== 'admin') {
    const me = await User.findById(userId).select('canteenId');
    if (!me?.canteenId || me.canteenId.toString() !== canteenId) {
      throw new AppError('You do not have access to this canteen’s orders', 403);
    }
  }

  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = { canteenId };
  if (status === 'active') {
    filter.status = { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] };
  } else if (status && status !== 'all') {
    filter.status = status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  const data = role === 'staff'
    ? orders.map((o) => {
        const obj = o.toObject();
        delete (obj as any).deliveryPin;
        return obj;
      })
    : orders;
  res.json({ success: true, data });
});

/**
 * PATCH /api/orders/:id/status  (staff / owner / admin)
 * Advance an order along the lifecycle. Transitions are validated against the
 * state machine; cancellation goes through cancelOrder, not here.
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, estimatedDeliveryTime, deliveryPin, overridePin } = req.body as {
    deliveryPin?: string;
    overridePin?: boolean;
    status: string;
    estimatedDeliveryTime?: string;
  };
  const { userId, role } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Order not found', 404);
  }
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (role !== 'admin') {
    const me = await User.findById(userId).select('canteenId');
    if (!me?.canteenId || me.canteenId.toString() !== order.canteenId.toString()) {
      throw new AppError('You do not have access to this order', 403);
    }
  }

  const allowed = FORWARD_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(`Cannot move an order from “${order.status}” to “${status}”`, 400);
  }

  order.status = status as IOrder['status'];
  if (estimatedDeliveryTime) {
    order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
  }
  if (status === 'delivered') {
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';
    const enteredPin = (deliveryPin || '').toString().trim();
    const override = Boolean(overridePin);

    if (order.deliveryPin) {
      if (override && isOwnerOrAdmin) {
        // Owner/Admin emergency override
      } else if (!enteredPin) {
        throw new AppError('Delivery PIN is required to complete handover. Ask the student for their 4-digit code.', 400);
      } else if (enteredPin !== order.deliveryPin) {
        throw new AppError('Invalid delivery PIN. Please confirm the 4-digit code with the student.', 400);
      }
    }

    order.deliveredAt = new Date();
    // Cash is collected at the door.
    if (order.paymentMethod === 'cash_on_delivery') {
      order.paymentStatus = 'paid';
    }
  }
  await order.save();

  emitOrderStatusUpdate(order);

  let data: any = order;
  if (role === 'staff' && order.studentId.toString() !== userId) {
    data = order.toObject();
    delete data.deliveryPin;
  }
  res.json({ success: true, data });
});

/**
 * POST /api/orders/:id/cancel  (student owner / staff / owner / admin)
 * A student may cancel their own order only while it's still pending/confirmed;
 * canteen staff may cancel up until it's out for delivery; admins may cancel any
 * order that isn't already delivered or cancelled.
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cancelReason } = req.body as { cancelReason?: string };
  const { userId, role } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Order not found', 404);
  }
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status === 'cancelled') {
    throw new AppError('This order is already cancelled', 400);
  }
  if (order.status === 'delivered') {
    throw new AppError('A delivered order cannot be cancelled', 400);
  }

  if (role === 'admin') {
    // full access
  } else if (role === 'student') {
    if (order.studentId.toString() !== userId) {
      throw new AppError('You do not have access to this order', 403);
    }
    if (!STUDENT_CANCELLABLE.includes(order.status)) {
      throw new AppError('This order can no longer be cancelled', 400);
    }
  } else if (role === 'staff' || role === 'owner') {
    const me = await User.findById(userId).select('canteenId');
    if (!me?.canteenId || me.canteenId.toString() !== order.canteenId.toString()) {
      throw new AppError('You do not have access to this order', 403);
    }
    if (!STAFF_CANCELLABLE.includes(order.status)) {
      throw new AppError('This order can no longer be cancelled', 400);
    }
  } else {
    throw new AppError('You do not have access to this order', 403);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason =
    cancelReason?.trim() || (role === 'student' ? 'Cancelled by student' : 'Cancelled by canteen');
  await order.save();

  emitOrderStatusUpdate(order);

  let data: any = order;
  if (role === 'staff' && order.studentId.toString() !== userId) {
    data = order.toObject();
    delete data.deliveryPin;
  }
  res.json({ success: true, data });
});

/**
 * POST /api/orders/:id/rate  (student)
 * Submits a 1-5 star rating and optional review for a delivered order.
 * Dynamically aggregates and updates the canteen's rating.
 */
export const rateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, review } = req.body as { rating: number; review?: string };
  const { userId } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Order not found', 404);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.studentId.toString() !== userId) {
    throw new AppError('You do not have access to this order', 403);
  }

  if (order.status !== 'delivered') {
    throw new AppError('Only delivered orders can be rated', 400);
  }

  if (order.rating) {
    throw new AppError('You have already rated this order', 400);
  }

  order.rating = rating;
  if (review && review.trim()) {
    order.review = review.trim();
  }
  order.ratedAt = new Date();
  await order.save();

  // Dynamically compute the canteen's new average rating & count
  const stats = await Order.aggregate([
    {
      $match: {
        canteenId: order.canteenId,
        rating: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$canteenId',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const avgRating = Math.round(stats[0].avgRating * 10) / 10;
    const totalRatings = stats[0].totalRatings;
    await Canteen.findByIdAndUpdate(order.canteenId, {
      rating: avgRating,
      totalRatings,
    });
  }

  res.json({
    success: true,
    data: order,
    message: 'Thank you for your rating!',
  });
});
