import Link from 'next/link';
import {
  ArrowRight,
  Bike,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { HomeHeroActions } from '@/components/home-hero-actions';
import { ConsumerRouteGuard } from '@/components/consumer-route-guard';

export default function Home() {
  return (
    <ConsumerRouteGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
            {/* Background Image with Depth Gradients */}
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070"
                alt="Delicious food"
                className="w-full h-full object-cover scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/65 to-ink/90" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center text-white animate-slide-up">
              <div className="badge border border-white/20 bg-white/10 backdrop-blur-md text-white/95 mb-6 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-highlight" />
                <span>Made for campus life</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl mb-6 tracking-tight font-display font-bold">
                Order from your <em className="text-highlight not-italic">favorite</em> canteens
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-white/85 mb-8 font-light max-w-2xl mx-auto leading-relaxed">
                Skip the queues. Get food delivered straight to your hostel room in minutes.
              </p>

              <HomeHeroActions />
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/70">
              <ChevronDown className="w-6 h-6" />
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 px-6 relative bg-background bg-dot-grid">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="badge badge-accent mb-4">
                  <span>How it works</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-4 tracking-tight font-display font-bold text-ink">
                  Food ordering, <em className="text-accent not-italic">simplified</em>
                </h2>
                <p className="text-muted font-light max-w-md mx-auto text-sm sm:text-base">
                  Designed specifically for campus schedules, meal breaks, and late-night cravings.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="card-interactive p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-4 right-5 font-display text-4xl font-bold text-ink/5 select-none">
                    01
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                      <UtensilsCrossed className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl mb-3 font-display font-semibold text-ink">
                      Browse menus
                    </h3>
                    <p className="text-muted font-light leading-relaxed text-sm">
                      Explore offerings from all campus canteens in one unified place. Filter by dietary preference, cuisine, or price.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="card-interactive p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-4 right-5 font-display text-4xl font-bold text-ink/5 select-none">
                    02
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                      <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl mb-3 font-display font-semibold text-ink">
                      Place your order
                    </h3>
                    <p className="text-muted font-light leading-relaxed text-sm">
                      Add items to cart, specify your hostel block and room number, and check out with zero prepayment hassle.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="card-interactive p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-4 right-5 font-display text-4xl font-bold text-ink/5 select-none">
                    03
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                      <Bike className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl mb-3 font-display font-semibold text-ink">
                      Track delivery
                    </h3>
                    <p className="text-muted font-light leading-relaxed text-sm">
                      Watch live progress as the kitchen cooks, and hand over your secure 4-digit PIN when the runner arrives at your door.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-6 bg-ink text-white relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-accent/20 rounded-full blur-3xl pointer-events-none"
            />
            <div className="relative max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl mb-5 tracking-tight font-display font-bold">
                Ready to <em className="text-highlight not-italic">skip the queue</em>?
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-8 font-light max-w-xl mx-auto">
                Explore campus kitchens and start your food order right now.
              </p>
              <Link
                href="/canteens"
                className="btn btn-primary text-base sm:text-lg px-8 py-3.5 shadow-lg shadow-accent/20"
              >
                <span>Explore Today&apos;s Menus</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-line bg-surface/40">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-muted">
            <p className="font-light text-xs sm:text-sm">
              © 2026 Campus Food. Made with care for university campus life.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/canteens" className="hover:text-ink transition-colors font-medium">
                Browse Canteens
              </Link>
              <Link
                href="/partner"
                className="text-accent hover:underline font-medium transition-colors"
              >
                Canteen Partner Portal →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </ConsumerRouteGuard>
  );
}
