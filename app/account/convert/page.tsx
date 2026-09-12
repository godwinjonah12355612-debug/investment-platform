"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Currency = {
  symbol: string;
  name: string;
  price: number;
  type: "cash" | "crypto";
};

const currencies: Currency[] = [
  {
    symbol: "USD",
    name: "US Dollar",
    price: 1,
    type: "cash",
  },
  {
    symbol: "EUR",
    name: "Euro",
    price: 1.08,
    type: "cash",
  },
  {
    symbol: "GBP",
    name: "British Pound",
    price: 1.27,
    type: "cash",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 108420,
    type: "crypto",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 4120,
    type: "crypto",
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 214.72,
    type: "crypto",
  },
];

export default function ConvertPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
const [balanceLoading, setBalanceLoading] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router]);
  useEffect(() => {
  const loadAvailableBalance = async () => {
    if (!user) return;

    setBalanceLoading(true);

    const supabase = createClient();

    if (["USD", "EUR", "GBP"].includes(fromCurrency)) {
      const { data, error } = await supabase
        .from("cash_balances")
        .select("available_balance")
        .eq("user_id", user.id)
        .eq("currency", fromCurrency)
        .maybeSingle();

      if (error) {
        console.error("Available cash balance error:", error);
        setAvailableBalance(0);
      } else {
        setAvailableBalance(Number(data?.available_balance ?? 0));
      }
    } else {
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("id")
        .eq("symbol", fromCurrency)
        .eq("asset_type", "crypto")
        .eq("is_active", true)
        .maybeSingle();

      if (assetError || !asset) {
        console.error("Crypto asset lookup error:", assetError);
        setAvailableBalance(0);
        setBalanceLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("crypto_balances")
        .select("available_quantity")
        .eq("user_id", user.id)
        .eq("asset_id", asset.id)
        .maybeSingle();

      if (error) {
        console.error("Available crypto balance error:", error);
        setAvailableBalance(0);
      } else {
        setAvailableBalance(Number(data?.available_quantity ?? 0));
      }
    }

    setBalanceLoading(false);
  };

  loadAvailableBalance();
}, [user, fromCurrency]);

  const fromAsset = useMemo(
    () =>
      currencies.find(
        (currency) => currency.symbol === fromCurrency
      ) ?? currencies[0],
    [fromCurrency]
  );

  const toAsset = useMemo(
    () =>
      currencies.find(
        (currency) => currency.symbol === toCurrency
      ) ?? currencies[3],
    [toCurrency]
  );

  const numericAmount = Number(amount) || 0;

  /*
   * Conversion calculation:
   *
   * Example:
   * USD value / BTC price = BTC received
   *
   * We first convert the source amount into USD,
   * then convert USD into the destination asset.
   */
  const usdValue = numericAmount * fromAsset.price;

  const grossReceive =
    toAsset.price > 0 ? usdValue / toAsset.price : 0;

  // Example platform conversion fee.
  const feeRate = 0.0025;
  const fee = grossReceive * feeRate;
  const receiveAmount = Math.max(grossReceive - fee, 0);

  const exchangeRate =
    toAsset.price > 0
      ? fromAsset.price / toAsset.price
      : 0;

   const canConvert =
  numericAmount > 0 &&
  numericAmount <= availableBalance &&
  fromCurrency !== toCurrency &&
  receiveAmount > 0;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount("");
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading conversion...
        </p>
      </main>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/account")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] transition hover:text-[#111613]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Convert
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push("/account/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
            title={user?.email ?? "Account"}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1100px] px-5 py-8 sm:px-7 lg:px-9">
        {/* PAGE HEADER */}
        <div>
          <p className="text-sm text-[#7b857e]">
            Exchange supported currencies and digital assets.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Convert assets
          </h2>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* CONVERTER */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_15px_45px_rgba(20,35,25,0.05)] sm:p-7">
            <div>
              <p className="text-xs text-[#89928b]">
                Asset conversion
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Exchange your assets
              </h3>
            </div>

            {/* FROM */}
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold">
                  From
                </label>
                
                <span className="text-[9px] text-[#929b95]">
  {balanceLoading
    ? "Available: Loading..."
    : `Available: ${formatAssetAmount(
        availableBalance,
        fromCurrency
      )} ${fromCurrency}`}
</span>
              </div>

              <div className="rounded-2xl border border-[#dfe5df] bg-[#fbfcfa] p-4 transition focus-within:border-[#16805a] focus-within:ring-4 focus-within:ring-[#16805a]/10">
                <div className="flex items-center gap-3">
                  <select
                    value={fromCurrency}
                    onChange={(e) => {
                      setFromCurrency(e.target.value);

                      if (e.target.value === toCurrency) {
                        const alternative = currencies.find(
                          (currency) =>
                            currency.symbol !==
                            e.target.value &&
                            currency.type !==
                              currencies.find(
                                (item) =>
                                  item.symbol === e.target.value
                              )?.type
                        );

                        if (alternative) {
                          setToCurrency(alternative.symbol);
                        }
                      }

                      setShowConfirmation(false);
                    }}
                    className="h-11 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-semibold outline-none"
                  >
                    {currencies.map((currency) => (
                      <option
                        key={currency.symbol}
                        value={currency.symbol}
                      >
                        {currency.symbol}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setShowConfirmation(false);
                    }}
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent text-right text-2xl font-semibold outline-none placeholder:text-[#c3c9c4]"
                  />
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-[9px] text-[#929b95]">
                    {fromAsset.name}
                  </span>

                  <span className="text-[9px] text-[#929b95]">
                    ≈ {formatCurrency(usdValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* SWAP */}
            <div className="relative z-10 -my-2 flex justify-center">
              <button
                onClick={swapCurrencies}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe5df] bg-white text-[#16805a] shadow-md transition hover:-translate-y-0.5 hover:bg-[#f8faf7]"
                aria-label="Swap currencies"
              >
                <SwapIcon />
              </button>
            </div>

            {/* TO */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold">
                  To
                </label>

                <span className="text-[9px] text-[#929b95]">
                  Estimated amount
                </span>
              </div>

              <div className="rounded-2xl border border-[#dfe5df] bg-[#fbfcfa] p-4">
                <div className="flex items-center gap-3">
                  <select
                    value={toCurrency}
                    onChange={(e) => {
                      setToCurrency(e.target.value);

                      if (e.target.value === fromCurrency) {
                        const alternative = currencies.find(
                          (currency) =>
                            currency.symbol !==
                            e.target.value &&
                            currency.type ===
                              currencies.find(
                                (item) =>
                                  item.symbol === e.target.value
                              )?.type
                        );

                        if (alternative) {
                          setFromCurrency(alternative.symbol);
                        }
                      }

                      setShowConfirmation(false);
                    }}
                    className="h-11 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-semibold outline-none"
                  >
                    {currencies.map((currency) => (
                      <option
                        key={currency.symbol}
                        value={currency.symbol}
                      >
                        {currency.symbol}
                      </option>
                    ))}
                  </select>

                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-2xl font-semibold">
                      {formatAssetAmount(
                        receiveAmount,
                        toAsset.symbol
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[9px] text-[#929b95]">
                    {toAsset.name}
                  </span>
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="mt-7 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
              <DetailRow
                label="Exchange rate"
                value={`1 ${fromAsset.symbol} = ${formatAssetAmount(
                  exchangeRate,
                  toAsset.symbol
                )} ${toAsset.symbol}`}
              />

              <DetailRow
                label="Conversion fee"
                value={`0.25%`}
              />

              <DetailRow
                label="Estimated fee"
                value={
                  fee > 0
                    ? formatAssetAmount(
                        fee,
                        toAsset.symbol
                      )
                    : "—"
                }
              />

              <div className="mt-3 border-t border-[#e9eee9] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    You receive
                  </span>

                  <span className="text-sm font-semibold text-[#16805a]">
                    {formatAssetAmount(
                      receiveAmount,
                      toAsset.symbol
                    )}{" "}
                    {toAsset.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* REVIEW BUTTON */}
            <button
              disabled={!canConvert}
              onClick={() => setShowConfirmation(true)}
              className="mt-6 h-12 w-full rounded-xl bg-[#111613] text-sm font-semibold text-white transition hover:bg-[#1b241f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Review conversion
            </button>
          </section>

          {/* SIDE INFO */}
          <aside className="space-y-5">
            <section className="rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_12px_35px_rgba(20,35,25,0.04)]">
              <p className="text-xs text-[#89928b]">
                Conversion summary
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Current transaction
              </h3>

              <div className="mt-6 space-y-4">
                <DetailRow
                  label="From"
                  value={`${amount || "0"} ${fromCurrency}`}
                />

                <DetailRow
                  label="To"
                  value={`${formatAssetAmount(
                    receiveAmount,
                    toCurrency
                  )} ${toCurrency}`}
                />

                <DetailRow
                  label="Rate"
                  value={`1 ${fromCurrency} ≈ ${formatAssetAmount(
                    exchangeRate,
                    toCurrency
                  )} ${toCurrency}`}
                />

                <DetailRow
                  label="Fee"
                  value="0.25%"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-[#dfe5df] bg-[#eef4ef] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#16805a]">
                  <ShieldIcon />
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Conversion protection
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#77837b]">
                    Review all details before confirming.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-[10px] text-[#717c74]">
                <p>✓ Rate shown before confirmation</p>
                <p>✓ Fees shown before confirmation</p>
                <p>✓ Transaction recorded in activity</p>
              </div>
            </section>
          </aside>
        </div>

        {/* CONFIRMATION */}
        {showConfirmation && (
          <section className="mt-5 rounded-3xl border border-[#cfe1d4] bg-white p-6 shadow-[0_15px_45px_rgba(20,35,25,0.06)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="rounded-full bg-[#eaf6ef] px-2.5 py-1 text-[9px] font-semibold text-[#16805a]">
                  READY FOR REVIEW
                </span>

                <h3 className="mt-3 text-xl font-semibold">
                  Confirm your conversion
                </h3>

                <p className="mt-2 max-w-xl text-xs leading-6 text-[#7b857e]">
                  You are converting{" "}
                  <strong>
                    {amount || "0"} {fromCurrency}
                  </strong>{" "}
                  into approximately{" "}
                  <strong>
                    {formatAssetAmount(
                      receiveAmount,
                      toCurrency
                    )}{" "}
                    {toCurrency}
                  </strong>
                  .
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-xs font-semibold text-[#58635b]"
                >
                  Edit
                </button>

                
<button
  onClick={async () => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc(
        "execute_conversion",
        {
          p_from_currency: fromCurrency,
          p_to_currency: toCurrency,
          p_amount: numericAmount,
          p_receive_amount: receiveAmount,
          p_exchange_rate: exchangeRate,
          p_fee_rate: feeRate,
          p_fee_amount: fee,
        }
      );

      if (error) {
        console.error("Conversion error:", error);
        alert(error.message);
        return;
      }

      console.log("CONVERSION SUCCESS:", data);

      setShowConfirmation(false);
      setAmount("");

      alert(
        `Conversion successful. ${numericAmount} ${fromCurrency} was converted to ${formatAssetAmount(
          receiveAmount,
          toCurrency
        )} ${toCurrency}.`
      );

      router.refresh();
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Conversion failed. Please try again.");
    }
  }}
  className="rounded-xl bg-[#16805a] px-5 py-3 text-xs font-semibold text-white"
>
  Confirm conversion
</button>


              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

/* -------------------------------- */
/* HELPERS */
/* -------------------------------- */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[#7c867f]">
        {label}
      </span>

      <span className="text-xs font-semibold text-right">
        {value}
      </span>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAssetAmount(
  value: number,
  symbol: string
) {
  const digits =
    symbol === "BTC"
      ? 8
      : symbol === "ETH"
      ? 6
      : symbol === "SOL"
      ? 4
      : 2;

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/* -------------------------------- */
/* ICONS */
/* -------------------------------- */

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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

function SwapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 7h10l-3-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 17H7l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 7v4M7 17v-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 19 6v5c0 4.8-2.9 8.3-7 10-4.1-1.7-7-5.2-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}