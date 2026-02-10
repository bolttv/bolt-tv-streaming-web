import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Play, ChevronDown, ChevronRight, Tv, Smartphone, Download, Users, Shield, Zap, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Footer from "@/components/Footer";

interface LandingItem {
  id: string;
  title: string;
  posterImage: string;
  verticalPosterImage?: string;
  heroImage?: string;
  description?: string;
  contentType?: string;
}

interface LandingRow {
  id: string;
  title: string;
  items: LandingItem[];
}

interface CleengOffer {
  id: string;
  title: string;
  price: number;
  currency: string;
  period: string;
  freePeriods?: number;
  freeDays?: number;
  description?: string;
  features?: string[];
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10" data-testid={`faq-item-${question.slice(0, 20).replace(/\s/g, '-')}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 md:py-6 text-left cursor-pointer group"
      >
        <span className="text-base md:text-lg font-semibold text-white pr-4 group-hover:text-purple-300 transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-purple-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 pb-5" : "max-h-0"}`}>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, authStep, isLoading } = useAuth();
  const [content, setContent] = useState<{ rows: LandingRow[]; hero: LandingItem[] } | null>(null);
  const [offers, setOffers] = useState<CleengOffer[]>([]);

  useEffect(() => {
    if (isAuthenticated && authStep === "authenticated" && !isLoading) {
      setLocation("/home");
    }
  }, [isAuthenticated, authStep, isLoading, setLocation]);

  useEffect(() => {
    fetch("/api/landing/content")
      .then(r => r.json())
      .then(data => setContent(data))
      .catch(() => {});

    fetch("/api/cleeng/offers")
      .then(r => r.json())
      .then(data => {
        const parsed = Array.isArray(data) ? data : data.offers || data.items || [];
        if (parsed.length > 0) {
          setOffers(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const featuredRow = content?.rows?.find(r => r.id === "featured" || r.title?.toLowerCase().includes("featured"));
  const popularRow = content?.rows?.find(r => r.id === "popular" || r.title?.toLowerCase().includes("popular"));
  const newMoviesRow = content?.rows?.find(r => r.id === "new-movies" || r.title?.toLowerCase().includes("movie"));
  const docsRow = content?.rows?.find(r => r.id === "documentaries" || r.title?.toLowerCase().includes("doc"));
  const allPosters = content?.rows?.flatMap(r => r.items) || [];
  const heroItems = content?.hero || [];

  const showcaseRow1 = featuredRow || content?.rows?.[0];
  const showcaseRow2 = popularRow || content?.rows?.[1];
  const showcaseRow3 = newMoviesRow || docsRow || content?.rows?.[2];

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="px-4 md:px-12 h-16 md:h-20 flex items-center justify-between max-w-[1400px] mx-auto">
          <img
            src="/assets/bolt-logo-white.png"
            alt="Bolt TV"
            className="h-[29px] md:h-9 w-auto"
            data-testid="img-logo"
          />
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/login">
              <span
                className="text-white/80 hover:text-white font-semibold text-sm transition cursor-pointer uppercase tracking-wide"
                data-testid="button-landing-signin"
              >
                Sign In
              </span>
            </Link>
            <Link href="/subscribe">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 md:px-6 py-2 rounded text-sm transition cursor-pointer uppercase tracking-wide"
                data-testid="button-landing-subscribe"
              >
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0">
            <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-1 md:gap-1.5 w-full h-full">
              {(() => {
                const posterSources = allPosters.length > 0
                  ? [...allPosters.slice(0, 20), ...allPosters.slice(0, 10)].map(p => ({
                      img: p.verticalPosterImage || p.posterImage,
                      title: p.title
                    }))
                  : [
                      { img: "/assets/poster-grit-bo.png", title: "Grit" },
                      { img: "/assets/poster-life-on-ice.png", title: "Life on Ice" },
                      { img: "/assets/poster-full-throttle.png", title: "Full Throttle" },
                      { img: "/assets/poster-rookie.png", title: "Rookie" },
                      { img: "/assets/poster-surfing.png", title: "Surfing" },
                      { img: "/assets/poster-traviesa.png", title: "Traviesa" },
                      { img: "/assets/poster-dtm.png", title: "DTM" },
                      { img: "/assets/poster-grit-arch.png", title: "Grit" },
                      { img: "/assets/poster-action_1.jpg", title: "Action" },
                      { img: "/assets/poster-doc_1.jpg", title: "Documentary" },
                      { img: "/assets/poster-comedy_1.jpg", title: "Comedy" },
                      { img: "/assets/poster-action_2.jpg", title: "Action" },
                      { img: "/assets/poster-doc_2.jpg", title: "Documentary" },
                      { img: "/assets/poster-comedy_2.jpg", title: "Comedy" },
                      { img: "/assets/poster-action_3.jpg", title: "Action" },
                      { img: "/assets/poster-doc_3.jpg", title: "Documentary" },
                      { img: "/assets/poster-grit-bo.png", title: "Grit" },
                      { img: "/assets/poster-life-on-ice.png", title: "Life on Ice" },
                      { img: "/assets/poster-full-throttle.png", title: "Full Throttle" },
                      { img: "/assets/poster-rookie.png", title: "Rookie" },
                      { img: "/assets/poster-surfing.png", title: "Surfing" },
                      { img: "/assets/poster-traviesa.png", title: "Traviesa" },
                      { img: "/assets/poster-dtm.png", title: "DTM" },
                      { img: "/assets/poster-grit-arch.png", title: "Grit" },
                      { img: "/assets/poster-action_1.jpg", title: "Action" },
                      { img: "/assets/poster-doc_1.jpg", title: "Documentary" },
                      { img: "/assets/poster-comedy_1.jpg", title: "Comedy" },
                      { img: "/assets/poster-action_2.jpg", title: "Action" },
                      { img: "/assets/poster-doc_2.jpg", title: "Documentary" },
                      { img: "/assets/poster-comedy_2.jpg", title: "Comedy" },
                    ];
                return posterSources.map((poster, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-md md:rounded-lg"
                    style={{ aspectRatio: "2/3" }}
                  >
                    <img
                      src={poster.img}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                      loading={i < 10 ? "eager" : "lazy"}
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/75 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[0.95] tracking-tight mb-5 md:mb-8">
            <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent drop-shadow-2xl">
              Athlete Stories
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Live Here
            </span>
          </h1>
          <p className="text-gray-300 text-base md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Exclusive sports documentaries, original series, and live events. Stream anywhere, anytime.
          </p>
          <p className="text-gray-400 text-sm md:text-base mb-8 md:mb-10">
            Starting at $7.99/mo. Cancel anytime.
          </p>
          <Link href="/subscribe">
            <button
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-10 md:px-14 py-4 md:py-5 rounded-md text-base md:text-lg transition-all shadow-2xl shadow-purple-500/30 cursor-pointer uppercase tracking-wider"
              data-testid="button-hero-subscribe"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-gray-500 text-xs md:text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-purple-400 hover:text-purple-300 cursor-pointer underline" data-testid="button-hero-signin">
                Sign In
              </span>
            </Link>
          </p>
        </div>
      </section>

      {showcaseRow1 && showcaseRow1.items.length > 0 && (
        <ShowcaseSection
          title={showcaseRow1.title || "Featured Shows & Movies"}
          items={showcaseRow1.items}
          layout="featured"
          testId="section-featured"
        />
      )}

      {showcaseRow2 && showcaseRow2.items.length > 0 && (
        <ShowcaseSection
          title={showcaseRow2.title || "Popular Right Now"}
          items={showcaseRow2.items}
          layout="scroll"
          testId="section-popular"
        />
      )}

      {showcaseRow3 && showcaseRow3.items.length > 0 && (
        <ShowcaseSection
          title={showcaseRow3.title || "New Movies & Documentaries"}
          items={showcaseRow3.items}
          layout="highlight"
          testId="section-movies"
        />
      )}

      <section className="relative py-20 md:py-28 px-4" data-testid="section-features">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-4">
            More Reasons to Love Bolt TV
          </h2>
          <p className="text-gray-400 text-base md:text-lg text-center mb-14 max-w-xl mx-auto">
            Everything you need for the ultimate streaming experience
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Tv,
                title: "Exclusive Originals",
                desc: "Award-winning documentaries and original series you won't find anywhere else.",
              },
              {
                icon: Smartphone,
                title: "Watch on Any Device",
                desc: "Stream on your phone, tablet, laptop, or smart TV. Your content follows you everywhere.",
              },
              {
                icon: Shield,
                title: "Cancel Anytime",
                desc: "No commitments, no contracts, no hidden fees. Simple and transparent pricing.",
              },
              {
                icon: Zap,
                title: "Live Sports & Events",
                desc: "Catch every game, match, and event as it happens with live streaming coverage.",
              },
              {
                icon: Download,
                title: "Pick Up Where You Left Off",
                desc: "Your watch progress syncs automatically across all your devices.",
              },
              {
                icon: Users,
                title: "Family Friendly",
                desc: "Content for everyone in your household with personalized recommendations.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 hover:bg-white/[0.06] hover:border-purple-500/20 transition-all duration-300 group"
                data-testid={`card-feature-${i}`}
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-28 px-4" data-testid="section-pricing">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-4">
            Pick a Plan. Cancel Anytime.
          </h2>
          <p className="text-gray-400 text-base md:text-lg text-center mb-12 max-w-xl mx-auto">
            Start streaming today with the plan that's right for you
          </p>

          {offers.length > 0 ? (
            <div className={`grid gap-6 ${offers.length === 1 ? "max-w-md mx-auto" : offers.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
              {offers.map((offer, i) => {
                const isPopular = i === Math.floor(offers.length / 2) && offers.length > 1;
                return (
                  <div
                    key={offer.id}
                    className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                      isPopular
                        ? "bg-white text-black border-2 border-purple-500 scale-[1.02] shadow-xl shadow-purple-500/10"
                        : "bg-white/[0.04] border border-white/10 hover:border-white/20"
                    }`}
                    data-testid={`card-plan-${i}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className={`text-xl md:text-2xl font-bold mb-2 ${isPopular ? "text-black" : "text-white"}`}>
                      {offer.title}
                    </h3>
                    {offer.description && (
                      <p className={`text-sm mb-4 ${isPopular ? "text-gray-600" : "text-gray-400"}`}>
                        {offer.description}
                      </p>
                    )}
                    <div className="mb-6">
                      <PlanFeatures isPopular={isPopular} tier={i} />
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className={`text-3xl md:text-4xl font-black ${isPopular ? "text-black" : "text-white"}`}>
                        {offer.currency === "USD" ? "$" : offer.currency}{Number(offer.price).toFixed(2)}
                      </span>
                      <span className={`text-sm ${isPopular ? "text-gray-500" : "text-gray-400"}`}>
                        /{offer.period === "month" ? "mo" : offer.period}
                      </span>
                    </div>
                    <Link href={`/subscribe`}>
                      <button
                        className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition cursor-pointer ${
                          isPopular
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        }`}
                        data-testid={`button-choose-plan-${i}`}
                      >
                        Choose
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                {
                  name: "Basic",
                  price: "$7.99",
                  desc: "Watch with ads. Perfect for casual viewers.",
                  features: ["Access to full content library", "Watch on 1 device", "Standard quality"],
                  popular: false,
                },
                {
                  name: "Premium",
                  price: "$12.99",
                  desc: "Watch without ads. The best experience.",
                  features: ["Everything in Basic", "No ads", "Watch on 3 devices", "HD & 4K quality", "Downloads available"],
                  popular: true,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-white text-black border-2 border-purple-500 shadow-xl shadow-purple-500/10"
                      : "bg-white/[0.04] border border-white/10 hover:border-white/20"
                  }`}
                  data-testid={`card-plan-${i}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className={`text-xl md:text-2xl font-bold mb-1 ${plan.popular ? "text-black" : "text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-5 ${plan.popular ? "text-gray-600" : "text-gray-400"}`}>
                    {plan.desc}
                  </p>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-purple-600" : "text-purple-400"}`} />
                        <span className={`text-sm ${plan.popular ? "text-gray-700" : "text-gray-300"}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-3xl md:text-4xl font-black ${plan.popular ? "text-black" : "text-white"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? "text-gray-500" : "text-gray-400"}`}>/mo</span>
                  </div>
                  <Link href="/subscribe">
                    <button
                      className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition cursor-pointer ${
                        plan.popular
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                      data-testid={`button-choose-plan-${i}`}
                    >
                      Choose
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative py-20 md:py-28 px-4" data-testid="section-faq">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-12">
            Questions? We've Got You Covered
          </h2>
          <div>
            <FAQItem
              question="What can I watch on Bolt TV?"
              answer="Bolt TV offers a wide range of content including exclusive sports documentaries, original series, live sports events, movies, and more. New content is added regularly to keep you entertained."
            />
            <FAQItem
              question="How much does Bolt TV cost?"
              answer="Bolt TV offers flexible plans starting at an affordable monthly price. You can choose the plan that fits your needs, and upgrade or downgrade at any time. Cancel anytime with no hidden fees."
            />
            <FAQItem
              question="What devices can I watch on?"
              answer="Bolt TV is available on a wide range of devices including smartphones, tablets, laptops, desktop computers, and smart TVs. Stream at home or on the go—your content follows you everywhere."
            />
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Absolutely. There are no long-term commitments or cancellation fees. You can cancel your subscription at any time from your account settings, and you'll continue to have access until the end of your billing period."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Check our current plans for any available free trial offers. We frequently offer trial periods so you can explore everything Bolt TV has to offer before committing to a plan."
            />
            <FAQItem
              question="How do I get started?"
              answer="Getting started is easy! Click 'Get Started' to choose a plan, create your account with your email address, and you'll be streaming in minutes. It's that simple."
            />
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
            Ready to Start Watching?
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Join thousands of fans already streaming on Bolt TV.
          </p>
          <Link href="/subscribe">
            <button
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded text-lg transition shadow-lg shadow-purple-500/25 mx-auto cursor-pointer uppercase tracking-wide"
              data-testid="button-cta-subscribe"
            >
              <Play className="w-5 h-5 fill-current" />
              Get Started
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PlanFeatures({ isPopular, tier }: { isPopular: boolean; tier: number }) {
  const featureSets = [
    ["Access to full content library", "Watch on 1 device", "Standard quality"],
    ["Everything in Basic", "No ads", "Watch on 3 devices", "HD & 4K quality", "Downloads available"],
    ["Everything in Premium", "Unlimited devices", "Priority support", "Exclusive early access"],
  ];
  const features = featureSets[Math.min(tier, featureSets.length - 1)];
  return (
    <div className="space-y-3">
      {features.map((f, j) => (
        <div key={j} className="flex items-start gap-2">
          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? "text-purple-600" : "text-purple-400"}`} />
          <span className={`text-sm ${isPopular ? "text-gray-700" : "text-gray-300"}`}>{f}</span>
        </div>
      ))}
    </div>
  );
}

function ShowcaseSection({
  title,
  items,
  layout,
  testId,
}: {
  title: string;
  items: LandingItem[];
  layout: "featured" | "scroll" | "highlight";
  testId: string;
}) {
  if (layout === "featured") {
    const heroItem = items[0];
    const sideItems = items.slice(1, 5);
    return (
      <section className="relative py-16 md:py-24 px-4" data-testid={testId}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display font-black text-center mb-10">
            {title}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-auto md:row-span-2 group">
              <img
                src={heroItem.heroImage || heroItem.posterImage}
                alt={heroItem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <span className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                  {heroItem.contentType || "Featured"}
                </span>
                <h3 className="text-xl md:text-3xl font-bold">{heroItem.title}</h3>
                {heroItem.description && (
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2 max-w-md">{heroItem.description}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {sideItems.map((item, i) => (
                <div
                  key={item.id}
                  className="relative rounded-xl overflow-hidden aspect-[2/3] group"
                  data-testid={`card-showcase-${i}`}
                >
                  <img
                    src={item.verticalPosterImage || item.posterImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "scroll") {
    return (
      <section className="relative py-16 md:py-24 px-4" data-testid={testId}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display font-black text-center mb-10">
            {title}
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {items.slice(0, 8).map((item, i) => (
              <div
                key={item.id}
                className="relative shrink-0 w-[140px] md:w-[180px] rounded-xl overflow-hidden group snap-start"
                data-testid={`card-scroll-${i}`}
              >
                <div className="aspect-[2/3]">
                  <img
                    src={item.verticalPosterImage || item.posterImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-semibold text-xs md:text-sm">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const heroItem = items[items.length > 3 ? 3 : 0];
  const sideItems = items.filter(x => x.id !== heroItem.id).slice(0, 3);
  return (
    <section className="relative py-16 md:py-24 px-4" data-testid={testId}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-display font-black text-center mb-10">
          {title}
        </h2>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4 order-2 md:order-1">
            {sideItems.map((item, i) => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden aspect-[2/3] group"
                data-testid={`card-highlight-${i}`}
              >
                <img
                  src={item.verticalPosterImage || item.posterImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-auto group order-1 md:order-2">
            <img
              src={heroItem.heroImage || heroItem.posterImage}
              alt={heroItem.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                {heroItem.contentType || "Featured"}
              </span>
              <h3 className="text-xl md:text-3xl font-bold">{heroItem.title}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
