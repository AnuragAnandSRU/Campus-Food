import Link from 'next/link';

const FEATURES: Array<[string, string]> = [
  ['🛵', 'Delivered to your hostel room'],
  ['💵', 'Cash on delivery — no prepayment'],
  ['🔔', 'Live updates from kitchen to door'],
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel — shown on large screens only */}
      <aside className="relative hidden overflow-hidden bg-accent px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
          aria-hidden
        />

        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-2 text-lg font-medium"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-accent">
            🍽️
          </span>
          Campus Food
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl leading-tight xl:text-5xl">
            Good food, <em className="not-italic text-highlight">no queue.</em>
          </h2>
          <p className="mt-4 font-light text-white/80">
            Order from your campus canteens and have it brought straight to your
            room — no more waiting in line between classes.
          </p>

          <ul className="mt-10 space-y-4 font-light text-white/90">
            {FEATURES.map(([icon, label]) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-lg">
                  {icon}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/60">Made for hostel life.</p>
      </aside>

      {/* Form column */}
      <main className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-lg font-medium text-ink lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-tint text-accent">
              🍽️
            </span>
            Campus Food
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
