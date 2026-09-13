"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [accountNumber, setAccountNumber] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] =
    useState(true);
  const [tradeNotifications, setTradeNotifications] =
    useState(true);
  const [securityNotifications, setSecurityNotifications] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] =
    useState("");

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);

      const name =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "";
setFullName(name);
setEmail(session.user.email ?? "");

const { data: profile, error: profileError } =
  await supabase
    .from("profiles")
    .select("account_number")
    .eq("id", session.user.id)
    .maybeSingle();

if (profileError) {
  console.error(
    "Profile account number error:",
    profileError
  );
} else {
  setAccountNumber(
    profile?.account_number ?? ""
  );
}

setLoading(false);
    };

    loadUser();
  }, [router]);

  const displayName =
    fullName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  const handleSaveProfile = async () => {
    setProfileMessage("");

    if (!fullName.trim()) {
      setProfileMessage(
        "Please enter your name."
      );
      return;
    }

    setSavingProfile(true);

    const supabase = createClient();

    const { data, error } =
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

    if (error) {
      console.error(
        "Profile update error:",
        error
      );

      setProfileMessage(
        error.message ||
          "Unable to update your profile."
      );
    } else {
      setUser(data.user);
      setProfileMessage(
        "Profile updated successfully."
      );
    }

    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "Passwords do not match."
      );
      return;
    }

    setChangingPassword(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      console.error(
        "Password update error:",
        error
      );

      setPasswordMessage(
        error.message ||
          "Unable to change password."
      );
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(
        "Password changed successfully."
      );
    }

    setChangingPassword(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading settings...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#dfe5df] bg-white lg:flex">

          {/* LOGO */}
          <div className="flex h-[76px] items-center border-b border-[#edf0ed] px-5">
            <button
              onClick={() =>
                router.push("/account")
              }
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-black text-white">
                IP
              </div>

              <div>
                <div className="text-sm font-bold">
                  Investment Platform
                </div>

                <div className="text-[9px] uppercase tracking-[0.16em] text-[#909991]">
                  Wealth workspace
                </div>
              </div>
            </button>
          </div>

          {/* NAVIGATION */}
          <div className="flex-1 overflow-y-auto px-3 py-5">

            <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Overview
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                label="Overview"
                onClick={() =>
                  router.push("/account")
                }
                icon={<GridIcon />}
              />

              <NavItem
                label="Portfolio"
                onClick={() =>
                  router.push(
                    "/account/portfolio"
                  )
                }
                icon={<PortfolioIcon />}
              />

              <NavItem
                label="Markets"
                onClick={() =>
                  router.push(
                    "/account/markets"
                  )
                }
                icon={<MarketIcon />}
              />

              <NavItem
                label="Trade"
                onClick={() =>
                  router.push("/account/trade")
                }
                icon={<TradeIcon />}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Investing
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                label="Crypto"
                onClick={() =>
                  router.push("/account/crypto")
                }
                icon={<CryptoIcon />}
              />

              <NavItem
                label="Convert"
                onClick={() =>
                  router.push(
                    "/account/convert"
                  )
                }
                icon={<ConvertIcon />}
              />

              <NavItem
                label="Watchlist"
                onClick={() =>
                  router.push(
                    "/account/watchlist"
                  )
                }
                icon={<StarIcon />}
              />

              <NavItem
                label="Orders"
                onClick={() =>
                  router.push(
                    "/account/orders"
                  )
                }
                icon={<OrdersIcon />}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Activity
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                label="Transactions"
                onClick={() =>
                  router.push(
                    "/account/transactions"
                  )
                }
                icon={<ReceiptIcon />}
              />

              <NavItem
                label="Transfers"
                onClick={() =>
                  router.push(
                    "/account/transfers"
                  )
                }
                icon={<TransferIcon />}
              />

              <NavItem
                label="Analytics"
                onClick={() =>
                  router.push(
                    "/account/analytics"
                  )
                }
                icon={<ChartIcon />}
              />

              <NavItem
                label="Support"
                onClick={() =>
                  router.push(
                    "/account/support"
                  )
                }
                icon={<MessageIcon />}
              />
            </nav>
          </div>

          {/* USER */}
          <div className="border-t border-[#edf0ed] p-3">
            <div className="flex items-center gap-3 rounded-xl bg-[#f5f7f3] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcefe4] text-xs font-bold text-[#16805a]">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {displayName}
                </p>

                <p className="truncate text-[9px] text-[#909991]">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#69736c] transition hover:bg-[#f5f7f3] hover:text-[#111613]"
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="min-w-0 flex-1">

          {/* HEADER */}
          <header className="sticky top-0 z-20 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
            <div className="flex h-[76px] items-center justify-between px-5 sm:px-7 lg:px-9">

              <div className="flex items-center gap-3">

                <button
                  onClick={() =>
                    router.push("/account")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] transition hover:text-[#111613]"
                  aria-label="Back"
                >
                  <BackIcon />
                </button>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                    Account
                  </p>

                  <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Settings
                  </h1>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <section className="mx-auto max-w-[1100px] px-5 py-8 sm:px-7 lg:px-9">

            <div>
              <p className="text-sm text-[#7b857e]">
                Manage your profile, security, and account preferences.
              </p>

              <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
                Account settings
              </h2>
            </div>

            {/* PROFILE */}
            <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dcefe4] text-lg font-bold text-[#16805a]">
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-xs text-[#89928b]">
                    Personal information
                  </p>

                  <h3 className="mt-1 text-lg font-semibold">
                    Profile
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
                    Full name
                  </label>

                  <input
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value
                      )
                    }
                    placeholder="Your full name"
                    className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-[#16805a] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
                    Email address
                  </label>

                  <input
                    value={email}
                    readOnly
                    className="mt-2 w-full cursor-not-allowed rounded-xl border border-[#dfe5df] bg-[#f3f5f2] px-4 py-3 text-sm text-[#7b857e] outline-none"
                  />

                  <p className="mt-2 text-[9px] text-[#929b95]">
                    Your login email is managed by your authentication account.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="rounded-xl bg-[#111613] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#242a26] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save changes"}
                </button>

                {profileMessage && (
                  <p className="text-xs text-[#16805a]">
                    {profileMessage}
                  </p>
                )}
              </div>
            </section>
            {/* INVESTMENT ACCOUNT */}
<section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
  <div>
    <p className="text-xs text-[#89928b]">
      Investment account
    </p>

    <h3 className="mt-1 text-lg font-semibold">
      Account number
    </h3>
  </div>

  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
    <div className="min-w-0 flex-1 rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3">
      <p className="break-all text-sm font-semibold tracking-[0.04em] text-[#111613]">
        {accountNumber || "Account number unavailable"}
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        if (accountNumber) {
          navigator.clipboard.writeText(accountNumber);
        }
      }}
      disabled={!accountNumber}
      className="rounded-xl bg-[#111613] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#242a26] disabled:cursor-not-allowed disabled:opacity-50"
    >
      Copy
    </button>
  </div>

  <p className="mt-3 text-[9px] text-[#929b95]">
    Use this account number when receiving transfers from another Investment Platform user.
  </p>
</section>

            {/* SECURITY */}

            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <div>
                <p className="text-xs text-[#89928b]">
                  Account protection
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Security
                </h3>
              </div>

              <div className="mt-6 max-w-xl">

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
                    New password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-[#16805a] focus:bg-white"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
                    Confirm password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-[#16805a] focus:bg-white"
                  />
                </div>

                <p className="mt-2 text-[9px] text-[#929b95]">
                  Use at least 6 characters.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

                  <button
                    onClick={
                      handleChangePassword
                    }
                    disabled={changingPassword}
                    className="rounded-xl bg-[#111613] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#242a26] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {changingPassword
                      ? "Updating..."
                      : "Change password"}
                  </button>

                  {passwordMessage && (
                    <p className="text-xs text-[#16805a]">
                      {passwordMessage}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* NOTIFICATIONS */}
            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <div>
                <p className="text-xs text-[#89928b]">
                  Stay informed
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Notifications
                </h3>
              </div>

              <div className="mt-5 divide-y divide-[#edf0ed]">

                <SettingRow
                  title="Email notifications"
                  description="Receive important account updates by email."
                  enabled={emailNotifications}
                  onChange={() =>
                    setEmailNotifications(
                      !emailNotifications
                    )
                  }
                />

                <SettingRow
                  title="Trade notifications"
                  description="Receive updates when orders are completed."
                  enabled={tradeNotifications}
                  onChange={() =>
                    setTradeNotifications(
                      !tradeNotifications
                    )
                  }
                />

                <SettingRow
                  title="Security notifications"
                  description="Receive alerts about important security activity."
                  enabled={securityNotifications}
                  onChange={() =>
                    setSecurityNotifications(
                      !securityNotifications
                    )
                  }
                />

              </div>

              <p className="mt-4 text-[9px] text-[#929b95]">
                Notification preferences are currently stored locally in this session. We can connect them to Supabase later.
              </p>
            </section>

            {/* PREFERENCES */}
            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <div>
                <p className="text-xs text-[#89928b]">
                  Workspace preferences
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Preferences
                </h3>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
                  <p className="text-xs font-semibold">
                    Display currency
                  </p>

                  <p className="mt-1 text-[9px] text-[#929b95]">
                    Currency used throughout your investment workspace.
                  </p>

                  <div className="mt-4 rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-xs font-semibold">
                    USD — US Dollar
                  </div>
                </div>

                <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
                  <p className="text-xs font-semibold">
                    Account type
                  </p>

                  <p className="mt-1 text-[9px] text-[#929b95]">
                    Your current Investment Platform account.
                  </p>

                  <div className="mt-4 rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-xs font-semibold">
                    Individual
                  </div>
                </div>

              </div>
            </section>

            {/* ACCOUNT ACTIONS */}
            <section className="mt-5 rounded-3xl border border-[#efdada] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <p className="text-xs text-[#89928b]">
                Account management
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Account actions
              </h3>

              <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-[#fffafa] p-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold">
                    Sign out
                  </p>

                  <p className="mt-1 text-[9px] text-[#929b95]">
                    Sign out of your Investment Platform account on this device.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-[#e5cccc] px-5 py-2.5 text-xs font-semibold text-[#c65b5b] transition hover:bg-[#faeeee]"
                >
                  Log out
                </button>

              </div>
            </section>

          </section>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------- */
/* SETTING ROW */
/* -------------------------------- */

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">

      <div>
        <p className="text-xs font-semibold">
          {title}
        </p>

        <p className="mt-1 text-[9px] text-[#929b95]">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        aria-label={title}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-[#16805a]"
            : "bg-[#d5dbd6]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/* -------------------------------- */
/* NAV ITEM */
/* -------------------------------- */

function NavItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#68736b] transition hover:bg-[#f5f7f3] hover:text-[#111613]"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* -------------------------------- */
/* ICONS */
/* -------------------------------- */

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 18V6M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m7 15 4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14M14 4l5 4-5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 16H5m5-4-5 4 5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CryptoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 7v10M13 7v10M9 9h4a2 2 0 1 1 0 4H9h4a2 2 0 1 1 0 4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 7h10l-3-3M17 17H7l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7v4M7 17v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v16H6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14M15 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 16H5m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m7 15 3-3 3 2 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3v-3.5a2.5 2.5 0 0 1-1.5-2.3v-6.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}