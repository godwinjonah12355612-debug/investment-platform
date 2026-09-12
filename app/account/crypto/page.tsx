"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type CryptoAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  quantity: number;
  value: number;
};



export default function CryptoPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);

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
        const { data: dbAssets, error: assetsError } = await supabase
  .from("assets")
  .select("symbol, name, asset_type, current_price, price_change_24h")
  .eq("is_active", true)
  .eq("asset_type", "crypto")
  .order("symbol");
if (assetsError) {
  console.error("Crypto assets error:", assetsError);
} else {
  console.log("CRYPTO ASSETS FROM SUPABASE:", dbAssets);

  const { data: dbBalances, error: balancesError } = await supabase
    .from("crypto_balances")
    .select(`
      available_quantity,
      asset:assets (
        symbol
      )
    `)
    .eq("user_id", user.id);

  if (balancesError) {
    console.error("Crypto balances error:", balancesError);
  }

  const balancesBySymbol = new Map<
    string,
    number
  >();

  (dbBalances ?? []).forEach(
    (balance: {
      available_quantity: number | null;
      asset:
        | { symbol: string }
        | { symbol: string }[]
        | null;
    }) => {
      const assetData = Array.isArray(balance.asset)
        ? balance.asset[0]
        : balance.asset;

      if (assetData?.symbol) {
        balancesBySymbol.set(
          assetData.symbol,
          Number(balance.available_quantity ?? 0)
        );
      }
    }
  );

  const formattedAssets: CryptoAsset[] = (dbAssets ?? []).map(
    (asset: {
      symbol: string;
      name: string;
      asset_type: string;
      current_price: number | null;
      price_change_24h: number | null;
    }) => {
      const quantity =
        balancesBySymbol.get(asset.symbol) ?? 0;

      const price = Number(asset.current_price ?? 0);

      return {
        symbol: asset.symbol,
        name: asset.name,
        price,
        change: Number(asset.price_change_24h ?? 0),
        quantity,
        value: quantity * price,
      };
    }
  );

  setCryptoAssets(formattedAssets);
}

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const selectedAsset = useMemo(
  () =>
    cryptoAssets.find((asset) => asset.symbol === selectedSymbol) ??
    cryptoAssets[0],
  [cryptoAssets, selectedSymbol]
);

if (loading) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
      <p className="text-sm text-[#68736b]">
        Loading crypto...
      </p>
    </main>
  );
}

if (!selectedAsset) {
  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center px-5 sm:px-7 lg:px-9">
          <button
            onClick={() => router.push("/account")}
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

          <p className="mt-2 text-sm text-[#7b857e]">
            There are currently no active crypto assets available.
          </p>
        </div>
      </section>
    </main>
  );
}

const totalValue = cryptoAssets.reduce(
    (total, asset) => total + asset.value,
    0
  );

  const totalDailyChange = cryptoAssets.reduce(
    (total, asset) =>
      total + asset.value * (asset.change / 100),
    0
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading crypto...
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Crypto
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/account/convert")}
              className="hidden rounded-xl border border-[#dfe5df] bg-white px-4 py-2.5 text-xs font-semibold text-[#58635b] sm:block"
            >
              Convert
            </button>

            <button
              onClick={() =>
                router.push("/account/settings")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
              title={user?.email ?? "Account"}
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-[#7b857e]">
              Manage and monitor your digital assets.
            </p>

            <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Crypto portfolio
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/account/crypto/trade?symbol=BTC")}
              className="rounded-xl bg-[#111613] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Buy / Sell
            </button>

            <button
              onClick={() => router.push("/account/convert")}
              className="rounded-xl border border-[#dfe5df] bg-white px-4 py-2.5 text-xs font-semibold text-[#58635b]"
            >
              Convert
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
  label="Crypto value"
  value={formatCurrency(totalValue)}
  change={`${totalValue > 0 ? "+" : ""}${totalValue > 0
    ? ((totalDailyChange / totalValue) * 100).toFixed(2)
    : "0.00"}%`}
  positive={totalDailyChange >= 0}
/>

          <SummaryCard
  label="24h change"
  value={`${totalDailyChange >= 0 ? "+" : ""}${formatCurrency(
    totalDailyChange
  )}`}
  change={`${totalValue > 0 ? (totalDailyChange / totalValue) * 100 : 0 >= 0 ? "+" : ""}${(
    totalValue > 0 ? (totalDailyChange / totalValue) * 100 : 0
  ).toFixed(2)}%`}
  positive={totalDailyChange >= 0}
/>

          <SummaryCard
  label="Bitcoin"
  value={formatCurrency(
    cryptoAssets.find((asset) => asset.symbol === "BTC")?.value ?? 0
  )}
  change={`${
    (cryptoAssets.find((asset) => asset.symbol === "BTC")?.change ?? 0) >= 0
      ? "+"
      : ""
  }${(
    cryptoAssets.find((asset) => asset.symbol === "BTC")?.change ?? 0
  ).toFixed(2)}%`}
  positive={
    (cryptoAssets.find((asset) => asset.symbol === "BTC")?.change ?? 0) >= 0
  }
/>

          <SummaryCard
  label="Ethereum"
  value={formatCurrency(
    cryptoAssets.find((asset) => asset.symbol === "ETH")?.value ?? 0
  )}
  change={`${
    (cryptoAssets.find((asset) => asset.symbol === "ETH")?.change ?? 0) >= 0
      ? "+"
      : ""
  }${(
    cryptoAssets.find((asset) => asset.symbol === "ETH")?.change ?? 0
  ).toFixed(2)}%`}
  positive={
    (cryptoAssets.find((asset) => asset.symbol === "ETH")?.change ?? 0) >= 0
  }
/>
        </div>

        {/* MAIN */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.7fr)]">
          {/* CHART */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3ed] text-xs font-bold text-[#16805a]">
                    {selectedAsset.symbol.slice(0, 2)}
                  </div>

                  <div>
                    <p className="text-xs text-[#89928b]">
                      {selectedAsset.name}
                    </p>

                    <h3 className="mt-1 text-xl font-semibold">
                      {formatCurrency(selectedAsset.price)}
                    </h3>
                  </div>
                </div>

                <p
                  className={`mt-3 text-xs font-semibold ${
                    selectedAsset.change >= 0
                      ? "text-[#16805a]"
                      : "text-[#c65b5b]"
                  }`}
                >
                  {selectedAsset.change >= 0 ? "+" : ""}
                  {selectedAsset.change.toFixed(2)}% today
                </p>
              </div>

              <div className="flex gap-2">
                {cryptoAssets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() =>
                      setSelectedSymbol(asset.symbol)
                    }
                    className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${
                      selectedSymbol === asset.symbol
                        ? "bg-[#111613] text-white"
                        : "border border-[#dfe5df] bg-white text-[#717b74]"
                    }`}
                  >
                    {asset.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-7 h-[330px] overflow-hidden rounded-2xl border border-[#edf0ed] bg-[#fafcf9]">
              {[20, 40, 60, 80].map((position) => (
                <div
                  key={position}
                  className="absolute left-0 right-0 border-t border-[#edf0ed]"
                  style={{ top: `${position}%` }}
                />
              ))}

              <svg
                viewBox="0 0 1000 360"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="cryptoArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#16805a"
                      stopOpacity="0.20"
                    />

                    <stop
                      offset="100%"
                      stopColor="#16805a"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 285 C60 277 75 290 130 260 S200 275 250 235 S310 245 355 210 S420 230 470 175 S525 205 580 150 S650 176 700 126 S770 143 820 92 S880 112 1000 44 L1000 360 L0 360 Z"
                  fill="url(#cryptoArea)"
                />

                <path
                  d="M0 285 C60 277 75 290 130 260 S200 275 250 235 S310 245 355 210 S420 230 470 175 S525 205 580 150 S650 176 700 126 S770 143 820 92 S880 112 1000 44"
                  fill="none"
                  stroke="#16805a"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                />

                <circle
                  cx="1000"
                  cy="44"
                  r="7"
                  fill="#16805a"
                />
              </svg>

              <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[9px] text-[#a1aaa4]">
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
                <span>JUL</span>
                <span>AUG</span>
                <span>SEP</span>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <p className="text-xs text-[#89928b]">
              Crypto actions
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              Manage your crypto
            </h3>

            <div className="mt-6 grid gap-3">
              <CryptoAction
  title="Buy crypto"
  description="Buy Bitcoin, Ethereum and more."
  onClick={() =>
    router.push(
      "/account/crypto/trade?symbol=BTC&side=buy"
    )
  }
/>

              <CryptoAction
  title="Sell crypto"
  description="Sell supported digital assets."
  onClick={() =>
    router.push(
      "/account/crypto/trade?symbol=BTC&side=sell"
    )
  }
/>

              <CryptoAction
                title="Convert"
                description="Exchange between supported assets."
                onClick={() =>
                  router.push("/account/convert")
                }
              />

              <CryptoAction
                title="Send crypto"
                description="Transfer crypto to another address."
                onClick={() =>
                  router.push("/account/transfers")
                }
              />

              <CryptoAction
                title="Receive crypto"
                description="View receiving instructions."
                onClick={() =>
                  router.push("/account/transfers")
                }
              />
            </div>
          </section>
        </div>

        {/* HOLDINGS */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Digital assets
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Crypto holdings
              </h3>
            </div>

            <button
              onClick={() =>
                router.push("/account/transactions")
              }
              className="text-[10px] font-semibold text-[#16805a]"
            >
              View activity
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">
                  <th className="pb-3 font-semibold">Asset</th>
                  <th className="pb-3 font-semibold">Quantity</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Value</th>
                  <th className="pb-3 text-right font-semibold">
                    24h change
                  </th>
                </tr>
              </thead>

              <tbody>
                {cryptoAssets.map((asset) => (
                  <tr
                    key={asset.symbol}
                    className="border-b border-[#f0f2ef] last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
                          {asset.symbol.slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-xs font-semibold">
                            {asset.symbol}
                          </p>

                          <p className="text-[9px] text-[#929b95]">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-xs text-[#68736b]">
                      {asset.quantity}
                    </td>

                    <td className="py-4 text-xs font-medium">
                      {formatCurrency(asset.price)}
                    </td>

                    <td className="py-4 text-xs font-semibold">
                      {formatCurrency(asset.value)}
                    </td>

                    <td
                      className={`py-4 text-right text-xs font-semibold ${
                        asset.change >= 0
                          ? "text-[#16805a]"
                          : "text-[#c65b5b]"
                      }`}
                    >
                      {asset.change >= 0 ? "+" : ""}
                      {asset.change.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Activity
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Recent crypto activity
              </h3>
            </div>

            <button
              onClick={() =>
                router.push("/account/transactions")
              }
              className="text-[10px] font-semibold text-[#16805a]"
            >
              View all
            </button>
          </div>

         <div className="mt-5 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-5 text-center">
  <p className="text-xs font-semibold text-[#68736b]">
    No recent crypto activity
  </p>

  <p className="mt-2 text-[10px] leading-5 text-[#929b95]">
    Your crypto transactions will appear here once you make a transaction.
  </p>
</div>
        </section>
      </section>
    </main>
  );
}

/* -------------------------------- */
/* COMPONENTS */
/* -------------------------------- */

function SummaryCard({
  label,
  value,
  change,
  positive = false,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,25,0.03)]">
      <p className="text-[10px] text-[#89928b]">
        {label}
      </p>

      <p className="mt-3 text-[25px] font-semibold tracking-[-0.04em]">
        {value}
      </p>

      <span
        className={`mt-2 inline-block rounded-md px-2 py-1 text-[9px] font-semibold ${
          positive
            ? "bg-[#eaf6ef] text-[#16805a]"
            : "bg-[#f3f5f2] text-[#727c75]"
        }`}
      >
        {change}
      </span>
    </div>
  );
}

function CryptoAction({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4 text-left transition hover:border-[#d5ded7] hover:bg-white"
    >
      <div>
        <p className="text-xs font-semibold">{title}</p>

        <p className="mt-1 text-[9px] leading-5 text-[#8b948e]">
          {description}
        </p>
      </div>

      <span className="text-[#16805a]">→</span>
    </button>
  );
}

function ActivityCard({
  title,
  detail,
  amount,
}: {
  title: string;
  detail: string;
  amount: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">{title}</p>

          <p className="mt-1 text-[9px] text-[#929b95]">
            {detail}
          </p>
        </div>

        <span className="h-2 w-2 rounded-full bg-[#16805a]" />
      </div>

      <p className="mt-5 text-sm font-semibold">
        {amount}
      </p>
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