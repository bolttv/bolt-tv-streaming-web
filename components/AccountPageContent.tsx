"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, updateProfile } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Mail, Lock, CreditCard, UserIcon, CheckCircle, AlertTriangle } from "lucide-react";

export default function AccountSettings() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, hasActiveSubscription } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  const isEmailVerified = !!user?.email_confirmed_at;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

      await supabase?.auth.updateUser({
        data: { first_name: firstName, last_name: lastName, display_name: displayName },
      });

      await updateProfile(user.id, {
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName,
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError("Failed to update profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await supabase!.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err) {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setResendError("");
    setResendSuccess(false);

    try {
      const { error } = await supabase!.auth.resend({ type: "signup", email: user.email });
      if (error) {
        setResendError(error.message);
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err) {
      setResendError("Failed to resend verification email.");
    } finally {
      setResendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const subscriptionTier = profile?.subscription_tier || "free";
  const billingPeriod = profile?.billing_period;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="pt-24 md:pt-28 pb-16 px-4 md:px-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-account-title">
            Account Settings
          </h1>

          {!isEmailVerified && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm" data-testid="banner-email-verification">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-200 text-sm">
                    Your email hasn&apos;t been verified yet. Check your inbox or click here to resend the verification email.
                  </p>
                  {resendSuccess && (
                    <p className="text-green-400 text-sm mt-2" data-testid="text-resend-success">
                      Verification email sent! Check your inbox.
                    </p>
                  )}
                  {resendError && (
                    <p className="text-red-400 text-sm mt-2" data-testid="text-resend-error">
                      {resendError}
                    </p>
                  )}
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="mt-3 bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-400 transition disabled:opacity-50"
                    data-testid="button-resend-verification"
                  >
                    {resendingEmail ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/[0.04] rounded-2xl p-8 backdrop-blur-sm border border-white/10" data-testid="section-profile">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/60 text-sm cursor-not-allowed"
                    data-testid="input-email"
                  />
                  {isEmailVerified && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {profileSuccess && (
                <p className="text-green-400 text-sm" data-testid="text-profile-success">
                  Profile updated successfully!
                </p>
              )}
              {profileError && (
                <p className="text-red-400 text-sm" data-testid="text-profile-error">
                  {profileError}
                </p>
              )}

              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50"
                data-testid="button-save-profile"
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-2xl p-8 backdrop-blur-sm border border-white/10" data-testid="section-subscription">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Subscription Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Current Plan</label>
                {subscriptionTier === "free" ? (
                  <div>
                    <p className="text-white text-sm" data-testid="text-subscription-status">No active subscription</p>
                    <button
                      onClick={() => router.push("/subscribe")}
                      className="mt-3 bg-white text-black font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition"
                      data-testid="button-subscribe"
                    >
                      Subscribe Now
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-white text-sm capitalize" data-testid="text-subscription-tier">
                      {subscriptionTier}
                    </p>
                    {billingPeriod && billingPeriod !== "none" && (
                      <p className="text-gray-400 text-sm mt-1 capitalize" data-testid="text-billing-period">
                        Billing: {billingPeriod}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-2xl p-8 backdrop-blur-sm border border-white/10" data-testid="section-password">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Password Management</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  data-testid="input-current-password"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  data-testid="input-new-password"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  data-testid="input-confirm-password"
                />
              </div>

              {passwordSuccess && (
                <p className="text-green-400 text-sm" data-testid="text-password-success">
                  Password updated successfully!
                </p>
              )}
              {passwordError && (
                <p className="text-red-400 text-sm" data-testid="text-password-error">
                  {passwordError}
                </p>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving}
                className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50"
                data-testid="button-change-password"
              >
                {passwordSaving ? "Updating..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
