import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.model';
import User from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import type {
  SalesData,
  PopularItem,
  OrderTimeline,
  DashboardStats,
} from '../../../shared/src/types/analytics.types';

/**
 * Validates timezone string and falls back to Asia/Kolkata if invalid.
 */
function sanitizeTimezone(tz?: string): string {
  if (!tz || typeof tz !== 'string') return 'Asia/Kolkata';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return 'Asia/Kolkata';
  }
}

/**
 * Extracts GMT offset for the given timezone, e.g. "+05:30".
 */
function getTimezoneOffset(tz: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+05:30';
  const match = tzPart.match(/GMT([+-]\d{2}:\d{2})/);
  return match ? match[1] : '+05:30';
}

/**
 * Calculates midnight (00:00:00) in the given timezone, optionally offset by daysAgo.
 */
function getStartOfDayInTimezone(tz: string = 'Asia/Kolkata', daysAgo: number = 0): Date {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [y, m, d] = dateParts.split('-').map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d - daysAgo));
  const targetStr = targetDate.toISOString().slice(0, 10);
  const offset = getTimezoneOffset(tz, targetDate);
  return new Date(`${targetStr}T00:00:00${offset}`);
}

/**
 * Formats a Date object to YYYY-MM-DD in the given timezone.
 */
function formatDateInTimezone(date: Date, tz: string = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Resolves the canteen ID to scope analytics queries to.
 * - Admin can pass ?canteenId=... to view a specific canteen, or omit it to view platform-wide stats.
 * - Canteen owners & staff are strictly scoped to their assigned canteen.
 */
async function resolveCanteenScope(req: Request): Promise<mongoose.Types.ObjectId | null> {
  const user = (req as AuthRequest).user!;

  if (user.role === 'admin') {
    const qCanteenId = req.query.canteenId as string | undefined;
    if (qCanteenId && mongoose.Types.ObjectId.isValid(qCanteenId)) {
      return new mongoose.Types.ObjectId(qCanteenId);
    }
    return null;
  }

  // Owner or staff: lookup canteenId from User record to ensure freshness
  const dbUser = await User.findById(user.userId).select('canteenId');
  if (!dbUser?.canteenId) {
    throw new AppError('No canteen assigned to this account', 400);
  }
  return dbUser.canteenId;
}

/**
 * GET /api/analytics/dashboard
 * Returns top-level summary metrics for today:
 * - todayOrders (placed since midnight in local timezone)
 * - todayRevenue (realized from delivered/paid orders)
 * - pendingOrders (currently active)
 * - pendingRevenue (in-flight order value)
 * - completedOrders (delivered)
 * - averagePreparationTime (in minutes)
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const canteenId = await resolveCanteenScope(req);
  const timezone = sanitizeTimezone(req.query.timezone as string);

  const matchBase: Record<string, any> = {};
  if (canteenId) {
    matchBase.canteenId = canteenId;
  }

  // Start of today anchored to target timezone midnight (e.g. Asia/Kolkata)
  const todayStart = getStartOfDayInTimezone(timezone, 0);

  // 1. Orders placed today
  const todayOrders = await Order.countDocuments({
    ...matchBase,
    createdAt: { $gte: todayStart },
  });

  // 2. Realized revenue from completed/delivered or paid orders placed today
  const todayRevenueAgg = await Order.aggregate([
    {
      $match: {
        ...matchBase,
        createdAt: { $gte: todayStart },
        $or: [{ status: 'delivered' }, { paymentStatus: 'paid' }],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
      },
    },
  ]);
  const todayRevenue = todayRevenueAgg[0]?.total || 0;

  // 3. Orders currently active / in progress in kitchen
  const pendingOrders = await Order.countDocuments({
    ...matchBase,
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] },
  });

  // 3b. In-flight revenue currently cooking / out for delivery
  const pendingRevenueAgg = await Order.aggregate([
    {
      $match: {
        ...matchBase,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
      },
    },
  ]);
  const pendingRevenue = pendingRevenueAgg[0]?.total || 0;

  // 4. Completed orders
  const completedOrders = await Order.countDocuments({
    ...matchBase,
    status: 'delivered',
  });

  // 5. Average prep / delivery time in minutes (returns 0 if no delivered orders yet)
  const prepTimeAgg = await Order.aggregate([
    {
      $match: {
        ...matchBase,
        status: 'delivered',
        deliveredAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        prepMinutes: {
          $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 1000 * 60],
        },
      },
    },
    {
      $match: {
        prepMinutes: { $gte: 1, $lte: 180 },
      },
    },
    {
      $group: {
        _id: null,
        avgMinutes: { $avg: '$prepMinutes' },
      },
    },
  ]);
  const averagePreparationTime =
    prepTimeAgg[0]?.avgMinutes != null ? Math.round(prepTimeAgg[0].avgMinutes) : 0;

  const stats: DashboardStats = {
    todayOrders,
    todayRevenue,
    pendingOrders,
    pendingRevenue,
    completedOrders,
    averagePreparationTime,
  };

  res.json({ success: true, data: stats });
});

/**
 * GET /api/analytics/sales
 * Returns day-by-day revenue and order counts over the given window (default 7 days, max 90).
 * Fills empty dates with 0 so graphs render continuous lines without date gaps.
 */
export const getSalesAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const canteenId = await resolveCanteenScope(req);
  const days = Math.min(Math.max(parseInt(req.query.days as string, 10) || 7, 1), 90);
  const timezone = sanitizeTimezone(req.query.timezone as string);

  const matchBase: Record<string, any> = {};
  if (canteenId) {
    matchBase.canteenId = canteenId;
  }

  const startDate = getStartOfDayInTimezone(timezone, days - 1);

  const salesAgg = await Order.aggregate([
    {
      $match: {
        ...matchBase,
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone },
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const salesMap = new Map<string, { totalOrders: number; totalRevenue: number }>();
  salesAgg.forEach((item) => {
    salesMap.set(item._id, { totalOrders: item.totalOrders, totalRevenue: item.totalRevenue });
  });

  const result: SalesData[] = [];
  const curr = new Date(startDate);
  const todayEnd = getStartOfDayInTimezone(timezone, -1);

  while (curr < todayEnd) {
    const dateStr = formatDateInTimezone(curr, timezone);
    const found = salesMap.get(dateStr) || { totalOrders: 0, totalRevenue: 0 };
    result.push({
      date: dateStr,
      totalOrders: found.totalOrders,
      totalRevenue: found.totalRevenue,
      averageOrderValue:
        found.totalOrders > 0 ? Math.round(found.totalRevenue / found.totalOrders) : 0,
    });
    curr.setDate(curr.getDate() + 1);
  }

  res.json({ success: true, data: result });
});

/**
 * GET /api/analytics/popular-items
 * Returns the highest-selling dishes ranked by order count and revenue.
 * Supports optional ?days=... to scope to a recent timeframe.
 */
export const getPopularItems = asyncHandler(async (req: Request, res: Response) => {
  const canteenId = await resolveCanteenScope(req);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 5, 1), 20);
  const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
  const timezone = sanitizeTimezone(req.query.timezone as string);

  const matchBase: Record<string, any> = {};
  if (canteenId) {
    matchBase.canteenId = canteenId;
  }

  const matchStage: Record<string, any> = {
    ...matchBase,
    status: { $ne: 'cancelled' },
  };

  if (days && days > 0) {
    matchStage.createdAt = { $gte: getStartOfDayInTimezone(timezone, days - 1) };
  }

  const popularAgg = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $ifNull: ['$items.menuItemId', '$items.name'] },
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        totalOrders: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalOrders: -1, totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        menuItemId: { $toString: '$_id' },
        name: 1,
        image: { $ifNull: ['$image', ''] },
        totalOrders: 1,
        totalRevenue: 1,
      },
    },
  ]);

  const items: PopularItem[] = popularAgg;
  res.json({ success: true, data: items });
});

/**
 * GET /api/analytics/orders-timeline
 * Returns the 24-hour distribution of orders across the day (0-23 hours).
 */
export const getOrdersTimeline = asyncHandler(async (req: Request, res: Response) => {
  const canteenId = await resolveCanteenScope(req);
  const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
  const timezone = sanitizeTimezone(req.query.timezone as string);

  const matchBase: Record<string, any> = {};
  if (canteenId) {
    matchBase.canteenId = canteenId;
  }

  const matchStage: Record<string, any> = {
    ...matchBase,
    status: { $ne: 'cancelled' },
  };

  if (days && days > 0) {
    matchStage.createdAt = { $gte: getStartOfDayInTimezone(timezone, days - 1) };
  }

  const timelineAgg = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: { date: '$createdAt', timezone } },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const timelineMap = new Map<number, number>();
  timelineAgg.forEach((item) => {
    timelineMap.set(item._id, item.orderCount);
  });

  const result: OrderTimeline[] = Array.from({ length: 24 }).map((_, hour) => ({
    hour,
    orderCount: timelineMap.get(hour) || 0,
  }));

  res.json({ success: true, data: result });
});
