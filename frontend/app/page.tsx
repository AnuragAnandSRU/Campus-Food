export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070"
            alt="Delicious food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 to-charcoal/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <div className="badge badge-accent mb-6">
            🎓 Made for campus life
          </div>

          <h1 className="text-6xl md:text-7xl mb-6 tracking-tight">
            Order from your <em className="text-accent not-italic">favorite</em> canteens
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-8 font-light max-w-2xl mx-auto">
            Skip the queues. Get food delivered to your hostel room in minutes.
          </p>

          <div className="flex gap-4 justify-center">
            <a href="/canteens" className="btn btn-primary text-lg px-8">
              Browse Canteens
            </a>
            <a href="/login" className="btn btn-secondary text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
              Sign In
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-accent mb-4">How it works</div>
            <h2 className="text-4xl md:text-5xl mb-4 tracking-tight">
              Food ordering, <em className="text-accent not-italic">simplified</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-2xl mb-3">Browse menus</h3>
              <p className="text-muted font-light">
                Explore offerings from all campus canteens in one place. Filter by cuisine, dietary preferences, or price.
              </p>
            </div>

            <div className="card p-8 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-2xl mb-3">Place your order</h3>
              <p className="text-muted font-light">
                Add items to cart, review your order, and specify your hostel block and room number.
              </p>
            </div>

            <div className="card p-8 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center mb-4">
                <span className="text-2xl">🚴</span>
              </div>
              <h3 className="text-2xl mb-3">Track delivery</h3>
              <p className="text-muted font-light">
                Get real-time updates as your order is prepared and delivered right to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-charcoal text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6 tracking-tight">
            Ready to <em className="text-accent not-italic">skip the queue</em>?
          </h2>
          <p className="text-xl text-white/80 mb-8 font-light">
            Join thousands of students already ordering food the smart way.
          </p>
          <a href="/register" className="btn btn-primary text-lg px-8">
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted">
          <p className="font-light">
            © 2026 Campus Food. Made with care for students.
          </p>
        </div>
      </footer>
    </main>
  );
}
