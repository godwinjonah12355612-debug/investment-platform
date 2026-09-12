"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
};
type AssetRow = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_24h: number | null;
};

const BITCOIN_PAYMENT_ADDRESS =
  "bc1qwx90w9s588gyev4qrw45fe57gq5pwrhctte8f2";

function CryptoTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<CryptoAsset[]>([]);

  const [selectedSymbol, setSelectedSymbol] = useState(
    searchParams.get("symbol") || "BTC"
  );

  const [side, setSide] = useState<"buy" | "sell">(
  searchParams.get("side") === "sell"
    ? "sell"
    : "buy"
);
  const [quantity, setQuantity] = useState("1");

  const [showPayment, setShowPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        setUser(user);

        const { data, error } = await supabase
          .from("assets")
          .select(
  "id, symbol, name, current_price, price_change_24h"
)
          .eq("is_active", true)
          .eq("asset_type", "crypto")
          .order("symbol");

        if (error) {
          console.error("Crypto trade assets error:", error);
          setMessage("Unable to load crypto assets.");
          return;
        }

        const formattedAssets: CryptoAsset[] = (
          (data ?? []) as AssetRow[]
        ).map((asset) => ({
  id: asset.id,
  symbol: asset.symbol,
  name: asset.name,
          price: Number(asset.current_price ?? 0),
          change: Number(asset.price_change_24h ?? 0),
        }));

        setAssets(formattedAssets);
      } catch (error) {
        console.error("Crypto trade loading error:", error);
        setMessage("Unable to load the crypto trading page.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const selectedAsset = useMemo(() => {
    return (
      assets.find((asset) => asset.symbol === selectedSymbol) ??
      assets[0]
    );
  }, [assets, selectedSymbol]);

  const numericQuantity = Number(quantity) || 0;

  const estimatedTotal =
    numericQuantity * (selectedAsset?.price ?? 0);

  const copyBitcoinAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        BITCOIN_PAYMENT_ADDRESS
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

  const handleBuy = async () => {
  if (!user) {
    setMessage("Please sign in again.");
    return;
  }

  if (!selectedAsset) {
    setMessage("Please select a crypto asset.");
    return;
  }

  if (numericQuantity <= 0) {
    setMessage("Enter a valid quantity.");
    return;
  }

  setSubmitting(true);
  setMessage("");

  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "buy_crypto",
      {
        p_asset_id: selectedAsset.id,
        p_quantity: numericQuantity,
      }
    );

    if (error) {
      console.error("Crypto buy error message:", error?.message);
console.error("Crypto buy error details:", error?.details);
console.error("Crypto buy error hint:", error?.hint);
console.error("Crypto buy error code:", error?.code);
console.error("Crypto buy error string:", String(error));


setMessage(
  error?.message ||
    error?.details ||
    error?.hint ||
    String(error) ||
    "Unable to complete the purchase."
);
      setSubmitting(false);
      return;
    }

    setMessage(
      `Purchase successful. You bought ${numericQuantity} ${selectedAsset.symbol}.`
    );

    setQuantity("0");
    setSubmitting(false);
  } catch (error) {
    console.error("Crypto buy error:", error);
    setMessage("Unable to complete the purchase.");
    setSubmitting(false);
  }
};

const handleContinue = () => {
  setMessage("");

  if (paymentSubmitted) {
    return;
  }

  if (numericQuantity <= 0) {
    setMessage("Enter a valid quantity.");
    return;
  }

  if (!selectedAsset || selectedAsset.price <= 0) {
    setMessage("Invalid crypto price.");
    return;
  }

  if (side === "buy") {
    handleBuy();
    return;
  }

  setShowPayment(true);
};
  const handlePaymentSubmit = async () => {
    if (paymentSubmitted) {
      setMessage(
        "This payment has already been submitted for review."
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

    if (numericQuantity <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }

    if (!selectedAsset || selectedAsset.price <= 0) {
      setMessage("Invalid crypto price.");
      return;
    }

    setSubmitting(true);
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
          "Payment slip upload error:",
          uploadError
        );

        setMessage(
          "Unable to upload the payment slip. Please try again."
        );
        setSubmitting(false);
        return;
      }

      const { error: requestError } = await supabase
        .from("crypto_payment_requests")
        .insert({
          user_id: user.id,
          asset_symbol: selectedAsset.symbol,
          side,
          quantity: numericQuantity,
          price: selectedAsset.price,
          estimated_total: estimatedTotal,
          payment_address: BITCOIN_PAYMENT_ADDRESS,
          payment_slip_path: filePath,
          status: "pending",
        });

      if (requestError) {
        console.error(
          "Crypto payment request error:",
          requestError
        );

        setMessage(
          "The payment slip was uploaded, but the order could not be created. Please contact support."
        );
        setSubmitting(false);
        return;
      }

      setPaymentSubmitted(true);
      setMessage(
        "Payment slip submitted for review. Your order will remain pending until the payment is reviewed."
      );
      setSubmitting(false);
    } catch (error) {
      console.error(
        "Payment submission error:",
        error
      );

      setMessage(
        "Unable to submit the payment slip. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading crypto trading...
        </p>
      </main>
    );
  }

  if (!selectedAsset) {
    return (
      <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
        <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1100px] items-center px-5 sm:px-7 lg:px-9">
            <button
              type="button"
              onClick={() => router.push("/account/crypto")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c]"
              aria-label="Back"
            >
              <BackIcon />
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-[700px] px-5 py-16 text-center sm:px-7">
          <div className="rounded-3xl border border-[#dfe5df] bg-white p-8 shadow-[0_12px_35px_rgba(20,35,25,0.04)]">
            <p className="text-lg font-semibold">
              No crypto assets available
            </p>

            <p className="mt-2 text-sm leading-6 text-[#7b857e]">
              There are currently no active crypto assets
              available for trading.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1100px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/account/crypto")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Crypto workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold">
                Buy & Sell Crypto
              </h1>
            </div>
          </div>

          <div
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
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[900px] px-5 py-8 sm:px-7 lg:px-9">
        <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_15px_45px_rgba(20,35,25,0.05)] sm:p-7">
          {/* HEADER */}
          <div>
            <p className="text-xs text-[#89928b]">
              Crypto order
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              {side === "buy" ? "Buy" : "Sell"} crypto
            </h2>
          </div>

          {/* ASSET */}
          <div className="mt-6">
            <label className="text-xs font-semibold">
              Select asset
            </label>

            <select
              value={selectedSymbol}
              disabled={paymentSubmitted}
              onChange={(e) => {
                setSelectedSymbol(e.target.value);
                setShowPayment(false);
                setPaymentSlip(null);
                setPaymentSubmitted(false);
                setMessage("");
              }}
              className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assets.map((asset) => (
                <option
                  key={asset.symbol}
                  value={asset.symbol}
                >
                  {asset.symbol} — {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* BUY / SELL */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f5f7f3] p-1">
            <button
              type="button"
              disabled={paymentSubmitted}
              onClick={() => {
  setSide("buy");
  setQuantity("0");
  setShowPayment(false);
  setPaymentSlip(null);
  setPaymentSubmitted(false);
  setMessage("");
}}
              className={`rounded-lg py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                side === "buy"
                  ? "bg-[#16805a] text-white"
                  : "text-[#727c75]"
              }`}
            >
              Buy
            </button>

            <button
              type="button"
              disabled={paymentSubmitted}
              onClick={() => {
  setSide("sell");
  setQuantity("0");
  setShowPayment(false);
  setPaymentSlip(null);
  setPaymentSubmitted(false);
  setMessage("");
}}
              className={`rounded-lg py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                side === "sell"
                  ? "bg-[#111613] text-white"
                  : "text-[#727c75]"
              }`}
            >
              Sell
            </button>
          </div>

          {/* ASSET PRICE */}
          <div className="mt-6 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {selectedAsset.symbol}
                </p>

                <p className="mt-1 text-[10px] text-[#89928b]">
                  {selectedAsset.name}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatCurrency(selectedAsset.price)}
                </p>

                <p
                  className={`text-[10px] font-semibold ${
                    selectedAsset.change >= 0
                      ? "text-[#16805a]"
                      : "text-[#c65b5b]"
                  }`}
                >
                  {selectedAsset.change >= 0 ? "+" : ""}
                  {selectedAsset.change.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mt-6">
            <label className="text-xs font-semibold">
              Quantity
            </label>

            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              disabled={paymentSubmitted}
              onChange={(e) => {
                setQuantity(e.target.value);
                setShowPayment(false);
                setPaymentSlip(null);
                setMessage("");
              }}
              className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* TOTAL */}
          <div className="mt-5 rounded-2xl border border-[#edf0ed] bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#778178]">
                Estimated total
              </span>

              <span className="text-xl font-semibold">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
          </div>

          {/* CONTINUE */}
          {!showPayment && !paymentSubmitted && (
            <button
              type="button"
              onClick={handleContinue}
              className={`mt-6 h-12 w-full rounded-xl text-sm font-semibold text-white transition ${
                side === "buy"
                  ? "bg-[#16805a] hover:bg-[#126d4d]"
                  : "bg-[#111613] hover:bg-[#1b241f]"
              }`}
            >
              Continue with{" "}
              {side === "buy" ? "Buy" : "Sell"}
            </button>
          )}

          {/* PAYMENT */}
          {showPayment && side === "sell" && (
            <div className="mt-6 rounded-2xl border border-[#dfe5df] bg-[#f8faf7] p-5">
             <p className="text-sm font-semibold">
  Complete your sale
</p>
             <p className="mt-2 text-xs leading-5 text-[#7b857e]">
  Use the  wallet address below for the required transaction instructions. Copy the address carefully before proceeding.
</p>
              {/* WALLET ADDRESS */}
              <div className="mt-4 rounded-xl border border-[#dfe5df] bg-white p-4">
                <p className="break-all text-xs font-medium leading-6 text-[#4f5a52]">
                  {BITCOIN_PAYMENT_ADDRESS}
                </p>
              </div>

              {/* COPY */}
{side === "sell" && (
  <button
    type="button"
    disabled={paymentSubmitted}
    onClick={copyBitcoinAddress}
    className="mt-3 w-full rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-xs font-semibold text-[#111613] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {copied ? "Copied ✓" : "Copy address"}
  </button>
)}

              {/* PAYMENT SLIP */}
              {!paymentSubmitted && (
                <>
                  <div className="mt-5">
                    <label
                      htmlFor="payment-slip"
                      className="text-xs font-semibold"
                    >
                      Upload payment slip
                    </label>

                    <input
                      id="payment-slip"
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
                    disabled={submitting || !paymentSlip}
                    onClick={handlePaymentSubmit}
                    className="mt-5 h-12 w-full rounded-xl bg-[#16805a] text-sm font-semibold text-white transition hover:bg-[#126d4d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit payment slip"}
                  </button>
                </>
              )}

              {/* SUBMITTED STATE */}
              {paymentSubmitted && (
                <div className="mt-5 rounded-xl border border-[#cfe1d5] bg-[#eef7f1] px-4 py-4 text-center">
                  <p className="text-sm font-semibold text-[#16805a]">
                    Payment slip submitted
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-[#68736b]">
                    Your payment slip has been received and
                    your {side} order is pending review.
                    Your crypto balance will not be updated
                    until the payment is reviewed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <div className="mt-5 rounded-xl border border-[#dfe5df] bg-[#f5f7f3] px-4 py-4 text-center text-xs leading-5 text-[#68736b]">
              {message}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function BackIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function CryptoTradePage() {
  return (
    <Suspense fallback={null}>
      <CryptoTradeContent />
    </Suspense>
  );
}