/**
 * Development seed.
 *
 * Populates demo data so the app has something to browse while building:
 *   - the platform admin (reuses ensureAdmin from bootstrap-admin)
 *   - 2 canteens, each with its OWN owner, staff account, and distinct menu
 *   - a verified demo student
 *
 * Idempotent by default (find-or-create on unique keys) so re-running is safe.
 * Pass --fresh to wipe canteens / menu items / orders / demo accounts first.
 * Refuses to run when NODE_ENV=production unless --force is also given.
 *
 * Run: npm run seed            (idempotent top-up)
 *      npm run seed -- --fresh (reset demo data, then seed)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import User, { IUser } from '../src/models/User.model';
import Canteen, { ICanteen } from '../src/models/Canteen.model';
import MenuItem from '../src/models/MenuItem.model';
import Order from '../src/models/Order.model';
import { ensureAdmin } from './bootstrap-admin';

const ARGS = process.argv.slice(2);
const FRESH = ARGS.includes('--fresh');
const FORCE = ARGS.includes('--force');

// Shared password for the demo owner/staff accounts (students keep their own).
const DEMO_PASSWORD = 'demo12345';
const STUDENT_PASSWORD = 'testpass123';

type Category = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages' | 'Desserts';

interface MenuSpec {
  name: string;
  description: string;
  price: number;
  category: Category;
  isVeg: boolean;
  preparationTime: number;
}

interface CanteenSpec {
  owner: { email: string; name: string; phone: string };
  staff: { email: string; name: string; phone: string };
  canteen: {
    name: string;
    description: string;
    location: string;
    openingHours: { open: string; close: string };
  };
  menu: MenuSpec[];
}

const CANTEEN_SPECS: CanteenSpec[] = [
  {
    owner: { email: 'owner.spice@campusfood.local', name: 'Ravi Menon', phone: '9000000101' },
    staff: { email: 'staff.spice@campusfood.local', name: 'Spice Junction Staff', phone: '9000000102' },
    canteen: {
      name: 'Spice Junction',
      description: 'North Indian & Indo-Chinese favourites — curries, noodles, and chai.',
      location: 'Hostel Block A, Ground Floor',
      openingHours: { open: '08:00', close: '23:00' },
    },
    menu: [
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in a rich tomato-butter gravy.', price: 120, category: 'Lunch', isVeg: true, preparationTime: 20 },
      { name: 'Butter Chicken', description: 'Tandoori chicken simmered in creamy makhani gravy.', price: 160, category: 'Lunch', isVeg: false, preparationTime: 25 },
      { name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles with crunchy vegetables.', price: 90, category: 'Snacks', isVeg: true, preparationTime: 15 },
      { name: 'Chicken Fried Rice', description: 'Indo-Chinese fried rice with egg and chicken.', price: 130, category: 'Lunch', isVeg: false, preparationTime: 18 },
      { name: 'Masala Chai', description: 'Spiced milk tea, freshly brewed.', price: 15, category: 'Beverages', isVeg: true, preparationTime: 5 },
      { name: 'Gulab Jamun (2 pcs)', description: 'Warm milk-solid dumplings in sugar syrup.', price: 40, category: 'Desserts', isVeg: true, preparationTime: 3 },
    ],
  },
  {
    owner: { email: 'owner.green@campusfood.local', name: 'Anita Rao', phone: '9000000201' },
    staff: { email: 'staff.green@campusfood.local', name: 'Green Bowl Staff', phone: '9000000202' },
    canteen: {
      name: 'Green Bowl',
      description: 'South Indian breakfasts, wraps, and healthy bowls.',
      location: 'Academic Block, Food Court',
      openingHours: { open: '07:30', close: '22:00' },
    },
    menu: [
      { name: 'Masala Dosa', description: 'Crispy rice crêpe with spiced potato filling.', price: 70, category: 'Breakfast', isVeg: true, preparationTime: 12 },
      { name: 'Idli Sambar (3 pcs)', description: 'Steamed rice cakes with lentil sambar.', price: 50, category: 'Breakfast', isVeg: true, preparationTime: 10 },
      { name: 'Veg Poha', description: 'Flattened rice tossed with peanuts and curry leaves.', price: 40, category: 'Breakfast', isVeg: true, preparationTime: 8 },
      { name: 'Paneer Frankie Wrap', description: 'Griddled wrap stuffed with spiced paneer.', price: 80, category: 'Snacks', isVeg: true, preparationTime: 12 },
      { name: 'Cold Coffee', description: 'Chilled blended coffee with milk.', price: 60, category: 'Beverages', isVeg: true, preparationTime: 6 },
      { name: 'Fresh Fruit Bowl', description: 'Seasonal fruit, cut fresh to order.', price: 70, category: 'Desserts', isVeg: true, preparationTime: 5 },
    ],
  },
];

const STUDENT_SPEC = {
  email: 'demo.student@college.edu',
  name: 'Demo Student',
  phone: '9000000900',
  hostelBlock: 'Block C',
  roomNumber: 'C-214',
};

async function wipeDemo(): Promise<void> {
  await Promise.all([
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Canteen.deleteMany({}),
    User.deleteMany({ role: { $in: ['owner', 'staff'] } }),
    User.deleteMany({ email: STUDENT_SPEC.email }),
  ]);
  console.log('🧹 --fresh: cleared canteens, menu items, orders, and demo owner/staff/student accounts');
}

/**
 * Ensure a canteen and its owner + staff + menu exist. The owner<->canteen
 * reference is circular (owner.canteenId is required, canteen.ownerId is
 * required), so we pre-generate the canteen _id to satisfy both at creation.
 */
async function ensureCanteenBundle(spec: CanteenSpec): Promise<ICanteen> {
  let owner = await User.findOne({ email: spec.owner.email });
  let canteen = await Canteen.findOne({ name: spec.canteen.name });

  const canteenId =
    (canteen?._id as mongoose.Types.ObjectId | undefined) ??
    (owner?.canteenId as mongoose.Types.ObjectId | undefined) ??
    new mongoose.Types.ObjectId();

  if (!owner) {
    owner = await User.create({
      ...spec.owner,
      role: 'owner',
      password: DEMO_PASSWORD,
      canteenId,
      isVerified: true,
    });
  }

  if (!canteen) {
    canteen = await Canteen.create({
      _id: canteenId,
      ...spec.canteen,
      ownerId: owner._id,
    });
  }

  const staffExists = await User.findOne({ email: spec.staff.email });
  if (!staffExists) {
    await User.create({
      ...spec.staff,
      role: 'staff',
      password: DEMO_PASSWORD,
      canteenId: canteen._id,
      isVerified: true,
    });
  }

  let added = 0;
  for (const item of spec.menu) {
    const exists = await MenuItem.findOne({ canteenId: canteen._id, name: item.name });
    if (!exists) {
      await MenuItem.create({ ...item, canteenId: canteen._id });
      added++;
    }
  }
  console.log(`  • ${canteen.name}: owner + staff ready, ${added} new menu item(s) (${spec.menu.length} total)`);
  return canteen;
}

async function ensureStudent(): Promise<IUser> {
  const existing = await User.findOne({ email: STUDENT_SPEC.email });
  if (existing) return existing;
  return User.create({
    ...STUDENT_SPEC,
    role: 'student',
    password: STUDENT_PASSWORD,
    isVerified: true,
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !FORCE) {
    console.error('❌ Refusing to seed demo data in production. Re-run with --force if you really mean it.');
    process.exit(1);
  }

  await connectDB();
  console.log('\n🌱 Seeding demo data...\n');

  if (FRESH) await wipeDemo();

  await ensureAdmin();
  for (const spec of CANTEEN_SPECS) await ensureCanteenBundle(spec);
  await ensureStudent();

  const [canteens, menuItems, users] = await Promise.all([
    Canteen.countDocuments(),
    MenuItem.countDocuments(),
    User.countDocuments(),
  ]);

  console.log('\n✅ Seed complete.');
  console.log(`   DB now has ${canteens} canteen(s), ${menuItems} menu item(s), ${users} user(s).\n`);
  console.log('   Demo logins:');
  console.log(`     admin   → admin@campusfood.local        / admin12345`);
  console.log(`     owner   → owner.spice@campusfood.local  / ${DEMO_PASSWORD}`);
  console.log(`     owner   → owner.green@campusfood.local  / ${DEMO_PASSWORD}`);
  console.log(`     staff   → staff.spice@campusfood.local  / ${DEMO_PASSWORD}`);
  console.log(`     staff   → staff.green@campusfood.local  / ${DEMO_PASSWORD}`);
  console.log(`     student → demo.student@college.edu      / ${STUDENT_PASSWORD}`);
  console.log('   (existing accounts keep their current passwords; use --fresh to reset)\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
  await mongoose.disconnect();
  process.exit(1);
});
