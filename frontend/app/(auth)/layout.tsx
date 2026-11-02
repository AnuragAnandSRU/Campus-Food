import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(27,122,69,0.14),transparent)]">
      {/* Top Header */}
      <header className="px-6 py-6 sm:px-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-accent">
          Campus<span className="text-ink">Food</span>
        </Link>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="card p-6 sm:p-10 shadow-xl shadow-ink/5 border border-line bg-surface/95 backdrop-blur-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-6 py-6 text-center text-xs text-muted border-t border-line/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Campus Food. Made with care for campus life.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <Link href="/canteens" className="hover:text-ink transition-colors">Canteens</Link>
            <Link href="/partner" className="hover:text-ink transition-colors">Partner Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
