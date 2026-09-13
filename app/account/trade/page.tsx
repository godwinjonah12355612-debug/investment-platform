
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Asset = {
  symbol: string;
  name: string;
  type: "Stock" | "ETF" | "Crypto";
  price: number;
  change: number;
};

function TradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashBalance, setCashBalance] = useState(0);
  const [marketAssets, setMarketAssets] = useState<Asset[]>([]);

  const [selectedSymbol, setSelectedSymbol] = useState(
    searchParams.get("symbol") || "AAPL"
  );

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState("");

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

      const { data: balance, error: balanceError } = await supabase
        .from("cash_balances")
        .select("available_balance")
        .eq("user_id", user.id)
        .eq("currency", "USD")
        .maybeSingle();

      if (balanceError) {
        console.error("Trade balance error:", balanceError);
      }

      setCashBalance(Number(balance?.available_balance ?? 0));

      const { data: dbAssets, error: assetsError } = await supabase
        .from("assets")
        .select(
          "symbol, name, asset_type, current_price, price_change_24h"
        )
        .eq("is_active", true)
        .in("asset_type", ["stock", "etf"])
        .order("symbol");

      if (assetsError) {
        console.error("Trade assets error:", assetsError);
      } else {
        const formattedAssets: Asset[] = (dbAssets ?? []).map(
          (asset: {
            symbol: string;
            name: string;
            asset_type: string;
            current_price: number | null;
            price_change_24h: number | null;
          }) => ({
            symbol: asset.symbol,
            name: asset.name,
            type:
              asset.asset_type === "stock"
                ? "Stock"
                : asset.asset_type === "etf"
                  ? "ETF"
                  : "Crypto",
            price: Number(asset.current_price ?? 0),
            change: Number(asset.price_change_24h ?? 0),
          })
        );

        setMarketAssets(formattedAssets);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const selectedAsset = useMemo(() => {
    return (
      marketAssets.find((asset) => asset.symbol === selectedSymbol) ??
      marketAssets[0]
    );
  }, [marketAssets, selectedSymbol]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading trade workspace...
        </p>
      </main>
    );
  }

  if (!selectedAsset) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          No tradable assets available.
        </p>
      </main>
    );
  }

  const numericQuantity = Number(quantity) || 0;

  const executionPrice =
    orderType === "limit" && Number(limitPrice) > 0
      ? Number(limitPrice)
      : selectedAsset.price;

  const estimatedTotal = numericQuantity * executionPrice;

  const handleTrade = async () => {
    if (!user) return;

    if (numericQuantity <= 0) {
      setTradeMessage("Enter a valid quantity.");
      return;
    }

    if (executionPrice <= 0) {
      setTradeMessage("Invalid execution price.");
      return;
    }

    setSubmitting(true);
    setTradeMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc("execute_trade", {
      p_asset_symbol: selectedAsset.symbol,
      p_side: side,
      p_quantity: numericQuantity,
      p_order_type: orderType,
      p_limit_price:
        orderType === "limit" && Number(limitPrice) > 0
          ? Number(limitPrice)
          : null,
    });

    if (error) {
      console.error("Trade error:", error);
      setTradeMessage(error.message);
      setSubmitting(false);
      return;
    }

    console.log("TRADE SUCCESS:", data);

    setTradeMessage(
      `${side === "buy" ? "Bought" : "Sold"} ${numericQuantity} ${selectedAsset.symbol} successfully.`
    );

    setSubmitting(false);

    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/account")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] hover:text-[#111613]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Trade
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push("/account/settings")}
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
      <section className="mx-auto max-w-[1200px] px-5 py-8 sm:px-7 lg:px-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          {/* LEFT */}
          <div className="space-y-5">
            {/* ASSET SELECTOR */}
            <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
              <div>
                <p className="text-xs text-[#89928b]">
                  Select investment
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Choose an asset
                </h2>
              </div>

              <div className="mt-5">
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm font-medium outline-none focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                >
                  {marketAssets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} — {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-xs font-bold text-[#16805a]">
                    {selectedAsset.symbol.slice(0, 2)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {selectedAsset.symbol}
                    </p>

                    <p className="text-[10px] text-[#8d9690]">
                      {selectedAsset.name}
                    </p>
                  </div>
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
            </section>

            {/* ORDER */}
            <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
              <div className="flex gap-2 rounded-xl bg-[#f5f7f3] p-1">
                <button
                  onClick={() => setSide("buy")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold ${
                    side === "buy"
                      ? "bg-[#16805a] text-white shadow-sm"
                      : "text-[#7b857e]"
                  }`}
                >
                  Buy
                </button>

                <button
                  onClick={() => setSide("sell")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold ${
                    side === "sell"
                      ? "bg-[#111613] text-white shadow-sm"
                      : "text-[#7b857e]"
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold">
                  Order type
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType("market")}
                    className={`rounded-xl border px-4 py-3 text-left ${
                      orderType === "market"
                        ? "border-[#16805a] bg-[#eef7f1]"
                        : "border-[#dfe5df]"
                    }`}
                  >
                    <p className="text-xs font-semibold">
                      Market
                    </p>

                    <p className="mt-1 text-[9px] text-[#89928b]">
                      Execute at current price
                    </p>
                  </button>

                  <button
                    onClick={() => setOrderType("limit")}
                    className={`rounded-xl border px-4 py-3 text-left ${
                      orderType === "limit"
                        ? "border-[#16805a] bg-[#eef7f1]"
                        : "border-[#dfe5df]"
                    }`}
                  >
                    <p className="text-xs font-semibold">
                      Limit
                    </p>

                    <p className="mt-1 text-[9px] text-[#89928b]">
                      Set your preferred price
                    </p>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs font-semibold">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                />
              </div>

              {orderType === "limit" && (
                <div className="mt-5">
                  <label className="text-xs font-semibold">
                    Limit price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={selectedAsset.price.toFixed(2)}
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                  />
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <section className="rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_15px_45px_rgba(20,35,25,0.06)]">
              <p className="text-xs text-[#89928b]">
                Order review
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {side === "buy" ? "Buy" : "Sell"}{" "}
                {selectedAsset.symbol}
              </h2>

              <div className="mt-7 space-y-4">
                <ReviewRow
                  label="Available cash"
                  value={formatCurrency(cashBalance)}
                />

                <ReviewRow
                  label="Current price"
                  value={formatCurrency(selectedAsset.price)}
                />

                <ReviewRow
                  label="Quantity"
                  value={numericQuantity.toString()}
                />

                <ReviewRow
                  label="Execution price"
                  value={formatCurrency(executionPrice)}
                />

                <div className="border-t border-[#edf0ed] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#778178]">
                      Estimated total
                    </span>

                    <span className="text-xl font-semibold">
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {tradeMessage && (
                <div className="mt-4 rounded-xl border border-[#dfe5df] bg-[#f5f7f3] px-4 py-3 text-center text-xs text-[#68736b]">
                  {tradeMessage}
                </div>
              )}

              <button
                type="button"
                disabled={
                  submitting ||
                  numericQuantity <= 0 ||
                  executionPrice <= 0
                }
                onClick={() => {
                  if (side === "sell") {
                    setSubmitting(true);
                    setTradeMessage("");

                    setTimeout(() => {
                      setSubmitting(false);
                      setTradeMessage(
                        "Sell request failed. Please contact customer support for assistance."
                      );
                    }, 3000);

                    return;
                  }

                  handleTrade();
                }}
                className={`mt-7 h-12 w-full rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  side === "buy"
                    ? "bg-[#16805a] hover:bg-[#126d4d]"
                    : "bg-[#111613] hover:bg-[#1b241f]"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : side === "sell"
                    ? "Submit Sell Request"
                    : "Submit Buy Request"}
              </button>

              <p className="mt-4 text-center text-[9px] leading-5 text-[#929b95]">
                Orders are reviewed before execution.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------- */
/* COMPONENTS */
/* -------------------------------- */

function ReviewRow({
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

export default function TradePage() {
  return (
    <Suspense fallback={null}>
      <TradeContent />
    </Suspense>
  );
}
