import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Play, Shield, Tv, Smartphone, Download, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, authStep, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && authStep === "authenticated" && !isLoading) {
      setLocation("/home");
    }
  }, [isAuthenticated, authStep, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent">
        <div className="px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <img
            src="/assets/bolt-logo-white.png"
            alt="Bolt TV"
            className="h-[29px] md:h-9 w-auto"
            data-testid="img-logo"
          />
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/subscribe">
              <button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-4 md:px-6 py-2 rounded-full text-sm transition cursor-pointer"
                data-testid="button-landing-subscribe"
              >
                Subscribe
              </button>
            </Link>
            <Link href="/login">
              <span
                className="text-white/80 hover:text-white font-medium text-sm transition cursor-pointer"
                data-testid="button-landing-signin"
              >
                Sign In
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-blue-900/30" />
          <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4 opacity-[0.12] pointer-events-none">
            {[
              "poster-grit-bo.png", "poster-life-on-ice.png", "poster-full-throttle.png",
              "poster-rookie.png", "poster-surfing.png", "poster-traviesa.png",
              "poster-dtm.png", "poster-grit-arch.png", "poster-action_1.jpg",
              "poster-doc_1.jpg", "poster-comedy_1.jpg", "poster-action_2.jpg",
              "poster-doc_2.jpg", "poster-comedy_2.jpg", "poster-action_3.jpg",
              "poster-doc_3.jpg", "poster-comedy_3.jpg", "poster-grit-bo.png",
            ].map((poster, i) => (
              <img
                key={i}
                src={`/assets/${poster}`}
                alt=""
                className="w-full aspect-[2/3] object-cover rounded-lg"
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <div className="mb-6">
            <span className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
              Stream Live & On Demand
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[0.9] tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
              Stories That
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Move You
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Exclusive sports documentaries, original series, and live events.
            Stream anywhere, anytime on any device.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/subscribe">
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg transition shadow-lg shadow-purple-500/25 cursor-pointer"
                data-testid="button-hero-subscribe"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Watching
              </button>
            </Link>
            <Link href="/login">
              <span
                className="flex items-center gap-2 text-white/70 hover:text-white font-medium text-base md:text-lg transition cursor-pointer group"
                data-testid="button-hero-signin"
              >
                Already a member?
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Why Bolt TV?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              The ultimate destination for sports entertainment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Tv,
                title: "Exclusive Originals",
                desc: "Award-winning documentaries and series you won't find anywhere else.",
              },
              {
                icon: Smartphone,
                title: "Watch Anywhere",
                desc: "Stream on your phone, tablet, laptop, or TV. Your content follows you.",
              },
              {
                icon: Shield,
                title: "No Commitments",
                desc: "Cancel anytime. No contracts, no hidden fees. Simple and transparent.",
              },
              {
                icon: Play,
                title: "Live Events",
                desc: "Catch live sports events and behind-the-scenes coverage as it happens.",
              },
              {
                icon: Download,
                title: "Pick Up Where You Left Off",
                desc: "Your watch progress syncs across all devices automatically.",
              },
              {
                icon: Users,
                title: "Multiple Profiles",
                desc: "Everyone in your household gets their own personalized experience.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group"
                data-testid={`card-feature-${i}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Featured Content
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            From gridiron glory to ice-cold rivalries
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { img: "poster-grit-bo.png", title: "Grit and Glory" },
              { img: "poster-life-on-ice.png", title: "Life on Ice" },
              { img: "poster-full-throttle.png", title: "Full Throttle" },
              { img: "poster-rookie.png", title: "The Rookie" },
            ].map((item, i) => (
              <div
                key={i}
                className="relative group overflow-hidden rounded-xl aspect-[2/3]"
                data-testid={`card-featured-${i}`}
              >
                <img
                  src={`/assets/${item.img}`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <p className="text-white font-bold text-sm md:text-base">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of fans already streaming on Bolt TV.
          </p>
          <Link href="/subscribe">
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-10 py-4 rounded-full text-lg transition shadow-lg shadow-purple-500/25 mx-auto cursor-pointer"
              data-testid="button-cta-subscribe"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Your Free Trial
            </button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src="/assets/bolt-logo-white.png"
            alt="Bolt TV"
            className="h-6 opacity-50"
          />
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Help Center</span>
          </div>
          <p className="text-gray-600 text-sm">&copy; 2026 Bolt TV. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
