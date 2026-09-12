/**
 * First-admin bootstrap.
 *
 * Creates the initial platform admin so there is an account that can log in and
 * provision canteens, owners, and staff (Option A account creation). This
 * solves the chicken-and-egg problem: you need an admin to create everyone
 * else, but a fresh database has no admin.
 *
 * Safe to run repeatedly — if an admin with the target email already exists it
 * is left untouched (the password is never silently reset).
 *
 * Credentials come from the environment, with dev-only fallbacks:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE
 * In production (NODE_ENV=production) ADMIN_EMAIL and ADMIN_PASSWORD MUST be set
 * or the script refuses to run.
 *
 * Run: npm run bootstrap:admin
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import User, { IUser } from '../src/models/User.model';

const IS_PROD = process.env.NODE_ENV === 'production';

// Dev fallbacks — never used in production (guarded in resolveAdminSpec()).
export const DEV_ADMIN_EMAIL = 'admin@campusfood.local';
export const DEV_ADMIN_PASSWORD = 'admin12345';

interface AdminSpec {
  email: string;
  password: string;
  name: string;
  phone: string;
}

function resolveAdminSpec(): AdminSpec {
  const email = (process.env.ADMIN_EMAIL ?? (IS_PROD ? '' : DEV_ADMIN_EMAIL)).toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (IS_PROD ? '' : DEV_ADMIN_PASSWORD);
  const name = process.env.ADMIN_NAME ?? 'Platform Admin';
  const phone = process.env.ADMIN_PHONE ?? '9000000000';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set to bootstrap the first admin' +
        (IS_PROD ? ' (required in production).' : '.')
    );
  }
  return { email, password, name, phone };
}

/**
 * Create the platform admin if it does not already exist. Returns the admin
 * document. Exported so the dev seed can reuse it.
 */
export async function ensureAdmin(): Promise<IUser> {
  const spec = resolveAdminSpec();

  const existing = await User.findOne({ email: spec.email });
  if (existing) {
    if (existing.role !== 'admin') {
      console.log(
        `⚠️  A user with ${spec.email} exists but role is "${existing.role}", not "admin" — left unchanged.`
      );
    } else {
      console.log(`✓ Admin already exists: ${spec.email} (left unchanged)`);
    }
    return existing;
  }

  const admin = await User.create({
    email: spec.email,
    password: spec.password, // hashed by the User pre-save hook
    name: spec.name,
    phone: spec.phone,
    role: 'admin',
    isVerified: true,
  });
  console.log(`✅ Created platform admin: ${spec.email}`);
  return admin;
}

// CLI entry — runs only when invoked directly, not when imported by the seed.
if (require.main === module) {
  (async () => {
    await connectDB();
    try {
      await ensureAdmin();
      if (!IS_PROD) {
        console.log(
          `\n   Dev login → email: ${DEV_ADMIN_EMAIL}   password: ${DEV_ADMIN_PASSWORD}`
        );
        console.log('   (override with ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env)\n');
      }
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Bootstrap failed:', err instanceof Error ? err.message : err);
      await mongoose.disconnect();
      process.exit(1);
    }
  })();
}
