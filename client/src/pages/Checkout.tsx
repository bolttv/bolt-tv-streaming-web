import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, CreditCard, Loader2, AlertCircle, Lock, Tag, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getOffers, CleengOffer, formatPrice, getTaxInfo, TaxInfo } from "@/lib/cleeng";
import LoadingSpinner from "@/components/LoadingSpinner";

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

function detectCardBrand(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\s/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return null;
}

function validateExpiry(expiry: string): { valid: boolean; error?: string } {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return { valid: false, error: "Invalid format (MM/YY)" };

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;

  if (month < 1 || month > 12) return { valid: false, error: "Invalid month" };

  const now = new Date();
  const expiryDate = new Date(year, month);
  if (expiryDate <= now) return { valid: false, error: "Card has expired" };

  return { valid: true };
}

function validateCvv(cvv: string, brand: string | null): boolean {
  if (brand === "Amex") return /^\d{4}$/.test(cvv);
  return /^\d{3}$/.test(cvv);
}

interface CardErrors {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardName?: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, cleengCustomer, isLinking, user, isLoading: authLoading } = useAuth();
  const [offer, setOffer] = useState<CleengOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [showPromoField, setShowPromoField] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: any } | null>(null);

  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const offerId = new URLSearchParams(window.location.search).get("offerId");
  const showTax = taxInfo && (taxInfo.taxAmount > 0 || taxInfo.priceInclTax > taxInfo.priceExclTax);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      setLocation("/subscribe");
      return;
    }

    if (isLinking) {
      setLoading(true);
      return;
    }

    const fetchOffer = async () => {
      if (!offerId) {
        const pendingOffer = localStorage.getItem("pending_checkout_offer");
        if (pendingOffer) {
          setLocation(`/checkout?offerId=${encodeURIComponent(pendingOffer)}`);
          return;
        }
        setError("No offer selected");
        setLoading(false);
        return;
      }

      try {
        const offers = await getOffers();
        const selectedOffer = offers.find(o => o.id === offerId || o.longId === offerId);
        if (selectedOffer) {
          setOffer(selectedOffer);
          localStorage.removeItem("pending_checkout_offer");
        } else {
          setError("Offer not found");
        }
      } catch (err) {
        setError("Failed to load offer details");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, isAuthenticated, isLinking, authLoading, user, setLocation]);

  useEffect(() => {
    if (!offer || !offerId) return;

    const fetchTax = async () => {
      setTaxLoading(true);
      try {
        const resolvedOfferId = offer.longId || offer.id || offerId;
        const info = await getTaxInfo(resolvedOfferId);
        if (info) {
          setTaxInfo(info);
        }
      } catch (err) {
        console.error("Failed to fetch tax info:", err);
      } finally {
        setTaxLoading(false);
      }
    };

    fetchTax();
  }, [offer, offerId]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    const digits = formatted.replace(/\s/g, "");
    setCardBrand(detectCardBrand(digits));

    if (touchedFields.has("cardNumber") && digits.length >= 13) {
      if (!luhnCheck(digits)) {
        setCardErrors(prev => ({ ...prev, cardNumber: "Invalid card number" }));
      } else {
        setCardErrors(prev => ({ ...prev, cardNumber: undefined }));
      }
    }
  };

  const handleCardNumberBlur = () => {
    setTouchedFields(prev => new Set(prev).add("cardNumber"));
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length > 0 && digits.length < 13) {
      setCardErrors(prev => ({ ...prev, cardNumber: "Card number is too short" }));
    } else if (digits.length >= 13 && !luhnCheck(digits)) {
      setCardErrors(prev => ({ ...prev, cardNumber: "Invalid card number" }));
    } else {
      setCardErrors(prev => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleExpiryBlur = () => {
    setTouchedFields(prev => new Set(prev).add("expiryDate"));
    if (expiryDate.length > 0) {
      const result = validateExpiry(expiryDate);
      if (!result.valid) {
        setCardErrors(prev => ({ ...prev, expiryDate: result.error }));
      } else {
        setCardErrors(prev => ({ ...prev, expiryDate: undefined }));
      }
    }
  };

  const handleCvvBlur = () => {
    setTouchedFields(prev => new Set(prev).add("cvv"));
    if (cvv.length > 0 && !validateCvv(cvv, cardBrand)) {
      setCardErrors(prev => ({ ...prev, cvv: cardBrand === "Amex" ? "Must be 4 digits" : "Must be 3 digits" }));
    } else {
      setCardErrors(prev => ({ ...prev, cvv: undefined }));
    }
  };

  const handleCardNameBlur = () => {
    setTouchedFields(prev => new Set(prev).add("cardName"));
    if (cardName.trim().length === 0) {
      setCardErrors(prev => ({ ...prev, cardName: "Name is required" }));
    } else if (cardName.trim().length < 2) {
      setCardErrors(prev => ({ ...prev, cardName: "Please enter your full name" }));
    } else {
      setCardErrors(prev => ({ ...prev, cardName: undefined }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: CardErrors = {};
    let valid = true;

    if (!cardName.trim()) {
      errors.cardName = "Name is required";
      valid = false;
    }

    const digits = cardNumber.replace(/\s/g, "");
    if (!digits) {
      errors.cardNumber = "Card number is required";
      valid = false;
    } else if (digits.length < 13) {
      errors.cardNumber = "Card number is too short";
      valid = false;
    } else if (!luhnCheck(digits)) {
      errors.cardNumber = "Invalid card number";
      valid = false;
    }

    if (!expiryDate) {
      errors.expiryDate = "Expiry date is required";
      valid = false;
    } else {
      const expiryResult = validateExpiry(expiryDate);
      if (!expiryResult.valid) {
        errors.expiryDate = expiryResult.error;
        valid = false;
      }
    }

    if (!cvv) {
      errors.cvv = "CVV is required";
      valid = false;
    } else if (!validateCvv(cvv, cardBrand)) {
      errors.cvv = cardBrand === "Amex" ? "Must be 4 digits" : "Must be 3 digits";
      valid = false;
    }

    setCardErrors(errors);
    setTouchedFields(new Set(["cardNumber", "expiryDate", "cvv", "cardName"]));
    return valid;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const response = await fetch("/api/cleeng/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: promoCode.trim(),
          offerId: offerId || offer?.longId || offer?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code");
      } else {
        setAppliedPromo({ code: promoCode.trim(), discount: data.discount });
        setPromoError(null);
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError(null);
  };

  const handleSubscribe = async () => {
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    if (!validateAllFields()) {
      setError("Please fix the card details highlighted above");
      return;
    }

    if (!cleengCustomer?.jwt) {
      setError("Account linking is still in progress. Please wait a moment and try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/cleeng/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offerId || offer?.longId || offer?.id,
          customerToken: cleengCustomer.jwt,
          customerEmail: user?.email || cleengCustomer.email,
          couponCode: appliedPromo?.code || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Payment could not be processed. Please check your card details and try again.");
        setProcessing(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
      } else {
        setError("Payment could not be processed. Please check your card details and try again.");
      }
    } catch (err) {
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || isLinking || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
          <p className="text-gray-400 mb-2">
            Your subscription is now active.
          </p>
          <p className="text-gray-500 text-sm mb-10">
            {offer?.freeDays && offer.freeDays > 0 
              ? `Your ${offer.freeDays}-day free trial has started. You won't be charged until it ends.`
              : `You now have full access to all premium content.`
            }
          </p>
          <Link 
            href="/home"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors cursor-pointer"
            data-testid="button-start-streaming"
          >
            Start Streaming
          </Link>
        </div>
      </div>
    );
  }

  const hasFieldErrors = Object.values(cardErrors).some(e => !!e);

  const displayCurrency = taxInfo?.currency || offer?.price.currency || "USD";
  const subtotalPrice = appliedPromo?.discount?.discountedPrice ?? (taxInfo?.priceExclTax ?? offer?.price.amount ?? 0);
  const taxAmount = taxInfo?.taxAmount ?? 0;
  const totalPrice = showTax
    ? subtotalPrice + taxAmount
    : (appliedPromo?.discount?.discountedPrice ?? offer?.price.amount ?? 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/subscribe" className="inline-flex items-center text-gray-400 hover:text-white mb-8 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to plans
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Name on Card</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        if (touchedFields.has("cardName") && e.target.value.trim().length >= 2) {
                          setCardErrors(prev => ({ ...prev, cardName: undefined }));
                        }
                      }}
                      onBlur={handleCardNameBlur}
                      placeholder="John Smith"
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        cardErrors.cardName ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-white"
                      }`}
                      data-testid="input-card-name"
                    />
                    {cardErrors.cardName && (
                      <p className="text-red-400 text-xs mt-1">{cardErrors.cardName}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-gray-400">Card Number</label>
                      {cardBrand && (
                        <span className="text-xs text-gray-500 font-medium">{cardBrand}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      onBlur={handleCardNumberBlur}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        cardErrors.cardNumber ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-white"
                      }`}
                      data-testid="input-card-number"
                    />
                    {cardErrors.cardNumber && (
                      <p className="text-red-400 text-xs mt-1">{cardErrors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => {
                          setExpiryDate(formatExpiry(e.target.value));
                          if (touchedFields.has("expiryDate")) {
                            const formatted = formatExpiry(e.target.value);
                            const result = validateExpiry(formatted);
                            if (result.valid) {
                              setCardErrors(prev => ({ ...prev, expiryDate: undefined }));
                            }
                          }
                        }}
                        onBlur={handleExpiryBlur}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                          cardErrors.expiryDate ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-white"
                        }`}
                        data-testid="input-expiry"
                      />
                      {cardErrors.expiryDate && (
                        <p className="text-red-400 text-xs mt-1">{cardErrors.expiryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setCvv(val);
                          if (touchedFields.has("cvv") && validateCvv(val, cardBrand)) {
                            setCardErrors(prev => ({ ...prev, cvv: undefined }));
                          }
                        }}
                        onBlur={handleCvvBlur}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                          cardErrors.cvv ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-white"
                        }`}
                        data-testid="input-cvv"
                      />
                      {cardErrors.cvv && (
                        <p className="text-red-400 text-xs mt-1">{cardErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-offset-0"
                      data-testid="checkbox-terms"
                    />
                    <span className="text-sm text-gray-400">
                      I agree to the <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>. 
                      {offer?.freeDays && offer.freeDays > 0 && (
                        <span className="block mt-1 text-gray-500">
                          After the free trial, you will be charged {formatPrice(offer.price.amount, offer.price.currency)}/{offer.billingCycle?.periodUnit || "month"}.
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={processing || hasFieldErrors}
                className="w-full py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors cursor-pointer"
                data-testid="button-subscribe"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {offer?.freeDays && offer.freeDays > 0 
                      ? `Start ${offer.freeDays}-Day Free Trial`
                      : `Subscribe - ${formatPrice(totalPrice, displayCurrency)}`
                    }
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secured with 256-bit SSL encryption</span>
              </div>
            </div>

            <div className="md:w-72 lg:w-80 flex-shrink-0">
              <div className="bg-gray-900 rounded-xl p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                {offer && (
                  <>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-800 min-w-0">
                        <span className="text-gray-400 flex-shrink-0">Plan</span>
                        <span className="font-medium truncate">{offer.title}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Billing</span>
                        <span className="font-medium">
                          {offer.billingCycle?.periodUnit === "year" ? "Yearly" : "Monthly"}
                        </span>
                      </div>

                      {offer.freeDays && offer.freeDays > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                          <span className="text-gray-400">Free Trial</span>
                          <span className="font-medium text-green-500">{offer.freeDays} days</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-2">
                      {(showTax || appliedPromo) && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Subtotal</span>
                          <span className="text-gray-300">
                            {appliedPromo ? (
                              <>
                                <span className="line-through text-gray-500 mr-2">
                                  {formatPrice(taxInfo?.priceExclTax ?? offer.price.amount, displayCurrency)}
                                </span>
                                {formatPrice(appliedPromo.discount.discountedPrice, displayCurrency)}
                              </>
                            ) : (
                              formatPrice(taxInfo?.priceExclTax ?? offer.price.amount, displayCurrency)
                            )}
                          </span>
                        </div>
                      )}

                      {showTax && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">
                            Tax{taxInfo?.taxRate ? ` (${(taxInfo.taxRate * 100).toFixed(1)}%)` : ""}
                          </span>
                          <span className="text-gray-300">
                            {taxLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : (
                              formatPrice(taxAmount, displayCurrency)
                            )}
                          </span>
                        </div>
                      )}

                      {appliedPromo && !showTax && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Discount ({appliedPromo.discount.discountPercent}%)</span>
                          <span className="text-green-400">
                            -{formatPrice(
                              (taxInfo?.priceExclTax ?? offer.price.amount) - appliedPromo.discount.discountedPrice,
                              displayCurrency
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-3 border-t border-gray-700">
                      <span className="text-gray-400">
                        {offer.freeDays && offer.freeDays > 0 ? "Due today" : "Total"}
                      </span>
                      <span className="text-2xl font-bold">
                        {offer.freeDays && offer.freeDays > 0 ? (
                          "$0.00"
                        ) : (
                          formatPrice(totalPrice, displayCurrency)
                        )}
                      </span>
                    </div>

                    {offer.freeDays && offer.freeDays > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Then {formatPrice(showTax ? (taxInfo?.priceInclTax ?? offer.price.amount) : offer.price.amount, displayCurrency)}/{offer.billingCycle?.periodUnit || "month"} after trial ends
                        {showTax && " (tax included)"}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-4 pt-4 border-t border-gray-800">
                  {!appliedPromo ? (
                    <>
                      {!showPromoField ? (
                        <button
                          type="button"
                          onClick={() => setShowPromoField(true)}
                          className="text-sm text-white hover:text-white/80 font-medium cursor-pointer flex items-center gap-1.5"
                          data-testid="button-promo-toggle"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          Have a promo code?
                        </button>
                      ) : (
                        <div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value);
                                if (promoError) setPromoError(null);
                              }}
                              placeholder="Enter code"
                              className={`flex-1 px-3 py-2 bg-gray-800 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none transition-colors ${
                                promoError ? "border-red-500" : "border-gray-700 focus:border-white"
                              }`}
                              disabled={promoLoading}
                              data-testid="input-promo-code"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleApplyPromo();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleApplyPromo}
                              disabled={promoLoading || !promoCode.trim()}
                              className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                              data-testid="button-apply-promo"
                            >
                              {promoLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </button>
                          </div>
                          {promoError && (
                            <p className="text-red-400 text-xs mt-1.5">{promoError}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm text-green-400 font-medium">{appliedPromo.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-gray-400 hover:text-white cursor-pointer"
                        data-testid="button-remove-promo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium mb-3">What's Included</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Unlimited streaming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>HD quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Watch on any device</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    <span>Account: </span>
                    <span className="text-gray-300">{user?.email || cleengCustomer?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
