import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { 
  ChevronDown, ChevronRight, Check, X, Star
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Footer from "@/components/Footer";
import posterGritGlory from "@assets/Grit-Glory-Poster-Web_1770942256469.png";
import posterRookie from "@assets/rookie-web_1770942256470.png";
import posterTraviesa from "@assets/traviesa-web_1770942256471.png";
import posterSurfing from "@assets/ChatGPT_Image_Oct_1,_2025_at_01_26_07_PM_1770942322327.png";
import posterLifeOnIce from "@assets/ChatGPT_Image_Oct_3,_2025,_11_50_56_AM_1770942322329.png";
import sportActionSports from "@assets/Action_Sports-New_1770944151377.png";
import sportBaseball from "@assets/Baseball-New_1770944155832.png";
import sportBasketball from "@assets/Basketball-New_1770944159354.png";
import sportBoxing from "@assets/Boxing-New_1770944162862.png";
import sportFootball from "@assets/Football-New_1770944167300.png";
import sportGaming from "@assets/Gaming-New_1770944173095.png";
import sportGolf from "@assets/Golf-New_1770944179196.png";
import sportHockey from "@assets/Hockey-New_1770944184636.png";
import sportCombat from "@assets/MMA-New_1770944197258.png";
import sportRugby from "@assets/Rugby-New_1770944206484.png";
import logoSamsung from "@assets/Samsung_1770967338626.webp";
import logoAppleTV from "@assets/AppleTV_1770967338626.webp";
import logoPanasonic from "@assets/Panasonic_1770967338626.webp";
import logoChromecast from "@assets/Chromecast_1770967338625.webp";
import logoSony from "@assets/Sony_1770967338625.webp";
import logoLG from "@assets/LG_1770967338625.webp";
import logoRoku from "@assets/Roku_1770967338626.webp";
import logoAmazonFire from "@assets/AmazonFire_1770967338627.webp";
import logoGooglePlay from "@assets/GooglePlay_1770967338627.webp";
import logoAppStore from "@assets/AppStore_1770967338627.webp";
import logoPS5 from "@assets/PS5_1770967338625.webp";
import logoXbox from "@assets/XBOX_1770967338628.webp";
import logoAndroidTV from "@assets/AndroidTV_1770967338628.webp";
import logoHisense from "@assets/Hisense_1770967338627.webp";

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
  price: { amount: number; currency: string; taxIncluded: boolean } | number;
  currency?: string;
  period?: string;
  billingCycle?: { periodUnit: string; amount: number };
  tags?: string[];
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
        <span className="text-base md:text-lg font-semibold text-white pr-4 group-hover:text-[#EAEAEA] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-white shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 pb-5" : "max-h-0"}`}>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function ScrollingPosterBackground({ posters }: { posters: { img: string; title: string }[] }) {
  if (posters.length === 0) return null;
  
  const postersPerColumn = 4;
  const allPosters = [...posters];
  while (allPosters.length < 60) {
    allPosters.push(...posters);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="flex gap-2 w-full h-full justify-center">
        {Array.from({ length: 12 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-2 flex-1 min-w-0"
            style={{
              animation: `scrollPosters ${20 + colIdx * 3}s linear infinite`,
              animationDirection: colIdx % 2 === 0 ? "normal" : "reverse",
            }}
          >
            {Array.from({ length: postersPerColumn * 2 }).map((_, rowIdx) => {
              const poster = allPosters[(colIdx * postersPerColumn + rowIdx) % allPosters.length];
              return (
                <div key={rowIdx} className="w-full rounded-lg overflow-hidden shrink-0" style={{ aspectRatio: "2/3" }}>
                  <img
                    src={poster.img}
                    alt={poster.title}
                    className="w-full h-full object-cover"
                    loading={rowIdx < 2 ? "eager" : "lazy"}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
    </div>
  );
}

const originalPosters = [
  { img: posterGritGlory, title: "Grit & Glory" },
  { img: posterRookie, title: "Rookie" },
  { img: posterTraviesa, title: "Traviesa" },
  { img: posterSurfing, title: "Surfing the Midnight Sun" },
  { img: posterLifeOnIce, title: "Life on Ice" },
];

function OriginalsBanner() {
  return (
    <section className="relative overflow-hidden" data-testid="section-originals-banner">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/originals-banner.mov" type="video/quicktime" />
        <source src="/assets/originals-banner.mov" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />


      <div className="relative z-10 pt-[84px] md:pt-[116px] px-6 md:px-16">
        <div className="max-w-2xl mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase leading-tight mb-4">
            Exclusive<br />Originals
          </h2>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-md">
            Award-winning series and documentaries you won't find anywhere else. Only on Bolt TV.
          </p>
          <Link href="/subscribe">
            <button className="bg-white hover:bg-white/90 text-black font-bold px-8 py-3 rounded-lg text-sm transition cursor-pointer uppercase tracking-wide w-fit" data-testid="button-originals-cta">
              Get Started
            </button>
          </Link>
        </div>

        <div className="pb-14">
          <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
            {originalPosters.map((poster, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[180px] md:w-[239px] rounded-lg overflow-hidden group cursor-pointer"
                style={{ aspectRatio: "2/3" }}
                data-testid={`originals-poster-${i}`}
              >
                <img
                  src={poster.img}
                  alt={poster.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, authStep, isLoading } = useAuth();
  const [content, setContent] = useState<{ rows: LandingRow[]; hero: LandingItem[] } | null>(null);
  const [offers, setOffers] = useState<CleengOffer[]>([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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

  const allPosters = content?.rows?.flatMap(r => r.items) || [];
  const posterSources = allPosters.length > 0
    ? allPosters.map(p => ({ img: p.verticalPosterImage || p.posterImage, title: p.title }))
    : [
        { img: "/assets/poster-grit-bo.png", title: "Grit" },
        { img: "/assets/poster-life-on-ice.png", title: "Life on Ice" },
        { img: "/assets/poster-full-throttle.png", title: "Full Throttle" },
        { img: "/assets/poster-rookie.png", title: "Rookie" },
        { img: "/assets/poster-surfing.png", title: "Surfing" },
        { img: "/assets/poster-traviesa.png", title: "Traviesa" },
        { img: "/assets/poster-dtm.png", title: "DTM" },
        { img: "/assets/poster-grit-arch.png", title: "Grit" },
      ];

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleGetStarted = () => {
    if (!email.trim() || !isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setLocation(`/subscribe?email=${encodeURIComponent(email.trim())}`);
  };

  const getOfferPrice = (offer: CleengOffer): number => {
    if (typeof offer.price === "object" && offer.price !== null) {
      return offer.price.amount;
    }
    return Number(offer.price);
  };

  const getOfferCurrency = (offer: CleengOffer): string => {
    if (typeof offer.price === "object" && offer.price !== null) {
      return offer.price.currency;
    }
    return offer.currency || "USD";
  };

  const getOfferPeriod = (offer: CleengOffer): string => {
    if (offer.billingCycle?.periodUnit) {
      return offer.billingCycle.periodUnit;
    }
    return offer.period?.replace("/", "") || "month";
  };

  const isPopularOffer = (offer: CleengOffer): boolean => {
    return (offer.tags || []).some(t => 
      t.toLowerCase().includes("popular") || t.toLowerCase().includes("most value")
    );
  };

  const planFeatureMap: Record<string, Record<string, boolean | string>> = {
    "Basic": {
      "Full content library": true,
      "Ad-supported": true,
      "Simultaneous streams": "1",
      "Video quality": "HD",
      "Offline downloads": false,
      "Live events": false,
    },
    "Premium": {
      "Full content library": true,
      "Ad-supported": false,
      "Simultaneous streams": "3",
      "Video quality": "4K Ultra HD",
      "Offline downloads": true,
      "Live events": true,
    },
  };

  const planDescMap: Record<string, string> = {
    "Basic": "Great for casual fans",
    "Premium": "Best value for sports fans",
  };

  const planNames = [...new Set(offers.map(o => o.title))];

  const getOfferForPlan = (planName: string, period: string) => {
    return offers.find(o => o.title === planName && getOfferPeriod(o) === period);
  };

  const lowestPrice = offers
    .filter(o => getOfferPeriod(o) === "month")
    .reduce((min, o) => Math.min(min, getOfferPrice(o)), Infinity);

  const startingPrice = lowestPrice < Infinity ? `$${lowestPrice.toFixed(2)}` : "$5.99";

  const savingsPercent = (() => {
    if (planNames.length === 0) return 16;
    const first = planNames[0];
    const mo = getOfferForPlan(first, "month");
    const yr = getOfferForPlan(first, "year");
    if (mo && yr) {
      const monthlyCost = getOfferPrice(mo) * 12;
      const yearlyCost = getOfferPrice(yr);
      return Math.round((1 - yearlyCost / monthlyCost) * 100);
    }
    return 16;
  })();

  const featureKeys = planNames.length > 0 
    ? Object.keys(planFeatureMap[planNames[0]] || planFeatureMap["Basic"])
    : Object.keys(planFeatureMap["Basic"]);

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes scrollPosters {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <img
              src="/assets/bolt-logo-white.png"
              alt="Bolt TV"
              className="h-[29px] md:h-9 w-auto hover:opacity-90 transition cursor-pointer"
              data-testid="img-logo"
            />
          </Link>
          <div className="flex items-center gap-4 md:gap-6 text-white/80 flex-shrink-0">
            <Link href="/login">
              <span
                className="flex items-center gap-2 hover:text-white transition font-bold text-sm flex-shrink-0 cursor-pointer"
                data-testid="button-landing-signin"
              >
                Sign In
              </span>
            </Link>
            <Link href="/subscribe">
              <button
                className="bg-white hover:bg-white/90 text-black font-bold px-5 md:px-6 py-2 rounded text-sm transition cursor-pointer uppercase tracking-wide"
                data-testid="button-landing-subscribe"
              >
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner - Short with scrolling poster background */}
      <section className="relative h-[75vh] flex items-center justify-center overflow-hidden pt-16" data-testid="section-hero">
        <ScrollingPosterBackground posters={posterSources} />
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight tracking-tight mb-3 md:mb-4 text-white">
            Athlete Stories Live Here
          </h1>
          <p className="text-white/80 text-sm md:text-lg max-w-xl mx-auto mb-2 leading-relaxed">
            Exclusive sports documentaries, original series, and live events.
          </p>
          <p className="text-white/60 text-xs md:text-sm mb-6">
            Starting at {startingPrice}/mo. Cancel anytime.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2" data-testid="hero-email-form">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent backdrop-blur-sm text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
                data-testid="input-hero-email"
              />
              <button
                onClick={handleGetStarted}
                className="bg-white hover:bg-white/90 text-black font-bold px-6 py-3 rounded-lg text-sm transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                data-testid="button-hero-getstarted"
              >
                Get Started
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-2 text-left" data-testid="text-email-error">{emailError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Table with Monthly/Yearly Toggle */}
      <section className="relative py-16 md:py-24 px-4" data-testid="section-pricing">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display font-black text-center mb-3 text-white">
            Pick Your Plan. Cancel Anytime.
          </h2>
          <p className="text-gray-400 text-sm md:text-base text-center mb-8 max-w-lg mx-auto">
            Choose the plan that's right for you
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center mb-10" data-testid="pricing-toggle">
            <div className="bg-white/10 rounded-full p-1 flex items-center">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  billingCycle === "monthly" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                }`}
                data-testid="toggle-monthly"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                }`}
                data-testid="toggle-yearly"
              >
                Yearly
                {savingsPercent > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${billingCycle === "yearly" ? "bg-black/20" : "bg-white/20 text-white"}`}>
                    Save {savingsPercent}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Plan Cards from Cleeng */}
          <div className={`grid gap-5 mb-12 ${planNames.length === 1 ? "max-w-md mx-auto" : planNames.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
            {planNames.map((planName, i) => {
              const period = billingCycle === "monthly" ? "month" : "year";
              const offer = getOfferForPlan(planName, period);
              if (!offer) return null;
              const price = getOfferPrice(offer);
              const currency = getOfferCurrency(offer);
              const popular = isPopularOffer(offer);
              const desc = planDescMap[planName] || offer.description || "";

              return (
                <div
                  key={offer.id}
                  className="relative rounded-2xl p-6 md:p-8 transition-all duration-300 bg-white/[0.04] border border-white/10 hover:border-white/20"
                  data-testid={`card-plan-${i}`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-white text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1 text-white">
                    {planName}
                  </h3>
                  {desc && (
                    <p className="text-sm mb-4 text-gray-400">
                      {desc}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {currency === "USD" ? "$" : currency}{price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  <Link href="/subscribe">
                    <button
                      className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      data-testid={`button-choose-plan-${i}`}
                    >
                      Get Started
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto" data-testid="comparison-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-3 text-gray-400 font-medium">Features</th>
                  {planNames.map((planName, i) => {
                    const offer = getOfferForPlan(planName, billingCycle === "monthly" ? "month" : "year");
                    const popular = offer ? isPopularOffer(offer) : false;
                    return (
                      <th key={i} className={`py-4 px-3 text-center font-bold ${popular ? "text-white" : "text-white"}`}>
                        {planName}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {featureKeys.map((featureKey) => (
                  <tr key={featureKey} className="border-b border-white/5">
                    <td className="py-3 px-3 text-gray-300">
                      {featureKey}
                    </td>
                    {planNames.map((planName, i) => {
                      const features = planFeatureMap[planName] || planFeatureMap["Basic"];
                      const val = features[featureKey];
                      const offer = getOfferForPlan(planName, billingCycle === "monthly" ? "month" : "year");
                      const popular = offer ? isPopularOffer(offer) : false;
                      return (
                        <td key={i} className="py-3 px-3 text-center">
                          {val === true ? (
                            <Check className="w-5 h-5 text-white mx-auto" />
                          ) : val === false ? (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <OriginalsBanner />

      {/* Athlete Driven Series */}
      <section className="relative py-16 md:py-24 px-4" data-testid="section-athlete-series">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 block">Real Stories</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-white">
                Athlete Driven Series
              </h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6">
                Go beyond the highlights. Our athlete-driven series puts you in the locker room, on the training ground, and inside the minds of the world's greatest competitors. Raw, real, and unfiltered.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-black flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm">Featuring 100+ athlete stories</p>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                {(allPosters.slice(4, 8).length > 0 ? allPosters.slice(4, 8) : [
                  { verticalPosterImage: "/assets/poster-surfing.png", posterImage: "/assets/poster-surfing.png", title: "Surfing" },
                  { verticalPosterImage: "/assets/poster-traviesa.png", posterImage: "/assets/poster-traviesa.png", title: "Traviesa" },
                  { verticalPosterImage: "/assets/poster-dtm.png", posterImage: "/assets/poster-dtm.png", title: "DTM" },
                  { verticalPosterImage: "/assets/poster-grit-arch.png", posterImage: "/assets/poster-grit-arch.png", title: "Grit" },
                ]).map((item, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[2/3] group">
                    <img
                      src={item.verticalPosterImage || item.posterImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Across Every Sport */}
      <section className="relative py-16 md:py-24 overflow-hidden" data-testid="section-every-sport">
        <div className="max-w-6xl mx-auto px-4 mb-10">
          <div className="text-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 block">Worldwide Coverage</span>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white">
              Stories Across Every Sport
            </h2>
          </div>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-4 animate-scroll-sports">
            {[
              { img: sportFootball, label: "Football" },
              { img: sportBasketball, label: "Basketball" },
              { img: sportBaseball, label: "Baseball" },
              { img: sportHockey, label: "Hockey" },
              { img: sportGolf, label: "Golf" },
              { img: sportBoxing, label: "Boxing" },
              { img: sportCombat, label: "Combat" },
              { img: sportActionSports, label: "Action Sports" },
              { img: sportRugby, label: "Rugby" },
              { img: sportGaming, label: "Gaming" },
              { img: sportFootball, label: "Football" },
              { img: sportBasketball, label: "Basketball" },
              { img: sportBaseball, label: "Baseball" },
              { img: sportHockey, label: "Hockey" },
              { img: sportGolf, label: "Golf" },
              { img: sportBoxing, label: "Boxing" },
              { img: sportCombat, label: "Combat" },
              { img: sportActionSports, label: "Action Sports" },
              { img: sportRugby, label: "Rugby" },
              { img: sportGaming, label: "Gaming" },
            ].map((sport, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-[180px] md:w-[239px] rounded-xl overflow-hidden group cursor-pointer"
                data-testid={`sport-card-${sport.label.toLowerCase().replace(/\s+/g, "-")}-${i}`}
              >
                <img
                  src={sport.img}
                  alt={sport.label}
                  className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* So Many Ways To Watch */}
      <section className="relative py-16 md:py-24 px-4 bg-black" data-testid="section-supported-devices">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-black mb-2 text-white leading-tight">
            Watch on your favorite devices.
          </h2>
          <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-white/70 italic leading-tight">
            Anytime. Anywhere.
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you are at home or on the go, Bolt TV is available on a wide range of mobile and connected devices including Smart TVs, Chromecast, Playstation, Xbox and more.
          </p>

          <div className="border-t border-white/10 pt-10 mb-10">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Our leading supported devices</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14 md:gap-y-10 mb-10">
            <img src={logoSamsung} alt="Samsung" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoAppleTV} alt="Apple TV" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoPanasonic} alt="Panasonic" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoChromecast} alt="Chromecast" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoSony} alt="Sony" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoLG} alt="LG" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoRoku} alt="Roku" className="h-3.5 md:h-5 w-auto object-contain" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14 md:gap-y-10">
            <img src={logoAmazonFire} alt="Amazon Fire TV" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoGooglePlay} alt="Google Play" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoAppStore} alt="App Store" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoPS5} alt="PS5" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoXbox} alt="Xbox" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoAndroidTV} alt="Android TV" className="h-3.5 md:h-5 w-auto object-contain" />
            <img src={logoHisense} alt="Hisense" className="h-3.5 md:h-5 w-auto object-contain" />
          </div>

          <p className="text-gray-500 text-xs md:text-sm mt-10">
            For more information see our full list of <a href="#" className="text-white hover:text-white/80 underline">supported devices</a>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-16 md:py-24 px-4" data-testid="section-faq">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display font-black text-center mb-10 text-white">
            Frequently Asked Questions
          </h2>
          <div>
            <FAQItem
              question="What can I watch on Bolt TV?"
              answer="Bolt TV offers a wide range of content including exclusive sports documentaries, original series, live sports events, movies, and more. New content is added regularly to keep you entertained."
            />
            <FAQItem
              question="How much does Bolt TV cost?"
              answer={`Bolt TV offers flexible plans starting at ${startingPrice}/month. Save up to ${savingsPercent}% with annual billing. Cancel anytime with no hidden fees.`}
            />
            <FAQItem
              question="What devices can I watch on?"
              answer="Bolt TV is available on smartphones, tablets, laptops, desktop computers, and smart TVs. Stream at home or on the go — your content follows you everywhere."
            />
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Absolutely. There are no long-term commitments or cancellation fees. Cancel your subscription at any time from your account settings, and you'll continue to have access until the end of your billing period."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Check our current plans for any available free trial offers. We frequently offer trial periods so you can explore everything Bolt TV has to offer before committing."
            />
            <FAQItem
              question="How do I get started?"
              answer="Enter your email above or click 'Get Started', choose a plan, create your account, and you'll be streaming in minutes."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-14 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-display font-black mb-3 text-white">
            Ready to Start Watching?
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-6">
            Join thousands of fans already streaming on Bolt TV.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
                data-testid="input-cta-email"
              />
              <button
                onClick={handleGetStarted}
                className="bg-white hover:bg-white/90 text-black font-bold px-6 py-3 rounded-lg text-sm transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                data-testid="button-cta-getstarted"
              >
                Get Started
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-2 text-left" data-testid="text-cta-email-error">{emailError}</p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
